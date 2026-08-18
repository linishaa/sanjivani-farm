import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [waveKey, setWaveKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const { wishlist = [], cart = [], currentUser, setCurrentUser } = useProducts() || {};
  
  // Local state to keep track of user session dynamically
  const [activeUser, setActiveUser] = useState(null);

  // Sync session from context or localStorage
  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    } else {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          setActiveUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      } else {
        setActiveUser(null);
      }
    }
  }, [currentUser, location]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    if (setCurrentUser) setCurrentUser(null);
    setActiveUser(null);
    setIsOpen(false);
    navigate('/login');
  };

  const isHomePage = location.pathname === '/';
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products ', path: '/products' },
    { name: 'Services', path: '/services' },
  ];

  const triggerWave = () => {
    if (isHomePage) {
      setWaveKey((prev) => prev + 1);
    }
  };

  return (
    <nav 
      className="relative w-full z-50 select-none cursor-pointer" 
      onClick={triggerWave}
      onTouchStart={triggerWave}
    >
      {/* Liquid Slosh Animation - Milk Drip Pulse */}
      {isHomePage && (
        <style>{`
          @keyframes milkDripSlosh {
            0% { transform: scaleY(1) translateY(0); }
            25% { transform: scaleY(1.2) translateY(3px); }
            50% { transform: scaleY(0.85) translateY(-2px); }
            75% { transform: scaleY(1.08) translateY(1px); }
            100% { transform: scaleY(1) translateY(0); }
          }
          .animate-milk-drip {
            animation: milkDripSlosh 0.85s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: top center;
          }
        `}</style>
      )}

      {/* Main Header Bar */}
      <div className={`w-full bg-white ${!isHomePage ? 'border-b border-slate-100 shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center space-x-3 group z-10">
              <img 
                src="/logo.png" 
                alt="Sanjivani Logo" 
                className="w-10 h-10 object-contain rounded-full border border-[#0F172A]/20"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png';
                }}
              />
              <div>
                <span className="text-xl font-black text-[#0F172A] tracking-tight block">Sanjivani</span>
                <span className="text-[10px] text-[#16a34a] font-extrabold uppercase tracking-widest block">Pure Farm Dairy</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 bg-[#f0fdf4] p-1.5 rounded-full border border-[#0F172A]/10 shadow-inner z-10">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-5 py-2 rounded-full text-xs font-black tracking-wider transition-all ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-sm'
                        : 'text-[#0F172A]/70 hover:text-[#0F172A] hover:bg-white/80'
                    }`}
                  >
                    {link.name.toUpperCase()}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3 z-10">
              <Link 
                to="/wishlist" 
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#0F172A]/10 hover:bg-[#dcfce7] transition-colors relative"
              >
                <span className="text-base">❤️</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#16a34a] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link 
                to="/cart"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#0F172A]/10 hover:bg-[#dcfce7] transition-colors relative"
              >
                <span className="text-base">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0F172A] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* DYNAMIC USER SECTION */}
              {activeUser ? (
                <div className="flex items-center space-x-2 bg-[#f0fdf4] pl-3 pr-1 py-1 rounded-full border border-[#0F172A]/10">
                  <span className="text-xs font-black text-[#0F172A]">
                    👤 {activeUser.name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-[#16a34a] text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm hover:bg-[#15803d] transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 bg-[#0F172A] text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md hover:bg-[#1e293b] transition-all transform hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Navigation Toggle */}
            <div className="md:hidden flex items-center space-x-2 z-10">
              <Link 
                to="/wishlist" 
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#0F172A]/10 relative"
              >
                <span className="text-sm">❤️</span>
              </Link>
              <Link 
                to="/cart" 
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#0F172A]/10 relative"
              >
                <span className="text-sm">🛒</span>
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[#0F172A] focus:outline-none p-2 rounded-full bg-white shadow-sm border border-[#0F172A]/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Realistic Organic Milk Drips Overlay (Home Page Only) */}
      {isHomePage && (
        <div className="absolute top-full left-0 w-full overflow-hidden leading-none pointer-events-none z-30 drop-shadow-md">
          <svg 
            key={waveKey}
            viewBox="0 0 1440 60" 
            className={`w-full h-7 sm:h-10 md:h-12 text-white fill-current block ${waveKey > 0 ? 'animate-milk-drip' : ''}`}
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M0,0 L1440,0 L1440,12 C1415,12 1400,38 1365,38 C1330,38 1320,14 1290,14 C1260,14 1250,46 1210,46 C1170,46 1160,14 1130,14 C1100,14 1090,32 1060,32 C1030,32 1020,12 990,12 C960,12 950,52 905,52 C860,52 850,14 820,14 C790,14 780,36 750,36 C720,36 710,12 680,12 C650,12 640,44 600,44 C560,44 550,16 520,16 C490,16 480,30 450,30 C420,30 410,12 380,12 C350,12 340,48 295,48 C250,48 240,14 210,14 C180,14 170,34 140,34 C110,34 100,12 70,12 C45,12 20,35 0,35 Z" 
            />
          </svg>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#0F172A]/10 px-6 pt-4 pb-6 space-y-3 shadow-xl relative z-40">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                  isActive ? 'bg-[#0F172A] text-white' : 'text-[#0F172A] bg-gray-50 hover:bg-[#dcfce7]/50'
                }`}
              >
                {link.name.toUpperCase()}
              </Link>
            );
          })}

          <Link 
            to="/wishlist" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 rounded-2xl text-xs font-black tracking-wider text-[#0F172A] bg-emerald-50"
          >
            MY WISHLIST ({wishlist.length}) ❤️
          </Link>

          <Link 
            to="/cart" 
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 rounded-2xl text-xs font-black tracking-wider text-[#0F172A] bg-amber-50"
          >
            MY CART ({cartCount}) 🛒
          </Link>

          {/* DYNAMIC MOBILE USER SECTION */}
          {activeUser ? (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="px-4 py-2 bg-[#f0fdf4] rounded-2xl text-xs font-bold text-[#0F172A]">
                Signed in as: <span className="font-extrabold">{activeUser.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="block w-full text-center py-3.5 bg-[#16a34a] text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-md hover:bg-[#15803d]"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3.5 bg-[#0F172A] text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-md mt-2"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;