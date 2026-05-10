import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle, Bell, ChevronDown, User, MapPin, Phone, Mail, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status,
        updatedAt: serverTimestamp()
      });
      
      // Auto-send notification simulation
      await addDoc(collection(db, 'notifications'), {
        orderId,
        phone: orders.find(o => o.id === orderId)?.phone || '',
        message: `Your Aurora order status has been updated to: ${status.toUpperCase()}.`,
        createdAt: serverTimestamp()
      });

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('Delete this order permanently from records? This action cannot be reversed.')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        alert('Transmission purged from system.');
      } catch (error) {
        console.error(error);
      }
    }
  };

  const calculateMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyOrders = orders.filter(o => {
      if (!o.createdAt?.toDate) return false;
      const d = o.createdAt.toDate();
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const revenue = monthlyOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return { count: monthlyOrders.length, revenue };
  };

  const stats = calculateMonthlyStats();

  const statusIcons = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    shipped: { icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    delivered: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  };

  return (
    <div className="space-y-6 md:space-y-12 pb-20 md:pb-0">
      <header className="bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-tight">Order Logs</h2>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{orders.length} Transmissions Received</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Monthly Volume
            </p>
            <p className="text-lg font-display uppercase">{stats.count} Orders</p>
          </div>
          <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3" /> Monthly Revenue
            </p>
            <p className="text-lg font-display uppercase text-green-500">${stats.revenue}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12 items-start">
        {/* Order List */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4 max-h-[calc(100vh-280px)] md:max-h-[70vh] overflow-y-auto md:pr-4 custom-scrollbar px-1">
          {loading ? (
            <div className="py-24 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Intercepting packets...</div>
          ) : orders.length === 0 ? (
            <div className="py-24 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">No transmissions found</div>
          ) : (
            orders.map(order => {
              const status = statusIcons[order.status];
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "bg-neutral-900 border p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-neutral-800",
                     selectedOrder?.id === order.id ? "border-white" : "border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <div className={cn("p-3 md:p-4 rounded-lg md:rounded-xl flex-shrink-0", status.bg)}>
                      <status.icon className={cn("w-5 h-5 md:w-6 h-6", status.color)} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="font-mono text-[8px] md:text-[10px] text-neutral-500 uppercase tracking-widest leading-none truncate font-bold">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      <h4 className="text-base md:text-lg font-display uppercase truncate">{order.customerName}</h4>
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest truncate">{order.items.length} Units / ${order.total}</p>
                    </div>
                  </div>
                  <div className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-mono uppercase tracking-widest border flex-shrink-0 ml-4", status.color, `border-current bg-current/5 inline-flex items-center justify-center`)}>
                    {order.status}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Detail Panel - Full screen on mobile */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.aside 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                "fixed inset-0 z-[70] bg-neutral-950 p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-0 lg:bg-neutral-900 lg:border lg:border-white/5 lg:rounded-3xl lg:p-8 lg:sticky lg:top-0 lg:block lg:translate-x-0",
              )}
            >
              <div className="space-y-12 pb-20 lg:pb-0">
                <header className="space-y-6">
                  <div className="flex justify-between items-start">
                     <h3 className="text-xl font-display uppercase">Transmission Info</h3>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full"><ChevronDown className="w-5 h-5 rotate-180 lg:rotate-0" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                  {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-mono uppercase tracking-widest border transition-all",
                        selectedOrder.status === s ? "bg-white text-black border-white" : "border-white/10 text-neutral-500 hover:border-white/30"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </header>

              <section className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-neutral-400">
                    <User className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">{selectedOrder.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-mono tracking-widest lowercase bg-white/5 px-2 py-0.5 rounded">{selectedOrder.email}</span>
                  </div>
                  <div className="flex items-start gap-4 text-neutral-400">
                    <MapPin className="w-4 h-4 mt-1" />
                    <span className="text-xs font-mono uppercase tracking-wider leading-relaxed">{selectedOrder.address}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white">Manifest</h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <div className="w-12 h-16 bg-neutral-800 rounded overflow-hidden flex-shrink-0">
                          {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-xs font-medium uppercase">{item.name}</div>
                          <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">SIZE {item.size} / x{item.quantity}</div>
                        </div>
                        <div className="text-xs font-mono">${item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-between items-center text-lg md:text-xl font-display uppercase tracking-tight">
                    <span>Total</span>
                    <span>${selectedOrder.total}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => alert(`Simulated SMS sent to ${selectedOrder.phone}`)}
                    className="flex-1 py-4 bg-white/5 border border-white/10 hover:border-white transition-all rounded-xl md:rounded-2xl flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest"
                  >
                    < Bell className="w-4 h-4" /> Poke
                  </button>
                  <button 
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="p-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all rounded-xl md:rounded-2xl text-red-500"
                    title="Purge Order Record"
                  >
                    < Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </div>
          </motion.aside>
        )}
        </AnimatePresence>
        
        {/* Desktop placeholder */}
        <aside className="hidden lg:block bg-neutral-950/20 border border-dashed border-white/5 rounded-3xl p-8 h-[70vh] flex items-center justify-center text-center opacity-40">
            {!selectedOrder && (
              <div className="space-y-4">
                <ShoppingBag className="w-12 h-12 text-neutral-800 mx-auto" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-700">Select a transmission<br />to verify payload</p>
              </div>
            )}
        </aside>
      </div>
    </div>
  );
}
