import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronDown } from 'lucide-react';

// Global variable to track entry within the same JS session (lost on refresh)
let hasEnteredThisSession = false;

export default function LandingPage() {
  const [isEntering, setIsEntering] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [landingVideoUrl, setLandingVideoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();

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
        } else {
          setLandingVideoUrl(defaultVideo);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setLandingVideoUrl(defaultVideo);
      }
    }
    fetchSettings();
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
          <div className="flex gap-4 md:gap-8 font-mono text-[10px] md:text-xs uppercase tracking-widest">
            <button onClick={() => navigate('/shop')} className="hover:text-white/60 transition-colors">Shop</button>
            <button onClick={() => navigate('/admin')} className="hover:text-white/60 transition-colors">Admin</button>
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

          {/* ... Categories and rest of content ... */}
          <div className="mt-32 md:mt-64 grid grid-cols-1 md:grid-cols-3 gap-1px bg-white/5 border border-white/5">
            {[
              { name: 'PANTS', desc: 'Sculpted Silhouettes', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800' },
              { name: 'SHIRTS', desc: 'Fluid Architecture', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800' },
              { name: 'BASIC TOPS', desc: 'Minimal Foundations', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800' }
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
        </main>

        <footer className="p-12 md:p-24 border-t border-white/5 flex flex-col items-center justify-center space-y-8 md:space-y-12">
           {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-8 md:h-12 w-auto grayscale opacity-40" />
           ) : (
             <div className="text-4xl md:text-6xl font-display tracking-tighter">AURORA</div>
           )}
           <div className="text-[8px] font-mono tracking-[0.8em] text-neutral-800 uppercase">
             ©MMXXVI / ALL RIGHTS RESERVED
           </div>
        </footer>
      </motion.div>
    </div>
  );
}


