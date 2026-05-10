import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ChevronLeft, ShoppingBag, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, removeFromCart } = useCart();
  const { profile } = useAuth();
  const [form, setForm] = useState({
    customerName: profile?.displayName || '',
    email: profile?.email || '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [automationEmail, setAutomationEmail] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAutomationEmail(docSnap.data().automationEmail || '');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...form,
        items: cart,
        total: cartTotal,
        automationEmail: automationEmail,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);
      
      // Send easy email notification via Web3Forms
      const web3Key = import.meta.env.VITE_WEB3FORMS_KEY;
      if (web3Key && web3Key !== 'YOUR_ACCESS_KEY_HERE') {
        const formData = new FormData();
        formData.append("access_key", web3Key);
        formData.append("subject", `New Order from ${form.customerName} - $${cartTotal}`);
        formData.append("from_name", "AURORA Store");
        formData.append("Order ID", docRef.id);
        formData.append("Customer", form.customerName);
        formData.append("Email", form.email);
        formData.append("Automation Email", automationEmail);
        formData.append("Phone", form.phone);
        formData.append("Address", form.address);
        formData.append("Total", `$${cartTotal}`);
        formData.append("Items", cart.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(', '));

        fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
      }

      clearCart();
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to secure order. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-neutral-900 border border-white/5 p-12 text-center space-y-10 backdrop-blur-2xl"
      >
        <div className="space-y-6">
          <CheckCircle2 className="w-16 h-16 text-white mx-auto stroke-[1]" />
          <div className="space-y-2">
            <h1 className="text-4xl font-display uppercase tracking-tight">Order Secured</h1>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
              Your acquisition has been logged in the Aurora archives. A summary will be sent to your terminal.
            </p>
          </div>
        </div>

        <div className="bg-black/50 border border-white/5 p-6 space-y-4">
          <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Order Reference (Save This)</span>
          <div className="flex flex-col gap-4">
            <div className="text-lg font-mono text-white tracking-widest bg-white/5 p-4 select-all">
              {orderId}
            </div>
            <button 
              onClick={() => {
                if (orderId) {
                  navigator.clipboard.writeText(orderId);
                  alert('Reference copied to clipboard');
                }
              }}
              className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => navigate('/shop')}
            className="w-full py-5 bg-white text-black font-mono font-bold uppercase tracking-[0.4em] hover:bg-neutral-200 transition-colors text-[10px]"
          >
            Return to Collection
          </button>
          <button 
            onClick={() => navigate('/track')}
            className="w-full py-5 border border-white/10 text-white font-mono uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all text-[10px]"
          >
            Track Trajectory
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <nav className="p-6 flex justify-between items-center border-b border-white/5">
        <button 
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Collection
        </button>
        <div className="text-xl font-display tracking-tighter" onClick={() => navigate('/')}>AURORA</div>
        <div className="w-20" />
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Order Form */}
          <div className="order-2 lg:order-1 space-y-12">
            <h2 className="text-3xl font-display tracking-tighter uppercase">Order Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={form.customerName}
                    onChange={(e) => setForm({...form, customerName: e.target.value})}
                    placeholder="E.G. JOHN DOE"
                    className="w-full bg-transparent border-b border-white/20 py-3 focus:outline-none focus:border-white transition-colors uppercase font-mono text-sm placeholder:text-neutral-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="+20 123 456 7890"
                    className="w-full bg-transparent border-b border-white/20 py-3 focus:outline-none focus:border-white transition-colors font-mono text-sm placeholder:text-neutral-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  placeholder="YOU@EXAMPLE.COM"
                  className="w-full bg-transparent border-b border-white/20 py-3 focus:outline-none focus:border-white transition-colors font-mono text-sm placeholder:text-neutral-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Shipping Address</label>
                <textarea 
                  required
                  rows={4}
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  placeholder="COMPLETE ADDRESS"
                  className="w-full bg-transparent border border-white/20 p-4 focus:outline-none focus:border-white transition-colors uppercase font-mono text-sm placeholder:text-neutral-800 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className={cn(
                  "w-full py-5 text-black font-mono font-bold uppercase tracking-[0.3em] transition-all",
                  isSubmitting ? "bg-neutral-600 cursor-not-allowed" : "bg-white hover:bg-neutral-200"
                )}
              >
                {isSubmitting ? "TRANSMITTING..." : "FINALIZE ORDER"}
              </button>
            </form>
          </div>

          {/* Cart Summary */}
          <div className="order-1 lg:order-2 space-y-12">
            <h2 className="text-3xl font-display tracking-tighter uppercase flex items-center gap-4">
              Your Selection <span className="text-sm font-mono text-neutral-500">[{cart.length}]</span>
            </h2>
            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
              {cart.length === 0 ? (
                <div className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Selection is empty
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex gap-6 items-center group">
                    <div className="w-20 aspect-[3/4] bg-neutral-900 border border-white/5 flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-700" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs uppercase font-medium">{item.name}</h4>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{item.gender} / Size {item.size}</p>
                      <button 
                        onClick={() => removeFromCart(i)}
                        className="text-[10px] font-mono text-neutral-600 hover:text-white transition-colors uppercase tracking-widest pt-2 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">${item.price}</p>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                <span>Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                <span>Shipping</span>
                <span>Calculated at verification</span>
              </div>
              <div className="flex justify-between items-center text-xl font-display tracking-tight pt-4 border-t border-white/20">
                <span>TOTAL</span>
                <span>${cartTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
