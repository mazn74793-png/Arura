import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Search, Package, MapPin, Calendar, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const orderRef = doc(db, 'orders', orderId.trim());
      const snap = await getDoc(orderRef);

      if (!snap.exists()) {
        setError('ORDER_NOT_FOUND: Record does not exist in local storage.');
      } else {
        const data = snap.data();
        if (data.email.toLowerCase() !== email.toLowerCase()) {
          setError('AUTH_FAILED: Identity mismatch for this record.');
        } else {
          setOrder({ id: snap.id, ...data });
        }
      }
    } catch (err) {
      setError('SYSTEM_ERROR: Request could not be processed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <nav className="p-8 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Aurora System
        </button>
        <div className="text-xl font-display uppercase tracking-tighter">Order Hub</div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Tracking Form */}
        <div className="space-y-12">
            <header className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-display uppercase tracking-tighter">Track Logistics</h1>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
                    Verify the trajectory of your acquisition within the Aurora network.
                </p>
            </header>

            <form onSubmit={handleTrack} className="bg-neutral-900/50 p-8 md:p-12 border border-white/5 space-y-8 backdrop-blur-xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">Order Reference</label>
                        <input 
                            required
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="ORD-7X829..."
                            className="w-full bg-black/50 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono text-xs text-neutral-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">Identity Email</label>
                        <input 
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="VERIFIED_EMAIL@DOMAIN.COM"
                            className="w-full bg-black/50 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono text-xs text-neutral-300"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        disabled={loading}
                        className="w-full py-5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.4em] hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Locate Package
                    </button>
                    <AnimatePresence>
                        {error && (
                            <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] font-mono text-red-500 uppercase tracking-widest text-center"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </form>
        </div>

        {/* Results Area */}
        <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
                {order ? (
                    <motion.div 
                        key="result"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="p-8 md:p-12 border border-white/10 bg-neutral-900/50 space-y-12">
                            <div className="flex justify-between items-start border-b border-white/5 pb-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Protocol: Live Update</span>
                                    <h2 className="text-3xl font-display uppercase tracking-tight">{order.status}</h2>
                                </div>
                                <Package className="w-8 h-8 text-white" strokeWidth={1} />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Courier Logic</span>
                                    <div className="flex items-center gap-3 text-xs font-mono uppercase">
                                        <MapPin className="w-3 h-3 text-neutral-500" /> Ground Transport
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Creation Timestamp</span>
                                    <div className="flex items-center gap-3 justify-end text-xs font-mono uppercase">
                                        <Calendar className="w-3 h-3 text-neutral-500" /> {order.createdAt?.toDate().toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Valuation</span>
                                    <div className="flex items-center gap-3 text-xs font-mono uppercase">
                                        <CreditCard className="w-3 h-3 text-neutral-500" /> ${order.total}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/5">
                                <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-500">Item Manifest</h3>
                                <div className="space-y-2">
                                    {order.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                                            <span>{item.name} ({item.size}) x{item.quantity}</span>
                                            <span className="text-neutral-500">${item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                             <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.5em]">Identity Verified • Log Saved</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center space-y-8 text-neutral-800"
                    >
                        <Package className="w-16 h-16 stroke-[0.5]" />
                        <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-center max-w-xs leading-loose">
                            Waiting for valid transmission coordinates to establish secure connection.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>

      <footer className="py-24 border-t border-white/5 text-center text-[10px] font-mono uppercase tracking-[0.8em] text-neutral-800">
          AURORA LOGISTICS • 2026
      </footer>
    </div>
  );
}
