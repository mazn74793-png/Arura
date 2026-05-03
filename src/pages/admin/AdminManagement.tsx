import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Admin } from '../../types';
import { UserPlus, Shield, Trash2, Mail, Key } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ uid: '', email: '', displayName: '' });
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({ ...doc.data() } as Admin));
      setAdmins(adminList);
      
      // If no admins, show bootstrap button
      if (adminList.length === 0) setIsBootstrapping(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'admins', newAdmin.uid), {
        ...newAdmin,
        createdAt: serverTimestamp()
      });
      setNewAdmin({ uid: '', email: '', displayName: '' });
      fetchAdmins();
    } catch (error) {
      alert("Only existing admins can add new ones.");
    }
  };

  const bootstrapFirstAdmin = async () => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: 'System Root',
        createdAt: serverTimestamp()
      });
      setIsBootstrapping(false);
      fetchAdmins();
      window.location.reload(); // Reload to update App state
    } catch (error) {
      console.error(error);
    }
  };

  const removeAdmin = async (uid: string) => {
    if (uid === auth.currentUser?.uid) return alert("Cannot revoke own clearance.");
    if (confirm('Revoke access for this operator?')) {
      await deleteDoc(doc(db, 'admins', uid));
      fetchAdmins();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="space-y-4 text-center">
        <Shield className="w-16 h-16 text-white mx-auto" strokeWidth={1} />
        <h2 className="text-4xl font-display uppercase tracking-tight">Security Clearances</h2>
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
          Authorized personnel only. Granting clearance provides full control over inventory and transmissions.
        </p>
      </header>

      {isBootstrapping && (
        <div className="bg-white/5 border border-dashed border-white/20 p-12 rounded-3xl text-center space-y-6">
          <h3 className="text-lg font-display uppercase">No Operators Found</h3>
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            The system is unmanaged. Claim root access for the current session.
          </p>
          <button 
            onClick={bootstrapFirstAdmin}
            className="px-12 py-4 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-neutral-200"
          >
            Claim Root Access
          </button>
        </div>
      )}

      {/* Add Admin Form */}
      <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-8">
        <h3 className="text-xl font-display uppercase flex items-center gap-4">
          <UserPlus className="w-5 h-5 text-neutral-500" /> Grant Access
        </h3>
        <form onSubmit={addAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Operation ID (UID)</label>
            <input 
              required
              value={newAdmin.uid}
              onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})}
              placeholder="PASTE FIREBASE UID"
              className="w-full bg-black/50 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Email Address</label>
            <input 
              required
              type="email"
              value={newAdmin.email}
              onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
              placeholder="OFFICIAL EMAIL"
              className="w-full bg-black/50 border border-white/5 p-4 focus:border-white transition-colors outline-none font-mono text-xs" 
            />
          </div>
          <div className="md:col-span-2 space-y-2 text-right">
             <button 
              type="submit"
              className="px-12 py-4 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-200 transition-colors"
            >
              Verify & Authorize
            </button>
          </div>
        </form>
      </div>

      {/* Admin List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 text-center">Active Operators</h3>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             <div className="py-12 text-center font-mono text-[10px] text-neutral-500">Verifying personnel...</div>
          ) : admins.map(admin => (
            <div key={admin.uid} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-white/40 transition-colors">
                  <Shield className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <div className="text-sm font-medium uppercase">{admin.email}</div>
                  <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">UID: {admin.uid}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {admin.uid === auth.currentUser?.uid && (
                  <span className="text-[8px] font-mono px-2 py-1 bg-white text-black uppercase rounded tracking-widest">Self</span>
                )}
                <button 
                  onClick={() => removeAdmin(admin.uid)}
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
