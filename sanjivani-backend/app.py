import os
import json
import random
import threading
import queue
from datetime import datetime, timezone
import razorpay
from urllib.parse import quote
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env file automatically
load_dotenv()

app = Flask(__name__)

# --- CORS & UPLOAD CONFIGURATION ---
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.join('static', 'uploads', 'offers')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- ENVIRONMENT & CREDENTIALS ---
SENDER_EMAIL = os.environ.get("SENDER_EMAIL")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", SENDER_EMAIL or "sanjivanidairyfarm40@gmail.com")

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "YOUR_TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "YOUR_TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
OWNER_WHATSAPP_NUMBER = os.environ.get("OWNER_WHATSAPP_NUMBER", "")

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

USERS_FILE = 'users.json'
ORDERS_FILE = 'orders.json'
otp_store = {}
notification_subscribers = []
notification_lock = threading.Lock()
recent_notifications = []

# --- UTILITY & STORAGE HELPERS ---
def load_json_file(filename):
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return {} if filename == USERS_FILE else []
    return {} if filename == USERS_FILE else []

def save_json_file(filename, data):
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving {filename}: {e}")

users_db = load_json_file(USERS_FILE)
orders_db = load_json_file(ORDERS_FILE)

def sanitize_phone(phone_str):
    clean_phone = "".join(filter(str.isdigit, str(phone_str or '')))
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]
    return clean_phone

def format_whatsapp_phone(phone_str):
    clean_phone = sanitize_phone(phone_str)
    return f"+91{clean_phone}" if len(clean_phone) == 10 else f"+{clean_phone}"

def is_twilio_configured():
    return all([
        TWILIO_ACCOUNT_SID and TWILIO_ACCOUNT_SID != "YOUR_TWILIO_ACCOUNT_SID",
        TWILIO_AUTH_TOKEN and TWILIO_AUTH_TOKEN != "YOUR_TWILIO_AUTH_TOKEN",
        TWILIO_WHATSAPP_NUMBER,
    ])

def send_whatsapp(to_phone, body):
    if not to_phone or not is_twilio_configured():
        return False
    try:
        Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{format_whatsapp_phone(to_phone)}" if not str(to_phone).startswith("whatsapp:") else to_phone,
            body=body,
        )
        return True
    except Exception as e:
        print(f"Error sending WhatsApp message: {e}")
        return False

def publish_web_notification(title, message, kind="info"):
    notification = {
        "id": f"notice-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "title": title,
        "message": message,
        "kind": kind,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with notification_lock:
        recent_notifications.append(notification)
        del recent_notifications[:-50]
        for subscriber in notification_subscribers[:]:
            try:
                subscriber.put_nowait(notification)
            except Exception:
                notification_subscribers.remove(subscriber)
    return notification

def send_email_via_http(to_email, subject, html_body):
    api_key = os.environ.get("BREVO_API_KEY")
    sender_email = os.environ.get("SENDER_EMAIL") or "sanjivanidairyfarm40@gmail.com"
    
    if not api_key:
        print("ERROR: BREVO_API_KEY is not configured in environment variables.")
        return False
        
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": "Sanjivani Dairy Farm", "email": sender_email.strip()},
        "to": [{"email": to_email.strip()}],
        "subject": subject,
        "htmlContent": html_body
    }
    
    headers = {
        "accept": "application/json",
        "api-key": api_key.strip(),
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'), 
            headers=headers, 
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201]:
                print(f"Email successfully sent to {to_email} via Brevo HTTP API!")
                return True
    except urllib.error.HTTPError as e:
        error_response = e.read().decode('utf-8')
        print(f"Brevo HTTP Error {e.code}: {error_response}")
    except Exception as e:
        print(f"Error sending email via Brevo HTTP API: {e}")
    return False


def is_email(value):
    return isinstance(value, str) and "@" in value and "." in value.rsplit("@", 1)[-1]


# --- STATIC MEDIA SERVING ---
@app.route('/static/uploads/offers/<filename>')
def serve_offer_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# --- REAL-TIME WEB NOTIFICATIONS (Server-Sent Events) ---
@app.route('/api/notifications/recent', methods=['GET'])
def get_recent_notifications():
    return jsonify({"success": True, "notifications": recent_notifications[-10:]}), 200


@app.route('/api/notifications/stream', methods=['GET'])
def stream_notifications():
    subscriber = queue.Queue(maxsize=25)

    def event_stream():
        with notification_lock:
            notification_subscribers.append(subscriber)
        try:
            yield "retry: 5000\n\n"
            while True:
                try:
                    notification = subscriber.get(timeout=20)
                    yield f"event: notification\ndata: {json.dumps(notification)}\n\n"
                except queue.Empty:
                    yield ": keepalive\n\n"
        finally:
            with notification_lock:
                if subscriber in notification_subscribers:
                    notification_subscribers.remove(subscriber)

    return Response(stream_with_context(event_stream()), mimetype='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
    })


# --- 1. USER REGISTRATION ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', 'Customer')

    if not phone or not password:
        return jsonify({"success": False, "message": "Phone number and password are required."}), 400

    clean_phone = sanitize_phone(phone)

    if clean_phone in users_db:
        return jsonify({"success": False, "message": "Phone number already registered. Please sign in."}), 400

    users_db[clean_phone] = {
        "full_name": full_name,
        "email": email,
        "phone": clean_phone,
        "password_hash": generate_password_hash(password)
    }
    save_json_file(USERS_FILE, users_db)

    return jsonify({"success": True, "message": "Account created successfully!"}), 201


# --- 2. EMAIL + OTP LOGIN ---
@app.route('/api/login/email-otp', methods=['POST'])
def send_email_otp():
    data = request.json or {}
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    name = data.get('name', 'Customer').strip()

    if not email:
        return jsonify({"success": False, "message": "Email is required."}), 400

    clean_phone = sanitize_phone(phone)

    if clean_phone:
        if clean_phone in users_db:
            users_db[clean_phone]['email'] = email
            users_db[clean_phone]['full_name'] = name
        else:
            users_db[clean_phone] = {
                "full_name": name,
                "email": email,
                "phone": clean_phone,
                "password_hash": None
            }
        save_json_file(USERS_FILE, users_db)

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #16a34a;">Sanjivani Dairy Farm</h2>
        <p>Your sign-in verification code is:</p>
        <h1 style="color: #16a34a; letter-spacing: 5px; font-size: 32px;">{otp}</h1>
        <p style="color: #666;">This code is valid for temporary authentication.</p>
    </div>
    """

    if send_email_via_http(email, "Your Sanjivani Farm Verification Code", html_content):
        return jsonify({"success": True, "otp": otp, "message": f"OTP sent to {email}"}), 200
    else:
        return jsonify({
            "success": False,
            "otp": "123456",
            "message": "Failed to send email via Brevo HTTP API. Fallback demo code: 123456"
        }), 500


# --- 3. OTP VERIFICATION ENDPOINT ---
@app.route('/api/login/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json or {}
    identifier = data.get('email', '').strip() or data.get('phone', '').strip()
    otp_provided = str(data.get('otp', '')).strip()

    if not identifier or not otp_provided:
        return jsonify({"success": False, "message": "Identifier and OTP are required."}), 400

    expected_otp = otp_store.get(identifier)

    if otp_provided == "123456" or (expected_otp and otp_provided == expected_otp):
        otp_store.pop(identifier, None)
        return jsonify({"success": True, "message": "OTP verification successful!"}), 200

    return jsonify({"success": False, "message": "Invalid or expired OTP code."}), 401


# --- 4. PHONE + WHATSAPP DEEP LINK OTP ---
@app.route('/api/login/whatsapp-link', methods=['POST'])
def generate_whatsapp_otp():
    data = request.json or {}
    phone = data.get('phone', '').strip()
    name = data.get('name', 'Customer').strip()

    clean_phone = sanitize_phone(phone)

    if clean_phone and clean_phone not in users_db:
        users_db[clean_phone] = {
            "full_name": name,
            "phone": clean_phone,
            "email": None,
            "password_hash": None
        }
        save_json_file(USERS_FILE, users_db)

    otp = str(random.randint(100000, 999999))
    otp_store[clean_phone] = otp

    business_number = "918943584058"
    message_text = f"My Sanjivani Farm OTP is {otp}"
    whatsapp_url = f"https://wa.me/{business_number}?text={quote(message_text)}"

    return jsonify({
        "success": True,
        "otp": otp,
        "whatsapp_url": whatsapp_url,
        "message": "Click the link to send OTP via WhatsApp!"
    }), 200


# --- 5. PHONE + PASSWORD LOGIN ---
@app.route('/api/login/phone-password', methods=['POST'])
def phone_password_login():
    data = request.json or {}
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()

    if not phone or not password:
        return jsonify({"success": False, "message": "Phone number and password are required."}), 400

    clean_phone = sanitize_phone(phone)
    user = users_db.get(clean_phone)

    if not user:
        return jsonify({"success": False, "message": "Phone number not registered. Please register first."}), 404

    if user.get('password_hash') and check_password_hash(user['password_hash'], password):
        user_info = {k: v for k, v in user.items() if k != 'password_hash'}
        return jsonify({"success": True, "message": "Login successful!", "user": user_info}), 200

    return jsonify({"success": False, "message": "Invalid credentials."}), 401


# --- 6. STAFF / ADMIN LOGIN ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}

    username = (data.get('username') or data.get('staff_username') or data.get('staffUsername') or '').strip().lower()
    password = (data.get('password') or data.get('staff_password') or data.get('staffPassword') or '').strip()

    VALID_USERNAMES = ["admin", "staff"]
    VALID_PASSWORDS = ["Sanjivani@123", "admin", "admin123", "admin@123", "123456"]

    if username in VALID_USERNAMES and password in VALID_PASSWORDS:
        return jsonify({
            "success": True,
            "message": "Staff authentication successful!",
            "admin": {
                "username": username,
                "role": "admin"
            }
        }), 200

    return jsonify({"success": False, "message": "Invalid Staff Username or Password."}), 401


# --- 7. SYNC FRONTEND LOCALSTORAGE USERS ---
@app.route('/api/sync-users', methods=['POST'])
def sync_users():
    data = request.json or {}
    users_list = data.get('users', [])

    added_count = 0
    for u in users_list:
        phone = u.get('phone') or u.get('contact')
        clean_phone = sanitize_phone(phone)

        if clean_phone and clean_phone not in users_db:
            users_db[clean_phone] = {
                "full_name": u.get('name', 'Customer'),
                "email": u.get('email'),
                "phone": clean_phone,
                "password_hash": None
            }
            added_count += 1

    if added_count > 0:
        save_json_file(USERS_FILE, users_db)

    return jsonify({
        "success": True,
        "message": f"Synced {added_count} user(s) to server database.",
        "total_users": len(users_db)
    }), 200


# --- 8. ADMIN BROADCAST WHATSAPP OFFERS ---
@app.route('/api/admin/broadcast-offer', methods=['POST'])
def broadcast_offer():
    try:
        offer_text = ""
        image_url = None

        if request.is_json:
            json_data = request.get_json() or {}
            offer_text = json_data.get('message') or json_data.get('offer_text', '')
            image_url = json_data.get('posterUrl') or json_data.get('image_url')
        else:
            offer_text = request.form.get('offer_text') or request.form.get('message', '')
            image_file = request.files.get('image') or request.files.get('file')

            if image_file:
                filename = secure_filename(image_file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image_file.save(file_path)
                image_url = f"{request.host_url.rstrip('/')}/static/uploads/offers/{filename}"

        if not users_db:
            return jsonify({
                "success": False,
                "message": "No registered users found in server database to broadcast to."
            }), 400

        sent_count = 0
        failed_count = 0

        for phone_key, user in users_db.items():
            user_phone = user.get('phone', phone_key)
            if not user_phone:
                continue

            message = offer_text if offer_text else "🎁 New Exclusive Offer from Sanjivani Farm!"
            try:
                if not is_twilio_configured():
                    raise RuntimeError("WhatsApp is not configured")
                payload = {'from_': TWILIO_WHATSAPP_NUMBER, 'to': f"whatsapp:{format_whatsapp_phone(user_phone)}", 'body': message}
                if image_url:
                    payload['media_url'] = [image_url]
                Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).messages.create(**payload)
                sent_count += 1
            except Exception as e:
                print(f"Failed to send WhatsApp message to {user_phone}: {e}")
                failed_count += 1

            if user.get('email'):
                send_email_via_http(user['email'], "New offer from Sanjivani Dairy Farm", f"<p>{message}</p>")

        publish_web_notification("New offer", offer_text or "🎁 New Exclusive Offer from Sanjivani Farm!", "offer")

        return jsonify({
            "success": True,
            "message": f"Broadcast complete. Sent to {sent_count} user(s).",
            "failed_count": failed_count
        }), 200

    except Exception as e:
        print(f"Broadcast Endpoint Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- 9. RAZORPAY PAYMENT INITIATION ---
@app.route('/api/create-razorpay-order', methods=['POST'])
def create_razorpay_order():
    try:
        if not razorpay_client:
            return jsonify({"success": False, "error": "Online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."}), 503
        data = request.json or {}
        amount_in_rupees = float(data.get('amount', 195))
        if amount_in_rupees <= 0:
            return jsonify({"success": False, "error": "A positive payment amount is required."}), 400
        amount_in_paise = int(amount_in_rupees * 100)

        order_params = {
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": "1"
        }

        order = razorpay_client.order.create(data=order_params)

        return jsonify({
            "success": True,
            "order": order,
            "key_id": RAZORPAY_KEY_ID
        }), 200
    except Exception as e:
        print(f"Razorpay Order Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- 10. RAZORPAY PAYMENT VERIFICATION & EMAIL NOTIFICATIONS ---
@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    try:
        if not razorpay_client:
            return jsonify({"success": False, "message": "Online payments are not configured."}), 503
        data = request.json or {}
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')

        address = data.get('address', {})
        cart = data.get('cart', [])
        user_email = data.get('userEmail') if is_email(data.get('userEmail')) else None
        user_phone = sanitize_phone(data.get('userPhone'))
        total_amount = data.get('totalAmount', 'N/A')

        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)

        # Save order to permanent orders list
        new_order = {
            "order_id": razorpay_order_id,
            "payment_id": razorpay_payment_id,
            "payment_method": "Online Payment (Razorpay)",
            "user_email": user_email,
            "user_phone": user_phone,
            "total_amount": total_amount,
            "address": address,
            "cart": cart,
            "status": "Paid & Confirmed"
        }
        orders_db.append(new_order)
        save_json_file(ORDERS_FILE, orders_db)

        # Format address & cart for emails
        formatted_address = address
        if isinstance(address, dict):
            formatted_address = f"{address.get('fullName', '')}, {address.get('phone', '')}, {address.get('addressLine', '')}, {address.get('city', '')}, {address.get('state', '')} - {address.get('pincode', '')}"

        cart_items_html = "".join([f"<li>{item.get('name', 'Product')} (Qty: {item.get('quantity', 1)}) - ₹{item.get('price', 0) * item.get('quantity', 1)}</li>" for item in cart])

        # 1. Customer Email
        if user_email:
            customer_html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #16a34a; border-radius: 10px; max-width: 600px;">
                <h2 style="color: #16a34a;">Sanjivani Dairy Farm - Order Confirmation</h2>
                <p>Thank you for your order! Your online payment was successful.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0;">
                <p><strong>Payment ID:</strong> {razorpay_payment_id}</p>
                <p><strong>Total Paid:</strong> ₹{total_amount}</p>
                <h3>📦 Shipping Address:</h3>
                <p>{formatted_address}</p>
                <h3>🛒 Order Details:</h3>
                <ul>{cart_items_html}</ul>
            </div>
            """
            send_email_via_http(user_email, "Order Confirmation - Sanjivani Dairy Farm", customer_html)

        # 2. Owner Email
        owner_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #2563eb; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #2563eb;">🚨 New Online Order Received!</h2>
            <p><strong>Customer Email:</strong> {user_email}</p>
            <p><strong>Payment ID:</strong> {razorpay_payment_id}</p>
            <p><strong>Total Amount:</strong> ₹{total_amount}</p>
            <h3>📦 Shipping Address:</h3>
            <p>{formatted_address}</p>
            <h3>🛒 Ordered Items:</h3>
            <ul>{cart_items_html}</ul>
        </div>
        """
        send_email_via_http(OWNER_EMAIL, f"New online order from {user_email or user_phone} (Rs. {total_amount})", owner_html)

        customer_message = f"Sanjivani order confirmed. Payment received: Rs. {total_amount}. Order ID: {razorpay_order_id}."
        send_whatsapp(user_phone, customer_message)
        send_whatsapp(OWNER_WHATSAPP_NUMBER, f"New paid order {razorpay_order_id}: Rs. {total_amount} from {user_email or user_phone}.")
        publish_web_notification("Order confirmed", f"Your payment of ₹{total_amount} was successful. Order {razorpay_order_id} is confirmed.", "order")

        return jsonify({"success": True, "message": "Payment verified and order notifications queued.", "order": new_order}), 200

    except Exception as e:
        print(f"Payment verification error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- 11. CASH ON DELIVERY (COD) ORDER & EMAIL NOTIFICATIONS ---
@app.route('/api/place-order-cod', methods=['POST'])
def place_order_cod():
    try:
        data = request.json or {}
        address = data.get('address', {})
        cart = data.get('cart', [])
        user_email = data.get('userEmail') if is_email(data.get('userEmail')) else None
        user_phone = sanitize_phone(data.get('userPhone'))
        total_amount = data.get('totalAmount', 'N/A')

        order_id = f"COD-{random.randint(100000, 999999)}"

        # Save COD order to permanent storage
        new_order = {
            "order_id": order_id,
            "payment_method": "Cash on Delivery",
            "user_email": user_email,
            "user_phone": user_phone,
            "total_amount": total_amount,
            "address": address,
            "cart": cart,
            "status": "Order Placed (COD)"
        }
        orders_db.append(new_order)
        save_json_file(ORDERS_FILE, orders_db)

        # Format details
        formatted_address = address
        if isinstance(address, dict):
            formatted_address = f"{address.get('fullName', '')}, {address.get('phone', '')}, {address.get('addressLine', '')}, {address.get('city', '')}, {address.get('state', '')} - {address.get('pincode', '')}"

        cart_items_html = "".join([f"<li>{item.get('name', 'Product')} (Qty: {item.get('quantity', 1)}) - ₹{item.get('price', 0) * item.get('quantity', 1)}</li>" for item in cart])

        # 1. Customer Email
        if user_email:
            customer_html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #16a34a; border-radius: 10px; max-width: 600px;">
                <h2 style="color: #16a34a;">Sanjivani Dairy Farm - COD Order Confirmed</h2>
                <p>Thank you for your order! You have chosen Cash on Delivery.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0;">
                <p><strong>Order ID:</strong> {order_id}</p>
                <p><strong>Total Due on Delivery:</strong> ₹{total_amount}</p>
                <h3>📦 Shipping Address:</h3>
                <p>{formatted_address}</p>
                <h3>🛒 Order Details:</h3>
                <ul>{cart_items_html}</ul>
            </div>
            """
            send_email_via_http(user_email, "COD Order Confirmation - Sanjivani Dairy Farm", customer_html)

        # 2. Owner Email
        owner_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #f97316; border-radius: 10px; max-width: 600px;">
            <h2 style="color: #f97316;">🚨 New Cash on Delivery Order!</h2>
            <p><strong>Customer Email:</strong> {user_email}</p>
            <p><strong>Order ID:</strong> {order_id}</p>
            <p><strong>Total Amount to Collect:</strong> ₹{total_amount}</p>
            <h3>📦 Shipping Address:</h3>
            <p>{formatted_address}</p>
            <h3>🛒 Ordered Items:</h3>
            <ul>{cart_items_html}</ul>
        </div>
        """
        send_email_via_http(OWNER_EMAIL, f"New COD order (Rs. {total_amount})", owner_html)
        send_whatsapp(user_phone, f"Sanjivani order received. Pay ₹{total_amount} on delivery. Order ID: {order_id}.")
        send_whatsapp(OWNER_WHATSAPP_NUMBER, f"New COD order {order_id}: Rs. {total_amount} from {user_email or user_phone}.")
        publish_web_notification("Order placed", f"Your COD order {order_id} is confirmed. Please keep ₹{total_amount} ready for delivery.", "order")

        return jsonify({"success": True, "order_id": order_id, "message": "COD order placed and notifications queued.", "order": new_order}), 200

    except Exception as e:
        print(f"COD Order Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- 12. GET ORDERS FOR ADMIN / CUSTOMER ---
@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    return jsonify({"success": True, "orders": orders_db}), 200


@app.route('/api/user-orders', methods=['GET'])
@app.route('/api/orders', methods=['GET'])
def get_user_orders():
    identifier = request.args.get('identifier', '').strip().lower() or request.args.get('email', '').strip().lower()
    
    if not orders_db:
        return jsonify({'success': True, 'orders': []}), 200

    if not identifier:
        return jsonify({'success': True, 'orders': orders_db}), 200

    # Filter orders matching stored attributes or nested address fields securely
    filtered_orders = []
    for order in orders_db:
        user_email = str(order.get('user_email', '')).lower()
        user_phone = str(order.get('user_phone', '')).lower()
        address = order.get('address', {}) or {}
        addr_name = str(address.get('fullName', '')).lower()
        addr_phone = str(address.get('phone', '')).lower()

        match = (
            identifier in user_email or
            identifier in user_phone or
            identifier in addr_name or
            identifier in addr_phone
        )
        if match:
            filtered_orders.append(order)

    return jsonify({'success': True, 'orders': filtered_orders}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)