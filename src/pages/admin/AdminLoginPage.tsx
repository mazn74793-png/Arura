import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const [noAdminsExist, setNoAdminsExist] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if this user is admin
        const adminDoc = await getDoc(doc(db, 'admins', u.uid));
        if (adminDoc.exists()) {
          navigate('/admin/products');
        } else {
          // User is logged in but not admin, check if ANY admins exist
          const adminSnapshot = await getDocs(collection(db, 'admins'));
          if (adminSnapshot.empty) {
            setNoAdminsExist(true);
          }
        }
      }
      setLoading(false);
      setIsCheckingAdmins(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const claimRoot = async () => {
    if (!user) return;
    try {
      // Ensure we are using the user's actual UID as the document ID
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Root Admin',
        createdAt: serverTimestamp()
      });
      // Force a state refresh
      window.location.href = '/admin/products';
    } catch (error) {
      console.error("Claim failed:", error);
      alert("Clearance failed. Check console for details.");
    }
  };

  const isTargetEmail = user?.email === 'motaem23y@gmail.com';

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-mono text-xs uppercase tracking-widest text-neutral-500">
      Verifying Clearance...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-white selection:text-black">
      <div className="w-full max-w-md space-y-12">
        <header className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Shield className="w-8 h-8 text-white" strokeWidth={1} />
          </div>
          <h1 className="text-4xl font-display uppercase tracking-tight">Aurora Internal</h1>
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Operator Authentication Required</p>
        </header>

        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-8">
          { (noAdminsExist || isTargetEmail) && user ? (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-center space-y-2">
                <p className="text-[10px] font-mono text-white uppercase tracking-widest">Clearance Recognized</p>
                <p className="text-[10px] font-mono text-neutral-500 uppercase leading-relaxed">
                  Clearance for {user.email} is pending activation.
                </p>
              </div>
              <button 
                onClick={claimRoot}
                className="w-full py-4 bg-white text-black font-mono font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-3"
              >
                <UserPlus className="w-4 h-4" /> Activate Admin Session
              </button>
            </div>
          ) : user ? (
            <div className="space-y-6 text-center">
               <div className="space-y-1">
                 <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Logged in as</p>
                 <p className="text-sm font-mono">{user.email}</p>
               </div>
               <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                 <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Access Denied</p>
                 <p className="text-[10px] font-mono text-red-500/60 uppercase mt-1">Unauthorized Protocol</p>
               </div>
               <button 
                onClick={() => auth.signOut()}
                className="text-[10px] font-mono text-neutral-500 hover:text-white uppercase tracking-widest underline"
               >
                 Switch Operator
               </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full py-5 border border-white/10 hover:border-white text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
            >
              <Lock className="w-4 h-4 group-hover:text-neutral-400 transition-colors" /> 
              Sign In with Google
              <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-2 transition-transform" />
            </button>
          )}
        </div>

        <footer className="text-center">
           <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-mono text-neutral-700 hover:text-neutral-400 uppercase tracking-widest transition-colors"
           >
             Return to Public Facing Site
           </button>
        </footer>
      </div>
    </div>
  );
}
