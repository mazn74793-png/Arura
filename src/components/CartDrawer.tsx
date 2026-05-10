import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-neutral-400" />
                <h2 className="text-sm font-mono uppercase tracking-[0.2em]">Bag ({cart.length})</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-neutral-600" />
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Your bag is empty</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="text-[10px] font-mono uppercase tracking-widest underline decoration-neutral-700 hover:decoration-white transition-colors"
                  >
                    Start Browsing
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.productId}-${item.size}`} className="flex gap-4 group">
                    <div className="w-24 aspect-[3/4] bg-neutral-900 overflow-hidden relative border border-white/5">
                      {item.image && (
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-xs font-display uppercase tracking-wider">{item.name}</h3>
                          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{item.size} / {item.gender} {item.color && `/ ${item.color}`}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="text-neutral-600 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 py-1 px-3">
                          <button onClick={() => updateQuantity(index, item.quantity - 1)} className="hover:text-neutral-400">
                            <Minus className="w-3 h-3 text-neutral-500" />
                          </button>
                          <span className="font-mono text-xs w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(index, item.quantity + 1)} className="hover:text-neutral-400">
                            <Plus className="w-3 h-3 text-neutral-500" />
                          </button>
                        </div>
                        <p className="font-mono text-xs">${item.price * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-8 border-t border-white/5 space-y-6">
                <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-neutral-400">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal}</span>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                    className="w-full py-5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-neutral-200 transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
