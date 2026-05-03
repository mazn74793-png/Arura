import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle, Bell, ChevronDown, User, MapPin, Phone, Mail } from 'lucide-react';
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

  const statusIcons = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    shipped: { icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    delivered: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center bg-neutral-900 border border-white/5 p-8 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-2xl font-display uppercase tracking-tight">Order Logs</h2>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{orders.length} Transmissions Received</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Order List */}
        <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
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
                    "bg-neutral-900 border p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-neutral-800",
                     selectedOrder?.id === order.id ? "border-white" : "border-white/5"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className={cn("p-4 rounded-xl", status.bg)}>
                      <status.icon className={cn("w-6 h-6", status.color)} />
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-none">
                        Transmitted: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}
                      </div>
                      <h4 className="text-lg font-display uppercase">{order.customerName}</h4>
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{order.items.length} Units / ${order.total}</p>
                    </div>
                  </div>
                  <div className={cn("px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest border", status.color, `border-${status.color.split('-')[1]}-500/20`)}>
                    {order.status}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Detail Panel */}
        <aside className={cn(
          "bg-neutral-900 border border-white/5 rounded-3xl p-8 sticky top-0 transition-opacity duration-300",
          !selectedOrder && "opacity-20 pointer-events-none"
        )}>
          {selectedOrder ? (
            <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
              <header className="space-y-6">
                <div className="flex justify-between items-start">
                   <h3 className="text-xl font-display uppercase">Transmission Info</h3>
                   <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full"><ChevronDown className="w-5 h-5 rotate-180" /></button>
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
                      <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <div className="space-y-1">
                          <div className="text-xs font-medium uppercase">{item.name}</div>
                          <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">SIZE {item.size} / x{item.quantity}</div>
                        </div>
                        <div className="text-xs font-mono">${item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-between items-center text-xl font-display uppercase tracking-tight">
                    <span>Total</span>
                    <span>${selectedOrder.total}</span>
                  </div>
                </div>

                <button 
                  onClick={() => alert(`Simulated SMS sent to ${selectedOrder.phone}`)}
                  className="w-full py-4 bg-white/5 border border-white/10 hover:border-white transition-all rounded-2xl flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest"
                >
                  <Bell className="w-4 h-4" /> Poke Customer
                </button>
              </section>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
              <ShoppingBag className="w-12 h-12 text-neutral-800" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-700">Select a transmission<br />to verify payload</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
