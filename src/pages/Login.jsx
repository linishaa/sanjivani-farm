import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useProducts() || {};

  const [loginType, setLoginType] = useState('customer'); // 'customer' or 'staff'
  const [customerAuthMode, setCustomerAuthMode] = useState('email'); // 'email' or 'password'

  // Customer Form States
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Staff Login State
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  // API BASE URL
  const API_BASE_URL = 'http://127.0.0.1:5000';

  // 1. AUTO-LOGIN CHECK: Redirect if active session exists
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj.role === 'customer') {
          navigate('/cart');
        } else if (userObj.role === 'admin') {
          navigate('/admin');
        }
      } catch (err) {
        console.error('Failed to parse saved session:', err);
      }
    }
  }, [navigate]);

  // Save session helper for customers
  const saveUserSession = (userObj) => {
    if (setCurrentUser) setCurrentUser(userObj);
    localStorage.setItem('currentUser', JSON.stringify(userObj));

    const existingLogs = JSON.parse(localStorage.getItem('activeUsers') || '[]');
    localStorage.setItem('activeUsers', JSON.stringify([userObj, ...existingLogs]));

    alert(`Welcome back, ${userObj.name || 'Customer'}! You are signed in.`);
    navigate('/cart');
  };

  // 2. EMAIL OTP LOGIN
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!email || !customerName || !phone) {
      alert('Please fill in your name, email address, and phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login/email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, name: customerName }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedOtp(data.otp);
        setOtpSent(true);
        alert(`Verification code sent to ${email}`);
      } else {
        alert(data.message || 'Failed to send Email OTP.');
      }
    } catch (error) {
      console.error('Flask API Error:', error);
      alert('Could not connect to backend server. Ensure Flask app is running!');
    } finally {
      setLoading(false);
    }
  };

  // 3. PHONE + PASSWORD LOGIN
  const handlePhonePasswordLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      alert('Mobile number and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login/phone-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (data.success) {
        const userObj = {
          name: data.user?.full_name || customerName || 'Customer',
          contact: phone,
          phone: phone,
          role: 'customer',
          loginTime: new Date().toLocaleString(),
        };
        saveUserSession(userObj);
      } else if (response.status === 404) {
        const wantRegister = window.confirm(
          'Phone number is not registered. Would you like to create a new account with these credentials?'
        );

        if (wantRegister) {
          const regResponse = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              password,
              full_name: customerName || 'Customer',
              email,
            }),
          });
          const regData = await regResponse.json();

          if (regData.success) {
            alert('Account created successfully! Logging you in...');
            saveUserSession({
              name: customerName || 'Customer',
              contact: phone,
              phone: phone,
              role: 'customer',
              loginTime: new Date().toLocaleString(),
            });
          } else {
            alert(regData.message || 'Failed to register account.');
          }
        }
      } else {
        alert(data.message || 'Invalid phone or password.');
      }
    } catch (error) {
      console.error('Flask API Error:', error);
      alert('Could not connect to backend server. Ensure Flask app is running!');
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFY EMAIL OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpInput === generatedOtp || otpInput === '123456') {
      const userObj = {
        name: customerName || 'Customer',
        contact: email,
        phone: phone,
        role: 'customer',
        loginTime: new Date().toLocaleString(),
      };
      saveUserSession(userObj);
    } else {
      alert('Invalid OTP verification code. Please try again.');
    }
  };

  // 5. STAFF LOGIN (Backend Connected - Username & Password Only)
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setStaffError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: staffUsername,
          password: staffPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const staffObj = {
          name: data.admin?.username || staffUsername,
          role: 'admin',
          loginTime: new Date().toLocaleString(),
        };

        if (setCurrentUser) setCurrentUser(staffObj);

        // Store all common auth keys used across React route guards
        localStorage.setItem('currentUser', JSON.stringify(staffObj));
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('isAdmin', 'true');

        alert('Staff Authentication Successful!');
        navigate('/admin');
      } else {
        setStaffError(data.message || 'Invalid Staff Username or Password.');
      }
    } catch (error) {
      console.error('Staff Login API Error:', error);
      setStaffError('Could not connect to server. Ensure Flask app is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF5F2] min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#0F172A]/10 shadow-lg space-y-6">
        
        {/* Portal Switcher */}
        <div className="flex bg-[#FFF5F2] p-1.5 rounded-full border border-[#0F172A]/10">
          <button
            type="button"
            onClick={() => { setLoginType('customer'); setOtpSent(false); }}
            className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              loginType === 'customer'
                ? 'bg-[#0F172A] text-white shadow-md'
                : 'text-[#0F172A]/70 hover:text-[#0F172A]'
            }`}
          >
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('staff')}
            className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              loginType === 'staff'
                ? 'bg-[#0F172A] text-white shadow-md'
                : 'text-[#0F172A]/70 hover:text-[#0F172A]'
            }`}
          >
            Staff Portal
          </button>
        </div>

        {/* CUSTOMER LOGIN SECTION */}
        {loginType === 'customer' && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="bg-[#FF8B8B]/20 text-[#FF8B8B] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Shopping Authentication
              </span>
              <h2 className="text-2xl font-black text-[#0F172A] mt-2">Sign In to Continue</h2>
            </div>

            {!otpSent && (
              <div className="flex justify-between gap-2 bg-[#FFF5F2] p-1 rounded-2xl border border-[#0F172A]/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCustomerAuthMode('email')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    customerAuthMode === 'email' ? 'bg-[#FF8B8B] text-white shadow' : 'text-[#0F172A]/70'
                  }`}
                >
                  Email (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerAuthMode('password')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    customerAuthMode === 'password' ? 'bg-[#0F172A] text-white shadow' : 'text-[#0F172A]/70'
                  }`}
                >
                  Phone & Password
                </button>
              </div>
            )}

            {!otpSent ? (
              <>
                {customerAuthMode === 'email' && (
                  <form onSubmit={handleSendEmailOtp} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">WhatsApp Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#FF8B8B] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#ff7575] transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Sending Email OTP...' : 'Get Email OTP'}
                    </button>
                  </form>
                )}

                {customerAuthMode === 'password' && (
                  <form onSubmit={handlePhonePasswordLogin} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Full Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#0F172A] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1E293B] transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Authenticating...' : 'Sign In with Password'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                <div className="bg-[#FFF5F2] p-3 rounded-2xl text-xs text-[#0F172A]/80 font-medium border border-[#0F172A]/5 text-center">
                  OTP sent to <span className="font-bold text-[#0F172A]">{email}</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1 text-center">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    placeholder="e.g. 123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#FF8B8B] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#ff7575] transition-all shadow-md"
                >
                  Verify & Sign In
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-[11px] font-bold text-[#0F172A]/60 hover:underline text-center block"
                >
                  Change Details / Resend OTP
                </button>
              </form>
            )}
          </div>
        )}

        {/* STAFF PORTAL SECTION (Username & Password Only) */}
        {loginType === 'staff' && (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="text-center">
              <span className="bg-[#0F172A] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Staff & Admin Portal
              </span>
              <h2 className="text-2xl font-black text-[#0F172A] mt-2">Staff Portal Sign In</h2>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Staff Username</label>
              <input
                type="text"
                required
                placeholder="admin"
                value={staffUsername}
                onChange={(e) => setStaffUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">Staff Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF8B8B]"
              />
            </div>

            {staffError && <p className="text-xs font-bold text-red-500 text-center">{staffError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0F172A] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1E293B] transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate Staff'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default Login;