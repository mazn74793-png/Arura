import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Search, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { setIsCartOpen, cart } = useCart();
  const { user, isAdmin } = useAuth();

  const categories: { id: Category | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pants', label: 'Pants' },
    { id: 'shirt', label: 'Shirts' },
    { id: 'basic-tops', label: 'Basic Tops' },
  ];

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().logoUrl) {
          setLogoUrl(docSnap.data().logoUrl);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchSettings();
  }, []);

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
        let productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        if (searchQuery) {
          productsData = productsData.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
          </button>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-neutral-500 hover:text-white transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="cursor-pointer" onClick={() => navigate('/')}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 md:h-8 w-auto brightness-200" />
          ) : (
            <div className="text-xl md:text-2xl font-display tracking-tighter uppercase">AURORA</div>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              title="Admin Control"
            >
              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest">Admin</span>
            </button>
          )}
          <button 
            onClick={() => navigate(user ? '/profile' : '/auth')}
            className="p-2 text-neutral-500 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" strokeWidth={1} />
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative group p-2"
          >
            <ShoppingBag className="w-5 h-5 text-white group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[65px] md:top-[81px] inset-x-0 bg-black border-b border-white/10 z-30 p-6"
          >
            <div className="max-w-3xl mx-auto relative">
              <input 
                autoFocus
                type="text" 
                placeholder="SEARCH_COLLECTION" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-2xl md:text-4xl font-display uppercase tracking-tighter outline-none placeholder:text-neutral-900"
              />
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-16 md:mb-24 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 md:px-8 py-3 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-500 border ${
                activeCategory === cat.id 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-neutral-500 border-white/5 hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-neutral-800 animate-pulse">Syncing...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 text-center px-4">No results for your query in this series</div>
            <button 
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="text-white underline font-mono text-[10px] uppercase tracking-widest hover:text-neutral-400 transition-colors"
            >
              Reset exploration
            </button>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-20"
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </motion.div>
        )}
      </main>

      <footer className="py-24 border-t border-white/5 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 md:h-12 w-auto opacity-40 hover:opacity-100 transition-opacity" />
            ) : (
              <div className="text-xl md:text-2xl font-display tracking-tighter uppercase opacity-40">AURORA</div>
            )}
            <p className="text-[10px] font-mono text-neutral-700 uppercase tracking-[0.4em] text-center px-4">Architectural Foundations</p>
        </div>
        <div className="flex gap-8 text-[8px] font-mono text-neutral-600 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
