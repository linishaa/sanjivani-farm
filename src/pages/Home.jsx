import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import your background images from the assets folder
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import bg3 from '../assets/bg3.png';

// 3 Catchy Headings paired with your background images
const HERO_SLIDES = [
  {
    bg: bg1,
    badge: "🌿 100% Organic Kerala Dairy",
    prefix: "Pure Taste of Nature,",
    title: "Delivered Fresh Every Morning",
    description: "Experience the wholesome goodness of traditional farm-fresh milk and dairy products straight from our sustainable pastures.",
  },
  {
    bg: bg2,
    badge: "🐄 Heritage A2 Cow Farm",
    prefix: "Tradition in Every Drop,",
    title: "Crafted With Care & Purity",
    description: "Nurtured in the lush green hills with sustainable farming methods, bringing you authentic nutrition and unmatched quality.",
  },
  {
    bg: bg3,
    badge: "✨ From Our Farm to Your Table",
    prefix: "Healthy Living Starts Here,",
    title: "Pure, Natural & Wholesome",
    description: "Taste the difference of true organic dairy, free from preservatives and artificial additives for you and your family.",
  },
];

// 3 Informative & Creative Pillars for the Middle Section
const FARM_PILLARS = [
  {
    id: 'grass-fed',
    badge: "Our Philosophy",
    title: "100% Grass-Fed & Free-Ranging",
    description: "Our heritage cows graze freely on organic pastures in the misty hills of Kerala, breathing fresh air and eating pesticide-free natural fodder.",
    details: "We prioritize animal welfare and natural nourishment. Our cows feed on high-protein indigenous grasses without chemical fertilizers. This free-range grazing ensures higher omega-3 fatty acids and superior natural flavor in every drop of milk.",
    icon: (
      <svg className="w-8 h-8 text-[#1B4D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    btnText: "Learn Our Methods",
  },
  {
    id: 'pure-untouched',
    badge: "Pure & Untouched",
    title: "Zero Preservatives & Hormones",
    description: "What you get in your bottle is exactly what nature made—unadulterated, raw, and completely free from synthetic hormones or chemical additives.",
    details: "Our zero-tolerance policy guarantees no oxytocin injections, no synthetic antibiotics, and zero added milk solids or water. We conduct daily lab testing for pure quality, keeping our dairy 100% wholesome and safe for all age groups.",
    icon: (
      <svg className="w-8 h-8 text-[#1B4D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    btnText: "Explore Purity",
  },
  {
    id: 'dawn-doorstep',
    badge: "Dawn to Doorstep",
    title: "Harvested at Sunrise",
    description: "Milked at dawn and rushed straight to your kitchen while maintaining strict cold chains so you enjoy maximum nutritional value every morning.",
    details: "Using automated touching-free milking systems, milk is immediately chilled to 4°C within minutes to retain nutrients and prevent bacterial growth. Delivered straight to your doorstep within 3-5 hours of milking.",
    icon: (
      <svg className="w-8 h-8 text-[#1B4D3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    btnText: "Book Farm Tour",
  },
];

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPillar, setSelectedPillar] = useState(null);

  // Auto-rotate background and heading every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <div className="bg-[#F8F5E6] min-h-screen text-[#0F172A] font-sans selection:bg-[#FFB5B5] selection:text-[#0F172A] overflow-x-hidden flex flex-col justify-between">
      
      {/* Keyframe Animations */}
      <style>
        {`
          @keyframes textFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-text-switch {
            animation: textFadeIn 0.5s ease-out forwards;
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

      {/* Hero Section */}
      <section 
        className="relative transition-all duration-1000 ease-in-out min-h-[85vh] flex items-center pt-28 pb-24 px-6 sm:px-12 lg:px-20 bg-cover bg-center shadow-sm"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(248, 245, 230, 0.75) 0%, rgba(248, 245, 230, 0.45) 45%, rgba(248, 245, 230, 0.05) 85%), url(${currentSlide.bg})`
        }}
      >
        <div className="max-w-2xl w-full space-y-6 relative z-20 text-left">
          
          {/* Badge */}
          <div 
            key={`badge-${currentIndex}`} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white shadow-sm text-xs font-extrabold text-[#1B4D3E] animate-text-switch"
          >
            {currentSlide.badge}
          </div>

          {/* Catchy Heading */}
          <h1 
            key={`heading-${currentIndex}`} 
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] leading-[1.12] tracking-tight animate-text-switch font-serif drop-shadow-xs"
          >
            {currentSlide.prefix} <br />
            <span className="text-[#1B4D3E] font-black">{currentSlide.title}</span>
          </h1>
          
          {/* Description */}
          <p 
            key={`desc-${currentIndex}`} 
            className="text-[#0F172A]/90 text-sm sm:text-base max-w-xl font-bold leading-relaxed animate-text-switch drop-shadow-xs"
          >
            {currentSlide.description}
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4 pt-2">
            <Link
              to="/products"
              className="px-8 py-4 bg-[#1B4D3E] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-xl hover:bg-[#2D6A4F] transition-all transform hover:-translate-y-0.5 text-center"
            >
              Explore Products
            </Link>
            <Link
              to="/services"
              className="px-7 py-4 bg-white/90 backdrop-blur-md text-[#1B4D3E] font-black text-xs uppercase tracking-wider rounded-full shadow-sm hover:bg-white transition-all border border-white text-center"
            >
              Book Farm Tour
            </Link>
          </div>

          {/* Slide Indicators with Progress Bar */}
          <div className="flex justify-start items-center gap-2 pt-4">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-500 ${idx === currentIndex ? 'w-10 bg-[#1B4D3E]/60' : 'w-2 bg-[#1B4D3E]/20'}`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {idx === currentIndex && (
                  <div className="absolute top-0 left-0 h-full bg-[#1B4D3E] animate-progress" />
                )}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Middle Informative / Creative Pillars Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-20">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold tracking-widest text-[#1B4D3E] uppercase bg-[#1B4D3E]/10 px-4 py-1.5 rounded-full">
            The Sanjivani Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-serif">
            Rooted in Tradition, Backed by Purity
          </h2>
          <p className="text-sm sm:text-base text-[#0F172A]/70 font-medium">
            Discover why families trust our sustainable farming practices for their daily nourishment.
          </p>
        </div>

        {/* 3 Informative Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FARM_PILLARS.map((pillar, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedPillar(pillar)}
              className="bg-white rounded-3xl p-8 shadow-xl border border-[#1B4D3E]/10 flex flex-col justify-between transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group cursor-pointer"
            >
              <div>
                {/* Icon & Badge Container */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#F8F5E6] rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4D3E] bg-[#1B4D3E]/10 px-3 py-1 rounded-full">
                    {pillar.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-[#0F172A] mb-3 font-serif">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#0F172A]/75 font-medium leading-relaxed mb-8">
                  {pillar.description}
                </p>
              </div>

              {/* Action Button */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPillar(pillar);
                }}
                className="w-full py-3.5 bg-[#F8F5E6] text-[#1B4D3E] font-black text-xs uppercase tracking-wider rounded-xl text-center group-hover:bg-[#1B4D3E] group-hover:text-white transition-all duration-300 shadow-xs block"
              >
                {pillar.btnText}
              </button>
            </div>
          ))}
        </div>

      </section>

      {/* Modal View for Card Details */}
      {selectedPillar && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-text-switch"
          onClick={() => setSelectedPillar(null)}
        >
          <div 
            className="bg-[#F8F5E6] rounded-3xl max-w-lg w-full p-8 shadow-2xl relative border border-[#1B4D3E]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPillar(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#1B4D3E] font-bold text-xl flex items-center justify-center shadow-md hover:bg-[#1B4D3E] hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                {selectedPillar.icon}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4D3E] bg-[#1B4D3E]/10 px-3 py-1 rounded-full">
                  {selectedPillar.badge}
                </span>
                <h3 className="text-2xl font-black text-[#0F172A] mt-1 font-serif">
                  {selectedPillar.title}
                </h3>
              </div>
            </div>

            <p className="text-[#0F172A]/80 font-medium text-sm sm:text-base leading-relaxed mb-4">
              {selectedPillar.description}
            </p>

            <div className="p-4 bg-white rounded-2xl border border-[#1B4D3E]/10 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1B4D3E] mb-2">Detailed Overview</h4>
              <p className="text-xs text-[#0F172A]/70 leading-relaxed font-medium">
                {selectedPillar.details}
              </p>
            </div>

            <button 
              onClick={() => setSelectedPillar(null)}
              className="w-full py-3.5 bg-[#1B4D3E] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#2D6A4F] transition-all shadow-md"
            >
              Close Overview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;