import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useState } from 'react';
import QuickView from './QuickView';

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-4">
        {/* Header Row with Name and Status */}
        <div className="flex justify-between items-end">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-500 group-hover:text-white transition-colors duration-500">
            {product.name}
          </h4>
          
          {product.status && product.status !== 'none' && (
            <span className={`text-[8px] font-mono uppercase tracking-[0.2em] font-bold ${
              product.status === 'sold' ? 'text-red-500' : 
              product.status === 'sale' ? 'text-amber-400' : 
              'text-white'
            }`}>
              {product.status === 'sold' ? 'Sold Out' : product.status === 'sale' ? 'Sale' : 'New Entry'}
            </span>
          )}
        </div>

        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-white/5 group/img">
          {/* Badge removed from here */}
          
          <Link to={`/product/${product.id}`} className="block h-full w-full">
            <AnimatePresence initial={false}>
              {isHovered && product.images[1] ? (
                <motion.img
                  key="hover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  src={product.images[1]}
                  alt={product.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${product.status === 'sold' ? 'grayscale opacity-50' : 'brightness-90'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <motion.img
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={product.images[0]}
                  alt={product.name}
                  className={`h-full w-full object-cover transition-all duration-1000 group-hover/img:scale-105 ${product.status === 'sold' ? 'grayscale opacity-50' : 'brightness-90 group-hover/img:brightness-100'}`}
                  referrerPolicy="no-referrer"
                />
              )}
            </AnimatePresence>
          </Link>

          {product.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <span className="text-[10px] font-mono uppercase tracking-[0.8em] text-white/40 rotate-12 border border-white/10 px-4 py-2 backdrop-blur-sm bg-black/20">
                Unavailable
              </span>
            </div>
          )}

          {/* Quick View Button Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover/img:translate-y-0 transition-transform duration-500 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-center">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickViewOpen(true);
                }}
                className="w-full py-4 bg-white text-black font-mono font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all active:scale-95"
              >
                Quick View
              </button>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="block flex flex-col gap-2">
            <div className="flex justify-between items-end pt-2">
                <h3 className="text-xs font-display uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors duration-300">
                    {product.name}
                </h3>
                <div className="flex items-center gap-3">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="relative text-[10px] font-mono text-neutral-600 px-1">
                      ${product.originalPrice}
                      <span className="absolute left-0 right-0 top-1/2 h-px bg-red-500/60 -rotate-[25deg] transform origin-center" />
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-white">${product.price}</span>
                </div>
            </div>
            <div className="h-px w-0 group-hover:w-full bg-white/20 transition-all duration-700" />
            <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">{product.category}</p>
        </Link>
      </div>

      <QuickView 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </motion.div>
  );
}
