import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';

function AdminDashboard() {
  const { orders = [], subscriptions = [] } = useProducts() || {};
  const [activeTab, setActiveTab] = useState('transactions');

  // Broadcast Offer Form States
  const [offerText, setOfferText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // --- AUTOMATIC USER SYNC ON COMPONENT MOUNT ---
  useEffect(() => {
    const syncLocalUsersToBackend = async () => {
      try {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (localUsers.length > 0) {
          await fetch(`${API_BASE_URL}/api/sync-users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: localUsers }),
          });
        }
      } catch (err) {
        console.warn('Backend user sync failed:', err);
      }
    };

    syncLocalUsersToBackend();
  }, []);

  // Helper to group orders by day and month
  const groupByDay = {};
  const groupByMonth = {};

  orders.forEach((order) => {
    const d = new Date(order.date);
    const dayKey = d.toLocaleDateString();
    const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!groupByDay[dayKey]) groupByDay[dayKey] = { count: 0, total: 0, orders: [] };
    groupByDay[dayKey].count += 1;
    groupByDay[dayKey].total += order.total;
    groupByDay[dayKey].orders.push(order);

    if (!groupByMonth[monthKey]) groupByMonth[monthKey] = { count: 0, total: 0, orders: [] };
    groupByMonth[monthKey].count += 1;
    groupByMonth[monthKey].total += order.total;
    groupByMonth[monthKey].orders.push(order);
  });

  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);

  // Handle Poster Image Selection and Local Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Submit Broadcast Request to Flask API
  const handleBroadcastOffers = async (e) => {
    e.preventDefault();
    if (!offerText && !imageFile) {
      alert('Please enter offer text or upload an offer image poster.');
      return;
    }

    setBroadcastLoading(true);
    setBroadcastStatus('Sending WhatsApp notifications to all users...');

    try {
      const formData = new FormData();
      formData.append('offer_text', offerText);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/broadcast-offer`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(`Success: ${data.message}`);
        setOfferText('');
        setImageFile(null);
        setImagePreview(null);
        setBroadcastStatus('');
      } else {
        alert(`Error: ${data.message}`);
        setBroadcastStatus('Broadcast failed.');
      }
    } catch (error) {
      console.error('Broadcast API Error:', error);
      alert('Could not send WhatsApp broadcast. Check if Flask backend is running.');
      setBroadcastStatus('');
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF5F2] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#0F172A]/10 shadow-sm">
          <div>
            <span className="bg-[#FF8B8B] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-2">
              Sanjivani Farm Management
            </h1>
          </div>
          <div className="bg-[#FFF5F2] px-6 py-3 rounded-2xl border border-[#0F172A]/10 flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-black text-[#0F172A]/50 block tracking-wider">
                Total Revenue
              </span>
              <span className="text-2xl font-black text-[#0F172A]">
                Rs. {totalRevenue}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#0F172A]/10 pb-4">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'transactions' 
                ? 'bg-[#0F172A] text-white shadow-md' 
                : 'bg-white text-[#0F172A]/70 hover:bg-white/80'
            }`}
          >
            📊 Transaction History
          </button>

          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'subscriptions' 
                ? 'bg-[#0F172A] text-white shadow-md' 
                : 'bg-white text-[#0F172A]/70 hover:bg-white/80'
            }`}
          >
            🥛 Active Subscriptions ({subscriptions.length})
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'orders' 
                ? 'bg-[#0F172A] text-white shadow-md' 
                : 'bg-white text-[#0F172A]/70 hover:bg-white/80'
            }`}
          >
            📦 All Orders ({orders.length})
          </button>

          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'broadcast' 
                ? 'bg-[#25D366] text-white shadow-md' 
                : 'bg-white text-[#0F172A]/70 hover:bg-white/80'
            }`}
          >
            📲 Broadcast Offers
          </button>
        </div>

        {/* TAB 1: TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div className="space-y-8">
            
            {/* Day by Day Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#0F172A]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#0F172A] mb-4">
                📅 Day-by-Day Transaction History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF5F2] text-[#0F172A] font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-2xl">Date</th>
                      <th className="p-3">Total Orders</th>
                      <th className="p-3 rounded-r-2xl">Revenue Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.keys(groupByDay).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(groupByDay).map(([date, data]) => (
                        <tr key={date} className="hover:bg-gray-50 font-bold text-[#0F172A]">
                          <td className="p-3.5">{date}</td>
                          <td className="p-3.5 text-gray-600 font-medium">{data.count} orders</td>
                          <td className="p-3.5 font-black text-[#FF8B8B]">Rs. {data.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Month by Month Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#0F172A]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#0F172A] mb-4">
                🗓️ Month-by-Month Transaction History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF5F2] text-[#0F172A] font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-2xl">Month</th>
                      <th className="p-3">Total Orders</th>
                      <th className="p-3 rounded-r-2xl">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.keys(groupByMonth).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-gray-400 font-medium">
                          No monthly records found.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(groupByMonth).map(([month, data]) => (
                        <tr key={month} className="hover:bg-gray-50 font-bold text-[#0F172A]">
                          <td className="p-3.5">{month}</td>
                          <td className="p-3.5 text-gray-600 font-medium">{data.count} orders</td>
                          <td className="p-3.5 font-black text-[#FF8B8B]">Rs. {data.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ACTIVE SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#0F172A]/10 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-[#0F172A]">Milk Subscription Requests</h2>
            
            {subscriptions.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-gray-400">
                No active subscriptions registered yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub, index) => (
                  <div key={sub.id || index} className="p-4 rounded-2xl bg-[#FFF5F2] border border-[#0F172A]/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#FF8B8B] tracking-wider block">
                          {sub.productType === 'a2' ? 'A2 Cow Milk' : 'Standard Milk'}
                        </span>
                        <h4 className="font-extrabold text-[#0F172A] text-sm">{sub.customer || 'Customer'}</h4>
                      </div>
                      <span className="text-xs font-black bg-[#0F172A] text-white px-3 py-1 rounded-full">
                        Rs. {sub.monthlyPrice || sub.total}/mo
                      </span>
                    </div>

                    <div className="text-xs text-[#0F172A]/70 font-medium space-y-1 pt-1 border-t border-[#0F172A]/10">
                      <div><span className="font-bold">Quantity:</span> {sub.litres || 2} Litres / day</div>
                      <div><span className="font-bold">Schedule:</span> <span className="capitalize">{sub.frequency || 'Daily'}</span></div>
                      <div><span className="font-bold">Pincode:</span> {sub.pincode || '680001'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#0F172A]/10 shadow-sm">
            <h2 className="text-lg font-black text-[#0F172A] mb-4">All Customer Orders</h2>
            
            {orders.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-gray-400">
                No customer orders found.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl border border-[#0F172A]/5 bg-[#FFF5F2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-black text-[#FF8B8B]">{order.id}</span>
                      <h4 className="font-extrabold text-[#0F172A] text-sm">{order.customer}</h4>
                      <p className="text-xs text-[#0F172A]/60 font-medium">
                        {new Date(order.date).toLocaleString()} • {order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-[#0F172A]">Rs. {order.total}</span>
                      <span className="block text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full mt-1">
                        {order.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHATSAPP OFFERS BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#0F172A]/10 shadow-sm max-w-2xl mx-auto space-y-6">
            <div>
              <span className="bg-[#25D366]/20 text-[#25D366] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Automated Marketing
              </span>
              <h2 className="text-xl font-black text-[#0F172A] mt-2">
                Broadcast WhatsApp Offers
              </h2>
              <p className="text-xs text-[#0F172A]/60 font-medium mt-1">
                Offers will be automatically delivered to every registered platform user's phone number, even if they are currently logged out.
              </p>
            </div>

            <form onSubmit={handleBroadcastOffers} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">
                  Offer Description / Text
                </label>
                <textarea
                  rows="4"
                  placeholder="Type offer message here... (e.g. 🥛 Special Discount! Get 15% off on monthly A2 Milk subscriptions using code SANJIVANI15!)"
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#0F172A]/15 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#0F172A]/70 mb-1">
                  Offer Poster Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-[#0F172A] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0F172A] file:text-white hover:file:bg-[#1E293B] cursor-pointer"
                />
              </div>

              {imagePreview && (
                <div className="mt-2 relative">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold uppercase text-[#0F172A]/60">Poster Preview:</p>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-[10px] font-extrabold text-red-500 hover:underline uppercase"
                    >
                      Remove Poster
                    </button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Poster Preview"
                    className="w-full h-48 object-cover rounded-2xl border border-[#0F172A]/10"
                  />
                </div>
              )}

              {broadcastStatus && (
                <p className="text-xs font-bold text-[#25D366] text-center animate-pulse">
                  {broadcastStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={broadcastLoading}
                className="w-full py-3.5 bg-[#25D366] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#20ba5a] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {broadcastLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Broadcasting Offers...
                  </>
                ) : (
                  '🚀 Send WhatsApp Offers to All Users'
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;