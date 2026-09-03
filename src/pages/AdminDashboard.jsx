import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';

const API_BASE_URL = 'https://sanjivani-farmbackend.onrender.com';

function AdminDashboard() {
  const { orders = [], subscriptions = [] } = useProducts() || {};
  const [activeTab, setActiveTab] = useState('transactions');

  // Broadcast Offer Form States
  const [offerText, setOfferText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Backend Orders States
  const [backendOrders, setBackendOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Registered Users State
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Product Stock & Inventory Management States
  const [products, setProducts] = useState([
    { id: 1, name: 'A2 Cow Milk (1 Litre)', price: 75, inStock: true, image: '' },
    { id: 2, name: 'Standard Fresh Milk (1 Litre)', price: 60, inStock: true, image: '' },
    { id: 3, name: 'Pure Desi Cow Ghee (500ml)', price: 650, inStock: true, image: '' },
    { id: 4, name: 'Fresh Farm Paneer (200g)', price: 120, inStock: true, image: '' },
    { id: 5, name: 'Natural Curd / Dahi (500g)', price: 45, inStock: true, image: '' },
  ]);

  // New Item Form States
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImageBase64, setNewItemImageBase64] = useState('');
  const [newItemImagePreview, setNewItemImagePreview] = useState(null);

  // --- ROBUST USER & INVENTORY SYNC ON COMPONENT MOUNT ---
  useEffect(() => {
    const loadRegisteredUsers = () => {
      let usersList = [];
      
      // Check multiple common localStorage keys for registered users
      const keysToCheck = ['users', 'registered_users', 'customers', 'all_users', 'userList'];
      for (const key of keysToCheck) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              usersList = parsed;
              break;
            } else if (typeof parsed === 'object' && parsed !== null) {
              usersList = [parsed];
              break;
            }
          } catch (e) {
            console.warn(`Error parsing key ${key}:`, e);
          }
        }
      }

      // Fallback: If no dedicated user list found, extract unique customers from existing orders
      if (usersList.length === 0 && orders.length > 0) {
        const uniqueMap = new Map();
        orders.forEach(order => {
          const email = order.user_email || order.email || (order.address && order.address.email);
          const name = order.customer || (order.address && order.address.fullName) || 'Valued Customer';
          const phone = order.phone || (order.address && order.address.phone) || 'N/A';
          if (email || name) {
            const identifier = email || name;
            if (!uniqueMap.has(identifier)) {
              uniqueMap.set(identifier, { id: uniqueMap.size + 1, name, email: email || 'N/A', phone });
            }
          }
        });
        usersList = Array.from(uniqueMap.values());
      }

      setRegisteredUsers(usersList);
    };

    loadRegisteredUsers();
    
    // Load saved stock status & custom products if available
    const savedProducts = localStorage.getItem('admin_products_stock');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Failed to load saved stock status', e);
      }
    }
  }, [orders]);

  // Fetch orders from backend when 'orders' tab is selected
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchBackendOrders();
    }
  }, [activeTab]);

  const fetchBackendOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await response.json();
      if (data.success) {
        setBackendOrders(data.orders.reverse()); // Newest first
      }
    } catch (err) {
      console.error('Failed to fetch backend orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Toggle Stock Status for a Product
  const toggleStockStatus = (id) => {
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        return { ...product, inStock: !product.inStock };
      }
      return product;
    });
    setProducts(updatedProducts);
    localStorage.setItem('admin_products_stock', JSON.stringify(updatedProducts));
  };

  // Delete Product
  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product from inventory?')) {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      localStorage.setItem('admin_products_stock', JSON.stringify(updatedProducts));
    }
  };

  // Handle New Product Image Selection & Base64 Conversion
  const handleNewItemImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItemImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add New Product Handler
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) {
      alert('Please enter product name and price.');
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: newItemName.trim(),
      price: parseFloat(newItemPrice),
      inStock: true,
      image: newItemImageBase64 || 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png'
    };

    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    localStorage.setItem('admin_products_stock', JSON.stringify(updatedProducts));

    // Reset Form
    setNewItemName('');
    setNewItemPrice('');
    setNewItemImageBase64('');
    setNewItemImagePreview(null);
    alert('New item successfully added to inventory!');
  };

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
    <div className="bg-[#F4F7F4] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#1B4D3E]/10 shadow-sm">
          <div>
            <span className="bg-[#1B4D3E] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#133020] mt-2">
              Sanjivani Farm Management
            </h1>
          </div>
          <div className="bg-[#FAF8F5] px-6 py-3 rounded-2xl border border-[#D8C7A3]/40 flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-black text-[#133020]/60 block tracking-wider">
                Total Revenue
              </span>
              <span className="text-2xl font-black text-[#1B4D3E]">
                Rs. {totalRevenue}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#1B4D3E]/10 pb-4">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'transactions' 
                ? 'bg-[#1B4D3E] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            📊 Transaction History
          </button>

          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'subscriptions' 
                ? 'bg-[#1B4D3E] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            🥛 Active Subscriptions ({subscriptions.length})
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'orders' 
                ? 'bg-[#1B4D3E] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            📦 All Orders ({backendOrders.length || orders.length})
          </button>

          <button 
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'customers' 
                ? 'bg-[#1B4D3E] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            👥 Registered Customers ({registeredUsers.length})
          </button>

          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'stock' 
                ? 'bg-[#1B4D3E] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            🏷️ Stock & Inventory ({products.length})
          </button>

          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === 'broadcast' 
                ? 'bg-[#2D6A4F] text-white shadow-md' 
                : 'bg-white text-[#133020]/70 hover:bg-[#EAF0EB]'
            }`}
          >
            📲 Broadcast Offers
          </button>
        </div>

        {/* TAB 1: TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#133020] mb-4">
                📅 Day-by-Day Transaction History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EAF0EB] text-[#133020] font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-2xl">Date</th>
                      <th className="p-3">Total Orders</th>
                      <th className="p-3 rounded-r-2xl">Revenue Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B4D3E]/5">
                    {Object.keys(groupByDay).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-[#133020]/40 font-medium">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(groupByDay).map(([date, data]) => (
                        <tr key={date} className="hover:bg-[#F4F7F4] font-bold text-[#133020]">
                          <td className="p-3.5">{date}</td>
                          <td className="p-3.5 text-[#133020]/70 font-medium">{data.count} orders</td>
                          <td className="p-3.5 font-black text-[#1B4D3E]">Rs. {data.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm">
              <h2 className="text-lg font-black text-[#133020] mb-4">
                🗓️ Month-by-Month Transaction History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EAF0EB] text-[#133020] font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-2xl">Month</th>
                      <th className="p-3">Total Orders</th>
                      <th className="p-3 rounded-r-2xl">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B4D3E]/5">
                    {Object.keys(groupByMonth).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-[#133020]/40 font-medium">
                          No monthly records found.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(groupByMonth).map(([month, data]) => (
                        <tr key={month} className="hover:bg-[#F4F7F4] font-bold text-[#133020]">
                          <td className="p-3.5">{month}</td>
                          <td className="p-3.5 text-[#133020]/70 font-medium">{data.count} orders</td>
                          <td className="p-3.5 font-black text-[#1B4D3E]">Rs. {data.total}</td>
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-[#133020]">Milk Subscription Requests</h2>
            {subscriptions.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-[#133020]/40">
                No active subscriptions registered yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub, index) => (
                  <div key={sub.id || index} className="p-4 rounded-2xl bg-[#EAF0EB]/60 border border-[#1B4D3E]/10 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#1B4D3E] tracking-wider block">
                          {sub.productType === 'a2' ? 'A2 Cow Milk' : 'Standard Milk'}
                        </span>
                        <h4 className="font-extrabold text-[#133020] text-sm">{sub.customer || 'Customer'}</h4>
                      </div>
                      <span className="text-xs font-black bg-[#133020] text-white px-3 py-1 rounded-full">
                        Rs. {sub.monthlyPrice || sub.total}/mo
                      </span>
                    </div>
                    <div className="text-xs text-[#133020]/70 font-medium space-y-1 pt-1 border-t border-[#1B4D3E]/10">
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-[#133020]">All Customer Orders</h2>
                <p className="text-xs text-[#133020]/60 font-medium mt-0.5">Detailed breakdown of items, customer addresses, and payment status.</p>
              </div>
              <button 
                onClick={fetchBackendOrders}
                className="px-4 py-2 bg-[#EAF0EB] text-[#1B4D3E] text-xs font-black rounded-full hover:bg-[#1B4D3E] hover:text-white transition-all"
              >
                🔄 Refresh Orders
              </button>
            </div>
            
            {ordersLoading ? (
              <p className="text-center py-10 text-xs font-bold text-[#133020]/50 animate-pulse">Loading orders from server...</p>
            ) : backendOrders.length === 0 ? (
              <p className="text-center py-10 text-xs font-bold text-[#133020]/40">
                No customer orders found in the database.
              </p>
            ) : (
              <div className="space-y-4">
                {backendOrders.map((order, index) => {
                  const isRazorpay = order.payment_method && order.payment_method.includes('Razorpay');
                  const addressText = typeof order.address === 'object' && order.address !== null
                    ? `${order.address.fullName || 'N/A'}, ${order.address.phone || ''}, ${order.address.addressLine || ''}, ${order.address.city || ''}, ${order.address.state || ''} - ${order.address.pincode || ''}`
                    : order.address;

                  return (
                    <div key={index} className="p-6 rounded-3xl border border-[#1B4D3E]/10 bg-[#FAF8F5] space-y-4 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1B4D3E]/10 pb-4 gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#1B4D3E] tracking-wider">
                            Order ID: {order.order_id || order.payment_id || 'N/A'}
                          </span>
                          <h4 className="font-extrabold text-[#133020] text-sm mt-0.5">
                            Customer: {order.user_email || 'Guest User'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full ${isRazorpay ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {order.payment_method || 'Cash on Delivery'}
                          </span>
                          <span className="text-base font-black text-[#1B4D3E]">
                            Rs. {order.total_amount || order.total}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 text-xs text-[#133020]/80">
                        <div>
                          <h5 className="font-extrabold text-[#133020] mb-2 uppercase tracking-wider text-[10px]">🛒 Ordered Items:</h5>
                          <ul className="list-disc list-inside space-y-1 bg-white p-3 rounded-2xl border border-[#1B4D3E]/10">
                            {order.cart && order.cart.map((item, idx) => (
                              <li key={idx} className="font-medium">
                                <span className="font-bold text-[#133020]">{item.name}</span> (Qty: {item.quantity}) — Rs. {item.price * item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-extrabold text-[#133020] mb-2 uppercase tracking-wider text-[10px]">📦 Delivery Address:</h5>
                          <p className="bg-white p-3 rounded-2xl border border-[#1B4D3E]/10 text-[#133020]/70 font-medium leading-relaxed">
                            {addressText || 'No address provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REGISTERED CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm space-y-6">
            <div>
              <span className="bg-[#EAF0EB] text-[#1B4D3E] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                User Management
              </span>
              <h2 className="text-xl font-black text-[#133020] mt-2">
                Registered Platform Users ({registeredUsers.length})
              </h2>
            </div>
            {registeredUsers.length === 0 ? (
              <p className="text-center py-10 text-xs font-bold text-[#133020]/40">
                No registered users found.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredUsers.map((user, index) => (
                  <div key={user.id || index} className="p-5 rounded-2xl border border-[#1B4D3E]/15 bg-[#FAF8F5] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#1B4D3E] tracking-wider block">
                          Customer Account
                        </span>
                        <h4 className="font-extrabold text-[#133020] text-sm">{user.name || user.fullName || 'Valued Customer'}</h4>
                      </div>
                      <span className="text-[10px] font-black bg-[#EAF0EB] text-[#1B4D3E] px-2.5 py-1 rounded-full">
                        ID: {user.id || index + 1}
                      </span>
                    </div>
                    <div className="text-xs text-[#133020]/70 font-medium space-y-1 pt-2 border-t border-[#1B4D3E]/10">
                      <div><span className="font-bold">Email:</span> {user.email || 'N/A'}</div>
                      <div><span className="font-bold">Phone:</span> {user.phone || user.mobile || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STOCK & INVENTORY MANAGEMENT + ADD NEW ITEM */}
        {activeTab === 'stock' && (
          <div className="space-y-8">
            
            {/* ADD NEW ITEM CARD */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm max-w-2xl mx-auto">
              <span className="bg-[#EAF0EB] text-[#1B4D3E] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Inventory Addition
              </span>
              <h2 className="text-xl font-black text-[#133020] mt-2 mb-1">
                ➕ Add New Product Item
              </h2>
              <p className="text-xs text-[#133020]/60 font-medium mb-6">
                Create a new item in your store inventory with an optional photo upload.
              </p>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#133020]/70 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Organic Farm Honey (500g)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-xs font-bold text-[#133020] focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#133020]/70 mb-1">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-xs font-bold text-[#133020] focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-[#133020]/70 mb-1">
                    Product Image (Choose Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewItemImageChange}
                    className="w-full text-xs text-[#133020] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#133020] file:text-white hover:file:bg-[#1B4D3E] cursor-pointer"
                  />
                </div>

                {newItemImagePreview && (
                  <div className="mt-2 relative">
                    <p className="text-[10px] font-bold uppercase text-[#133020]/60 mb-1">Image Preview:</p>
                    <img
                      src={newItemImagePreview}
                      alt="New Product Preview"
                      className="w-32 h-32 object-cover rounded-2xl border border-[#1B4D3E]/10"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1B4D3E] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#133020] transition-all shadow-md mt-4"
                >
                  ✨ Save & Add Item to Inventory
                </button>
              </form>
            </div>

            {/* EXISTING INVENTORY LIST */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm">
              <h2 className="text-xl font-black text-[#133020] mb-2">
                🏷️ Current Inventory Stock Status
              </h2>
              <p className="text-xs text-[#133020]/60 font-medium mb-6">
                Toggle products between "In Stock" and "Out of Stock" or remove them entirely.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="p-5 rounded-2xl border border-[#1B4D3E]/15 bg-[#FAF8F5] flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image || 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png'}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-[#1B4D3E]/10 bg-white"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png';
                        }}
                      />
                      <div>
                        <h4 className="font-extrabold text-[#133020] text-sm">{product.name}</h4>
                        <p className="text-xs font-bold text-[#1B4D3E] mt-0.5">Rs. {product.price}</p>
                        <span className={`inline-block mt-2 px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                          product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? '🟢 In Stock' : '🔴 Out of Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleStockStatus(product.id)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                          product.inStock ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {product.inStock ? 'Mark Out' : 'Mark In'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-slate-200 text-slate-700 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: WHATSAPP OFFERS BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#1B4D3E]/10 shadow-sm max-w-2xl mx-auto space-y-6">
            <div>
              <span className="bg-[#EAF0EB] text-[#1B4D3E] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Automated Marketing
              </span>
              <h2 className="text-xl font-black text-[#133020] mt-2">
                Broadcast WhatsApp Offers
              </h2>
            </div>

            <form onSubmit={handleBroadcastOffers} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-[#133020]/70 mb-1">
                  Offer Description / Text
                </label>
                <textarea
                  rows="4"
                  placeholder="Type offer message here..."
                  value={offerText}
                  onChange={(e) => setOfferText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#1B4D3E]/20 text-xs font-bold text-[#133020] focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-[#133020]/70 mb-1">
                  Offer Poster Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-[#133020] file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#133020] file:text-white hover:file:bg-[#1B4D3E] cursor-pointer"
                />
              </div>

              {imagePreview && (
                <div className="mt-2 relative">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold uppercase text-[#133020]/60">Poster Preview:</p>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-[10px] font-extrabold text-red-600 hover:underline uppercase"
                    >
                      Remove Poster
                    </button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Poster Preview"
                    className="w-full h-48 object-cover rounded-2xl border border-[#1B4D3E]/10"
                  />
                </div>
              )}

              {broadcastStatus && (
                <p className="text-xs font-bold text-[#2D6A4F] text-center animate-pulse">
                  {broadcastStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={broadcastLoading}
                className="w-full py-3.5 bg-[#2D6A4F] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1B4D3E] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {broadcastLoading ? 'Broadcasting Offers...' : '🚀 Send WhatsApp Offers to All Users'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;