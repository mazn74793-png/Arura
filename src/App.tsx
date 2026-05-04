import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ShopPage from './pages/ShopPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <CartProvider>
      <Router>
        <CartDrawer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              loading ? (
                <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>
              ) : isAdmin ? (
                <AdminDashboard />
              ) : (
                <AdminLoginPage />
              )
            } 
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

