import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Heart, LogOut, ChevronRight, Package, Calendar } from 'lucide-react';
import { Product } from '../types';

export default function ProfilePage() {
  const { profile, logout, wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'orders'>('wishlist');
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      setLoading(true);
      
      try {
        // Fetch Wishlist Details
        if (wishlist.length > 0) {
          const prodsArr: Product[] = [];
          for (const id of wishlist) {
            const q = query(collection(db, 'products'), where('__name__', '==', id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                prodsArr.push({ ...snap.docs[0].data(), id: snap.docs[0].id } as Product);
            }
          }
          setWishlistProducts(prodsArr);
        } else {
          setWishlistProducts([]);
        }

        // Fetch Orders
        const ordersQ = query(
          collection(db, 'orders'), 
          where('email', '==', profile.email),
          orderBy('createdAt', 'desc')
        );
        const ordersSnap = await getDocs(ordersQ);
        setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile, wishlist]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Header */}
      <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="text-xl font-display tracking-tighter uppercase">AURORA</button>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/shop')}
            className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            Shop
          </button>
          <button 
            onClick={logout}
            className="p-2 text-neutral-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 space-y-16">
        {/* User Info */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-white/5 pb-16">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-neutral-900 overflow-hidden border border-white/10 group">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-neutral-700" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Aesthetic Member</span>
              <h1 className="text-3xl md:text-5xl font-display uppercase tracking-tighter">{profile.displayName || 'Anonymous User'}</h1>
            </div>
            <p className="text-xs font-mono text-neutral-400">{profile.email}</p>
            {profile.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Access Control Panel
              </button>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="space-y-8">
          <div className="flex gap-12 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`pb-4 text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative ${activeTab === 'wishlist' ? 'text-white' : 'text-neutral-500'}`}
            >
              Wishlist ({wishlist.length})
              {activeTab === 'wishlist' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative ${activeTab === 'orders' ? 'text-white' : 'text-neutral-500'}`}
            >
              Order History ({orders.length})
              {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-px bg-white" />}
            </button>
          </div>

          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-neutral-800 font-mono text-[10px] uppercase tracking-widest animate-pulse">Syncing Database...</div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'wishlist' ? (
                  <motion.div 
                    key="wishlist"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12"
                  >
                    {wishlistProducts.length === 0 ? (
                      <div className="col-span-full py-12 text-center space-y-6">
                        <Heart className="w-8 h-8 text-neutral-900 mx-auto" />
                        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">No pieces saved yet</p>
                        <button onClick={() => navigate('/shop')} className="text-[10px] font-mono uppercase tracking-widest underline underline-offset-4">Browse Collection</button>
                      </div>
                    ) : (
                      wishlistProducts.map((product) => (
                        <div key={product.id} className="group space-y-4">
                          <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative border border-white/5">
                            <img 
                              src={product.images[0]} 
                              alt={product.name} 
                              className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                              onClick={() => navigate(`/product/${product.id}`)}
                            />
                            <button 
                              onClick={() => toggleWishlist(product.id)}
                              className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
                            >
                              <Heart className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <h3 className="text-xs font-display uppercase tracking-wider">{product.name}</h3>
                                <p className="text-[10px] font-mono text-neutral-500">${product.price}</p>
                            </div>
                            <button onClick={() => navigate(`/product/${product.id}`)} className="p-2 hover:bg-white/5 rounded-full"><ChevronRight className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {orders.length === 0 ? (
                      <div className="py-24 text-center space-y-6">
                        <Package className="w-8 h-8 text-neutral-900 mx-auto" />
                        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">No order records found</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="bg-neutral-950 border border-white/5 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 hover:border-white/20 transition-colors">
                          <div className="space-y-6">
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Order ID: {order.id.slice(-8)}</span>
                              <div className="flex items-center gap-3">
                                <h4 className="text-sm font-display tracking-wider uppercase">Order Placed</h4>
                                <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                  order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-[10px] font-mono text-neutral-500">
                                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {order.createdAt?.toDate().toLocaleDateString()}</div>
                                <div className="flex items-center gap-2"><ShoppingBag className="w-3 h-3" /> {order.items.length} Items</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-4">
                            <span className="text-xl font-display">${order.total}</span>
                            <button className="text-[8px] font-mono uppercase tracking-[0.3em] px-6 py-3 border border-white/10 hover:bg-white hover:text-black transition-all">Details</button>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <footer className="py-24 border-t border-white/5 text-center px-6">
         <div className="text-[10px] font-mono text-neutral-700 uppercase tracking-[0.5em]">AURORA IDENTITY • 2026</div>
      </footer>
    </div>
  );
}
