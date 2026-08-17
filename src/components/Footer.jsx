import React from 'react';
import { Link } from 'react-router-dom';
import farmBg from '../assets/farm-footer-bg.png';

function Footer() {
    // SEO Geo Metadata (Invisible)
    const GeoMetadata = () => (
        <div className="hidden" aria-hidden="true">
            <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <span itemProp="streetAddress">Sanjivani Organic Farm, Countryside</span>
                <span itemProp="addressLocality">Thrissur</span>
                <span itemProp="addressRegion">Kerala</span>
                <span itemProp="postalCode">680001</span>
                <span itemProp="addressCountry">India</span>
            </span>
            <span itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
                <span itemProp="latitude">10.5276</span>
                <span itemProp="longitude">76.2144</span>
            </span>
            <span itemProp="telephone">+91 98765 43210</span>
            <span itemProp="email">support@sanjivanifarm.com</span>
            <span itemProp="openingHours" content="Mo-Su 06:00-20:00">Mon-Sun 6:00 AM - 8:00 PM</span>
        </div>
    );

    return (
        <footer
            className="relative mt-24 text-white bg-cover bg-center bg-no-repeat shadow-inner"
            style={{
                backgroundImage: `url(${farmBg})`,
            }}
            itemScope
            itemType="https://schema.org/Organization"
        >
            <GeoMetadata />

            {/* Classic Smooth Wave Divider */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-[99%] pointer-events-none">
                <svg
                    className="relative block w-full h-[60px] md:h-[100px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,130.83,121.5,194,101.9,236.4,88.66,279.79,64.12,321.39,56.44Z"
                        className="fill-[#0F172A]"
                    ></path>
                </svg>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                
                {/* Top Section: CTA & Brand */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pb-12 border-b border-white/20">
                    <div className="max-w-md">
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                            Sanjivani Milk
                        </h2>
                        <p className="text-xs font-medium text-slate-100 leading-relaxed drop-shadow">
                            Pure, fresh, and natural whole milk delivered straight to your doorstep every morning from our lush green pastures.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/checkout"
                            className="px-6 py-3 bg-[#FF8B8B] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#ff7575] transition-all shadow-lg"
                        >
                            Order Now
                        </Link>
                        <Link
                            to="/products"
                            className="px-6 py-3 bg-black/40 text-white text-xs font-black uppercase tracking-wider rounded-full border border-white/40 hover:bg-black/60 transition-all shadow-lg"
                        >
                            View Products
                        </Link>
                    </div>
                </div>

                {/* Middle Section: Links, Contact, Newsletter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 py-12 border-b border-white/20">
                    
                    {/* Quick Links */}
                    <div className="lg:col-span-3">
                        <h3 className="text-white font-extrabold tracking-wider text-xs uppercase mb-6 drop-shadow">
                            Explore
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { to: '/', label: 'Home' },
                                { to: '/products', label: 'Products & Videos' },
                                { to: '/services', label: 'Book Farm Tour' },
                                { to: '/login', label: 'Sign In / Register' },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        to={item.to}
                                        className="text-xs font-medium text-slate-200 hover:text-[#FF8B8B] transition-colors duration-200 drop-shadow"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div className="lg:col-span-4">
                        <h3 className="text-white font-extrabold tracking-wider text-xs uppercase mb-6 drop-shadow">
                            Connect
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-base">📍</span>
                                <span className="text-xs font-medium text-slate-200 leading-relaxed drop-shadow">
                                    Sanjivani Organic Farm, Countryside<br/>Thrissur, Kerala 680001
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-base">📞</span>
                                <span className="text-xs font-medium text-slate-200 drop-shadow">+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-base">✉️</span>
                                <span className="text-xs font-medium text-slate-200 drop-shadow">support@sanjivanifarm.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-5">
                        <h3 className="text-white font-extrabold tracking-wider text-xs uppercase mb-6 drop-shadow">
                            Newsletter
                        </h3>
                        <p className="text-xs font-medium text-slate-200 mb-4 leading-relaxed drop-shadow">
                            Subscribe to get the latest farm news, seasonal specials, and updates delivered to your inbox.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Email address"
                                required
                                className="flex-1 w-full bg-black/50 border border-white/30 text-white placeholder-slate-300 text-xs font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-[#FF8B8B] transition-all shadow-inner"
                                aria-label="Email for newsletter"
                            />
                            <button 
                                type="submit"
                                className="w-full sm:w-auto px-6 py-3 bg-[#FF8B8B] text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-[#ff7575] transition-all shadow-lg"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-medium text-slate-300 text-center md:text-left drop-shadow">
                        &copy; {new Date().getFullYear()} Sanjivani Milk. All rights reserved.
                    </p>

                    {/* Geo SEO Visible Footer Line */}
                    <div className="text-[10px] font-bold text-slate-300 text-center md:text-left flex flex-wrap gap-2 items-center drop-shadow">
                        <span itemProp="name">Sanjivani Milk</span>
                        <span>|</span>
                        <span itemProp="addressLocality">Thrissur</span>
                        <span>·</span>
                        <span itemProp="addressRegion">Kerala</span>
                        <span>·</span>
                        <span itemProp="addressCountry">India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
