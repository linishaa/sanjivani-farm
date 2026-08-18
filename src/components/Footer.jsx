import React from 'react';
import { Link } from 'react-router-dom';
import farmBg from '../assets/bg2.png';

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
            className="relative mt-24 text-white bg-cover bg-center bg-no-repeat shadow-inner overflow-hidden"
            style={{
                backgroundImage: `url(${farmBg})`,
            }}
            itemScope
            itemType="https://schema.org/Organization"
        >
            {/* Mist-like subtle blur & overlay */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px] z-0"></div>

            <GeoMetadata />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
                {/* Top Section: CTA & Brand */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pb-12 border-b border-white/20">
                    <div className="max-w-xl">
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 drop-shadow-md">
                            Sanjivani Milk
                        </h2>
                        <p className="text-sm sm:text-base font-semibold text-zinc-100 leading-relaxed drop-shadow">
                            Pure, fresh, and natural whole milk delivered straight to your doorstep every morning from our lush green pastures.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/checkout"
                            className="px-7 py-3.5 bg-[#16a34a] text-white text-sm font-black uppercase tracking-wider rounded-full hover:bg-[#15803d] transition-all shadow-xl"
                        >
                            Order Now
                        </Link>
                        <Link
                            to="/products"
                            className="px-7 py-3.5 bg-black/50 text-white text-sm font-black uppercase tracking-wider rounded-full border border-white/40 hover:bg-black/75 transition-all shadow-xl"
                        >
                            View Products
                        </Link>
                    </div>
                </div>

                {/* Middle Section: Links, Contact, Newsletter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 py-12 border-b border-white/20">
                    
                    {/* Quick Links */}
                    <div className="lg:col-span-3">
                        <h3 className="text-emerald-400 font-black tracking-widest text-sm uppercase mb-6 drop-shadow">
                            Explore
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { to: '/', label: 'Home' },
                                { to: '/products', label: 'Products & Videos' },
                                { to: '/services', label: 'Book Farm Tour' },
                                { to: '/login', label: 'Sign In / Register' },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        to={item.to}
                                        className="text-sm font-bold text-zinc-100 hover:text-[#4ade80] transition-colors duration-200 drop-shadow flex items-center gap-2"
                                    >
                                        <span className="text-emerald-400 text-xs">▶</span> {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div className="lg:col-span-4">
                        <h3 className="text-emerald-400 font-black tracking-widest text-sm uppercase mb-6 drop-shadow">
                            Connect
                        </h3>
                        <ul className="space-y-5">
                            <li className="flex items-start gap-3">
                                <span className="text-lg">📍</span>
                                <span className="text-sm font-semibold text-zinc-100 leading-relaxed drop-shadow">
                                    Sanjivani Organic Farm, Countryside<br/>Thrissur, Kerala 680001
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-lg">📞</span>
                                <span className="text-sm font-semibold text-zinc-100 drop-shadow">+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-lg">✉️</span>
                                <span className="text-sm font-semibold text-zinc-100 drop-shadow">support@sanjivanifarm.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-5">
                        <h3 className="text-emerald-400 font-black tracking-widest text-sm uppercase mb-6 drop-shadow">
                            Newsletter
                        </h3>
                        <p className="text-sm font-semibold text-zinc-100 mb-5 leading-relaxed drop-shadow">
                            Subscribe to get the latest farm news, seasonal specials, and updates delivered to your inbox.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                required
                                className="flex-1 w-full bg-black/60 border border-white/40 text-white placeholder-zinc-300 text-sm font-bold rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[#22c55e] transition-all shadow-inner"
                                aria-label="Email for newsletter"
                            />
                            <button 
                                type="submit"
                                className="w-full sm:w-auto px-7 py-3.5 bg-[#16a34a] text-white text-sm font-black uppercase tracking-wider rounded-2xl hover:bg-[#15803d] transition-all shadow-xl"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm font-semibold text-zinc-200 text-center md:text-left drop-shadow">
                        &copy; {new Date().getFullYear()} Sanjivani Milk. All rights reserved.
                    </p>

                    {/* Geo SEO Visible Footer Line */}
                    <div className="text-xs font-bold text-zinc-200 text-center md:text-left flex flex-wrap gap-2 items-center drop-shadow">
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