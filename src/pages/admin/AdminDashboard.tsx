import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="text-2xl font-display tracking-tighter">AURORA<span className="text-[10px] ml-2 text-neutral-500 font-mono tracking-widest uppercase">Admin</span></div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
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
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-black/50 backdrop-blur-sm border-b border-white/5 px-8 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-[0.3em] overflow-hidden truncate">
            Dashboard / {navItems.find(i => location.pathname === i.path)?.label || 'Overview'}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full relative">
              <Bell className="w-5 h-5 text-neutral-400" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full" />
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/products" replace />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/staff" element={<AdminManagement />} />
            <Route path="/settings" element={<SettingsManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
