import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface QuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickView({ product, isOpen, onClose }: QuickViewProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { wishlist, toggleWishlist, user } = useAuth();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');

  if (!isOpen) return null;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      gender: 'unisex', // Default for quick view
      image: product.colors?.find(c => c.name === selectedColor)?.image || product.images[0]
    });
    onClose();
    setIsCartOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-black border border-white/10 overflow-hidden grid grid-cols-1 md:grid-cols-2"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="aspect-[3/4] bg-neutral-900 border-r border-white/5">
            <img 
              src={product.colors?.find(c => c.name === selectedColor)?.image || product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[80vh] md:max-h-full">
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{product.category}</p>
              <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter leading-tight">{product.name}</h2>
              <div className="flex items-center gap-4">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl font-mono text-neutral-600 line-through">${product.originalPrice}</span>
                )}
                <p className="text-xl md:text-2xl font-mono text-white">${product.price}</p>
              </div>
            </div>

            <div className="space-y-6">
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Color</label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 p-0.5 transition-all",
                          selectedColor === color.name ? "border-white scale-110" : "border-white/10"
                        )}
                      >
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-3 border text-[10px] font-mono uppercase tracking-widest transition-all",
                        selectedSize === size ? "bg-white text-black border-white" : "border-white/10 text-neutral-500 hover:border-white/40"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button 
                onClick={handleAddToCart}
                disabled={product.status === 'sold'}
                className={cn(
                  "flex-1 py-4 bg-white text-black font-mono font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors text-xs",
                  product.status === 'sold' && "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50"
                )}
              >
                {product.status === 'sold' ? 'Sold Out' : 'Add to Bag'}
              </button>
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={cn(
                  "px-6 border transition-all duration-300",
                  wishlist.includes(product.id) ? "bg-white text-black border-white" : "border-white/10 text-white"
                )}
              >
                <Heart className={cn("w-4 h-4", wishlist.includes(product.id) && "fill-current")} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
