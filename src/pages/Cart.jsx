import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Cart() {
  const { cart = [], removeFromCart, updateQuantity, clearCart, currentUser: contextUser } = useProducts() || {};
  const navigate = useNavigate();

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const subTotal = cart.reduce((acc, item) => {
    const itemPrice = typeof item.price === 'number' ? item.price : (item.rawPrice || 0);
    return acc + itemPrice * (item.quantity || 1);
  }, 0);

  const shipping = subTotal > 0 ? 0 : 0;
  const totalAmount = subTotal + shipping;

  const handleCheckout = () => {
    // Check authentication matching Checkout.jsx logic
    const storedUser = localStorage.getItem('currentUser');
    const user = contextUser || (storedUser ? JSON.parse(storedUser) : null);

    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-10 px-4 sm:px-6 lg:px-12 text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto">
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto my-12">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Looks like you haven't added anything to your cart yet.</p>
            <Link
              to="/products"
              className="inline-block px-8 py-3 bg-[#157A52] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#106040] transition-all shadow-sm"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Cart Items Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="bg-[#F4BF24] rounded-xl px-6 py-3 grid grid-cols-12 text-xs font-bold text-gray-800 tracking-wide uppercase mb-4">
                  <div className="col-span-6 sm:col-span-5">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {cart.map((item) => {
                    const price = typeof item.price === 'number' ? item.price : (item.rawPrice || 0);
                    const itemSubtotal = price * (item.quantity || 1);

                    return (
                      <div key={item.id} className="py-4 grid grid-cols-12 items-center text-sm gap-2">
                        <div className="col-span-6 sm:col-span-5 flex items-center space-x-3">
                          <button
                            onClick={() => removeFromCart && removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 font-bold text-lg px-1 transition-colors"
                            title="Remove item"
                          >
                            ✕
                          </button>
                          
                          <div className="w-14 h-14 bg-amber-50/50 rounded-xl p-1 border border-gray-100 flex items-center justify-center flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xs text-gray-400">No Img</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                            <p className="text-xs text-gray-400 font-medium">{item.unit || '500 g'}</p>
                          </div>
                        </div>

                        <div className="col-span-2 text-center font-bold text-gray-700 text-xs sm:text-sm">
                          ₹{price.toFixed(2)}
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 space-x-2 bg-white">
                            <button
                              onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) - 1)}
                              className="text-gray-500 hover:text-gray-800 font-bold text-sm px-1"
                            >
                              −
                            </button>
                            <span className="font-bold text-xs sm:text-sm text-gray-800 min-w-[16px] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) + 1)}
                              className="text-gray-500 hover:text-gray-800 font-bold text-sm px-1"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 text-right font-bold text-gray-800 text-xs sm:text-sm">
                          ₹{itemSubtotal.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => clearCart && clearCart()}
                    className="text-xs font-bold text-[#157A52] hover:underline underline-offset-4"
                  >
                    Clear Shopping Cart
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs text-gray-600 font-medium">
                  <div className="flex justify-between">
                    <span>Items</span>
                    <span className="font-bold text-gray-800">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sub Total</span>
                    <span className="font-bold text-gray-800">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-bold text-gray-800">₹{shipping.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-base font-extrabold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-[#157A52] hover:bg-[#106040] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition-all text-center mt-2"
                >
                  Proceed to Checkout
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;