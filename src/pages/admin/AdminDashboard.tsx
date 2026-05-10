import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  LayoutDashboard, 
  LogOut,
  Bell,
  Menu,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import { auth } from '../../lib/firebase';
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

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" />;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { label: 'Products', icon: Package, path: '/admin/products' },
    { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
    { label: 'Manage Admins', icon: Users, path: '/admin/staff' },
    { label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
  ];

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
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] w-64 md:w-72 bg-neutral-950 border-r border-white/5 transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full pointer-events-none lg:pointer-events-auto"
      )}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="text-2xl font-display tracking-tighter">AURORA<span className="text-[10px] ml-2 text-neutral-500 font-mono tracking-widest uppercase">Admin</span></div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 -mr-2 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-widest transition-all",
                location.pathname === item.path 
                  ? "bg-white text-black" 
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 space-y-4">
          <div className="p-4 bg-neutral-900 rounded-xl border border-white/5">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Logged as</div>
            <div className="text-sm truncate font-medium">{auth.currentUser?.email}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-black relative">
        <header className="flex-shrink-0 h-16 md:h-20 bg-black border-b border-white/5 px-4 md:px-8 flex items-center justify-between z-40 relative">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsSidebarOpen(true);
              }} 
              className="lg:hidden p-3 -ml-3 rounded-xl hover:bg-white/10 transition-colors relative z-[70] flex items-center gap-2 group"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Panel</span>
            </button>
            <div className="text-[10px] md:text-xs font-mono text-neutral-500 uppercase tracking-[0.3em] overflow-hidden truncate max-w-[100px] sm:max-w-none">
              Dashboard / {navItems.find(i => location.pathname === i.path)?.label || 'Overview'}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-3 hover:bg-white/5 rounded-full relative z-50 cursor-pointer">
              <Bell className="w-4 h-4 md:w-5 h-5 text-neutral-400" />
              <span className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/admin/products" replace />} />
              <Route path="/products" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <ProductManagement />
                </motion.div>
              } />
              <Route path="/orders" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <OrderManagement />
                </motion.div>
              } />
              <Route path="/staff" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <AdminManagement />
                </motion.div>
              } />
              <Route path="/settings" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <SettingsManagement />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
