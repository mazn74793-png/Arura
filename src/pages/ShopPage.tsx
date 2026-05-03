import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const navigate = useNavigate();

  const categories: { id: Category | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pants', label: 'Pants' },
    { id: 'shirt', label: 'Shirts' },
    { id: 'basic-tops', label: 'Basic Tops' },
  ];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        let q = query(productsRef, orderBy('createdAt', 'desc'));
        
        if (activeCategory !== 'all') {
          q = query(productsRef, where('category', '==', activeCategory), orderBy('createdAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-xl font-display tracking-tighter cursor-pointer" onClick={() => navigate('/')}>AURORA</div>
        <button className="relative">
          <ShoppingBag className="w-5 h-5 text-white" strokeWidth={1.5} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-4 mb-16 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 border ${
                activeCategory === cat.id 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-neutral-500 border-white/10 hover:border-white/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            Loading collection...
          </div>
        ) : products.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">No pieces found in this series</div>
            <button 
              onClick={() => setActiveCategory('all')}
              className="text-white underline font-mono text-[10px] uppercase tracking-widest"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-24 border-t border-white/5 flex flex-col items-center gap-4">
        <div className="text-xl font-display tracking-tighter">AURORA</div>
        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Minimalist Essentials</p>
      </footer>
    </div>
  );
}
