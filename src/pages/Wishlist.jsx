import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Wishlist() {
  const { products, wishlist, toggleWishlist } = useProducts();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="bg-[#F8F5E6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-[#0F172A]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-[#0F172A]/10 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span>My Wishlist</span> ❤️
            </h1>
            <p className="text-xs font-bold text-[#FF8B8B] uppercase tracking-widest mt-1">
              {wishlistedProducts.length} Saved Dairy Favorites
            </p>
          </div>

          <Link
            to="/products"
            className="px-5 py-2.5 bg-[#0F172A] text-white text-xs font-extrabold uppercase rounded-full hover:bg-[#1e293b] transition-colors"
          >
            Explore Menu
          </Link>
        </div>

        {/* Wishlist Items Grid */}
        {wishlistedProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center space-y-4 border border-[#0F172A]/10 shadow-sm">
            <span className="text-5xl block">🐾</span>
            <h2 className="text-xl font-black">Your Wishlist is Empty!</h2>
            <p className="text-xs font-semibold text-[#0F172A]/60 max-w-sm mx-auto">
              Click the heart icon on any product to save it to your wishlist and view it here anytime.
            </p>
            <Link
              to="/products"
              className="inline-block px-7 py-3 bg-[#FF8B8B] text-[#0F172A] text-xs font-extrabold uppercase tracking-wider rounded-full hover:bg-[#FFB5B5] transition-colors shadow-md"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#0F172A]/10 shadow-sm flex flex-col justify-between relative group"
              >
                {/* Remove Heart Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  title="Remove from wishlist"
                >
                  ❤️
                </button>

                <div className="space-y-3">
                  <div 
                    className="h-40 rounded-2xl flex items-center justify-center p-4"
                    style={{ backgroundColor: product.bgColor || '#FFDFDF' }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-32 object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-lg">{product.name}</h3>
                    <p className="text-xs font-black text-[#FF8B8B] mt-0.5">{product.price}</p>
                    <p className="text-xs text-[#0F172A]/70 font-medium mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    disabled={product.isSoldOut}
                    className={`w-full py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm ${
                      product.isSoldOut
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#0F172A] text-white hover:bg-[#1e293b]'
                    }`}
                  >
                    {product.isSoldOut ? 'Sold Out' : 'Add to Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Wishlist;
