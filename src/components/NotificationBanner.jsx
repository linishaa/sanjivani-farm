import React from 'react';
import { useProducts } from '../context/ProductContext';

function NotificationBanner() {
  const { activeAd, dismissAd } = useProducts();

  if (!activeAd || !activeAd.isVisible) return null;

  return (
    <div className="bg-[#0F172A] text-white px-4 py-3 shadow-md relative z-50 border-b border-[#FFB5B5]/30 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#FFB5B5] text-[#0F172A] text-[10px] font-black uppercase tracking-wider rounded-full shrink-0">
            {activeAd.title}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white/90">
            {activeAd.message}
          </p>
        </div>

        <button
          onClick={dismissAd}
          className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 rounded-md transition-colors shrink-0"
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
}

export default NotificationBanner;
