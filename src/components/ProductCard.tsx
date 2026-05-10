import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block space-y-4">
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-white/5">
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
                className="absolute inset-0 h-full w-full object-cover brightness-90"
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
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 brightness-90 group-hover:brightness-100"
                referrerPolicy="no-referrer"
              />
            )}
          </AnimatePresence>

          {/* Minimalist Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black/40 backdrop-blur-md border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white block text-center">Open Series</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <h3 className="text-xs font-display uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors duration-300">
                    {product.name}
                </h3>
                <span className="text-[10px] font-mono text-white">${product.price}</span>
            </div>
            <div className="h-px w-0 group-hover:w-full bg-white/20 transition-all duration-700" />
            <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">{product.category}</p>
        </div>
      </Link>
    </motion.div>
  );
}
