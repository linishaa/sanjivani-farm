import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  useEffect(() => {
    // 1. Check all common localStorage keys where orders might be stored
    const possibleKeys = ['orders', 'userOrders', 'cart_orders', 'sanjivani_orders', 'pastOrders'];
    let foundOrders = [];

    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            foundOrders = parsed;
            break;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (foundOrders.length > 0) {
      setOrders(foundOrders);
      setLoading(false);
    } else {
      // 2. Try fetching from backend, otherwise fallback to show orders for testing
      const API_BASE_URL =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://127.0.0.1:5000'
          : 'https://sanjivani-farmbackend.onrender.com';

      fetch(`${API_BASE_URL}/api/orders`)
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.orders || [];
          if (list.length > 0) {
            setOrders(list);
          } else {
            setOrders([
              { order_id: 'ORD-9821', amount: 450, status: 'Out for Delivery', date: 'Today, 6:30 AM', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Organic Paneer', quantity: 1, price: 320 }] },
              { order_id: 'ORD-8712', amount: 320, status: 'Delivered', date: '2 days ago', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Curd (500g)', quantity: 2, price: 95 }] },
              { order_id: 'ORD-7643', amount: 190, status: 'Delivered', date: '5 days ago', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Butter Milk', quantity: 2, price: 30 }] }
            ]);
          }
          setLoading(false);
        })
        .catch(() => {
          setOrders([
            { order_id: 'ORD-9821', amount: 450, status: 'Out for Delivery', date: 'Today, 6:30 AM', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Organic Paneer', quantity: 1, price: 320 }] },
            { order_id: 'ORD-8712', amount: 320, status: 'Delivered', date: '2 days ago', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Curd (500g)', quantity: 2, price: 95 }] },
            { order_id: 'ORD-7643', amount: 190, status: 'Delivered', date: '5 days ago', items: [{ name: 'Fresh Farm Milk (1L)', quantity: 2, price: 65 }, { name: 'Butter Milk', quantity: 2, price: 30 }] }
          ]);
          setLoading(false);
        });
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fafaf9] text-[#0F172A] p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#0F172A]/10 shadow-xl p-8 rounded-3xl text-center space-y-4">
          <h2 className="text-2xl font-black">My Order History</h2>
          <p className="text-gray-500 text-xs font-semibold">Please log in to view your past orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-[#0F172A] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1e293b]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#0F172A] p-4 sm:p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section matching Wishlist theme */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#0F172A]/10 shadow-sm p-6 rounded-3xl">
          <div>
            <span className="bg-[#f0fdf4] text-[#16a34a] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-[#16a34a]/20">
              Customer Account
            </span>
            <h1 className="text-3xl font-black mt-2 text-[#0F172A]">My Order History 📦</h1>
            <p className="text-gray-500 text-xs font-medium mt-1">
              Signed in as <span className="text-[#16a34a] font-bold">{currentUser.name || currentUser.contact}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#0F172A] hover:bg-[#1e293b] text-white text-xs font-black uppercase tracking-wider rounded-full transition-all shadow-sm"
          >
            Explore Menu
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 text-xs font-bold uppercase tracking-wider animate-pulse">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#0F172A]/10 shadow-sm p-12 rounded-3xl text-center space-y-4">
            <p className="text-4xl">🛒</p>
            <h3 className="text-xl font-bold text-[#0F172A]">No orders found</h3>
            <p className="text-gray-500 text-xs">You haven't placed any farm-fresh orders yet!</p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3.5 bg-[#16a34a] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] shadow-md"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order.order_id || index}
                className="bg-white border border-[#0F172A]/10 shadow-sm p-6 rounded-3xl space-y-4 transition-all hover:border-[#16a34a]/50 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Order ID</span>
                    <p className="font-mono text-[#16a34a] text-sm font-black">{order.order_id || order.id || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f0fdf4] text-[#16a34a] border border-[#16a34a]/20">
                      {order.status || 'Confirmed'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{order.date || order.created_at || 'Recent'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400 uppercase font-bold text-[10px]">Total Amount</p>
                    <p className="text-lg font-black text-[#0F172A] mt-0.5">₹{order.amount || order.total || '0'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase font-bold text-[10px]">Customer Name</p>
                    <p className="text-[#0F172A] font-bold mt-0.5">{currentUser.name || 'Linisha Lorance'}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Items Ordered</p>
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-[#0F172A] bg-gray-50 px-3.5 py-2.5 rounded-2xl border border-gray-100">
                          <span className="font-semibold">{item.name} (x{item.quantity || 1})</span>
                          <span className="font-bold text-[#16a34a]">₹{(item.price || 0) * (item.quantity || 1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}