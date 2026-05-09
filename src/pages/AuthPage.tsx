import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, ChevronLeft } from 'lucide-react';

export default function AuthPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-display tracking-tighter uppercase">Join Aurora</h1>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em] leading-relaxed">
            Sync your aesthetic preferences and access your private collection.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-white/5 p-8 md:p-12 space-y-8 backdrop-blur-xl">
          <div className="space-y-6">
            <button 
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-4 py-5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Continue with Google
            </button>
            
            <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest leading-loose">
              By continuing, you agree to our terms of curated experience and privacy foundations.
            </p>
          </div>
        </div>

        <div className="pt-12">
            <div className="text-[10px] font-mono text-neutral-800 uppercase tracking-[0.5em]">Identity • Sync • Aurora</div>
        </div>
      </motion.div>
    </div>
  );
}
