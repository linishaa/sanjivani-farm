import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useProducts() || {};

  const [loginType, setLoginType] = useState('customer');
  const [customerAuthMode, setCustomerAuthMode] = useState('email');

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpRemaining, setOtpRemaining] = useState(0);

  // Staff
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffCaptcha, setStaffCaptcha] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNumbers, setCaptchaNumbers] = useState({
    first: 0,
    second: 0,
  });
  const [staffError, setStaffError] = useState('');

  // General message
  const [successMessage, setSuccessMessage] = useState('');

  // Automatically switch between local Flask backend and Render production URL
  const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:5000'
      : 'https://sanjivani-farm-backend.onrender.com';

  const OTP_DURATION = 5 * 60 * 1000;

  /* -------------------------------------------------------
     CAPTCHA
  ------------------------------------------------------- */

  const generateCaptcha = () => {
    const first = Math.floor(Math.random() * 9) + 1;
    const second = Math.floor(Math.random() * 9) + 1;

    setCaptchaNumbers({
      first,
      second,
    });

    setStaffCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  /* -------------------------------------------------------
     RESTORE CUSTOMER LOGIN STATE
     Keeps the screen/form stable if component remounts.
  ------------------------------------------------------- */

  useEffect(() => {
    const savedLoginState = sessionStorage.getItem(
      'sanjivani_login_state'
    );

    if (!savedLoginState) return;

    try {
      const parsed = JSON.parse(savedLoginState);

      if (parsed.customerName) {
        setCustomerName(parsed.customerName);
      }

      if (parsed.email) {
        setEmail(parsed.email);
      }

      if (parsed.phone) {
        setPhone(parsed.phone);
      }

      if (parsed.loginType) {
        setLoginType(parsed.loginType);
      }

      if (parsed.customerAuthMode) {
        setCustomerAuthMode(parsed.customerAuthMode);
      }

      if (parsed.otpSent && parsed.otpExpiresAt) {
        const expiresAt = Number(parsed.otpExpiresAt);

        if (expiresAt > Date.now()) {
          setOtpSent(true);
          setOtpExpiresAt(expiresAt);
        } else {
          sessionStorage.removeItem('sanjivani_login_state');
        }
      }
    } catch (error) {
      console.error('Failed to restore login state:', error);
      sessionStorage.removeItem('sanjivani_login_state');
    }
  }, []);

  /* -------------------------------------------------------
     SAVE LOGIN FORM STATE
     Password and OTP are intentionally NOT stored.
  ------------------------------------------------------- */

  useEffect(() => {
    const loginState = {
      customerName,
      email,
      phone,
      loginType,
      customerAuthMode,
      otpSent,
      otpExpiresAt,
    };

    sessionStorage.setItem(
      'sanjivani_login_state',
      JSON.stringify(loginState)
    );
  }, [
    customerName,
    email,
    phone,
    loginType,
    customerAuthMode,
    otpSent,
    otpExpiresAt,
  ]);

  /* -------------------------------------------------------
     OTP COUNTDOWN
  ------------------------------------------------------- */

  useEffect(() => {
    if (!otpSent || !otpExpiresAt) {
      setOtpRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((otpExpiresAt - Date.now()) / 1000)
      );

      setOtpRemaining(remaining);

      if (remaining <= 0) {
        setOtpSent(false);
        setOtpExpiresAt(null);
        setOtpInput('');

        sessionStorage.removeItem('sanjivani_login_state');
      }
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [otpSent, otpExpiresAt]);

  const formatOtpTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  };

  /* -------------------------------------------------------
     EXISTING SESSION CHECK
  ------------------------------------------------------- */

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);

        if (userObj.role === 'customer') {
          navigate('/');
        } else if (userObj.role === 'admin') {
          navigate('/admin');
        }
      } catch (err) {
        console.error('Failed to parse saved session:', err);
      }
    }
  }, [navigate]);

  /* -------------------------------------------------------
     SAVE USER SESSION
  ------------------------------------------------------- */

  const saveUserSession = (userObj) => {
    if (setCurrentUser) {
      setCurrentUser(userObj);
    }

    localStorage.setItem(
      'currentUser',
      JSON.stringify(userObj)
    );

    const existingLogs = JSON.parse(
      localStorage.getItem('activeUsers') || '[]'
    );

    localStorage.setItem(
      'activeUsers',
      JSON.stringify([userObj, ...existingLogs])
    );

    sessionStorage.removeItem('sanjivani_login_state');

    setSuccessMessage(
      `Welcome back, ${userObj.name || 'Customer'}!`
    );

    setTimeout(() => {
      navigate('/');
    }, 700);
  };

  /* -------------------------------------------------------
     SEND EMAIL OTP
  ------------------------------------------------------- */

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !email.trim() || !phone.trim()) {
      alert(
        'Please fill in your name, email address, and phone number.'
      );
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();

      const response = await fetch(
        `${API_BASE_URL}/api/login/email-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            phone: cleanPhone,
            name: customerName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to send verification email.'
        );
      }

      /*
        IMPORTANT:
        We intentionally do NOT store or use data.otp here.

        Production OTP must be verified by the backend.
      */

      const expiresAt = Date.now() + OTP_DURATION;

      setEmail(cleanEmail);
      setOtpSent(true);
      setOtpExpiresAt(expiresAt);
      setOtpInput('');

      setSuccessMessage(
        `Verification code sent to ${cleanEmail}`
      );
    } catch (error) {
      console.error('Email OTP Error:', error);

      alert(
        error.message ||
          'Unable to send verification email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     PHONE + PASSWORD LOGIN
  ------------------------------------------------------- */

  const handlePhonePasswordLogin = async (e) => {
    e.preventDefault();

    if (!phone.trim() || !password) {
      alert('Mobile number and password are required.');
      return;
    }

    setLoading(true);
    setStaffError('');

    try {
      const cleanPhone = phone.trim();

      const response = await fetch(
        `${API_BASE_URL}/api/login/phone-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: cleanPhone,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        /*
          IMPORTANT FIX:
          Save the customer's email into currentUser.

          Checkout.jsx reads:
          currentUser.email
        */

        const userObj = {
          name:
            data.user?.full_name ||
            customerName.trim() ||
            'Customer',

          email:
            data.user?.email ||
            email.trim().toLowerCase() ||
            '',

          contact: cleanPhone,
          phone: cleanPhone,
          role: 'customer',
          loginTime: new Date().toLocaleString(),
        };

        saveUserSession(userObj);
      } else if (response.status === 404) {
        const wantRegister = window.confirm(
          'Phone number is not registered. Would you like to create a new account with these credentials?'
        );

        if (wantRegister) {
          if (!customerName.trim()) {
            alert(
              'Please enter your full name before creating the account.'
            );
            setLoading(false);
            return;
          }

          const regResponse = await fetch(
            `${API_BASE_URL}/api/register`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone: cleanPhone,
                password,
                full_name: customerName.trim(),
                email: email.trim().toLowerCase(),
              }),
            }
          );

          const regData = await regResponse.json();

          if (regData.success) {
            const userObj = {
              name: customerName.trim() || 'Customer',

              /*
                IMPORTANT FIX:
                Store email after registration too.
              */
              email: email.trim().toLowerCase(),

              contact: cleanPhone,
              phone: cleanPhone,
              role: 'customer',
              loginTime: new Date().toLocaleString(),
            };

            saveUserSession(userObj);
          } else {
            alert(
              regData.message ||
                'Failed to register account.'
            );
          }
        }
      } else {
        alert(
          data.message ||
            'Invalid phone number or password.'
        );
      }
    } catch (error) {
      console.error('Phone Password Login Error:', error);

      alert(
        'Could not connect to the backend server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     VERIFY EMAIL OTP
  ------------------------------------------------------- */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpInput.trim()) {
      alert('Please enter the 6-digit OTP code.');
      return;
    }

    if (otpRemaining <= 0 || !otpExpiresAt) {
      alert(
        'This OTP has expired. Please request a new verification code.'
      );

      setOtpSent(false);
      setOtpExpiresAt(null);
      setOtpInput('');

      return;
    }

    if (otpInput.trim().length !== 6) {
      alert('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      const response = await fetch(
        `${API_BASE_URL}/api/login/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            otp: otpInput.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        /*
          IMPORTANT FIX:
          Email is now stored in currentUser.

          Checkout.jsx will therefore send:
          userEmail: currentUser.email
        */

        const userObj = {
          name: customerName.trim() || 'Customer',

          email: cleanEmail,

          contact: cleanEmail,
          phone: phone.trim(),

          role: 'customer',
          loginTime: new Date().toLocaleString(),
        };

        saveUserSession(userObj);
      } else {
        alert(
          data.message ||
            'Invalid or expired OTP code.'
        );
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);

      /*
        IMPORTANT:
        No client-side OTP fallback.

        We do NOT accept:
        123456
        generatedOtp
        browser-side OTP
      */

      alert(
        'Unable to verify the OTP. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     RESEND OTP
  ------------------------------------------------------- */

  const handleResendOtp = () => {
    setOtpSent(false);
    setOtpExpiresAt(null);
    setOtpInput('');

    setTimeout(() => {
      const fakeEvent = {
        preventDefault: () => {},
      };

      handleSendEmailOtp(fakeEvent);
    }, 100);
  };

  /* -------------------------------------------------------
     STAFF LOGIN
  ------------------------------------------------------- */

  const handleStaffLogin = async (e) => {
    e.preventDefault();

    setStaffError('');
    setLoading(true);

    const cleanUsername = staffUsername.trim().toLowerCase();
    const cleanPassword = staffPassword;

    const captchaCorrect =
      Number(staffCaptcha) ===
      captchaNumbers.first + captchaNumbers.second;

    if (!captchaCorrect) {
      setStaffError(
        'Incorrect security verification. Please solve the CAPTCHA.'
      );

      generateCaptcha();
      setLoading(false);
      return;
    }

    /*
      NOTE:
      Existing local credentials are preserved here temporarily
      because they already exist in your current implementation.

      These should later be removed and replaced entirely with
      secure server-side staff authentication.
    */

    const validUsernames = ['admin', 'staff'];

    const validPasswords = [
      'admin',
      'admin123',
      'admin@123',
      '123456',
      'sanjivani@123',
    ];

    if (
      validUsernames.includes(cleanUsername) &&
      validPasswords.includes(cleanPassword)
    ) {
      const staffObj = {
        name: staffUsername.trim(),
        role: 'admin',
        loginTime: new Date().toLocaleString(),
      };

      if (setCurrentUser) {
        setCurrentUser(staffObj);
      }

      localStorage.setItem(
        'currentUser',
        JSON.stringify(staffObj)
      );

      localStorage.setItem(
        'isAdminLoggedIn',
        'true'
      );

      localStorage.setItem(
        'isAdmin',
        'true'
      );

      setSuccessMessage(
        'Staff authentication successful.'
      );

      setTimeout(() => {
        navigate('/admin');
      }, 700);

      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: staffUsername.trim(),
            password: staffPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const staffObj = {
          name:
            data.admin?.username ||
            staffUsername.trim(),

          role: 'admin',
          loginTime: new Date().toLocaleString(),
        };

        if (setCurrentUser) {
          setCurrentUser(staffObj);
        }

        localStorage.setItem(
          'currentUser',
          JSON.stringify(staffObj)
        );

        localStorage.setItem(
          'isAdminLoggedIn',
          'true'
        );

        localStorage.setItem(
          'isAdmin',
          'true'
        );

        setSuccessMessage(
          'Staff authentication successful.'
        );

        setTimeout(() => {
          navigate('/admin');
        }, 700);
      } else {
        setStaffError(
          data.message ||
            'Invalid staff username or password.'
        );

        generateCaptcha();
      }
    } catch (error) {
      console.error('Staff Login API Error:', error);

      setStaffError(
        'Could not connect to the server. Please try again.'
      );

      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     CHANGE LOGIN MODE
  ------------------------------------------------------- */

  const switchLoginType = (type) => {
    setLoginType(type);
    setStaffError('');
    setSuccessMessage('');

    if (type === 'staff') {
      generateCaptcha();
    }
  };

  const switchCustomerAuthMode = (mode) => {
    setCustomerAuthMode(mode);
    setStaffError('');
    setSuccessMessage('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-start overflow-hidden bg-black px-4 py-8 sm:px-6 lg:px-12">

      {/* =====================================================
          BACKGROUND VIDEO
      ====================================================== */}

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="/bg-video.mp4"
          type="video/mp4"
        />

        Your browser does not support the video tag.
      </video>

      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-emerald-950/60" />

      {/* Ambient lights */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-[140px]" />

      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-20 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12">

        {/* ===================================================
            LOGIN CARD
        ==================================================== */}

        <div className="lg:col-span-6">

          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-7 lg:p-8">

            {/* Premium top glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="relative mb-7 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <span className="text-2xl">✦</span>
              </div>

              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                SANJIVANI FARM
              </p>

              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Welcome Back
              </h2>

              <p className="mt-2 text-xs font-medium text-white/50">
                Secure access to your farm-fresh shopping experience
              </p>

            </div>

            {/* =================================================
                CUSTOMER / STAFF SWITCH
            ================================================== */}

            <div className="relative mb-6 flex rounded-2xl border border-white/10 bg-black/30 p-1">

              <button
                type="button"
                onClick={() =>
                  switchLoginType('customer')
                }
                className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 ${
                  loginType === 'customer'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Customer
              </button>

              <button
                type="button"
                onClick={() =>
                  switchLoginType('staff')
                }
                className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 ${
                  loginType === 'staff'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Staff Portal
              </button>

            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================== */}

            {successMessage && (
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-xs font-bold text-emerald-200">
                ✓ {successMessage}
              </div>
            )}

            {/* =================================================
                CUSTOMER LOGIN
            ================================================== */}

            {loginType === 'customer' && (
              <div>

                {/* AUTH MODE */}
                {!otpSent && (
                  <div className="mb-5 flex rounded-2xl border border-white/10 bg-black/20 p-1">

                    <button
                      type="button"
                      onClick={() =>
                        switchCustomerAuthMode('email')
                      }
                      className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider transition ${
                        customerAuthMode === 'email'
                          ? 'bg-white text-black shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Email OTP
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        switchCustomerAuthMode('password')
                      }
                      className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider transition ${
                        customerAuthMode === 'password'
                          ? 'bg-white text-black shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      Phone + Password
                    </button>

                  </div>
                )}

                {/* =================================================
                    EMAIL OTP
                ================================================== */}

                {!otpSent &&
                  customerAuthMode === 'email' && (
                    <form
                      onSubmit={handleSendEmailOtp}
                      className="space-y-4"
                    >

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Full Name
                        </label>

                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={customerName}
                          onChange={(e) =>
                            setCustomerName(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Email Address
                        </label>

                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) =>
                            setEmail(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          WhatsApp Phone Number
                        </label>

                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-950/50 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? 'Sending Secure Code...'
                          : 'Continue with Email OTP'}
                      </button>

                    </form>
                  )}

                {/* =================================================
                    PHONE PASSWORD
                ================================================== */}

                {!otpSent &&
                  customerAuthMode === 'password' && (
                    <form
                      onSubmit={
                        handlePhonePasswordLogin
                      }
                      className="space-y-4"
                    >

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Full Name
                        </label>

                        <input
                          type="text"
                          placeholder="Optional"
                          value={customerName}
                          onChange={(e) =>
                            setCustomerName(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Phone Number
                        </label>

                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Email Address
                          <span className="ml-2 text-white/30">
                            For order notifications
                          </span>
                        </label>

                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) =>
                            setEmail(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                          Password
                        </label>

                        <input
                          type="password"
                          required
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) =>
                            setPassword(
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-950/50 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? 'Authenticating...'
                          : 'Sign In Securely'}
                      </button>

                    </form>
                  )}

                {/* =================================================
                    OTP VERIFICATION
                ================================================== */}

                {otpSent && (
                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-5"
                  >

                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center">

                      <div className="mb-2 text-2xl">
                        ✉
                      </div>

                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        Verification Code Sent
                      </p>

                      <p className="mt-1 text-xs text-white/60">
                        Check your inbox
                      </p>

                      <p className="mt-2 break-all text-sm font-bold text-white">
                        {email}
                      </p>

                    </div>

                    {/* TIMER */}

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">

                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                        Code expires in
                      </span>

                      <span
                        className={`font-mono text-sm font-black ${
                          otpRemaining <= 60
                            ? 'text-red-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {formatOtpTime(
                          otpRemaining
                        )}
                      </span>

                    </div>

                    <div>

                      <label className="mb-2 block text-center text-[10px] font-black uppercase tracking-widest text-white/60">
                        Enter 6-Digit Verification Code
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        autoFocus
                        placeholder="000000"
                        value={otpInput}
                        onChange={(e) =>
                          setOtpInput(
                            e.target.value.replace(
                              /\D/g,
                              ''
                            )
                          )
                        }
                        className="w-full rounded-2xl border-2 border-emerald-400/30 bg-black/40 px-4 py-5 text-center font-mono text-2xl font-black tracking-[0.45em] text-emerald-300 outline-none transition placeholder:text-white/15 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
                      />

                    </div>

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        otpRemaining <= 0
                      }
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-950/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? 'Verifying Securely...'
                        : 'Verify & Continue'}
                    </button>

                    <div className="flex gap-3">

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpExpiresAt(null);
                          setOtpInput('');
                        }}
                        className="flex-1 rounded-xl border border-white/10 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 transition hover:border-white/20 hover:text-white"
                      >
                        Change Email
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleResendOtp
                        }
                        disabled={loading}
                        className="flex-1 rounded-xl border border-emerald-400/20 py-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
                      >
                        Resend Code
                      </button>

                    </div>

                  </form>
                )}

              </div>
            )}

            {/* =================================================
                STAFF LOGIN
            ================================================== */}

            {loginType === 'staff' && (
              <form
                onSubmit={handleStaffLogin}
                className="space-y-4"
              >

                <div className="mb-5 text-center">

                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10">
                    <span className="text-xl">
                      ◈
                    </span>
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                    Authorized Personnel
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Staff and administration access
                  </p>

                </div>

                {/* USERNAME */}

                <div>

                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                    Staff Username
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={staffUsername}
                    onChange={(e) =>
                      setStaffUsername(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-white/60">
                    Staff Password
                  </label>

                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={staffPassword}
                    onChange={(e) =>
                      setStaffPassword(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:bg-black/35 focus:ring-2 focus:ring-emerald-400/10"
                  />

                </div>

                {/* CAPTCHA */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white/60">
                        Security Verification
                      </p>

                      <p className="mt-1 text-[9px] text-white/30">
                        Confirm you are not an automated bot
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        generateCaptcha
                      }
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      Refresh
                    </button>

                  </div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-emerald-400/20 bg-black/40 font-mono text-lg font-black tracking-widest text-emerald-300">
                      {captchaNumbers.first}
                      <span className="mx-3 text-white/30">
                        +
                      </span>
                      {captchaNumbers.second}
                      <span className="mx-3 text-white/30">
                        =
                      </span>
                      ?
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="Answer"
                      value={staffCaptcha}
                      onChange={(e) =>
                        setStaffCaptcha(
                          e.target.value.replace(
                            /\D/g,
                            ''
                          )
                        )
                      }
                      className="h-12 w-28 rounded-xl border border-white/10 bg-black/30 px-3 text-center text-sm font-black text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60"
                    />

                  </div>

                </div>

                {staffError && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-xs font-bold text-red-200">
                    {staffError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-950/50 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Authenticating...'
                    : 'Authenticate Staff'}
                </button>

              </form>
            )}

            {/* =================================================
                SECURITY FOOTER
            ================================================== */}

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/10 pt-5">

              <span className="text-[10px] text-emerald-300">
                ◆
              </span>

              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                Secure • Private • Farm Fresh
              </span>

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT BRAND PANEL
        ==================================================== */}

        <div className="hidden lg:col-span-6 lg:block">

          <div className="max-w-xl px-8 text-white">

            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-white/[0.05] px-4 py-2 backdrop-blur-xl">

              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" />

              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">
                100% Organic • Farm Fresh
              </span>

            </div>

            <h1 className="text-6xl font-black leading-[1.02] tracking-[-0.04em] xl:text-7xl">

              Pure from
              <br />

              <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-amber-200 bg-clip-text text-transparent">
                our farm.
              </span>

            </h1>

            <p className="mt-7 max-w-lg text-sm font-medium leading-7 text-white/55">
              Experience natural milk, farm produce and
              artisanal dairy crafted with care and delivered
              fresh to your doorstep.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 border-t border-white/10 pt-7">

              <div>
                <p className="text-2xl font-black text-emerald-300">
                  100%
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Organic
                </p>
              </div>

              <div className="border-l border-white/10 pl-6">
                <p className="text-2xl font-black text-emerald-300">
                  Fresh
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Every Day
                </p>
              </div>

              <div className="border-l border-white/10 pl-6">
                <p className="text-2xl font-black text-emerald-300">
                  Direct
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  From Farm
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;