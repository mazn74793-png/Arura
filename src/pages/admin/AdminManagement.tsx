import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';
import { Shield, UserPlus, Trash2, Search, Mail, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface AuroraUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AuroraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // 1. Get emails from global settings
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      const adminEmails: string[] = settingsSnap.exists() ? (settingsSnap.data().adminEmails || []) : [];

      // 2. Get users who have the admin role
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      const adminProfiles = querySnapshot.docs.map(doc => ({ ...doc.data() } as AuroraUser));

      // 3. Merge: Start with users who haveProfiles
      const mergedList = [...adminProfiles];

      // 4. Add emails from list that don't have profiles yet
      adminEmails.forEach(email => {
        if (!mergedList.some(a => a.email.toLowerCase() === email.toLowerCase())) {
          mergedList.push({
            uid: `pending-${email}`,
            email: email,
            displayName: 'Pending Authorization',
            role: 'admin',
            createdAt: null
          });
        }
      });

      setAdmins(mergedList);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    
    setSearching(true);
    setMessage(null);

    try {
      // 1. Update Global Settings List (Primary source of truth for new/all users)
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      const currentEmails: string[] = settingsSnap.exists() ? (settingsSnap.data().adminEmails || []) : [];
      
      if (!currentEmails.includes(email)) {
        await setDoc(settingsRef, {
          adminEmails: [...currentEmails, email],
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 2. Try to update existing user profile if they have already logged in
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: 'admin',
          updatedAt: serverTimestamp()
        });
      }

      setMessage({ text: `Access granted to ${email}`, type: 'success' });
      alert(`Clearance granted to ${email}`);
      setEmailInput('');
      fetchAdmins();
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to update permissions.", type: 'error' });
      alert("Failed to grant access.");
    } finally {
      setSearching(false);
    }
  };

  const revokeAccess = async (uid: string, email?: string) => {
    if (uid === auth.currentUser?.uid) return alert("Cannot revoke own clearance.");
    if (confirm('Revoke administrator privileges for this user?')) {
      try {
        // 1. Remove from Global Settings List
        if (email) {
          const settingsRef = doc(db, 'settings', 'global');
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const currentEmails: string[] = settingsSnap.data().adminEmails || [];
            await updateDoc(settingsRef, {
              adminEmails: currentEmails.filter(e => e !== email.toLowerCase()),
              updatedAt: serverTimestamp()
            });
          }
        }

        // 2. Update user profile
        await updateDoc(doc(db, 'users', uid), {
          role: 'user',
          updatedAt: serverTimestamp()
        });
        
        alert('Privileges revoked.');
        fetchAdmins();
      } catch (error) {
        console.error(error);
        alert("Operation failed. Unauthorized.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="space-y-4 text-center">
        <Shield className="w-16 h-16 text-white mx-auto" strokeWidth={1} />
        <h2 className="text-4xl font-display uppercase tracking-tight">Access Control</h2>
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
          Authorized personnel management. Administrators can modify inventory and access all communications.
        </p>
      </header>

      {/* Add Admin Form */}
      <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-8 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display uppercase flex items-center gap-4">
            <UserPlus className="w-5 h-5 text-neutral-500" /> Grant Clearance
          </h3>
          <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Protocol: Role Elevation</span>
        </div>
        
        <form onSubmit={handleGrantAccess} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Target Email Address</label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input 
                  required
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="EX: NAME@AURORA.FOUNDATION"
                  className="w-full bg-black/50 border border-white/5 p-4 pl-12 focus:border-white transition-colors outline-none font-mono text-xs" 
                />
              </div>
              <button 
                type="submit"
                disabled={searching}
                className="px-8 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Authorize
              </button>
            </div>
          </div>
          
          {message && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className={cn("text-[10px] font-mono uppercase tracking-widest", message.type === 'error' ? 'text-red-500' : 'text-green-500')}
            >
              {message.text}
            </motion.p>
          )}
        </form>
      </div>

      {/* Admin List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">Active Controllers</h3>
          <span className="text-[8px] font-mono text-neutral-700 uppercase tracking-widest">Total: {admins.length}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             <div className="py-12 text-center font-mono text-[10px] text-neutral-500 flex items-center justify-center gap-3">
               <Loader2 className="w-4 h-4 animate-spin" /> Syncing Personnel...
             </div>
          ) : admins.length === 0 ? (
            <div className="py-12 text-center font-mono text-[10px] text-neutral-800">No external administrators authorized.</div>
          ) : admins.map(admin => (
            <div key={admin.uid} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-colors">
                  <Shield className={cn("w-5 h-5", admin.uid === auth.currentUser?.uid ? "text-white" : "text-neutral-500")} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium uppercase font-display tracking-wider text-neutral-200">{admin.displayName || 'Unnamed Operator'}</div>
                  <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">{admin.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {admin.uid === auth.currentUser?.uid && (
                  <span className="text-[8px] font-mono px-3 py-1 bg-white text-black uppercase font-bold tracking-widest">Root</span>
                )}
                <button 
                  onClick={() => revokeAccess(admin.uid, admin.email)}
                  className="p-3 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
