import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';
import { useProducts } from '../context/ProductContext';

function Products() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState('');
  const productContext = useProducts();
  const addToCart = productContext?.addToCart;

  // Filter out any undefined or null products to prevent runtime errors
  const safeProducts = Array.isArray(PRODUCTS) 
    ? PRODUCTS.filter((item) => item && typeof item === 'object') 
    : [];

  const handleAddToCart = (product) => {
    if (!product) return;
    if (addToCart) {
      addToCart(product);
    }
    setToast(`Added ${product.name || 'item'} to cart!`);
    setTimeout(() => setToast(''), 3000);
  };

  const firstRowProducts = safeProducts.slice(0, 4);
  const lastRowProducts = safeProducts.slice(4);

  return (
    <div className="bg-[#FDFBF7] min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E5631] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce">
          <span>✅</span> {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="bg-[#1E5631] text-[#FDFBF7] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Our Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E5631] mt-3 mb-4">
            Fresh Homemade Dairy Products
          </h1>
          <p className="text-gray-600">
            100% natural, chemical-free dairy products made with traditional care. Click on any product card to view full details and customer reviews!
          </p>
        </div>

        {/* First Row: Top 4 Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {firstRowProducts.map((product, idx) => (
            <ProductCard 
              key={product?.id || idx} 
              product={product} 
              onSelectProduct={(prod) => setSelectedProduct(prod)} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {/* Second Row: Centered Products */}
        {lastRowProducts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-8">
            {lastRowProducts.map((product, idx) => (
              <div 
                key={product?.id || idx} 
                className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-[300px]"
              >
                <ProductCard 
                  product={product} 
                  onSelectProduct={(prod) => setSelectedProduct(prod)} 
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        )}

        {/* Full Screen Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-all"
              >
                &times;
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-72 md:h-full bg-[#F5F2E8] relative flex items-center justify-center p-6">
                  {selectedProduct?.image ? (
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct?.name || 'Product'}
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : (
                    <div className="text-[#1E5631]/40 font-bold text-sm">No Image</div>
                  )}
                  {selectedProduct?.unit && (
                    <span className="absolute top-4 left-4 bg-[#1E5631] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {selectedProduct.unit}
                    </span>
                  )}
                </div>

                <div className="p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                  <div>
                    <h2 className="text-2xl font-black text-[#1E5631] mb-2">{selectedProduct?.name || 'Product'}</h2>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedProduct?.tags?.map((tag, idx) => (
                        <span key={idx} className="bg-[#F8F5E6] text-[#1E5631] text-xs font-bold px-2.5 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-amber-400">★ ★ ★ ★ ★</div>
                      <span className="font-bold text-sm text-gray-800">{selectedProduct?.rating || '4.9'} / 5.0</span>
                      <span className="text-xs text-gray-500">({selectedProduct?.reviews || 28} Verified Reviews)</span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {selectedProduct?.description || ''}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-400 block uppercase">Price</span>
                      <span className="text-2xl font-black text-[#1E5631]">Rs. {selectedProduct?.price || 0}</span>
                    </div>

                    <button 
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="px-6 py-3 bg-[#1E5631] hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Products;
