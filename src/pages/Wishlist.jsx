import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useProducts } from '../context/ProductContext';

function Wishlist() {
  const productContext = useProducts() || {};
  const { products = PRODUCTS, wishlist = [], toggleWishlist, addToCart } = productContext;
  const [toast, setToast] = useState('');

  // Emergency fallback to match what Products.jsx saved to localStorage
  const [localWishlist, setLocalWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('client_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep local wishlist synced with storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('client_wishlist');
        if (saved) setLocalWishlist(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeWishlist = wishlist.length > 0 ? wishlist : localWishlist;
  const safeProducts = Array.isArray(products) && products.length > 0 ? products : PRODUCTS;

  // Bulletproof matching: handles IDs stored as strings, numbers, or objects
  const wishlistedProducts = safeProducts.filter((product) => {
    if (!product) return false;
    return activeWishlist.some(item => {
      const itemId = typeof item === 'object' && item !== null ? item.id : item;
      return String(itemId) === String(product.id);
    });
  });

  const handleAddToCart = (product) => {
    if (!product || product.isSoldOut) return;
    if (addToCart) addToCart(product);
    setToast(`Added ${product.name || 'item'} to cart!`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRemoveFromWishlist = (product) => {
    if (typeof toggleWishlist === 'function') {
      try {
        toggleWishlist(product.id);
      } catch (e) {
        console.error(e);
      }
    }

    // Update local storage fallback instantly
    setLocalWishlist(prev => {
      const updated = prev.filter(item => {
        const itemId = typeof item === 'object' && item !== null ? item.id : item;
        return String(itemId) !== String(product.id);
      });
      try {
        localStorage.setItem('client_wishlist', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setToast(`Removed ${product.name || 'item'} from wishlist`);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="bg-[#F8F5E6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-[#0F172A] relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[99999] bg-[#0F172A] text-white px-6 py-3 rounded-xl shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
          <span>✨</span> {toast}
        </div>
      )}

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

          <div className="text-center flex flex-col items-center">
            <div className="w-full flex justify-center px-4 pt-2">
              <img
                src="/oops.png"
                alt="Cute cow"
                className="w-full max-w-xl h-auto object-contain"
              />
            </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedProducts.map((product) => (

              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-[#0F172A]/10 shadow-sm flex flex-col justify-between relative group"
              >
                {/* Remove Heart Button */}
                <button
                  onClick={() => handleRemoveFromWishlist(product)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors z-10 cursor-pointer shadow-sm"
                  title="Remove from wishlist"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  ❤️
                </button>

                <div className="space-y-3">
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

                  <div>
                    <h3 className="font-black text-lg">
                      {product.name}
                    </h3>

                    <p className="text-xs font-black text-[#FF8B8B] mt-0.5">
                      Rs. {product.price}
                    </p>

                    <p className="text-xs text-[#0F172A]/70 font-medium mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
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