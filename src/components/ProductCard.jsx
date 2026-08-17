import React, { useState } from 'react';

function ProductCard({ product, onSelectProduct, onAddToCart }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product || typeof product !== 'object') return null;

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleQuantityChange = (e, delta) => {
    e.stopPropagation();
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({ ...product, quantity });
    }
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    setShowPaymentModal(true); 
  };

  const handleCOD = (e) => {
    e.stopPropagation();
    setShowPaymentModal(false);
    alert(`✅ Order Confirmed! ${quantity}x ${product.name} will be delivered via Cash on Delivery.`);
  };

  // Foolproof simulated online payment for a smooth HR demo
  const handleOnlinePayment = (e) => {
    e.stopPropagation();
    setShowPaymentModal(false);
    setIsProcessing(true);

    // Simulates secure bank redirect and successful authorization
    setTimeout(() => {
      setIsProcessing(false);
      const mockPaymentId = 'pay_' + Math.random().toString(36).substring(2, 11);
      alert(`🎉 Payment Successful!\n\nTransaction ID: ${mockPaymentId}\nAmount Paid: Rs. ${(product?.price || 0) * quantity}`);
    }, 1500);
  };

  return (
    <>
      <div 
        onClick={() => onSelectProduct && onSelectProduct(product)}
        className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[460px] h-full group"
      >
        {/* Image Container */}
        <div className="relative w-full h-64 shrink-0 bg-white flex items-center justify-center p-4 overflow-hidden">
          {product?.image ? (
            <img 
              src={product.image} 
              alt={product?.name || 'Product'}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm">
              No Image
            </div>
          )}
          
          {product?.unit && (
            <span className="absolute top-4 left-4 bg-[#1E5631] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm z-10">
              {product.unit}
            </span>
          )}

          <button
            onClick={handleWishlistClick}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-gray-100 z-10"
            aria-label="Add to Wishlist"
          >
            <svg 
              className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-current fill-none'}`} 
              viewBox="0 0 24 24" 
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Product Information */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[17px] font-extrabold text-[#1a472a] leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">
                {product?.name || 'Dairy Product'}
              </h3>
              <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-700 border border-amber-200/50">
                <span className="text-amber-500">★</span> {product?.rating || '4.9'}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              {product?.tags?.slice(0, 2).map((tag, idx) => (
                <span key={idx} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md tracking-wide">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed pt-1.5 font-medium">
              {product?.description}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3 mt-auto">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-0.5">Price</span>
                <span className="text-lg font-black text-[#1a472a]">Rs. {(product?.price || 0) * quantity}</span>
              </div>

              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200 shadow-inner">
                <button 
                  onClick={(e) => handleQuantityChange(e, -1)}
                  className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold text-sm flex items-center justify-center hover:bg-gray-100 shadow-sm transition-all"
                >
                  -
                </button>
                <span className="px-3 text-sm font-black text-gray-800 w-8 text-center">{quantity}</span>
                <button 
                  onClick={(e) => handleQuantityChange(e, 1)}
                  className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold text-sm flex items-center justify-center hover:bg-gray-100 shadow-sm transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={handleAddToCart}
                className="py-2.5 px-2 border-2 border-[#1E5631] text-[#1E5631] hover:bg-[#1E5631] hover:text-white font-bold text-xs rounded-xl transition-colors text-center"
              >
                Add to Cart
              </button>
              
              <button 
                onClick={handleBuyNowClick}
                disabled={isProcessing}
                className="py-2.5 px-2 bg-[#1E5631] hover:bg-[#153d22] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/20 transition-all text-center flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <span>{isProcessing ? 'Processing...' : '⚡ Buy Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
          
          <div 
            className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mt-2 mb-6">
              <h3 className="text-2xl font-black text-[#1a472a] tracking-tight">Checkout</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Choose how you'd like to pay</p>
            </div>

            {/* Total Amount Box */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-emerald-100/50">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">Total Amount</span>
                <span className="text-xs text-gray-500 font-medium">{quantity}x {product?.name}</span>
              </div>
              <span className="text-2xl font-black text-[#1a472a]">Rs. {(product?.price || 0) * quantity}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              
              {/* Cash on Delivery Button */}
              <button 
                onClick={handleCOD}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-[#1E5631] hover:bg-emerald-50/30 transition-all group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center mr-4 group-hover:bg-[#1E5631] group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-sm group-hover:text-[#1E5631] transition-colors">Cash on Delivery</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Pay when order arrives</p>
                </div>
              </button>

              {/* Online Payment Button */}
              <button 
                onClick={handleOnlinePayment}
                className="w-full flex items-center p-4 bg-[#1E5631] rounded-2xl hover:bg-[#153d22] shadow-lg shadow-emerald-900/20 transition-all group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center mr-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">Pay Online</p>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">UPI, Cards & Wallets</p>
                </div>
              </button>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductCard;