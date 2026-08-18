import React, { useState } from 'react';

function ServicesHub() {
  const [activeTab, setActiveTab] = useState('subscription');

  // Daily Subscription State
  const [litres, setLitres] = useState(1);
  const [durationDays, setDurationDays] = useState(30);
  const [subPaymentMethod, setSubPaymentMethod] = useState('online');
  const [subSubmitted, setSubSubmitted] = useState(false);

  const [subData, setSubData] = useState({
    contactName: '',
    phone: '',
    village: '',
    district: '',
    pincode: '',
    startDate: '',
    preferredTime: '',
    unavailabilityNote: '', // Delivery instructions / if not available note
  });

  // Price Calculation for Subscription (Fixed A2 Cow Milk @ ₹65)
  const pricePerLitre = 65;
  const milkVariety = 'Cow Milk';
  const estimatedTotal = litres * pricePerLitre * durationDays;

  // Bulk & Catering State
  const [bulkSubmitted, setBulkSubmitted] = useState(false);
  const [bulkData, setBulkData] = useState({
    contactName: '',
    cateringName: '',
    phone: '',
    village: '',
    district: '',
    pincode: '',
    deliveryDate: '',
    deliveryTime: '',
    volume: '50',
    paymentMethod: 'online',
  });

  // Helper for Phone Input (Only digits, max 10)
  const handlePhoneInput = (value, setter, dataObj) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 10) {
      setter({ ...dataObj, phone: digitsOnly });
    }
  };

  // Helper for Pincode Input (Only digits, max 6)
  const handlePincodeInput = (value, setter, dataObj) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 6) {
      setter({ ...dataObj, pincode: digitsOnly });
    }
  };

  // Helper to dynamically load Razorpay Checkout Script
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

  // Trigger Subscription Submit
  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();

    if (subData.phone.length !== 10) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (subData.pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    if (subPaymentMethod === 'cod') {
      setSubSubmitted(true);
      return;
    }

    const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE';
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      alert('Failed to load online payment gateway. Please check your connection.');
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: estimatedTotal * 100,
      currency: 'INR',
      name: 'Sanjivani Dairy',
      description: `${milkVariety} Subscription (${durationDays} Days Plan)`,
      prefill: {
        contact: subData.phone,
      },
      handler: function (response) {
        setSubSubmitted(true);
      },
      theme: { color: '#1B4D3E' },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // Trigger Bulk Form Submit
  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (bulkData.phone.length !== 10) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (bulkData.pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }

    if (bulkData.paymentMethod === 'cod') {
      setBulkSubmitted(true);
      return;
    }

    const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE';
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      alert('Failed to load online payment gateway. Please check your connection.');
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: 1000 * 100,
      currency: 'INR',
      name: 'Sanjivani Dairy',
      description: `Bulk Delivery Booking (${bulkData.volume} Litres)`,
      prefill: {
        contact: bulkData.phone,
      },
      handler: function (response) {
        setBulkSubmitted(true);
      },
      theme: { color: '#1B4D3E' },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <div className="bg-[#F8F5E6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-[#1B4D3E]/10 text-[#1B4D3E] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border border-[#1B4D3E]/20">
            ✨ Sanjivani Dairy Services
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight font-serif">
            Fresh & Direct <span className="text-[#2D6A4F]">Dairy Services</span>
          </h1>
          <p className="text-[#0F172A]/70 max-w-2xl mx-auto text-sm sm:text-base font-medium">
            Customize daily morning delivery or book bulk organic dairy supplies for special occasions.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white p-1.5 rounded-full border border-[#1B4D3E]/15 shadow-sm space-x-1">
            {[
              { id: 'subscription', label: 'Daily Subscription' },
              { id: 'bulk', label: 'Bulk & Catering' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSubSubmitted(false);
                  setBulkSubmitted(false);
                }}
                className={`px-6 py-3 rounded-full text-xs font-black tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1B4D3E] text-white shadow-md'
                    : 'text-[#0F172A]/70 hover:text-[#1B4D3E] hover:bg-[#F8F5E6]'
                }`}
              >
                {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Daily Subscription */}
        {activeTab === 'subscription' && (
          <div>
            {subSubmitted ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#1B4D3E]/15 shadow-xl max-w-lg mx-auto text-center space-y-4">
                <div className="w-16 h-16 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center mx-auto text-2xl font-black border border-[#1B4D3E]/20">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] font-serif">Subscription Confirmed!</h3>
                <p className="text-sm font-medium text-[#0F172A]/70">
                  Thank you <span className="font-bold text-[#0F172A]">{subData.contactName}</span>! Your daily delivery of <span className="font-bold text-[#0F172A]">{litres} Litre(s)</span> starting from <span className="font-bold text-[#0F172A]">{subData.startDate}</span> has been set up.
                </p>
                <p className="text-xs text-[#2D6A4F] font-bold">
                  {subPaymentMethod === 'cod' ? '💵 Payment Mode: Cash on Delivery' : '💳 Payment Mode: Paid Online'}
                </p>
                <button
                  onClick={() => setSubSubmitted(false)}
                  className="px-6 py-3.5 bg-[#1B4D3E] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#2D6A4F] transition-all mt-4"
                >
                  Create Another Plan
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscriptionSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/15 shadow-xl space-y-6">
                    <h2 className="text-xl font-black text-[#0F172A] font-serif">Customize Your Subscription Plan</h2>
                    
                    {/* Milk Variety */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-2">
                        Selected Milk Variety
                      </label>
                      <div className="p-4 rounded-2xl border-2 border-[#1B4D3E] bg-[#F8F5E6]/40 ring-2 ring-[#1B4D3E]/10 flex justify-between items-center">
                        <div>
                          <div className="font-black text-[#0F172A] text-base">Cow Milk</div>
                          <div className="text-xs text-[#0F172A]/70 font-medium mt-0.5">100% Pure, Unadulterated & Fresh Farm Milk</div>
                        </div>
                        <div className="text-xs text-white font-black bg-[#1B4D3E] px-3.5 py-2 rounded-full shadow-sm">
                          ₹65 / Litre
                        </div>
                      </div>
                    </div>

                    {/* Daily Quantity */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70">
                          Daily Quantity
                        </label>
                        <span className="text-xs font-black bg-[#1B4D3E] text-white px-3 py-1 rounded-full">
                          {litres} Litres / day
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={litres}
                        onChange={(e) => setLitres(Number(e.target.value))}
                        className="w-full accent-[#1B4D3E] cursor-pointer h-2 bg-[#1B4D3E]/10 rounded-lg"
                      />
                      <div className="flex justify-between text-[11px] font-bold text-[#0F172A]/40 mt-1">
                        <span>1 Litre</span>
                        <span>5 Litres</span>
                        <span>10 Litres</span>
                      </div>
                    </div>

                    {/* Subscription Duration & Starting Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1.5">
                          Subscription Duration *
                        </label>
                        <select
                          value={durationDays}
                          onChange={(e) => setDurationDays(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                        >
                          <option value={7}>1 Week (7 Days Plan)</option>
                          <option value={15}>15 Days Plan</option>
                          <option value={30}>1 Month (30 Days Plan)</option>
                          <option value={60}>2 Months (60 Days Plan)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1.5">
                          Starting Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={subData.startDate}
                          onChange={(e) => setSubData({ ...subData, startDate: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                        />
                      </div>
                    </div>

                    {/* Contact Info (Name, Phone, Preferred Time) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#0F172A]/10">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={subData.contactName}
                          onChange={(e) => setSubData({ ...subData, contactName: e.target.value })}
                          placeholder="Your Name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-[#0F172A]/50">+91</span>
                          <input
                            type="tel"
                            required
                            value={subData.phone}
                            onChange={(e) => handlePhoneInput(e.target.value, setSubData, subData)}
                            placeholder="9876543210"
                            maxLength={10}
                            className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                          Preferred Time <span className="text-[#2D6A4F] font-bold">(Opt)</span>
                        </label>
                        <select
                          value={subData.preferredTime}
                          onChange={(e) => setSubData({ ...subData, preferredTime: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                        >
                          <option value="">Any Morning Time</option>
                          <option value="5:00 AM - 6:30 AM">5:00 AM - 6:30 AM</option>
                          <option value="6:30 AM - 8:00 AM">6:30 AM - 8:00 AM</option>
                          <option value="8:00 AM - 9:30 AM">8:00 AM - 9:30 AM</option>
                        </select>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-3">
                      <span className="block text-xs font-black uppercase tracking-wider text-[#0F172A]">
                        Delivery Address Details
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                            Village / Area / Flat *
                          </label>
                          <input
                            type="text"
                            required
                            value={subData.village}
                            onChange={(e) => setSubData({ ...subData, village: e.target.value })}
                            placeholder="e.g. Rampur / Sector 4"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                            District *
                          </label>
                          <input
                            type="text"
                            required
                            value={subData.district}
                            onChange={(e) => setSubData({ ...subData, district: e.target.value })}
                            placeholder="e.g. Thrissur"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            required
                            value={subData.pincode}
                            onChange={(e) => handlePincodeInput(e.target.value, setSubData, subData)}
                            placeholder="680001"
                            maxLength={6}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Instruction Box / Unavailability Note */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1.5">
                        If not available on delivery day / Special Instructions <span className="text-[#2D6A4F] font-bold">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={subData.unavailabilityNote}
                        onChange={(e) => setSubData({ ...subData, unavailabilityNote: e.target.value })}
                        placeholder="e.g. If not available, leave milk bag near front gate, or call/message a day before if skipping..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] resize-none"
                      />
                    </div>

                    {/* Subscription Payment Options */}
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-3">
                        Select Payment Mode
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSubPaymentMethod('online')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            subPaymentMethod === 'online'
                              ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-md'
                              : 'border-[#1B4D3E]/20 text-[#0F172A] bg-white hover:border-[#1B4D3E]/50'
                          }`}
                        >
                          <div className="font-extrabold text-sm flex items-center gap-1.5">💳 Pay Online</div>
                          <div className={`text-[11px] mt-0.5 ${subPaymentMethod === 'online' ? 'text-white/80' : 'text-[#0F172A]/60'}`}>UPI, Cards, Netbanking</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSubPaymentMethod('cod')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            subPaymentMethod === 'cod'
                              ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-md'
                              : 'border-[#1B4D3E]/20 text-[#0F172A] bg-white hover:border-[#1B4D3E]/50'
                          }`}
                        >
                          <div className="font-extrabold text-sm flex items-center gap-1.5">💵 Cash on Delivery</div>
                          <div className={`text-[11px] mt-0.5 ${subPaymentMethod === 'cod' ? 'text-white/80' : 'text-[#0F172A]/60'}`}>Pay cash on delivery</div>
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Price Preview Card */}
                  <div className="bg-[#1B4D3E] text-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
                    <span className="bg-[#2D6A4F] text-white text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full tracking-widest inline-block border border-white/10">
                      Plan Summary
                    </span>
                    
                    <div className="space-y-3 text-xs font-medium border-b border-white/15 pb-4">
                      <div className="flex justify-between">
                        <span className="text-white/75">Milk Type:</span>
                        <span className="font-bold text-white">A2 Desi Cow Milk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/75">Daily Volume:</span>
                        <span className="font-bold text-white">{litres} L / day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/75">Duration:</span>
                        <span className="font-bold text-white">{durationDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/75">Start Date:</span>
                        <span className="font-bold text-white">{subData.startDate || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/75">Payment Mode:</span>
                        <span className="font-bold text-[#E9D8A6] uppercase">
                          {subPaymentMethod === 'online' ? 'Online' : 'Cash on Delivery'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-white/70 font-bold">Total Estimated Cost</div>
                      <div className="text-4xl font-black text-[#E9D8A6] mt-1">₹{estimatedTotal}</div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-white text-[#1B4D3E] font-black text-xs uppercase tracking-wider rounded-full hover:bg-[#F8F5E6] transition-all transform hover:-translate-y-0.5 shadow-xl cursor-pointer"
                    >
                      {subPaymentMethod === 'online' ? 'Pay Online & Start Plan' : 'Confirm Subscription (COD)'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Bulk Orders */}
        {activeTab === 'bulk' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/15 shadow-xl max-w-2xl mx-auto">
            {bulkSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center mx-auto text-xl font-black border border-[#1B4D3E]/20">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] font-serif">Bulk Delivery Order Received!</h3>
                <p className="text-xs font-medium text-[#0F172A]/70 max-w-md mx-auto">
                  Thank you, <span className="font-bold text-[#0F172A]">{bulkData.contactName}</span>. Your order for <span className="font-bold text-[#0F172A]">{bulkData.volume} Litres</span> scheduled for <span className="font-bold text-[#0F172A]">{bulkData.deliveryDate}</span> has been logged.
                </p>
                <p className="text-xs text-[#2D6A4F] font-bold">
                  {bulkData.paymentMethod === 'cod' ? '💵 Payment Mode: Cash on Delivery' : '💳 Payment Mode: Paid Online'}
                </p>
                <button
                  onClick={() => setBulkSubmitted(false)}
                  className="px-6 py-3.5 bg-[#1B4D3E] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#2D6A4F] transition-all mt-2"
                >
                  Book Another Bulk Order
                </button>
              </div>
            ) : (
              <form onSubmit={handleBulkSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-serif">Bulk & Catering Supplies</h2>
                  <p className="text-xs font-medium text-[#0F172A]/70 mt-0.5">
                    Order pure organic milk and dairy in bulk for functions, events, or restaurant supplies.
                  </p>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bulkData.contactName}
                      onChange={(e) => setBulkData({ ...bulkData, contactName: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Catering Service Name <span className="text-[#2D6A4F] font-bold">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={bulkData.cateringName}
                      onChange={(e) => setBulkData({ ...bulkData, cateringName: e.target.value })}
                      placeholder="e.g. Royal Caterers"
                      className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                    />
                  </div>
                </div>

                {/* Phone & Volume */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Indian Phone Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-sm font-bold text-[#0F172A]/50">+91</span>
                      <input
                        type="tel"
                        required
                        value={bulkData.phone}
                        onChange={(e) => handlePhoneInput(e.target.value, setBulkData, bulkData)}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full pl-14 pr-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Estimated Volume *
                    </label>
                    <select
                      value={bulkData.volume}
                      onChange={(e) => setBulkData({ ...bulkData, volume: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                    >
                      <option value="50">50 - 100 Litres</option>
                      <option value="200">100 - 300 Litres</option>
                      <option value="500">500+ Litres</option>
                    </select>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-3 pt-2">
                  <span className="block text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Delivery Address Details
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                        Village / Town / Area *
                      </label>
                      <input
                        type="text"
                        required
                        value={bulkData.village}
                        onChange={(e) => setBulkData({ ...bulkData, village: e.target.value })}
                        placeholder="e.g. Ollur Village"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        value={bulkData.district}
                        onChange={(e) => setBulkData({ ...bulkData, district: e.target.value })}
                        placeholder="e.g. Thrissur"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0F172A]/70 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={bulkData.pincode}
                        onChange={(e) => handlePincodeInput(e.target.value, setBulkData, bulkData)}
                        placeholder="680001"
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Schedule (Date & Optional Time) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkData.deliveryDate}
                      onChange={(e) => setBulkData({ ...bulkData, deliveryDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-1">
                      Delivery Time Slot <span className="text-[#2D6A4F] font-bold">(Optional)</span>
                    </label>
                    <select
                      value={bulkData.deliveryTime}
                      onChange={(e) => setBulkData({ ...bulkData, deliveryTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#1B4D3E]/20 text-[#0F172A] text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                    >
                      <option value="">Select Preferred Time</option>
                      <option value="5:00 AM - 8:00 AM">Early Morning (5:00 AM - 8:00 AM)</option>
                      <option value="8:00 AM - 12:00 PM">Morning (8:00 AM - 12:00 PM)</option>
                      <option value="4:00 PM - 8:00 PM">Evening (4:00 PM - 8:00 PM)</option>
                    </select>
                  </div>
                </div>

                {/* Payment Options Toggle */}
                <div className="pt-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]/70 mb-2">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, paymentMethod: 'online' })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        bulkData.paymentMethod === 'online'
                          ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-md'
                          : 'border-[#1B4D3E]/20 text-[#0F172A] bg-white hover:border-[#1B4D3E]/50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center gap-1.5">💳 Pay Online</div>
                      <div className={`text-[10px] mt-0.5 ${bulkData.paymentMethod === 'online' ? 'text-white/80' : 'text-[#0F172A]/60'}`}>Razorpay / UPI / Cards</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkData({ ...bulkData, paymentMethod: 'cod' })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        bulkData.paymentMethod === 'cod'
                          ? 'border-[#1B4D3E] bg-[#1B4D3E] text-white shadow-md'
                          : 'border-[#1B4D3E]/20 text-[#0F172A] bg-white hover:border-[#1B4D3E]/50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center gap-1.5">💵 Cash on Delivery</div>
                      <div className={`text-[10px] mt-0.5 ${bulkData.paymentMethod === 'cod' ? 'text-white/80' : 'text-[#0F172A]/60'}`}>Pay cash on delivery</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1B4D3E] text-white font-black text-xs uppercase tracking-wider rounded-full hover:bg-[#2D6A4F] transition-all shadow-xl mt-4 cursor-pointer"
                >
                  {bulkData.paymentMethod === 'online' ? 'Proceed to Online Payment' : 'Confirm Bulk Order (COD)'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ServicesHub;