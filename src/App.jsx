import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationBanner from './components/NotificationBanner';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ServicesHub from './pages/ServicesHub';
import Login from './pages/Login';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <ProductProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#F8F5E6]">
          <NotificationBanner />
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/services" element={<ServicesHub />} />
              <Route path="/login" element={<Login />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              
              {/* 🔒 Blocked for regular users, only open to admin role */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<Home />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </ProductProvider>
  );
}

export default App;