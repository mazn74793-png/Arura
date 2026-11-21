import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Bell,
  Menu,
  X,
  Settings as SettingsIcon,
  ArrowLeft,
  Store,
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import AdminManagement from './AdminManagement';
import SettingsManagement from './SettingsManagement';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'orders'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPendingOrdersCount(snapshot.size);
      },
      (error) => {
        console.error('Error listening to pending orders:', error);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { label: 'Products', icon: Package, path: '/admin/products' },
    { label: 'Orders', icon: ShoppingBag, path: '/admin/orders', badge: pendingOrdersCount },
    { label: 'Manage Admins', icon: Users, path: '/admin/staff' },
    { label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
  ];

  const activeNav = navItems.find((i) => location.pathname === i.path);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[60] w-64 md:w-72 bg-neutral-950 border-r border-white/10 transition-transform duration-300 ease-out lg:relative lg:translate-x-0 flex flex-col h-screen',
          !isSidebarOpen && '-translate-x-full pointer-events-none lg:pointer-events-auto'
        )}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-baseline gap-2.5 whitespace-nowrap">
            <span className="text-2xl font-display tracking-tighter">AURORA</span>
            <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
              Admin
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close Menu"
            className="lg:hidden p-2 -mr-2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <Link
            to="/"
            onClick={() => {
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group whitespace-nowrap"
          >
            <span className="flex items-center gap-3">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-neutral-400 group-hover:text-white" />
              <span>Back to Store</span>
            </span>
            <Store className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-3.5">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums',
                      isActive ? 'bg-black text-white' : 'bg-amber-400/20 text-amber-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0 bg-neutral-950">
          <div className="px-4 py-3 bg-neutral-900 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-0.5">
              Signed in
            </div>
            <div className="text-xs truncate font-mono text-neutral-200">
              {auth.currentUser?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-black relative">
        <header className="flex-shrink-0 h-16 md:h-20 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 flex items-center justify-between gap-4 z-40 relative">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsSidebarOpen(true);
              }}
              className="lg:hidden p-2.5 -ml-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 group"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2 text-[11px] md:text-xs font-mono uppercase tracking-[0.2em] truncate">
              <span className="text-neutral-500 hidden sm:inline">Dashboard</span>
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <span className="text-white font-semibold truncate">
                {activeNav?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white hover:text-black border border-white/10 text-neutral-200 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all group whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Store</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              aria-label={`View pending orders (${pendingOrdersCount})`}
              title={
                pendingOrdersCount > 0
                  ? `${pendingOrdersCount} pending order${pendingOrdersCount === 1 ? '' : 's'}`
                  : 'View Orders'
              }
              className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-neutral-300 hover:text-white shrink-0"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-black text-[10px] font-mono font-bold tabular-nums flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/admin/products" replace />} />
              <Route
                path="/products"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductManagement />
                  </motion.div>
                }
              />
              <Route
                path="/orders"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OrderManagement />
                  </motion.div>
                }
              />
              <Route
                path="/staff"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdminManagement />
                  </motion.div>
                }
              />
              <Route
                path="/settings"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SettingsManagement />
                  </motion.div>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
