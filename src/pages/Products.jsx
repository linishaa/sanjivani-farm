import React, { useState, useEffect, useRef } from 'react';
import { PRODUCTS } from '../data/products';
import { useProducts } from '../context/ProductContext';
import { useNavigate } from 'react-router-dom';

// --- Animated Scroll Reveal Component ---
const ScrollReveal = ({ children, direction = 'up', delay = 0, className = '' }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const currentRef = domRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(currentRef);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const getTranslateClass = () => {
    switch (direction) {
      case 'left': return '-translate-x-16';
      case 'right': return 'translate-x-16';
      case 'up': return 'translate-y-16';
      default: return 'translate-y-16';
    }
  };

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${getTranslateClass()}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

function Products() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState('');
  const productContext = useProducts();
  const addToCart = productContext?.addToCart;
  const navigate = useNavigate();

  // Filter out any undefined or null products
  const safeProducts = Array.isArray(PRODUCTS) 
    ? PRODUCTS.filter((item) => item && typeof item === 'object') 
    : [];

  const handleAddToCart = (product) => {
    if (!product) return;
    if (addToCart) addToCart(product);
    setToast(`Added ${product.name || 'item'} to cart!`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleBuyNow = (product) => {
    if (!product) return;
    if (addToCart) addToCart(product);
    navigate('/cart');
  };

  return (
    // Balanced 60% Dark Deep Green Theme
    <div className="bg-[#1B3225] min-h-screen relative overflow-hidden pb-24 font-sans text-[#D4E2D8]">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#D4AF37] text-[#1B3225] px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.4)] font-bold text-sm flex items-center gap-2 animate-bounce">
          <span>✅</span> {toast}
        </div>
      )}

      {/* Page Header */}
      <ScrollReveal direction="up" className="pt-20 pb-12 px-4 text-center max-w-4xl mx-auto">
        <span className="text-[#D4AF37] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.3em] border border-[#D4AF37]/40 bg-[#244231]">
          Our Collection ({safeProducts.length})
        </span>
        <h1 className="text-4xl sm:text-6xl font-serif text-[#F0F5F2] mt-6 mb-4 tracking-tight">
          Purity & Tradition
        </h1>
        <p className="text-[#A6C0B1] font-light text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Discover our rich, chemical-free dairy products crafted with the utmost care. Sourced directly from our farms to your table.
        </p>
      </ScrollReveal>

      {/* Immersive Alternating Rows */}
      <div className="space-y-20 sm:space-y-32 mt-8">
        {safeProducts.map((product, idx) => {
          const isEven = idx % 2 === 0;

          return (
            <div key={product?.id || idx} className="w-full">
              <div className={`max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex flex-col ${
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center gap-12 lg:gap-24`}>
                
                {/* Image Section */}
                <ScrollReveal 
                  direction={isEven ? 'left' : 'right'} 
                  className="w-full md:w-1/2 relative group cursor-pointer"
                >
                  <div 
                    onClick={() => setSelectedProduct(product)}
                    className="relative w-full aspect-square sm:aspect-[4/3] flex items-center justify-center p-4"
                  >
                    {/* Balanced 60% dark ambient backdrop */}
                    <div className="absolute inset-0 bg-[#244231] rounded-[2rem] opacity-80 group-hover:opacity-100 transition-opacity duration-700 blur-lg border border-[#315640]"></div>
                    
                    {product?.image ? (
                      <img 
                        src={product.image} 
                        alt={product?.name || 'Product'}
                        className="relative z-10 w-full h-full object-contain drop-shadow-[0_15px_22px_rgba(0,0,0,0.35)] group-hover:scale-105 group-hover:-rotate-1 transition-all duration-700 ease-out"
                      />
                    ) : (
                      <span className="relative z-10 text-[#678B75] font-bold text-sm">No Image</span>
                    )}

                    {/* Minimalist Unit Badge */}
                    {product?.unit && (
                      <span className="absolute top-4 right-4 z-20 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-widest border-b border-[#D4AF37]/50 pb-0.5">
                        {product.unit}
                      </span>
                    )}
                  </div>
                </ScrollReveal>

                {/* Content Section */}
                <ScrollReveal 
                  direction={isEven ? 'right' : 'left'} 
                  delay={200}
                  className="flex-1 w-full space-y-8"
                >
                  <div>
                    <h2 
                      onClick={() => setSelectedProduct(product)}
                      className="text-4xl sm:text-5xl font-serif text-[#F0F5F2] cursor-pointer hover:text-[#D4AF37] transition-colors tracking-wide leading-tight mb-4"
                    >
                      {product?.name || 'Product'}
                    </h2>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center text-[#D4AF37] text-sm tracking-widest">
                        ★★★★★ <span className="ml-2 text-[#A6C0B1] text-xs">({product?.rating || '4.9'})</span>
                      </div>
                    </div>

                    <p className="text-[#A6C0B1] text-sm sm:text-base font-light leading-relaxed mb-8">
                      {product?.description || ''}
                    </p>

                    {/* Tags */}
                    {product?.tags && product.tags.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {product.tags.map((tag, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2"></div>
                            <div>
                              <p className="text-[#E2ECE6] text-sm font-medium">{tag}</p>
                              <p className="text-[#88A895] text-[11px] mt-0.5">Premium quality guaranteed</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-[#315640]">
                    <div>
                      <span className="text-[10px] text-[#88A895] uppercase tracking-[0.2em] block mb-1">Current Price</span>
                      <span className="text-3xl font-serif text-[#F0F5F2]">
                        Rs. {product?.price || 0}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="flex-1 sm:flex-initial px-8 py-3.5 bg-[#2C523B] hover:bg-[#376348] text-[#F0F5F2] text-xs font-bold uppercase tracking-widest rounded-md border border-[#376348] transition-all text-center shadow-md"
                      >
                        Buy Now
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 sm:flex-initial px-8 py-3.5 bg-transparent hover:bg-[#244231] text-[#D4AF37] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-bold uppercase tracking-widest rounded-md transition-all text-center"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          );
        })}
      </div>

      {/* Full Screen Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-[#101E16]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <div className="bg-[#1B3225] border border-[#315640] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 text-[#88A895] hover:text-[#D4AF37] w-10 h-10 flex items-center justify-center font-light text-3xl transition-colors"
            >
              &times;
            </button>

            <div className="w-full md:w-1/2 bg-[#244231] p-8 flex items-center justify-center relative border-r border-[#315640]">
              {selectedProduct?.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct?.name || 'Product'}
                  className="max-h-[300px] md:max-h-[500px] object-contain drop-shadow-[0_15px_22px_rgba(0,0,0,0.45)]" 
                />
              ) : (
                <div className="text-[#678B75] font-bold text-sm">No Image</div>
              )}
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-serif text-[#F0F5F2] mb-4">{selectedProduct?.name || 'Product'}</h2>
              
              <div className="flex items-center text-[#D4AF37] text-sm tracking-widest mb-6">
                ★★★★★ <span className="ml-2 text-[#88A895] text-xs">({selectedProduct?.rating || '4.9'})</span>
              </div>

              <p className="text-[#A6C0B1] text-sm font-light leading-relaxed mb-8">
                {selectedProduct?.description || ''}
              </p>

              <div className="pt-6 border-t border-[#315640] space-y-6">
                <div className="flex items-end justify-between">
                  <span className="text-[10px] text-[#88A895] uppercase tracking-[0.2em]">Price</span>
                  <span className="text-3xl font-serif text-[#F0F5F2]">Rs. {selectedProduct?.price || 0}</span>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => { handleBuyNow(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 py-4 bg-[#2C523B] hover:bg-[#376348] text-[#F0F5F2] font-bold text-xs uppercase tracking-widest transition-all rounded-md border border-[#376348] shadow-md"
                  >
                    Buy Now
                  </button>
                  <button 
                    onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 py-4 bg-transparent hover:bg-[#244231] text-[#D4AF37] font-bold text-xs uppercase tracking-widest transition-all border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-md"
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
  );
}

export default Products;