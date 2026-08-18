import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F5E6]">
      {!isLoginPage && <NotificationBanner />}
      {!isLoginPage && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<ServicesHub />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          
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

      {/* Renders Footer ONLY on the home page */}
      {isHomePage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ProductProvider>
      <Router>
        <AppContent />
      </Router>
    </ProductProvider>
  );
}

export default App;