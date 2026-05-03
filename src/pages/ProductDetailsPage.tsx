import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Gender } from '../types';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<Gender>('man');
  const [quantity, setQuantity] = useState(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
    async function fetchProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setProduct({ ...data, id: docSnap.id });
          setSelectedSize(data.sizes[0] || '');
          setSelectedGender(data.gender !== 'unisex' ? data.gender : 'man');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      quantity,
      gender: selectedGender
    };
    
    // Simple state management for demo: store in localStorage
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    localStorage.setItem('cart', JSON.stringify([...currentCart, cartItem]));
    navigate('/checkout');
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-neutral-500">
      Revealing details...
    </div>
  );

  if (!product) return (
    <div className="h-screen bg-black flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-red-500">
      Product not found
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <nav className="p-4 md:p-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <button 
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 md:h-8 w-auto grayscale brightness-200" />
          ) : (
            <div className="text-xl md:text-2xl font-display tracking-tighter uppercase">AURORA</div>
          )}
        </div>
        <div className="w-8 md:w-20" />
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Images */}
          <div className="space-y-4">
            {product.images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 }}
                className="aspect-[3/4] bg-neutral-900 overflow-hidden border border-white/5"
              >
                <img 
                   src={img} 
                  alt={`${product.name} ${i + 1}`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>

          {/* Details */}
          <div className="md:sticky md:top-32 space-y-8 md:space-y-12">
            <header className="space-y-3 md:space-y-4">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em]">{product.category}</p>
              <h1 className="text-3xl md:text-6xl font-display tracking-tighter leading-tight uppercase">{product.name}</h1>
              <p className="text-xl md:text-2xl font-mono">${product.price}</p>
            </header>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Select Gender</label>
                <div className="flex gap-2 md:gap-4">
                  {['man', 'woman'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g as Gender)}
                      disabled={product.gender !== 'unisex' && product.gender !== g}
                      className={cn(
                        "flex-1 py-3 border text-[10px] font-mono uppercase tracking-widest transition-all",
                        selectedGender === g ? "bg-white text-black border-white" : "border-white/10 text-neutral-500 hover:border-white/40",
                        product.gender !== 'unisex' && product.gender !== g && "opacity-20 cursor-not-allowed"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Select Size</label>
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

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Quantity</label>
                <div className="flex items-center gap-6 py-2 px-4 border border-white/10 w-fit">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:text-neutral-400">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-sm w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="hover:text-neutral-400">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              className="w-full py-5 bg-white text-black font-mono font-bold uppercase tracking-[0.3em] hover:bg-neutral-200 transition-colors text-[10px] md:text-sm"
            >
              Secure Choice
            </button>

            <div className="pt-8 md:pt-12 space-y-4 md:space-y-6 border-t border-white/5">
              <div className="flex items-start gap-4">
                <Info className="w-5 h-5 text-neutral-500 mt-0.5" />
                <div className="space-y-2">
                   <h4 className="text-[10px] font-mono uppercase tracking-widest">Description</h4>
                   <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light">
                     {product.description || "A masterfully crafted piece reflecting the Aurora aesthetic. Designed for durability and comfort with high-quality materials."}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
