import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Checkout() {
  const navigate = useNavigate();
  const { cart = [], currentUser: contextUser } = useProducts() || {};

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:5000';

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
      <div className="bg-[#FFF5F2] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#0F172A]/10 text-center max-w-md space-y-4 shadow-lg">
          <span className="text-3xl">🔒</span>
          <h2 className="text-2xl font-black text-[#0F172A]">Sign In Required</h2>
          <p className="text-xs font-medium text-[#0F172A]/70">
            You must verify your email via OTP before placing an order.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-[#0F172A] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1e293b]"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

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

    if (!address.trim()) {
      alert('Please enter a valid shipping address.');
      return;
    }

    if (subtotal <= 0) {
      alert('Your cart is empty!');
      return;
    }

    setIsProcessing(true);

    // ------------------- OPTION A: CASH ON DELIVERY -------------------
    if (paymentMethod === 'cod') {
      alert(`Order placed successfully via Cash on Delivery for ${currentUser.name || 'Customer'}!`);
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
          color: '#FF8B8B',
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
              address: address,
              cart: cart,
              userEmail: currentUser.email
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
      alert('Could not initiate online payment. Check if Flask backend is running.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#FFF5F2] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-[#0F172A]/10 shadow-lg space-y-6">
        <h1 className="text-2xl font-black text-[#0F172A]">Checkout</h1>
        
        <div className="bg-[#FFF8F5] p-4 rounded-2xl border border-[#0F172A]/5 text-xs text-[#0F172A]/80">
          Ordering as: <span className="font-bold text-[#0F172A]">{currentUser.name || 'Customer'} ({currentUser.email || 'Email not provided'})</span>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          {/* Address */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-2">Delivery Address</label>
            <textarea 
              required 
              rows="3" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter complete shipping address"
              className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
            />
          </div>

          {/* Payment Options */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-2">Payment Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Online Payment (Razorpay) */}
              <div 
                onClick={() => setPaymentMethod('online')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${paymentMethod === 'online' ? 'border-[#FF8B8B] bg-[#FF8B8B]/10 ring-1 ring-[#FF8B8B]' : 'border-[#0F172A]/15 hover:border-[#0F172A]/30 bg-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <input type="radio" checked={paymentMethod === 'online'} readOnly className="accent-[#FF8B8B] w-4 h-4" />
                  <span className="text-sm font-bold text-[#0F172A]">Pay Online (Razorpay)</span>
                </div>
                <p className="text-xs font-medium text-[#0F172A]/60 mt-1 ml-7">UPI, GPay, Credit/Debit Cards, Netbanking</p>
              </div>

              {/* Cash on Delivery Option */}
              <div 
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${paymentMethod === 'cod' ? 'border-[#FF8B8B] bg-[#FF8B8B]/10 ring-1 ring-[#FF8B8B]' : 'border-[#0F172A]/15 hover:border-[#0F172A]/30 bg-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <input type="radio" checked={paymentMethod === 'cod'} readOnly className="accent-[#FF8B8B] w-4 h-4" />
                  <span className="text-sm font-bold text-[#0F172A]">Cash on Delivery</span>
                </div>
                <p className="text-xs font-medium text-[#0F172A]/60 mt-1 ml-7">Pay via cash or UPI on delivery</p>
              </div>

            </div>
          </div>

          {/* Total & Submit */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm font-black text-[#0F172A]">Total Amount:</span>
            <span className="text-lg font-black text-[#FF8B8B]">₹{subtotal}</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#0F172A] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1E293B] transition-all shadow-md disabled:opacity-50"
          >
            {isProcessing ? 'Processing Payment...' : paymentMethod === 'online' ? 'Pay Now via Razorpay' : 'Confirm Order (COD)'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Checkout;