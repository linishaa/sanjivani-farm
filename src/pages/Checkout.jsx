import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { API_ROOT_URL } from '../utils/apiService';

const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

function Checkout() {
  const navigate = useNavigate();

  const {
    cart = [],
    currentUser: contextUser,
    clearCart,
    addOrder,
  } = useProducts() || {};

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);

  // ---------------------------------------------------------
  // DELIVERY ADDRESS STATE
  // ---------------------------------------------------------
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('Kerala');
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');

  // ---------------------------------------------------------
  // ADDRESS VALIDATION STATE
  // ---------------------------------------------------------
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [showDistrictSuggestions, setShowDistrictSuggestions] =
    useState(false);

  const [postOfficeSuggestions, setPostOfficeSuggestions] = useState([]);
  const [showPostOfficeSuggestions, setShowPostOfficeSuggestions] =
    useState(false);

  const [pincodeStatus, setPincodeStatus] = useState('idle');
  const [pincodeMessage, setPincodeMessage] = useState('');

  const [addressError, setAddressError] = useState('');

  // ---------------------------------------------------------
  // FALLBACK TO LOCAL STORAGE FOR CURRENT USER
  // ---------------------------------------------------------
  const getStoredUser = () => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Failed to read current user:', error);
      return null;
    }
  };

  const currentUser = contextUser || getStoredUser();

  // ---------------------------------------------------------
  // AUTH GUARD
  // ---------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="bg-[#f0fdf4] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 text-center max-w-md space-y-4 shadow-xl">
          <span className="text-4xl">🔒</span>

          <h2 className="text-2xl font-black text-gray-900">
            Sign In Required
          </h2>

          <p className="text-xs font-medium text-gray-600">
            You must verify your account before placing an order.
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-[#16a34a] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] transition-all shadow-md"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // CART TOTAL
  // ---------------------------------------------------------
  const subtotal = cart.reduce(
    (acc, item) =>
      acc + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  // ---------------------------------------------------------
  // DISTRICT AUTOCOMPLETE
  // ---------------------------------------------------------
  const handleDistrictChange = (e) => {
    const value = e.target.value;

    setDistrict(value);
    setAddressError('');

    if (!value.trim()) {
      setDistrictSuggestions([]);
      setShowDistrictSuggestions(false);
      return;
    }

    const filtered = KERALA_DISTRICTS.filter((item) =>
      item.toLowerCase().startsWith(value.trim().toLowerCase())
    );

    setDistrictSuggestions(filtered);
    setShowDistrictSuggestions(filtered.length > 0);
  };

  const selectDistrict = (value) => {
    setDistrict(value);
    setShowDistrictSuggestions(false);
    setDistrictSuggestions([]);
    setAddressError('');
  };

  // ---------------------------------------------------------
  // PINCODE VALIDATION + POST OFFICE LOOKUP
  // ---------------------------------------------------------
  useEffect(() => {
    const cleanPincode = pincode.replace(/\D/g, '');

    if (cleanPincode.length !== 6) {
      setPincodeStatus('idle');
      setPincodeMessage('');
      setPostOffice('');
      setPostOfficeSuggestions([]);
      setShowPostOfficeSuggestions(false);
      return;
    }

    let cancelled = false;

    const lookupPincode = async () => {
      setPincodeStatus('loading');
      setPincodeMessage('Checking PIN code...');
      setAddressError('');
      setPostOffice('');
      setPostOfficeSuggestions([]);
      setShowPostOfficeSuggestions(false);

      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${cleanPincode}`
        );

        if (!response.ok) {
          throw new Error('Unable to check PIN code.');
        }

        const data = await response.json();

        if (cancelled) return;

        const result = data?.[0];

        if (
          !result ||
          result.Status !== 'Success' ||
          !Array.isArray(result.PostOffice) ||
          result.PostOffice.length === 0
        ) {
          setPincodeStatus('error');
          setPincodeMessage('Invalid PIN code.');
          setPostOffice('');
          setPostOfficeSuggestions([]);
          return;
        }

        const offices = result.PostOffice;

        // ---------------------------------------------------
        // CHECK THAT PIN BELONGS TO KERALA
        // ---------------------------------------------------
        const keralaOffices = offices.filter(
          (office) =>
            String(office.State || '')
              .trim()
              .toLowerCase() === 'kerala'
        );

        if (keralaOffices.length === 0) {
          setPincodeStatus('error');
          setPincodeMessage('This PIN code is outside Kerala.');
          setPostOffice('');
          setPostOfficeSuggestions([]);
          return;
        }

        // ---------------------------------------------------
        // USE POSTAL DATA TO DETERMINE DISTRICT
        // ---------------------------------------------------
        const firstOffice = keralaOffices[0];

        const detectedDistrict = String(
          firstOffice.District || ''
        ).trim();

        const detectedState = String(
          firstOffice.State || ''
        ).trim();

        // ---------------------------------------------------
        // VALIDATE DISTRICT AGAINST KERALA DISTRICT LIST
        // ---------------------------------------------------
        const matchedDistrict = KERALA_DISTRICTS.find(
          (item) =>
            item.toLowerCase() === detectedDistrict.toLowerCase()
        );

        if (!matchedDistrict) {
          setPincodeStatus('error');
          setPincodeMessage(
            'We could not verify this PIN code as a Kerala delivery PIN.'
          );
          setPostOffice('');
          setPostOfficeSuggestions([]);
          return;
        }

        // ---------------------------------------------------
        // AUTOMATICALLY SET STATE + DISTRICT
        // ---------------------------------------------------
        setStateName(detectedState || 'Kerala');
        setDistrict(matchedDistrict);

        // ---------------------------------------------------
        // POST OFFICE LIST
        // ---------------------------------------------------
        const uniquePostOffices = [
          ...new Map(
            keralaOffices.map((office) => [
              office.Name,
              office,
            ])
          ).values(),
        ];

        setPostOfficeSuggestions(uniquePostOffices);

        // If only one post office exists, select it.
        if (uniquePostOffices.length === 1) {
          setPostOffice(uniquePostOffices[0].Name);
          setShowPostOfficeSuggestions(false);
        } else {
          setPostOffice('');
          setShowPostOfficeSuggestions(false);
        }

        // ---------------------------------------------------
        // SUCCESS
        // ---------------------------------------------------
        setPincodeStatus('success');
        setPincodeMessage(
          uniquePostOffices.length > 1
            ? 'PIN code verified. Select your Post Office.'
            : 'PIN code verified.'
        );
      } catch (error) {
        if (cancelled) return;

        console.error('PIN lookup error:', error);

        setPincodeStatus('error');
        setPincodeMessage(
          'Unable to verify this PIN code right now. Please try again.'
        );
        setPostOffice('');
        setPostOfficeSuggestions([]);
      }
    };

    lookupPincode();

    return () => {
      cancelled = true;
    };
  }, [pincode]);

  // ---------------------------------------------------------
  // PIN INPUT
  // ---------------------------------------------------------
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);

    setPincode(value);
    setAddressError('');

    if (value.length < 6) {
      setPincodeStatus('idle');
      setPincodeMessage('');
      setPostOffice('');
      setPostOfficeSuggestions([]);
      setShowPostOfficeSuggestions(false);
    }
  };

  // ---------------------------------------------------------
  // POST OFFICE SELECT
  // ---------------------------------------------------------
  const selectPostOffice = (office) => {
    setPostOffice(office.Name);
    setVillage((currentVillage) =>
      currentVillage.trim() ? currentVillage : office.Name
    );

    setShowPostOfficeSuggestions(false);
    setAddressError('');
  };

  // ---------------------------------------------------------
  // LOAD RAZORPAY SDK
  // ---------------------------------------------------------
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');

      script.src =
        'https://checkout.razorpay.com/v1/checkout.js';

      script.async = true;

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // ---------------------------------------------------------
  // ADDRESS VALIDATION
  // ---------------------------------------------------------
  const validateAddress = () => {
    setAddressError('');

    if (!village.trim()) {
      setAddressError(
        'Please enter your Village / Town / City.'
      );
      return false;
    }

    if (!district.trim()) {
      setAddressError('Please select your District.');
      return false;
    }

    const validDistrict = KERALA_DISTRICTS.some(
      (item) =>
        item.toLowerCase() === district.trim().toLowerCase()
    );

    if (!validDistrict) {
      setAddressError(
        'Please select a valid Kerala district from the suggestions.'
      );
      return false;
    }

    if (stateName.trim().toLowerCase() !== 'kerala') {
      setAddressError(
        'Sanjivani Farm currently supports delivery within Kerala.'
      );
      return false;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddressError(
        'Please enter a valid 6-digit PIN code.'
      );
      return false;
    }

    if (pincodeStatus !== 'success') {
      setAddressError(
        'Please wait until your PIN code is successfully verified.'
      );
      return false;
    }

    if (!postOffice.trim()) {
      setAddressError('Please select your Post Office.');
      return false;
    }

    if (subtotal <= 0 || !cart.length) {
      setAddressError('Your cart is empty.');
      return false;
    }

    return true;
  };

  // ---------------------------------------------------------
  // MAIN ORDER FUNCTION
  // ---------------------------------------------------------
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (isProcessing) {
      return;
    }

    // Close suggestion dropdowns
    setShowDistrictSuggestions(false);
    setShowPostOfficeSuggestions(false);

    if (!validateAddress()) {
      return;
    }

    setIsProcessing(true);

    // -------------------------------------------------------
    // STRUCTURED ADDRESS
    // -------------------------------------------------------
    const address = {
      fullName: currentUser.name || 'Customer',
      phone: currentUser.phone || '',
      addressLine: street.trim(),
      village: village.trim(),
      city: village.trim(),
      district: district.trim(),
      state: 'Kerala',
      pincode: pincode.trim(),
      postOffice: postOffice.trim(),
    };

    // -------------------------------------------------------
    // OPTION A: CASH ON DELIVERY
    // -------------------------------------------------------
    if (paymentMethod === 'cod') {
      try {
        const codResponse = await fetch(
          `${API_ROOT_URL}/api/place-order-cod`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              cart,
              totalAmount: subtotal,
              userEmail: currentUser.email || '',
              userPhone: currentUser.phone || '',
            }),
          }
        );

        const codData = await codResponse.json();

        if (!codResponse.ok || !codData.success) {
          throw new Error(
            codData.message ||
              'Unable to place the COD order.'
          );
        }

        // Add order to local application state
        addOrder?.({
          id: codData.order_id,
          customer: currentUser.name || 'Customer',
          items: cart,
          total: subtotal,
          paymentMethod: 'Cash on Delivery',
          status: 'Order Placed (COD)',
          address,
        });

        // Clear cart only after successful backend order
        clearCart?.();

        alert(
          `Order ${codData.order_id} placed successfully. We sent the confirmation through the available notification channels.`
        );

        navigate('/orders');
      } catch (error) {
        console.error('COD order error:', error);

        alert(
          error.message ||
            'Could not place your COD order. Please try again.'
        );
      } finally {
        setIsProcessing(false);
      }

      return;
    }

    // -------------------------------------------------------
    // OPTION B: RAZORPAY ONLINE PAYMENT
    // -------------------------------------------------------
    try {
      // -----------------------------------------------------
      // STEP 1: LOAD RAZORPAY
      // -----------------------------------------------------
      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        alert(
          'Failed to load Razorpay. Please check your internet connection and try again.'
        );

        setIsProcessing(false);
        return;
      }

      // -----------------------------------------------------
      // STEP 2: CREATE RAZORPAY ORDER
      // -----------------------------------------------------
      const orderResponse = await fetch(
        `${API_ROOT_URL}/api/create-razorpay-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: subtotal,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData.success ||
        !orderData.order
      ) {
        alert(
          `Server Error: ${
            orderData.error ||
            orderData.message ||
            'Could not initiate payment.'
          }`
        );

        setIsProcessing(false);
        return;
      }

      // -----------------------------------------------------
      // STEP 3: RAZORPAY OPTIONS
      // -----------------------------------------------------
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,

        name: 'Sanjivani Pure Farm Dairy',

        description: 'Sanjivani Farm Order Payment',

        order_id: orderData.order.id,

        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
          contact: currentUser.phone || '',
        },

        theme: {
          color: '#16a34a',
        },

        // ---------------------------------------------------
        // PAYMENT SUCCESS
        // ---------------------------------------------------
        handler: async function (response) {
          try {
            // -----------------------------------------------
            // STEP 4: VERIFY PAYMENT ON BACKEND
            // -----------------------------------------------
            const verifyResponse = await fetch(
              `${API_ROOT_URL}/api/verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  address,

                  cart,

                  totalAmount: subtotal,

                  userEmail:
                    currentUser.email || '',

                  userPhone:
                    currentUser.phone || '',
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            // -----------------------------------------------
            // SUCCESSFUL VERIFICATION
            // -----------------------------------------------
            if (
              verifyResponse.ok &&
              verifyData.success
            ) {
              addOrder?.({
                id: response.razorpay_order_id,

                customer:
                  currentUser.name || 'Customer',

                items: cart,

                total: subtotal,

                paymentMethod:
                  'Online Payment (Razorpay)',

                status: 'Paid & Confirmed',

                address,
              });

              // IMPORTANT:
              // Cart is cleared only after successful
              // backend payment verification.
              clearCart?.();

              alert(
                '🎉 Payment successful! Your order has been placed and confirmation notifications have been sent.'
              );

              navigate('/orders');
            } else {
              console.error(
                'Payment verification failed:',
                verifyData
              );

              alert(
                verifyData.message ||
                  'Payment was received, but order verification could not be completed. Please contact support with your payment details.'
              );
            }
          } catch (error) {
            console.error(
              'Payment verification error:',
              error
            );

            alert(
              'Payment processing completed, but we could not confirm the order with the server. Please contact support before making another payment.'
            );
          } finally {
            setIsProcessing(false);
          }
        },

        // ---------------------------------------------------
        // PAYMENT WINDOW CLOSED
        // ---------------------------------------------------
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      // -----------------------------------------------------
      // STEP 5: OPEN RAZORPAY
      // -----------------------------------------------------
      const razorpayWindow =
        new window.Razorpay(options);

      razorpayWindow.open();
    } catch (error) {
      console.error('Razorpay Error:', error);

      alert(
        'Could not initiate online payment. Please try again.'
      );

      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="bg-[#f0fdf4] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-xl space-y-6">

        {/* ---------------------------------------------------
            HEADER
        --------------------------------------------------- */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900">
            Checkout
          </h1>

          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Sanjivani Farm
          </span>
        </div>

        {/* ---------------------------------------------------
            CURRENT USER
        --------------------------------------------------- */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60 text-xs text-gray-700 flex items-center justify-between gap-4">
          <div>
            Ordering as:{' '}
            <span className="font-bold text-emerald-900">
              {currentUser.name || 'Customer'}
            </span>
          </div>

          <div className="text-emerald-700 font-semibold text-right break-all">
            {currentUser.email ||
              currentUser.phone ||
              ''}
          </div>
        </div>

        {/* ---------------------------------------------------
            FORM
        --------------------------------------------------- */}
        <form
          onSubmit={handlePlaceOrder}
          className="space-y-6"
        >

          {/* =================================================
              DELIVERY ADDRESS
          ================================================= */}
          <div className="space-y-4">

            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
              Delivery Address Details
            </h2>

            {/* ---------------------------------------------
                HOUSE / STREET
            --------------------------------------------- */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                House No. / Street / Landmark{' '}
                <span className="font-medium text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                placeholder="e.g. House No. 12, Main Road, Near Milk Hub"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setAddressError('');
                }}
                autoComplete="street-address"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
              />
            </div>

            {/* ---------------------------------------------
                VILLAGE / CITY
            --------------------------------------------- */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                Village / Town / City *
              </label>

              <input
                type="text"
                required
                placeholder="Enter village, town or city"
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value);
                  setAddressError('');
                }}
                autoComplete="address-level2"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
              />

              <p className="text-[10px] text-gray-400 mt-1">
                Enter your local area, village or town.
              </p>
            </div>

            {/* ---------------------------------------------
                DISTRICT + STATE
            --------------------------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* DISTRICT */}
              <div className="relative">
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                  District *
                </label>

                <input
                  type="text"
                  required
                  placeholder="Type your district"
                  value={district}
                  onChange={handleDistrictChange}
                  onFocus={() => {
                    if (district.trim()) {
                      const filtered =
                        KERALA_DISTRICTS.filter(
                          (item) =>
                            item
                              .toLowerCase()
                              .startsWith(
                                district
                                  .trim()
                                  .toLowerCase()
                              )
                        );

                      setDistrictSuggestions(
                        filtered
                      );

                      setShowDistrictSuggestions(
                        filtered.length > 0
                      );
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowDistrictSuggestions(
                        false
                      );
                    }, 150);
                  }}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                />

                {/* DISTRICT SUGGESTIONS */}
                {showDistrictSuggestions &&
                  districtSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                      {districtSuggestions.map(
                        (item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={() =>
                              selectDistrict(
                                item
                              )
                            }
                            className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>

              {/* STATE */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                  State *
                </label>

                <select
                  value={stateName}
                  onChange={(e) => {
                    setStateName(e.target.value);
                    setAddressError('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent"
                >
                  <option value="Kerala">
                    Kerala
                  </option>
                </select>

                <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Currently delivering within Kerala
                </p>
              </div>
            </div>

            {/* ---------------------------------------------
                PIN CODE + POST OFFICE
            --------------------------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* PINCODE */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                  PIN Code *
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 680001"
                    value={pincode}
                    onChange={handlePincodeChange}
                    autoComplete="postal-code"
                    className={`w-full px-4 py-3 rounded-2xl border text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent ${
                      pincodeStatus ===
                      'success'
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : pincodeStatus ===
                          'error'
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-200 focus:ring-[#16a34a]'
                    }`}
                  />

                  {/* LOADING */}
                  {pincodeStatus ===
                    'loading' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Checking...
                    </span>
                  )}

                  {/* SUCCESS */}
                  {pincodeStatus ===
                    'success' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">
                      ✓
                    </span>
                  )}
                </div>

                {/* PIN MESSAGE */}
                {pincodeMessage && (
                  <p
                    className={`text-[10px] font-semibold mt-1 ${
                      pincodeStatus ===
                      'success'
                        ? 'text-emerald-600'
                        : pincodeStatus ===
                          'error'
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {pincodeStatus ===
                      'success'
                      ? '✓ '
                      : pincodeStatus ===
                        'error'
                      ? '✕ '
                      : ''}
                    {pincodeMessage}
                  </p>
                )}
              </div>

              {/* POST OFFICE */}
              <div className="relative">
                <label className="block text-[11px] font-extrabold uppercase text-gray-600 mb-1">
                  Post Office *
                </label>

                <input
                  type="text"
                  required
                  readOnly={
                    postOfficeSuggestions.length ===
                    0
                  }
                  placeholder={
                    pincodeStatus ===
                    'loading'
                      ? 'Checking PIN...'
                      : 'Select Post Office'
                  }
                  value={postOffice}
                  onChange={(e) => {
                    setPostOffice(
                      e.target.value
                    );
                    setShowPostOfficeSuggestions(
                      true
                    );
                  }}
                  onFocus={() => {
                    if (
                      postOfficeSuggestions.length >
                      0
                    ) {
                      setShowPostOfficeSuggestions(
                        true
                      );
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowPostOfficeSuggestions(
                        false
                      );
                    }, 150);
                  }}
                  autoComplete="off"
                  className={`w-full px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent ${
                    !postOffice &&
                    pincodeStatus ===
                      'success'
                      ? 'bg-emerald-50'
                      : 'bg-white'
                  }`}
                />

                {/* POST OFFICE SUGGESTIONS */}
                {showPostOfficeSuggestions &&
                  postOfficeSuggestions.length >
                    0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">

                      {postOfficeSuggestions.map(
                        (office, index) => (
                          <button
                            key={`${office.Name}-${index}`}
                            type="button"
                            onMouseDown={() =>
                              selectPostOffice(
                                office
                              )
                            }
                            className="w-full text-left px-4 py-3 border-b last:border-b-0 border-gray-100 hover:bg-emerald-50 transition-colors"
                          >
                            <span className="block text-xs font-bold text-gray-800">
                              {office.Name}
                            </span>

                            <span className="block text-[10px] text-gray-400 mt-0.5">
                              {office.Block
                                ? `${office.Block}, `
                                : ''}
                              {office.District ||
                                district}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}

                {pincodeStatus ===
                  'success' &&
                  postOfficeSuggestions.length >
                    1 &&
                  !postOffice && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Please select your Post Office.
                    </p>
                  )}
              </div>
            </div>

            {/* ---------------------------------------------
                ADDRESS ERROR
            --------------------------------------------- */}
            {addressError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                <span className="text-sm">
                  ⚠️
                </span>

                <p className="text-[11px] font-semibold leading-relaxed">
                  {addressError}
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              PAYMENT METHOD
          ================================================= */}
          <div className="space-y-3 pt-2">

            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-1">
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* ONLINE PAYMENT */}
              <div
                onClick={() =>
                  !isProcessing &&
                  setPaymentMethod(
                    'online'
                  )
                }
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${
                  paymentMethod ===
                  'online'
                    ? 'border-[#16a34a] bg-emerald-500/10 ring-2 ring-[#16a34a]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${
                  isProcessing
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={
                      paymentMethod ===
                      'online'
                    }
                    readOnly
                    className="accent-[#16a34a] w-4 h-4"
                  />

                  <span className="text-sm font-bold text-gray-900">
                    Pay Online (Razorpay)
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-500 mt-1 ml-7">
                  UPI, GPay, Cards, Netbanking
                </p>
              </div>

              {/* COD */}
              <div
                onClick={() =>
                  !isProcessing &&
                  setPaymentMethod(
                    'cod'
                  )
                }
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-center ${
                  paymentMethod ===
                  'cod'
                    ? 'border-[#16a34a] bg-emerald-500/10 ring-2 ring-[#16a34a]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${
                  isProcessing
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={
                      paymentMethod ===
                      'cod'
                    }
                    readOnly
                    className="accent-[#16a34a] w-4 h-4"
                  />

                  <span className="text-sm font-bold text-gray-900">
                    Cash on Delivery
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-500 mt-1 ml-7">
                  Pay via cash or UPI on delivery
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              TOTAL
          ================================================= */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm font-black text-gray-900">
              Total Amount:
            </span>

            <span className="text-xl font-black text-[#16a34a]">
              ₹{subtotal.toFixed(0)}
            </span>
          </div>

          {/* =================================================
              SUBMIT BUTTON
          ================================================= */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-[#16a34a] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? 'Processing...'
              : paymentMethod ===
                'online'
              ? 'Pay Now via Razorpay'
              : 'Confirm Order (COD)'}
          </button>

          {/* SECURITY / DELIVERY NOTE */}
          <p className="text-center text-[10px] text-gray-400 font-medium">
            Your delivery details are verified before
            placing the order.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Checkout;