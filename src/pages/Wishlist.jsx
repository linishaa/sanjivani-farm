import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Wishlist() {
  const { products, wishlist, toggleWishlist } = useProducts();

  // Safely handle undefined values
  const safeProducts = products || [];
  const safeWishlist = wishlist || [];

  const wishlistedProducts = safeProducts.filter((product) =>
    safeWishlist.includes(product.id)
  );

  return (
    <div className="bg-[#F8F5E6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-[#0F172A]">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-[#0F172A]/10 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span>My Wishlist</span>
              <span>❤️</span>
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

        {/* Wishlist Content */}
        {wishlistedProducts.length === 0 ? (

          /* ==========================================
             EMPTY WISHLIST
          ========================================== */
          <div className="text-center flex flex-col items-center">

            {/* Cow Illustration */}
            <div className="w-full flex justify-center px-4 pt-2">
              <img
                src="/oops.png"
                alt="Cute cow"
                className="w-full max-w-xl h-auto object-contain"
              />
            </div>

            {/* Empty State Text */}
            <div className="px-6 -mt-2">

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Oops! Nothing here.
              </h2>

              <p className="text-sm font-medium text-[#0F172A]/60 max-w-md mx-auto mt-3 leading-relaxed">
                Your wishlist is waiting for some dairy favourites.
                Save your favourite products and they'll appear here.
              </p>

              <Link
                to="/products"
                className="inline-flex items-center justify-center mt-7 px-8 py-3.5 bg-[#FF8B8B] text-[#0F172A] text-xs font-extrabold uppercase tracking-wider rounded-full hover:bg-[#FFB5B5] transition-colors shadow-md"
              >
                Browse Products
              </Link>

            </div>
          </div>

        ) : (

          /* ==========================================
             WISHLIST PRODUCTS
          ========================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {wishlistedProducts.map((product) => (

              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#0F172A]/10 shadow-sm flex flex-col justify-between relative group"
              >

                {/* Remove Heart Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors z-10"
                  title="Remove from wishlist"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  ❤️
                </button>

                <div className="space-y-3">

                  {/* Product Image */}
                  <div
                    className="h-40 rounded-2xl flex items-center justify-center p-4"
                    style={{
                      backgroundColor: product.bgColor || '#FFDFDF',
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-32 object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 className="font-black text-lg">
                      {product.name}
                    </h3>

                    <p className="text-xs font-black text-[#FF8B8B] mt-0.5">
                      {product.price}
                    </p>

                    <p className="text-xs text-[#0F172A]/70 font-medium mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                </div>

                {/* Add to Order */}
                <div className="pt-4 flex gap-2">
                  <button
                    disabled={product.isSoldOut}
                    className={`w-full py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm ${
                      product.isSoldOut
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#0F172A] text-white hover:bg-[#1e293b]'
                    }`}
                  >
                    {product.isSoldOut
                      ? 'Sold Out'
                      : 'Add to Order'}
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