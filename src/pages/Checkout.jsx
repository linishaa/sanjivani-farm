import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Checkout() {
  const navigate = useNavigate();
  const { cart = [], currentUser: contextUser } = useProducts() || {};

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);

  // Structured Delivery Address State
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Dynamically switch between local Flask backend and Render URL
  const API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:5000'
      : 'https://sanjivani-farmbackend.onrender.com';

  // Fallback to localStorage for currentUser session persistence
  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  };

  const currentUser = contextUser || getStoredUser();

  // Guard: Redirect to login if user is not authenticated
  if (!currentUser) {
    return (
      <div className="bg-[#f0fdf4] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 text-center max-w-md space-y-4 shadow-xl">
          <span className="text-4xl">🔒</span>
          <h2 className="text-2xl font-black text-gray-900">Sign In Required</h2>
          <p className="text-xs font-medium text-gray-600">
            You must verify your account before placing an order.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-[#16a34a] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] transition-all shadow-md"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

  // Dynamically load Razorpay SDK Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Main Handle Order Function
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!village.trim() || !district.trim() || !stateName.trim() || !pincode.trim()) {
      alert('Please fill in all mandatory address details (Village/City, District, State, and Pincode).');
      return;
    }

    if (pincode.trim().length !== 6 || isNaN(pincode)) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    if (subtotal <= 0) {
      alert('Your cart is empty!');
      return;
    }

    const fullAddress = `${street ? street.trim() + ', ' : ''}${village.trim()}, District: ${district.trim()}, ${stateName.trim()} - ${pincode.trim()}`;

    setIsProcessing(true);

    // ------------------- OPTION A: CASH ON DELIVERY -------------------
    if (paymentMethod === 'cod') {
      alert(`Order placed successfully via Cash on Delivery for ${currentUser.name || 'Customer'}!\nShipping Address: ${fullAddress}`);
      setIsProcessing(false);
      navigate('/');
      return;
    }

    // ------------------- OPTION B: REAL RAZORPAY ONLINE PAYMENT -------------------
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // Step 1: Create Order on Backend
      const orderResponse = await fetch(`${API_BASE_URL}/api/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: subtotal }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(`Server Error: ${orderData.error || 'Could not initiate payment'}`);
        setIsProcessing(false);
        return;
      }

      // Step 2: Open Real Razorpay Payment Window
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Sanjivani Pure Farm Dairy',
        description: 'Order Payment',
        order_id: orderData.order.id,
        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
          contact: currentUser.phone || '',
        },
        theme: {
          color: '#16a34a',
        },
        handler: async function (response) {
          // Step 3: Verify Payment on Backend
          const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              address: fullAddress,
              cart: cart,
              userEmail: currentUser.email || currentUser.phone,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert('🎉 Payment Successful! Your order has been placed.');
            navigate('/');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpayWindow = new window.Razorpay(options);
      razorpayWindow.open();
    } catch (error) {
      console.error('Razorpay Error:', error);
      alert('Could not initiate online payment. Ensure Flask backend is running on http://127.0.0.1:5000');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#f0fdf4] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Sanjivani Farm
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60 text-xs text-gray-700 flex items-center justify-between">
          <div>
            Ordering as: <span className="font-bold text-emerald-900">{currentUser.name || 'Customer'}</span>
          </div>
          <div className="text-emerald-700 font-semibold">{currentUser.email || currentUser.phone || ''}</div>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          {/* Structured Delivery Address Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
              Delivery Address Details
            </h2>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                House No. / Street / Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. House No. 12, Main Road, Near Milk Hub"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                  Village / Town / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter village or city"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">District *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter state"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Online Payment (Razorpay) */}
              <div
                onClick={() => setPaymentMethod('online')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${
                  paymentMethod === 'online'
                    ? 'border-[#16a34a] bg-emerald-500/10 ring-2 ring-[#16a34a]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'online'}
                    readOnly
                    className="accent-[#16a34a] w-4 h-4"
                  />
                  <span className="text-sm font-bold text-gray-900">Pay Online (Razorpay)</span>
                </div>
                <p className="text-xs font-medium text-gray-500 mt-1 ml-7">UPI, GPay, Cards, Netbanking</p>
              </div>

              {/* Cash on Delivery Option */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${
                  paymentMethod === 'cod'
                    ? 'border-[#16a34a] bg-emerald-500/10 ring-2 ring-[#16a34a]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'cod'}
                    readOnly
                    className="accent-[#16a34a] w-4 h-4"
                  />
                  <span className="text-sm font-bold text-gray-900">Cash on Delivery</span>
                </div>
                <p className="text-xs font-medium text-gray-500 mt-1 ml-7">Pay via cash or UPI on delivery</p>
              </div>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm font-black text-gray-900">Total Amount:</span>
            <span className="text-xl font-black text-[#16a34a]">₹{subtotal}</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-[#16a34a] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {isProcessing
              ? 'Processing Payment...'
              : paymentMethod === 'online'
              ? 'Pay Now via Razorpay'
              : 'Confirm Order (COD)'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;