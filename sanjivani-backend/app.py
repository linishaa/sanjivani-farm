import os
import json
import random
import smtplib
from urllib.parse import quote
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from twilio.rest import Client

app = Flask(__name__)
# Enable CORS for React frontend running on port 5173
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- UPLOAD CONFIGURATION ---
UPLOAD_FOLDER = os.path.join('static', 'uploads', 'offers')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- EMAIL CREDENTIALS ---
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "sanjivanidairyfarm40@gmail.com")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD", "iofkceaabhmtrbug")

# --- TWILIO WHATSAPP CREDENTIALS ---
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "YOUR_TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "YOUR_TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

# --- USER STORAGE HELPERS (PERSISTENT JSON STORAGE) ---
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading users file: {e}")
            return {}
    return {}

def save_users(db):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(db, f, indent=4)
    except Exception as e:
        print(f"Error saving users file: {e}")

users_db = load_users()
otp_store = {}


def format_whatsapp_phone(phone_str):
    """Clean phone number and append default country code (+91) if needed."""
    clean_phone = "".join(filter(str.isdigit, str(phone_str)))
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]
    return f"+91{clean_phone}" if len(clean_phone) == 10 else f"+{clean_phone}"


def send_email_via_smtp(to_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


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

    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]

    if clean_phone in users_db:
        return jsonify({"success": False, "message": "Phone number already registered. Please sign in."}), 400

    users_db[clean_phone] = {
        "full_name": full_name,
        "email": email,
        "phone": clean_phone,
        "password_hash": generate_password_hash(password)
    }
    save_users(users_db)

    return jsonify({"success": True, "message": "Account created successfully!"})


# --- 2. EMAIL + OTP LOGIN ---
@app.route('/api/login/email-otp', methods=['POST'])
def send_email_otp():
    data = request.json or {}
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    name = data.get('name', 'Customer').strip()

    if not email:
        return jsonify({"success": False, "message": "Email is required."}), 400

    clean_phone = "".join(filter(str.isdigit, str(phone))) if phone else ""
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]

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
        save_users(users_db)

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #0F172A;">Sanjivani Farm</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #FF8B8B; letter-spacing: 5px;">{otp}</h1>
        <p>This code expires in 5 minutes.</p>
    </div>
    """

    if send_email_via_smtp(email, "Your Sanjivani Farm OTP Code", html_content):
        return jsonify({"success": True, "otp": otp, "message": f"OTP sent to {email}"})
    else:
        return jsonify({"success": False, "message": "Failed to send Email OTP. Check server SMTP settings."}), 500


# --- 3. PHONE + WHATSAPP DEEP LINK OTP ---
@app.route('/api/login/whatsapp-link', methods=['POST'])
def generate_whatsapp_otp():
    data = request.json or {}
    phone = data.get('phone', '').strip()
    name = data.get('name', 'Customer').strip()

    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]

    if clean_phone:
        if clean_phone not in users_db:
            users_db[clean_phone] = {
                "full_name": name,
                "phone": clean_phone,
                "email": None,
                "password_hash": None
            }
            save_users(users_db)

    otp = str(random.randint(100000, 999999))
    otp_store[clean_phone] = otp

    business_number = "918943584058"
    message_text = f"My Sanjivani Farm OTP is {otp}"
    encoded_text = quote(message_text)
    whatsapp_url = f"https://wa.me/{business_number}?text={encoded_text}"

    return jsonify({
        "success": True,
        "otp": otp,
        "whatsapp_url": whatsapp_url,
        "message": "Click the link to send OTP via WhatsApp!"
    })


# --- 4. PHONE + PASSWORD LOGIN ---
@app.route('/api/login/phone-password', methods=['POST'])
def phone_password_login():
    data = request.json or {}
    phone = data.get('phone', '').strip()
    password = data.get('password', '').strip()

    if not phone or not password:
        return jsonify({"success": False, "message": "Phone number and password are required."}), 400

    clean_phone = "".join(filter(str.isdigit, str(phone)))
    if len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]

    user = users_db.get(clean_phone)

    if not user:
        return jsonify({"success": False, "message": "Phone number not registered. Please register first."}), 404

    if user.get('password_hash') and check_password_hash(user['password_hash'], password):
        user_info = {k: v for k, v in user.items() if k != 'password_hash'}
        return jsonify({"success": True, "message": "Login successful!", "user": user_info})
    else:
        return jsonify({"success": False, "message": "Invalid password."}), 401


# --- 5. STAFF / ADMIN LOGIN ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}

    username = (data.get('username') or data.get('staff_username') or data.get('staffUsername') or '').strip()
    password = (data.get('password') or data.get('staff_password') or data.get('staffPassword') or '').strip()

    VALID_USERNAMES = ["admin", "staff"]
    VALID_PASSWORD = "Sanjivani@123"

    if username.lower() in VALID_USERNAMES and password == VALID_PASSWORD:
        return jsonify({
            "success": True,
            "message": "Staff authentication successful!",
            "admin": {
                "username": username,
                "role": "admin"
            }
        }), 200

    return jsonify({"success": False, "message": "Invalid Staff Username or Password."}), 401


# --- 6. SYNC FRONTEND LOCALSTORAGE USERS ---
@app.route('/api/sync-users', methods=['POST'])
def sync_users():
    data = request.json or {}
    users_list = data.get('users', [])

    added_count = 0
    for u in users_list:
        phone = u.get('phone') or u.get('contact')
        if not phone:
            continue
        clean_phone = "".join(filter(str.isdigit, str(phone)))
        if len(clean_phone) > 10:
            clean_phone = clean_phone[-10:]

        if clean_phone and clean_phone not in users_db:
            users_db[clean_phone] = {
                "full_name": u.get('name', 'Customer'),
                "email": u.get('email'),
                "phone": clean_phone,
                "password_hash": None
            }
            added_count += 1

    if added_count > 0:
        save_users(users_db)

    return jsonify({
        "success": True,
        "message": f"Synced {added_count} user(s) to server database.",
        "total_users": len(users_db)
    })


# --- 7. ADMIN BROADCAST WHATSAPP OFFERS ---
@app.route('/api/admin/broadcast-offer', methods=['POST'])
def broadcast_offer():
    try:
        offer_text = ""
        image_url = None

        # Parse JSON vs Multipart Form-Data payloads
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
                image_url = f"{request.host_url}{file_path.replace('\\', '/')}"

        if not users_db:
            return jsonify({
                "success": False,
                "message": "No registered users found to broadcast to. Ask a user to sign in first!"
            }), 400

        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        sent_count = 0
        failed_count = 0

        for phone_key, user in users_db.items():
            user_phone = user.get('phone', phone_key)
            if not user_phone:
                continue

            formatted_whatsapp = f"whatsapp:{format_whatsapp_phone(user_phone)}"

            try:
                payload = {
                    'from_': TWILIO_WHATSAPP_NUMBER,
                    'to': formatted_whatsapp,
                    'body': offer_text if offer_text else "🎁 New Exclusive Offer from Sanjivani Farm!"
                }

                if image_url:
                    payload['media_url'] = [image_url]

                twilio_client.messages.create(**payload)
                sent_count += 1
            except Exception as e:
                print(f"Failed to send WhatsApp message to {formatted_whatsapp}: {e}")
                failed_count += 1

        return jsonify({
            "success": True,
            "message": f"Broadcast complete. Sent to {sent_count} user(s).",
            "failed_count": failed_count
        }), 200

    except Exception as e:
        print(f"Broadcast Endpoint Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)