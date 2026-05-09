import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import CartDrawer from './components/CartDrawer';

function AppRoutes() {
  const { isAdmin, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Syncing Aurora...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/auth" element={user ? <Navigate to="/profile" /> : <AuthPage />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={isAdmin ? <AdminDashboard /> : <Navigate to="/auth" />} 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <CartDrawer />
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

