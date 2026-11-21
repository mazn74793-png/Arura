import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Bell, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Trash2, 
  TrendingUp, 
  Search, 
  Calendar, 
  CalendarDays, 
  X, 
  MessageSquare, 
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatPrice } from '../../lib/currency';

type DateFilterPreset = 'all' | 'today' | 'yesterday' | 'last7' | 'month' | 'custom';

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(''); // YYYY-MM-DD

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setConfirmDeleteId(null);
  }, [selectedOrder?.id]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status,
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'notifications'), {
        orderId,
        phone: orders.find(o => o.id === orderId)?.phone || '',
        message: `Your Aurora order status has been updated to: ${status.toUpperCase()}.`,
        createdAt: serverTimestamp()
      });

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      showToast(`Status updated to ${status.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSendAlert = async (order: Order) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        orderId: order.id,
        phone: order.phone || '',
        message: `Aurora Dispatch Update: Your order #${order.id.slice(-6)} is currently ${order.status.toUpperCase()}.`,
        createdAt: serverTimestamp()
      });
      showToast(`Alert logged for ${order.phone || order.customerName}`);
    } catch (error) {
      console.error(error);
      showToast('Failed to send alert', 'error');
    }
  };

  const deleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      setConfirmDeleteId(null);
      showToast('Order deleted permanently.');
    } catch (error) {
      console.error(error);
      showToast('Delete failed. Unauthorized.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract JS Date safely
  const getOrderDate = (order: Order): Date | null => {
    if (!order.createdAt) return null;
    if (typeof order.createdAt.toDate === 'function') {
      return order.createdAt.toDate();
    }
    if (order.createdAt instanceof Date) {
      return order.createdAt;
    }
    if (order.createdAt?.seconds) {
      return new Date(order.createdAt.seconds * 1000);
    }
    if (typeof order.createdAt === 'string' || typeof order.createdAt === 'number') {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const toDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatOrderDateTime = (date: Date | null) => {
    if (!date) return 'Recently';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Extract all unique dates with orders
  const daysWithOrders = useMemo(() => {
    const map = new Map<string, { dateKey: string; date: Date; count: number; totalRevenue: number }>();
    
    orders.forEach(order => {
      const date = getOrderDate(order);
      if (!date) return;
      const key = toDateKey(date);
      const existing = map.get(key) || { dateKey: key, date, count: 0, totalRevenue: 0 };
      existing.count += 1;
      existing.totalRevenue += Number(order.total) || 0;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [orders]);

  // Date filtering logic
  const isOrderMatchingDate = (order: Order): boolean => {
    const date = getOrderDate(order);
    if (datePreset === 'all') return true;
    if (!date) return false;

    const today = new Date();
    const todayKey = toDateKey(today);
    const orderKey = toDateKey(date);

    if (datePreset === 'custom') {
      return selectedCustomDate ? orderKey === selectedCustomDate : true;
    }

    if (datePreset === 'today') {
      return orderKey === todayKey;
    }

    if (datePreset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return orderKey === toDateKey(yesterday);
    }

    if (datePreset === 'last7') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo && date <= today;
    }

    if (datePreset === 'month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }

    return true;
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter
      if (!isOrderMatchingDate(order)) return false;

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const nameMatch = order.customerName?.toLowerCase().includes(queryLower);
        const phoneMatch = order.phone?.toLowerCase().includes(queryLower);
        const emailMatch = order.email?.toLowerCase().includes(queryLower);
        const addressMatch = order.address?.toLowerCase().includes(queryLower);
        const idMatch = order.id?.toLowerCase().includes(queryLower);
        const itemsMatch = order.items?.some(i => i.name.toLowerCase().includes(queryLower));

        if (!nameMatch && !phoneMatch && !emailMatch && !addressMatch && !idMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, datePreset, selectedCustomDate, statusFilter, searchQuery]);

  // Calculate stats for current filtered selection
  const filteredStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pendingCount = filteredOrders.filter(o => o.status === 'pending').length;
    const deliveredCount = filteredOrders.filter(o => o.status === 'delivered').length;
    return {
      count: filteredOrders.length,
      revenue: totalRevenue,
      pendingCount,
      deliveredCount
    };
  }, [filteredOrders]);

  const statusIcons: Record<OrderStatus, { icon: any; color: string; bg: string; border: string }> = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
    shipped: { icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
    delivered: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
    cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  };

  const getCleanPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      return `20${cleaned.substring(1)}`;
    }
    return cleaned;
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDatePreset('all');
    setSelectedCustomDate('');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || datePreset !== 'all' || selectedCustomDate !== '';

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Top Header Metrics & Overview */}
      <header className="bg-neutral-900/80 backdrop-blur-md border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col lg:flex-row justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-3xl font-display uppercase tracking-tight">Order Logs</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-white/10 text-white border border-white/10">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="text-[10px] md:text-xs font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <span>Total System Volume: {orders.length}</span>
            {hasActiveFilters && (
              <span className="text-amber-400 font-bold">• Filter Active</span>
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-neutral-400" /> Orders
            </p>
            <p className="text-lg md:text-xl font-display uppercase tabular-nums">{filteredStats.count}</p>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-3 h-3 font-mono text-[9px] text-green-400 flex items-center justify-center font-bold">EG</span> Revenue
            </p>
            <p className="text-lg md:text-xl font-display uppercase text-green-400 truncate tabular-nums">
              {formatPrice(filteredStats.revenue)}
            </p>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" /> Pending
            </p>
            <p className="text-lg md:text-xl font-display uppercase text-amber-400 tabular-nums">{filteredStats.pendingCount}</p>
          </div>

          <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Delivered
            </p>
            <p className="text-lg md:text-xl font-display uppercase text-emerald-400 tabular-nums">{filteredStats.deliveredCount}</p>
          </div>
        </div>
      </header>

      {/* Date Selection & Filter Toolbar */}
      <section className="bg-neutral-900/60 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5 mr-1">
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
              Days:
            </span>
            {(
              [
                { id: 'all', label: 'All Days' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
              ] as { id: DateFilterPreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setDatePreset(preset.id);
                  setSelectedCustomDate('');
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all",
                  datePreset === preset.id && !selectedCustomDate
                    ? "bg-white text-black border-white font-bold shadow-md"
                    : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20 bg-black/20"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Specific Day Calendar Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl focus-within:border-white transition-all">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <label htmlFor="custom-date-picker" className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                Specific Day:
              </label>
              <input
                id="custom-date-picker"
                type="date"
                value={selectedCustomDate}
                onChange={(e) => {
                  setSelectedCustomDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-white font-mono text-xs outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Days with Orders Quick Chips (Interactive Calendar Activity) */}
        {daysWithOrders.length > 0 && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                Active Order Days ({daysWithOrders.length} days with orders)
              </span>
              <span className="text-[9px] font-mono text-neutral-600">Click a day to view its orders</span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {daysWithOrders.slice(0, 14).map(day => {
                const isSelected = selectedCustomDate === day.dateKey;
                const isToday = toDateKey(new Date()) === day.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => {
                      setSelectedCustomDate(day.dateKey);
                      setDatePreset('custom');
                    }}
                    className={cn(
                      "flex-none px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest border transition-all flex items-center gap-2",
                      isSelected
                        ? "bg-white text-black border-white font-bold"
                        : "bg-black/30 border-white/5 text-neutral-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    <span>{isToday ? 'Today' : day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[8px]",
                      isSelected ? "bg-black text-white" : "bg-white/10 text-neutral-300"
                    )}>
                      {day.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar & Status Filters */}
        <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, phone, address, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'shipped', label: 'Shipped' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' },
              ] as { id: 'all' | OrderStatus; label: string }[]
            ).map((st) => {
              const count = st.id === 'all' 
                ? orders.filter(isOrderMatchingDate).length 
                : orders.filter(o => isOrderMatchingDate(o) && o.status === st.id).length;
              return (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={cn(
                    "flex-none px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-mono uppercase tracking-widest border transition-all flex items-center gap-1.5",
                    statusFilter === st.id
                      ? "bg-white text-black border-white font-bold"
                      : "border-white/5 text-neutral-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>{st.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[8px]",
                    statusFilter === st.id ? "bg-black text-white" : "bg-white/10 text-neutral-400"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Grid: Orders List & Detailed Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Order Cards List */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
          {loading ? (
            <div className="py-24 text-center space-y-3 bg-neutral-900/40 rounded-2xl border border-white/5">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                Intercepting orders database...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 text-center space-y-4 bg-neutral-900/40 rounded-2xl border border-dashed border-white/10 p-8">
              <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="space-y-1">
                <p className="font-display uppercase text-lg text-white">No Orders Found</p>
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  No transmissions match your current date or search criteria.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-widest rounded-xl hover:bg-neutral-200 transition-all inline-block mt-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map(order => {
              const statusCfg = statusIcons[order.status] || statusIcons.pending;
              const orderDate = getOrderDate(order);
              const formattedDate = formatOrderDateTime(orderDate);
              const cleanPhone = getCleanPhone(order.phone);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "bg-neutral-900/90 border p-4 md:p-6 rounded-2xl transition-all cursor-pointer hover:bg-neutral-850 hover:border-white/30 group relative",
                    isSelected ? "border-white shadow-xl shadow-white/5 bg-neutral-900" : "border-white/5"
                  )}
                >
                  {/* Top Row: Date, ID, and Status Badge */}
                  <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{formattedDate}</span>
                      </div>
                      <span className="text-neutral-700">•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(order.id, order.id);
                        }}
                        className="text-[9px] font-mono text-neutral-500 hover:text-white flex items-center gap-1 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded transition-colors"
                        title="Copy Order ID"
                      >
                        {copiedId === order.id ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>#{order.id.slice(-6)}</span>
                      </button>
                    </div>

                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] md:text-[9px] font-mono uppercase tracking-widest border flex items-center gap-1.5",
                      statusCfg.bg,
                      statusCfg.color,
                      statusCfg.border
                    )}>
                      <statusCfg.icon className="w-3 h-3" />
                      <span>{order.status}</span>
                    </div>
                  </div>

                  {/* Middle Row: Customer Info & Items */}
                  <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-base md:text-lg font-display uppercase tracking-wide text-white group-hover:text-neutral-100 transition-colors truncate">
                        {order.customerName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-400">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{order.phone}</span>
                        </div>
                        {order.address && (
                          <div className="flex items-center gap-1.5 text-neutral-500 truncate max-w-[260px]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Total Price in EG & Unit count */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                      <span className="text-base md:text-xl font-mono font-bold text-white tracking-tight">
                        {formatPrice(order.total)}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview Strip */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5 text-[9px] font-mono text-neutral-400">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-5 h-5 rounded object-cover" />
                            )}
                            <span className="truncate max-w-[100px] text-white">{item.name}</span>
                            <span className="text-neutral-500">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-[9px] font-mono text-neutral-500 bg-black/30 px-2 py-1 rounded-lg">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Quick Action Buttons on Card */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${order.customerName}, regarding your order #${order.id.slice(-6)} from AURORA:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500 hover:text-black border border-green-500/20 text-green-400 transition-all flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest"
                            title="Direct WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white hover:text-black border border-white/10 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Detail Drawer / Panel */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.aside 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "fixed inset-0 z-[70] bg-neutral-950 p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-0 lg:bg-neutral-900/90 lg:border lg:border-white/10 lg:rounded-3xl lg:p-8 lg:sticky lg:top-4 lg:block lg:translate-x-0 custom-scrollbar max-h-[85vh]",
              )}
            >
              <div className="space-y-8 pb-20 lg:pb-0">
                {/* Header */}
                <header className="space-y-4 pb-6 border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Order Details</div>
                      <h3 className="text-xl md:text-2xl font-display uppercase tracking-tight text-white">
                        #{selectedOrder.id.slice(-8)}
                      </h3>
                      <p className="text-[10px] font-mono text-neutral-400 mt-1">
                        {formatOrderDateTime(getOrderDate(selectedOrder))}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(null)} 
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                      title="Close panel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Updaters */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block">
                      Update Order Status:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => {
                        const isCurrent = selectedOrder.status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={updatingStatusId === selectedOrder.id}
                            onClick={() => updateStatus(selectedOrder.id, s)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 disabled:opacity-50",
                              isCurrent 
                                ? "bg-white text-black border-white font-bold shadow-md" 
                                : "border-white/10 text-neutral-400 hover:text-white hover:border-white/30 bg-black/30"
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </header>

                {/* Customer Information */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Customer Dossier</h4>
                  
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-3 text-neutral-200">
                      <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-xs font-mono uppercase tracking-wider font-bold">{selectedOrder.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-neutral-300">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <span className="text-xs font-mono tracking-wider">{selectedOrder.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${selectedOrder.phone}`}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[9px] font-mono uppercase tracking-widest border border-white/10"
                        >
                          Call
                        </a>
                        {getCleanPhone(selectedOrder.phone) && (
                          <a
                            href={`https://wa.me/${getCleanPhone(selectedOrder.phone)}?text=${encodeURIComponent(`Hello ${selectedOrder.customerName}, regarding your order #${selectedOrder.id.slice(-6)} from AURORA:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-green-500/10 hover:bg-green-500 hover:text-black text-green-400 text-[9px] font-mono uppercase tracking-widest border border-green-500/20 flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {selectedOrder.email && (
                      <div className="flex items-center gap-3 text-neutral-300">
                        <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <a href={`mailto:${selectedOrder.email}`} className="text-xs font-mono lowercase hover:underline truncate">
                          {selectedOrder.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start gap-3 text-neutral-300 pt-2 border-t border-white/5">
                      <MapPin className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs font-mono uppercase tracking-wider leading-relaxed">
                        {selectedOrder.address || 'No address provided'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Items Manifest */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Order Items</h4>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {selectedOrder.items?.length || 0} Items
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-black/40 p-3.5 rounded-xl border border-white/5">
                        <div className="w-14 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-neutral-600 uppercase">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="text-xs font-medium uppercase text-white truncate">{item.name}</div>
                          <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                            SIZE: <span className="text-white font-bold">{item.size}</span>
                            {item.color && (
                              <span> • COLOR: <span className="text-white font-bold">{item.color}</span></span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-neutral-500">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </div>
                        </div>
                        <div className="text-sm font-mono font-bold text-white whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Total */}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm font-mono uppercase tracking-widest text-neutral-400">Total Amount</span>
                    <span className="text-xl md:text-2xl font-mono font-bold text-white">
                      {formatPrice(selectedOrder.total)}
                    </span>
                  </div>
                </section>

                {/* Actions: Direct Notify & Delete */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <button 
                    type="button"
                    onClick={() => handleSendAlert(selectedOrder)}
                    className="w-full py-3.5 bg-white/5 border border-white/10 hover:border-white transition-all rounded-xl flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-neutral-200 hover:text-white"
                  >
                    <Bell className="w-4 h-4 text-neutral-400" />
                    <span>Log Status Alert</span>
                  </button>
                  
                  {confirmDeleteId === selectedOrder.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deletingId === selectedOrder.id}
                        onClick={() => deleteOrder(selectedOrder.id)}
                        className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-mono uppercase tracking-widest font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                      >
                        {deletingId === selectedOrder.id ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedOrder.id)}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all rounded-xl text-red-500 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Order</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop placeholder when no order is selected */}
        {!selectedOrder && (
          <aside className="hidden lg:flex bg-neutral-900/30 border border-dashed border-white/5 rounded-3xl p-8 min-h-[500px] flex-col items-center justify-center text-center opacity-60">
            <div className="space-y-4 max-w-xs">
              <ShoppingBag className="w-12 h-12 text-neutral-700 mx-auto" />
              <div className="space-y-1">
                <p className="font-display uppercase text-sm text-neutral-400">No Order Selected</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                  Click any order on the left to inspect details, update status, or contact the customer.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[999] max-w-sm w-full bg-neutral-900 border border-white/10 px-6 py-4 flex items-center justify-between gap-4 shadow-2xl rounded-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">{toast.message}</p>
            </div>
            <button 
              type="button"
              onClick={() => setToast(null)}
              className="text-neutral-500 hover:text-white text-xs font-mono"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
