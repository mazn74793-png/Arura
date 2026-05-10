import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Gender } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Minus, Info, ShoppingBag, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import ProductReviews from '../components/ProductReviews';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { wishlist, toggleWishlist, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<Gender>('man');
  const [quantity, setQuantity] = useState(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0].name);
          }
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
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
      gender: selectedGender,
      image: product.colors?.find(c => c.name === selectedColor)?.image || product.images[0]
    });
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
            <img src={logoUrl} alt="Logo" className="h-6 md:h-8 w-auto brightness-200" />
          ) : (
            <div className="text-xl md:text-2xl font-display tracking-tighter uppercase">AURORA</div>
          )}
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="p-2 text-neutral-500 hover:text-white transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative group aspect-[3/4] bg-neutral-900 border border-white/5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex + (selectedColor || '')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={
                    (selectedColor && activeImageIndex === 0 && product.colors?.find(c => c.name === selectedColor)?.image) || 
                    product.images[activeImageIndex]
                  } 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {product.images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                  <button 
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all pointer-events-auto border border-white/5"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all pointer-events-auto border border-white/5"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      "flex-shrink-0 w-20 aspect-[3/4] bg-neutral-900 border overflow-hidden transition-all duration-300",
                      activeImageIndex === i ? "border-white" : "border-white/5 opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}
            className="lg:sticky lg:top-32 space-y-8 md:space-y-12"
          >
            <motion.header 
              variants={{
                hidden: { opacity: 0, x: 20 },
                show: { opacity: 1, x: 0 }
              }}
              className="space-y-3 md:space-y-4"
            >
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em]">{product.category}</p>
                {product.status && product.status !== 'none' && (
                  <span className={`px-3 py-1.5 text-[8px] font-mono uppercase tracking-[0.2em] backdrop-blur-md border ${
                    product.status === 'sold' ? 'bg-red-500/10 border-red-500/40 text-red-500' : 
                    product.status === 'sale' ? 'bg-amber-400/10 border-amber-400/40 text-amber-400' : 
                    'bg-white/10 border-white/20 text-white'
                  }`}>
                    {product.status === 'sold' ? 'Sold Out' : product.status === 'sale' ? 'Sale' : 'New Entry'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-6xl font-display tracking-tighter leading-tight uppercase">{product.name}</h1>
              <div className="flex items-center gap-6">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="relative group">
                    <span className="text-xl md:text-3xl font-mono text-neutral-600 px-2 leading-none block">
                      ${product.originalPrice}
                    </span>
                    <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-red-600/80 -rotate-[15deg] transform origin-center shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
                  </div>
                )}
                <p className="text-2xl md:text-4xl font-mono text-white leading-none">${product.price}</p>
              </div>
            </motion.header>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
              }}
              className="space-y-6 md:space-y-8"
            >
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

              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Select Color</label>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setSelectedColor(color.name);
                          setActiveImageIndex(0); // Show color image (handled in gallery logic)
                        }}
                        className="group flex flex-col items-center gap-2"
                        title={color.name}
                      >
                        <div 
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all p-0.5",
                            selectedColor === color.name ? "border-white scale-110" : "border-white/10 hover:border-white/40"
                          )}
                        >
                          <div 
                            className="w-full h-full rounded-full" 
                            style={{ backgroundColor: color.hex }}
                          />
                        </div>
                        <span className={cn(
                          "text-[8px] font-mono uppercase tracking-widest transition-colors",
                          selectedColor === color.name ? "text-white" : "text-neutral-500"
                        )}>
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
              }}
              className="flex gap-4"
            >
              {product.status === 'sold' ? (
                <div className="flex-1 py-5 bg-neutral-900 border border-white/10 text-neutral-500 font-mono font-bold uppercase tracking-[0.3em] text-[10px] md:text-sm text-center">
                  Coming Soon
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 py-5 bg-white text-black font-mono font-bold uppercase tracking-[0.3em] hover:bg-neutral-200 transition-colors text-[10px] md:text-sm"
                >
                  Secure Choice
                </button>
              )}
              <button 
                onClick={() => user ? toggleWishlist(product.id) : navigate('/auth')}
                className={cn(
                  "px-6 border transition-all duration-500",
                  wishlist.includes(product.id) 
                    ? "bg-white text-black border-white" 
                    : "border-white/10 text-white hover:border-white/30"
                )}
              >
                <Heart className={cn("w-4 h-4", wishlist.includes(product.id) && "fill-current")} />
              </button>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
              }}
              className="pt-8 md:pt-12 space-y-4 md:space-y-8 border-t border-white/5"
            >
              <div className="flex items-start gap-4">
                <Info className="w-5 h-5 text-neutral-500 mt-1" />
                <div className="space-y-3">
                   <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">Description</h4>
                   <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light">
                     {product.description || "A masterfully crafted piece reflecting the Aurora aesthetic. Designed for durability and comfort with high-quality materials."}
                   </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                  <div className="p-4 border border-white/5">Ethically Sourced</div>
                  <div className="p-4 border border-white/5">Lifetime Assembly</div>
                  <div className="p-4 border border-white/5">Sync with Essentials</div>
                  <div className="p-4 border border-white/5">Limited Edition</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {product && <ProductReviews productId={product.id} />}
      </main>
    </div>
  );
}
