import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronDown, ArrowRight, ShoppingBag, User as UserIcon } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// Global variable to track entry within the same JS session (lost on refresh)
let hasEnteredThisSession = false;

export default function LandingPage() {
  const [isEntering, setIsEntering] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [landingVideoUrl, setLandingVideoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [contactEmail, setContactEmail] = useState<string>('CONCIERGE@AURORA.STUDIO');
  const navigate = useNavigate();
  const { setIsCartOpen, cart } = useCart();
  const { user } = useAuth();

  // Check if user has already entered in this JS session
  useEffect(() => {
    if (hasEnteredThisSession) {
      setIsEntering(true);
      setShowContent(true);
    }
  }, []);

  // Your provided video as default
  const defaultVideo = "https://storage.googleapis.com/cortex-blobs/6baf5333-e18e-4a87-b99b-fe3e2f5b82ac";

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.landingVideoUrl) setLandingVideoUrl(data.landingVideoUrl);
          else setLandingVideoUrl(defaultVideo);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.socialLinks) setSocialLinks(data.socialLinks);
          if (data.contactEmail) setContactEmail(data.contactEmail);
        } else {
          setLandingVideoUrl(defaultVideo);
        }
        setIsInitialLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setLandingVideoUrl(defaultVideo);
        setIsInitialLoading(false);
      }
    }

    async function fetchFeatured() {
      try {
        const q = query(collection(db, 'products'), limit(4));
        const snap = await getDocs(q);
        const prods = snap.docs.map(doc => ({ ...doc.data() as Product, id: doc.id }));
        setFeaturedProducts(prods);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      }
    }

    fetchSettings();
    fetchFeatured();
  }, []);

  const handleEnter = () => {
    setIsEntering(true);
    const videoElement = document.getElementById('intro-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().catch(console.error);
    }
  };

  const handleVideoEnd = () => {
    setShowContent(true);
    hasEnteredThisSession = true;
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[10px] font-mono uppercase tracking-[1em] text-neutral-500"
        >
          Aurora
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden selection:bg-white selection:text-black">
      {/* Intro Overlay */}
      <AnimatePresence>
        {!showContent && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
          >
            {/* The Background Video */}
            {landingVideoUrl && (
              <video 
                id="intro-video"
                onEnded={handleVideoEnd}
                onError={() => setShowContent(true)}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isEntering ? 'opacity-100' : 'opacity-0'}`}
              >
                <source src={landingVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {/* Enter Button Layer */}
            {!isEntering && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-[120] flex flex-col items-center gap-12"
              >
                {logoUrl ? (
                  <motion.img 
                    src={logoUrl} 
                    alt="Aurora Logo" 
                    className="w-40 md:w-64 h-auto max-w-[80vw]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                ) : (
                  <div className="text-5xl md:text-[8rem] lg:text-[10rem] font-display tracking-tighter text-white uppercase leading-none text-center px-4">AURORA</div>
                )}
                <button 
                  onClick={handleEnter}
                  className="px-8 md:px-20 py-4 md:py-6 border border-white text-white font-mono tracking-[0.5em] md:tracking-[1em] text-[10px] md:text-xs uppercase hover:bg-white hover:text-black transition-all duration-700 relative overflow-hidden group"
                >
                  <span className="relative z-10">ENTER THE VOID</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-0" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Website Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{ display: showContent ? 'block' : 'none' }}
        className="min-h-screen bg-black"
      >
        <nav className="p-4 md:p-8 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-40">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-6 md:h-8 w-auto grayscale brightness-200" />
            ) : (
              <div className="text-xl md:text-2xl font-display tracking-tighter">AURORA</div>
            )}
          </div>
          <div className="flex items-center gap-4 md:gap-8 font-mono text-[10px] md:text-xs uppercase tracking-widest">
            <button onClick={() => navigate('/shop')} className="hover:text-white/60 transition-colors">Shop</button>
            {user && (
              <button 
                onClick={() => navigate('/admin')} 
                className="hidden md:block text-neutral-500 hover:text-white transition-colors"
                title="Admin Control"
              >
                Admin
              </button>
            )}
            <button 
              onClick={() => navigate(user ? '/profile' : '/auth')}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <UserIcon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1} />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 bg-white text-black text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-24 md:pb-48">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center text-center space-y-8 md:space-y-12"
          >
            <div className="space-y-4">
              <p className="text-[10px] font-mono tracking-[0.3em] md:tracking-[0.5em] text-neutral-500 uppercase">Perception / Series 01</p>
              <h2 className="text-5xl md:text-[8rem] lg:text-[12rem] font-display leading-[0.85] tracking-tighter uppercase">
                Obsidian<br />Minimalism
              </h2>
            </div>
            
            <button 
              onClick={() => navigate('/shop')}
              className="mt-4 md:mt-8 px-8 md:px-12 py-4 md:py-5 bg-white text-black font-mono font-bold tracking-widest text-[10px] md:text-xs uppercase hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl hover:shadow-white/10"
            >
              Enter Collection
            </button>
          </motion.div>

          {/* Featured Products Grid */}
          <div className="mt-32 md:mt-64 space-y-16">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 text-center md:text-left">
              <div className="space-y-4">
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.5em] block"
                >
                  Selected Works
                </motion.span>
                <h3 className="text-4xl md:text-6xl font-display uppercase tracking-tight leading-none">Essential Pieces</h3>
              </div>
              <button 
                onClick={() => navigate('/shop')}
                className="group flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all py-4 px-8 border border-white/5 hover:border-white/20"
              >
                View Collection <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="group cursor-pointer space-y-6"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale brightness-75 group-hover:brightness-100 group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black/40 backdrop-blur-sm">
                       <p className="text-[10px] font-mono uppercase tracking-widest text-center">Quick View</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-xs md:text-sm font-display uppercase tracking-wider group-hover:text-neutral-400 transition-colors">{product.name}</h4>
                    <p className="text-[10px] font-mono text-neutral-500 tracking-[0.2em]">${product.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {featuredProducts.length === 0 && !isInitialLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-white/5 border border-white/5">
                {[
                  { name: 'PANTS', desc: 'Sculpted Silhouettes', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800' },
                  { name: 'SHIRTS', desc: 'Fluid Architecture', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800' },
                  { name: 'OUTERWEAR', desc: 'Elemental Protection', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800' }
                ].map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="group relative aspect-[3/5] bg-black overflow-hidden flex flex-col justify-end p-8 md:p-12 cursor-pointer"
                    onClick={() => navigate('/shop')}
                  >
                    <img 
                      src={cat.img} 
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700 brightness-50 grayscale hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="relative z-10 space-y-2 text-left">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{cat.desc}</span>
                      <h3 className="text-3xl md:text-4xl font-display">{cat.name}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Newsletter Section */}
        <section className="py-32 px-6 border-y border-white/5 bg-neutral-950/30">
          <div className="max-w-xl mx-auto text-center space-y-12">
             <div className="space-y-4">
                <h3 className="text-3xl font-display uppercase tracking-tight">The Aurora Bulletin</h3>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
                  Join our internal network for priority access to upcoming drops and conceptual explorations.
                </p>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); alert('Identity synced to bulletin.'); }} className="flex gap-2">
                <input 
                  required
                  type="email"
                  placeholder="IDENTITY@DOMAIN.COM"
                  className="flex-1 bg-black/50 border border-white/5 p-5 outline-none focus:border-white transition-colors font-mono text-[10px] uppercase tracking-widest"
                />
                <button type="submit" className="px-10 py-5 bg-white text-black font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                  Join
                </button>
             </form>
          </div>
        </section>

        <footer className="py-24 px-6 border-t border-white/5 bg-neutral-950">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-12">
            <div className="space-y-8 col-span-1 md:col-span-2">
              <div className="text-3xl font-display tracking-tighter uppercase cursor-pointer flex items-center gap-3" onClick={() => navigate('/')}>
                {logoUrl ? <img src={logoUrl} alt="Aurora" className="h-8 grayscale brightness-200" /> : 'AURORA'}
              </div>
              <div className="space-y-6">
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest leading-loose max-w-sm">
                  Architectural minimalist garments for the discerning individual. Designed in London, sourced globally.
                </p>
                <div className="flex flex-wrap gap-4 text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-[0.3em]">
                  <span className="px-3 py-1 border border-white/10">Limited Release</span>
                  <span className="px-3 py-1 border border-white/10">Global Logistics</span>
                  <span className="px-3 py-1 border border-white/10">Ethics Verified</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
               <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-500 border-b border-white/5 pb-2">Inventory</h4>
               <ul className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  <li><button onClick={() => navigate('/shop')} className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 uppercase">Shop All <ArrowRight className="w-2 h-2" /></button></li>
                  <li><button onClick={() => navigate('/shop')} className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 uppercase">New Arrivals <ArrowRight className="w-2 h-2" /></button></li>
                  <li><button onClick={() => navigate('/shop')} className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 uppercase">Archives <ArrowRight className="w-2 h-2" /></button></li>
               </ul>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-500 border-b border-white/5 pb-2">Connect</h4>
               <ul className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  {socialLinks?.instagram && (
                    <li><a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-all flex items-center gap-2 uppercase">Instagram</a></li>
                  )}
                  {socialLinks?.facebook && (
                    <li><a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-all flex items-center gap-2 uppercase">Facebook</a></li>
                  )}
                  {socialLinks?.whatsapp && (
                    <li><a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white transition-all flex items-center gap-2 uppercase">WhatsApp</a></li>
                  )}
                  <li><a href={`mailto:${contactEmail}`} className="hover:text-white transition-all flex items-center gap-2 uppercase text-[8px] break-all">{contactEmail}</a></li>
               </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex flex-col gap-2">
                <div className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.5em]">AURORA IDENTITY • {new Date().getFullYear()}</div>
                <div className="text-[8px] font-mono text-neutral-800 uppercase tracking-widest">Digital Sanctuary designed for the void</div>
             </div>
             <div className="flex gap-8 text-neutral-500 font-mono text-[8px] uppercase tracking-widest">
                <button className="hover:text-white transition-colors">Privacy</button>
                <button className="hover:text-white transition-colors">Terms</button>
                <button className="hover:text-white transition-colors">Ethics</button>
             </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}


