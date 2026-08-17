import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HOME_PRODUCTS } from '../data/products';

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % HOME_PRODUCTS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + HOME_PRODUCTS.length) % HOME_PRODUCTS.length);
  };

  // Auto-rotate product every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const activeProduct = HOME_PRODUCTS[currentIndex] || HOME_PRODUCTS[0];

  // Dynamic theme, heading, badge, and tags generator matching exact product names
  const getHeroTheme = (product) => {
    if (!product) return {};

    const name = (product.name || '').toLowerCase();
    
    let prefix = "Farm Fresh";
    let badge = "✨ 100% Organic & Pure";
    let tags = ["🌿 Zero Additives", "🐄 A2 Cow Dairy", "🚚 Morning Express"];
    let defaultBg = "#FFEAE3";

    if (name.includes('ghee')) {
      prefix = "Pure Golden";
      badge = "✨ Traditional Bilona Churned";
      tags = ["🍯 Rich Aroma", "💪 Boosts Immunity", "🔥 High Smoke Point"];
      defaultBg = "#FFF2C6";
    } else if (name.includes('yogurt')) {
      prefix = "Creamy & Probiotic";
      badge = "✨ Active Culture Goodness";
      tags = ["🍓 Real Fruit Puree", "🦠 Gut Friendly", "💪 High Protein"];
      defaultBg = "#FCE7F3";
    } else if (name.includes('curd')) {
      prefix = "Thick & Naturally Set";
      badge = "✨ Traditional Clay Pot Set";
      tags = ["🥣 Ultra Thick", "🦠 Probiotic Rich", "🌿 100% Natural"];
      defaultBg = "#FFEAE3";
    } else if (name.includes('butter')) {
      prefix = "Hand-Churned Pure";
      badge = "✨ Authentic Farm Butter";
      tags = ["🧈 Soft & Creamy", "🌱 Unsalted Option", "🥛 Pure Cream"];
      defaultBg = "#FEF08A";
    } else if (name.includes('paneer') || name.includes('cheese')) {
      prefix = "Velvety Soft & Fresh";
      badge = "✨ Made From Fresh Whole Milk";
      tags = ["💪 18g Protein/100g", "🥗 Melt In Mouth", "🌱 Non-GMO"];
      defaultBg = "#F1F5F9";
    } else if (name.includes('milk')) {
      prefix = "Pure Wholesome";
      badge = "✨ Delivered Within 12 Hours";
      tags = ["🥛 Unprocessed A2", "🌱 Pasture Raised", "❄️ Cold Chain Fresh"];
      defaultBg = "#E0F2FE";
    } else if (name.includes('egg')) {
      prefix = "Farm Fresh Organic";
      badge = "✨ Free Range Hens";
      tags = ["🥚 High Protein", "🌾 Natural Feed", "✨ Zero Antibiotics"];
      defaultBg = "#FEF9C3";
    }

    return {
      prefix,
      title: product.name,
      badge: product.badge || badge,
      bgColor: product.bgColor || defaultBg,
      description: product.description || `Freshly crafted ${product.name} delivered straight from our sustainable farm.`,
      tags: product.tags || tags
    };
  };

  const currentTheme = getHeroTheme(activeProduct);

  return (
    <div className="bg-[#F8F5E6] min-h-screen text-[#0F172A] font-sans selection:bg-[#FFB5B5] selection:text-[#0F172A] overflow-x-hidden flex flex-col justify-between">
      
      {/* Keyframe Animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(1.2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          @keyframes textFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-text-switch {
            animation: textFadeIn 0.4s ease-out forwards;
          }
          @keyframes timerProgress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-progress {
            animation: timerProgress 3s linear infinite;
          }
        `}
      </style>

      {/* Dynamic Hero Section */}
      <section 
        className="relative transition-colors duration-700 ease-in-out pt-28 sm:pt-36 pb-32 sm:pb-44 lg:pb-52 shadow-sm"
        style={{ backgroundColor: currentTheme.bgColor }}
      >
        {/* Hero Grid Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-20">
          
          {/* Left Dynamic Text */}
          <div className="lg:col-span-6 space-y-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Dynamic Highlight Badge */}
            <div 
              key={`badge-${currentIndex}`} 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm text-xs font-extrabold text-[#0F172A] animate-text-switch"
            >
              {currentTheme.badge}
            </div>

            {/* Heading */}
            <h1 
              key={`heading-${currentIndex}`} 
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] leading-[1.12] tracking-tight animate-text-switch"
            >
              {currentTheme.prefix} <br className="hidden sm:block" />
              <span className="block mt-1 sm:mt-2 text-[#FF6B6B] font-black">{currentTheme.title}</span>
            </h1>
            
            {/* Tagline / Description */}
            <p 
              key={`desc-${currentIndex}`} 
              className="text-[#0F172A]/80 text-sm sm:text-base max-w-md font-semibold leading-relaxed min-h-[45px] animate-text-switch"
            >
              {currentTheme.description}
            </p>

            {/* Dynamic Key Attribute Pills */}
            <div key={`tags-${currentIndex}`} className="flex flex-wrap justify-center lg:justify-start gap-2 pt-1 animate-text-switch">
              {currentTheme.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-3.5 py-1.5 bg-white/70 backdrop-blur-sm rounded-xl text-xs font-extrabold text-[#0F172A]/90 border border-white shadow-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 pt-4 w-full sm:w-auto">
              <Link
                to="/products"
                className="w-full sm:w-auto text-center px-8 py-4 bg-[#0F172A] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-xl hover:bg-[#1e293b] transition-all transform hover:-translate-y-0.5"
              >
                ORDER {activeProduct?.name ? activeProduct.name.toUpperCase() : 'NOW'}
              </Link>
              <Link
                to="/services"
                className="w-full sm:w-auto text-center px-7 py-4 bg-white/70 backdrop-blur-md text-[#0F172A] font-black text-xs uppercase tracking-wider rounded-full shadow-sm hover:bg-white transition-all border border-white"
              >
                BOOK FARM TOUR
              </Link>
            </div>

          </div>

          {/* Right Area: Carousel Images + Floating Badge */}
          <div className="lg:col-span-6 relative h-[320px] sm:h-[450px] lg:h-[480px] w-full flex items-center justify-center mt-6 lg:mt-0">
            
            {/* Floating Purity Tag */}
            <div className="absolute top-0 right-2 sm:top-4 sm:right-6 bg-white/90 backdrop-blur-md border border-white rounded-2xl p-3.5 shadow-xl z-40 hidden sm:flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-[#0F172A]/60">Guaranteed</p>
                <p className="text-xs font-black text-[#0F172A]">100% Farm Fresh</p>
              </div>
            </div>

            {HOME_PRODUCTS.map((product, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={product.id || idx}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isActive 
                      ? "opacity-100 scale-100 translate-y-0 z-30 pointer-events-auto" 
                      : "opacity-0 scale-90 translate-y-6 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-[280px] sm:max-w-[380px] lg:max-w-[420px] max-h-[280px] sm:max-h-[420px] w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.18)] animate-float"
                  />
                </div>
              );
            })}

            {/* Slide Controls with Auto-Switch Progress Indicator */}
            <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-40">
              <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white shadow-lg">
                <button 
                  onClick={prevSlide} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center hover:bg-[#0F172A] hover:text-white transition-colors shadow-sm text-[#0F172A]"
                  aria-label="Previous product"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex gap-2 items-center">
                  {HOME_PRODUCTS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-2 rounded-full overflow-hidden transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-[#0F172A]/30' : 'w-2 bg-[#0F172A]/20'}`}
                      aria-label={`Go to ${p.name}`}
                    >
                      {idx === currentIndex && (
                        <div className="absolute top-0 left-0 h-full bg-[#0F172A] animate-progress" />
                      )}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={nextSlide} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center hover:bg-[#0F172A] hover:text-white transition-colors shadow-sm text-[#0F172A]"
                  aria-label="Next product"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Curved Wave Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="relative block w-full h-[60px] sm:h-[120px] lg:h-[160px]">
            <path fill="#F8F5E6" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,170.7C672,149,768,139,864,149.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Middle Tagline Banner */}
      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16 text-center relative z-20">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] leading-relaxed">
          We believe in bringing the <span className="text-[#FF6B6B]">pure taste of nature</span> to your table every single morning. 
          Our dairy and farm goods are crafted with <span className="text-[#FF6B6B]">100% organic passion</span>.
        </h2>
      </section>

    </div>
  );
}

export default Home;
