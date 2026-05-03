import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrderItem } from '../types';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, []);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...form,
        items: cart,
        total,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Send easy email notification via Web3Forms
      const web3Key = import.meta.env.VITE_WEB3FORMS_KEY;
      if (web3Key) {
        const formData = new FormData();
        formData.append("access_key", web3Key);
        formData.append("subject", `New Order from ${form.customerName} - $${total}`);
        formData.append("from_name", "AURORA Store");
        formData.append("Order ID", docRef.id);
        formData.append("Customer", form.customerName);
        formData.append("Email", form.email);
        formData.append("Phone", form.phone);
        formData.append("Address", form.address);
        formData.append("Total", `$${total}`);
        formData.append("Items", cart.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(', '));

        fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
      }

      localStorage.removeItem('cart');
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to secure order. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center space-y-8 p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-white flex flex-col items-center space-y-4"
      >
        <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={1} />
        <h1 className="text-4xl font-display tracking-tighter">ORDER SECURED</h1>
        <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest leading-relaxed max-w-sm">
          Your request has been transmitted to our workshop. We will notify you via phone once the verification is complete.
        </p>
      </motion.div>
      <button 
        onClick={() => navigate('/shop')}
        className="px-8 py-3 border border-white/20 hover:border-white transition-all text-white font-mono text-[10px] uppercase tracking-widest"
      >
        Return to Collection
      </button>
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
                  <div key={i} className="flex gap-6 items-center">
                    <div className="w-20 h-24 bg-neutral-900 border border-white/5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm uppercase font-medium">{item.name}</h4>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{item.gender} / Size {item.size}</p>
                      <button 
                        onClick={() => {
                          const newCart = [...cart];
                          newCart.splice(i, 1);
                          setCart(newCart);
                          localStorage.setItem('cart', JSON.stringify(newCart));
                        }}
                        className="text-[10px] font-mono text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest pt-2"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">${item.price}</p>
                      <p className="text-[10px] font-mono text-neutral-500">QTY: {item.quantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                <span>Subtotal</span>
                <span>${total}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">
                <span>Shipping</span>
                <span>Calculated at verification</span>
              </div>
              <div className="flex justify-between items-center text-xl font-display tracking-tight pt-4 border-t border-white/20">
                <span>TOTAL</span>
                <span>${total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
