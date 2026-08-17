import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Cart() {
  const { cart = [], removeFromCart, updateQuantity } = useProducts() || {};
  const navigate = useNavigate();

  const totalAmount = cart.reduce((acc, item) => {
    const itemPrice = typeof item.price === 'number' ? item.price : (item.rawPrice || 0);
    return acc + itemPrice * (item.quantity || 1);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-[#1E5631] mb-6">Shopping Cart 🛒</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#1E5631]/10 shadow-sm">
          <p className="text-gray-500 font-medium mb-4">Your cart is currently empty.</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-[#1E5631] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 transition-all"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#1E5631]/10 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-[#1E5631]">{item.name}</h3>
                    <p className="text-xs font-semibold text-gray-500">
                      Rs. {typeof item.price === 'number' ? item.price : item.rawPrice}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 font-bold hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="font-bold">{item.quantity || 1}</span>
                  <button
                    onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 font-bold hover:bg-gray-200"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart && removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2 font-bold text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#1E5631]/10 shadow-sm h-fit">
            <h2 className="text-xl font-black text-[#1E5631] mb-4">Order Summary</h2>
            <div className="flex justify-between py-2 border-b text-sm font-semibold">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-black border-t mt-2">
              <span>Total</span>
              <span>₹{totalAmount}</span>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 py-3.5 bg-[#1E5631] hover:bg-emerald-900 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-all"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
