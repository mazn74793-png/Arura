import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Syncing Aurora...</div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <LandingPage />
          </motion.div>
        } />
        <Route path="/shop" element={
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <ShopPage />
          </motion.div>
        } />
        <Route path="/product/:id" element={
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <ProductDetailsPage />
          </motion.div>
        } />
        <Route path="/checkout" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <CheckoutPage />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {user ? <Navigate to="/profile" /> : <AuthPage />}
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {user ? <ProfilePage /> : <Navigate to="/auth" />}
          </motion.div>
        } />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {isAdmin ? <AdminDashboard /> : <Navigate to="/auth" />}
            </motion.div>
          } 
        />
      </Routes>
    </AnimatePresence>
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

