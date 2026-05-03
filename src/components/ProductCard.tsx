import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-white/5">
          {product.images[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-neutral-800 font-mono text-xs uppercase tracking-widest">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
        </div>
        <div className="mt-4 flex justify-between items-start">
          <div>
            <h3 className="text-sm font-sans font-medium tracking-tight text-neutral-200 uppercase">{product.name}</h3>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">{product.category}</p>
          </div>
          <p className="text-sm font-mono text-white">${product.price}</p>
        </div>
      </Link>
    </motion.div>
  );
}
