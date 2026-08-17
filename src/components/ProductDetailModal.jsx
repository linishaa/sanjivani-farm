import React, { useState } from 'react';
import { PRODUCTS } from '../data/products';

function ProductDetailModal({ product, onClose, onAddToCart, onWatchVideo, onSelectProduct }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const totalPrice = product.price * quantity;
  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFBF5] rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-[#1E5631]/10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-100 transition-colors shadow-sm z-10"
        >
          ✕
        </button>

        {/* Top Split View: Left Image | Right Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
          
          {/* Left Side: Big Image */}
          <div className="bg-[#F4EBE1] rounded-3xl p-8 flex items-center justify-center min-h-[280px] shadow-inner relative">
            <span className="absolute top-4 left-4 bg-[#1E5631] text-[#FFFBF5] text-xs font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
              {product.unit} Pack
            </span>
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-56 w-56 object-contain drop-shadow-xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png';
              }}
            />
          </div>

          {/* Right Side: Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs font-semibold text-[#8C5E3C] bg-[#F5E6D3] px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-3xl font-black text-[#1E5631] mb-2">{product.name}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector & Dynamic Price */}
            <div className="bg-white p-4 rounded-2xl border border-[#1E5631]/10 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Unit Price: Rs. {product.price} / {product.unit}</span>
                  <span className="text-2xl font-black text-[#D97706]">
                    Rs. {totalPrice}
                  </span>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center space-x-3 bg-[#F4EBE1] px-3 py-1.5 rounded-full">
                  <button 
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="w-8 h-8 bg-white text-[#1E5631] rounded-full font-bold flex items-center justify-center hover:bg-[#1E5631] hover:text-white transition-colors shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-[#1E5631] min-w-[24px] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 bg-[#1E5631] text-white rounded-full font-bold flex items-center justify-center hover:bg-[#153e22] transition-colors shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onWatchVideo && onWatchVideo(product)}
                className="py-3 bg-amber-100 text-amber-900 rounded-2xl text-xs font-bold hover:bg-amber-200 transition-colors"
              >
                Watch Making Video
              </button>
              <button 
                onClick={() => {
                  onAddToCart && onAddToCart(product, quantity);
                  onClose();
                }}
                className="py-3 bg-[#1E5631] text-white rounded-2xl text-xs font-bold hover:bg-[#153e22] transition-colors shadow-md"
              >
                Add To Cart
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Section: Related Products */}
        <div className="border-t border-[#1E5631]/10 pt-6">
          <h3 className="text-lg font-bold text-[#1E5631] mb-4">Related Farm Products</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {relatedProducts.map((rel) => (
              <div 
                key={rel.id}
                onClick={() => {
                  setQuantity(1);
                  onSelectProduct(rel);
                }}
                className="bg-white rounded-2xl p-3 border border-[#1E5631]/10 hover:border-[#1E5631] transition-all cursor-pointer text-center group shadow-sm hover:shadow-md"
              >
                <div className="bg-[#F4EBE1] rounded-xl p-2 mb-2 flex items-center justify-center h-16">
                  <img 
                    src={rel.image} 
                    alt={rel.name} 
                    className="h-12 w-12 object-contain group-hover:scale-110 transition-transform"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png';
                    }}
                  />
                </div>
                <h4 className="text-xs font-bold text-[#1E5631] truncate">{rel.name}</h4>
                <p className="text-[11px] font-extrabold text-[#D97706]">Rs. {rel.price}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetailModal;
