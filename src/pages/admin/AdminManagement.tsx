import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Shield, UserPlus, Trash2, Mail, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

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
  const [confirmRevokeUid, setConfirmRevokeUid] = useState<string | null>(null);
  const [revokingUid, setRevokingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      const adminEmails: string[] = settingsSnap.exists() ? (settingsSnap.data().adminEmails || []) : [];

      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      const adminProfiles = querySnapshot.docs.map(d => ({ ...d.data(), uid: d.id } as AuroraUser));

      const mergedList = [...adminProfiles];

      adminEmails.forEach(email => {
        if (!mergedList.some(a => a.email?.toLowerCase() === email.toLowerCase())) {
          mergedList.push({
            uid: `pending-${email.toLowerCase()}`,
            email,
            displayName: 'Pending Sign-In',
            role: 'admin',
            createdAt: null
          });
        }
      });

      setAdmins(mergedList);
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to load administrators.', type: 'error' });
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
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      const currentEmails: string[] = settingsSnap.exists() ? (settingsSnap.data().adminEmails || []) : [];

      if (!currentEmails.some(e => e.toLowerCase() === email)) {
        await setDoc(settingsRef, {
          adminEmails: [...currentEmails, email],
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

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
      setEmailInput('');
      fetchAdmins();
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to update permissions.', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  const revokeAccess = async (uid: string, email?: string) => {
    if (uid === auth.currentUser?.uid) {
      setMessage({ text: 'Cannot revoke your own clearance.', type: 'error' });
      setConfirmRevokeUid(null);
      return;
    }

    setRevokingUid(uid);
    try {
      if (email) {
        const settingsRef = doc(db, 'settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const currentEmails: string[] = settingsSnap.data().adminEmails || [];
          await updateDoc(settingsRef, {
            adminEmails: currentEmails.filter(e => e.toLowerCase() !== email.toLowerCase()),
            updatedAt: serverTimestamp()
          });
        }
      }

      // Pending invites do not yet have a /users document
      if (!uid.startsWith('pending-')) {
        await updateDoc(doc(db, 'users', uid), {
          role: 'user',
          updatedAt: serverTimestamp()
        });
      }

      setConfirmRevokeUid(null);
      setMessage({ text: 'Admin privileges revoked.', type: 'success' });
      fetchAdmins();
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Operation failed. Unauthorized.', type: 'error' });
    } finally {
      setRevokingUid(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">Access Control</h2>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed">
              Manage authorized administrators who can edit inventory and view orders.
            </p>
          </div>
        </div>
      </header>

      {/* Add Admin Form */}
      <div className="bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-display uppercase flex items-center gap-3">
            <UserPlus className="w-4 h-4 text-neutral-400" /> Grant Clearance
          </h3>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Role Elevation</span>
        </div>

        <form onSubmit={handleGrantAccess} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              Target Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  required
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 pl-11 focus:border-white transition-colors outline-none font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3.5 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Authorize</span>
              </button>
            </div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3.5 py-2.5 rounded-xl border",
                message.type === 'error'
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              )}
            >
              {message.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </form>
      </div>

      {/* Admin List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">Active Controllers</h3>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest tabular-nums">Total: {admins.length}</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="py-12 text-center font-mono text-[10px] text-neutral-500 flex items-center justify-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Syncing Personnel...
            </div>
          ) : admins.length === 0 ? (
            <div className="py-12 text-center font-mono text-[10px] text-neutral-500 border border-dashed border-white/10 rounded-2xl">
              No external administrators authorized.
            </div>
          ) : (
            admins.map(admin => {
              const isSelf = admin.uid === auth.currentUser?.uid;
              const isPending = admin.uid.startsWith('pending-');

              return (
                <div
                  key={admin.uid}
                  className="bg-neutral-900/60 border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                      <Shield className={cn("w-4 h-4", isSelf ? "text-white" : "text-neutral-400")} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium uppercase font-display tracking-wider text-neutral-200 truncate">
                          {admin.displayName || 'Unnamed Operator'}
                        </span>
                        {isSelf && (
                          <span className="text-[8px] font-mono px-2 py-0.5 bg-white text-black uppercase font-bold tracking-widest rounded">
                            You
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[8px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 lowercase tracking-wider truncate">
                        {admin.email}
                      </div>
                    </div>
                  </div>

                  {!isSelf && (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {confirmRevokeUid === admin.uid ? (
                        <>
                          <button
                            type="button"
                            disabled={revokingUid === admin.uid}
                            onClick={() => revokeAccess(admin.uid, admin.email)}
                            className="px-3 py-2 bg-red-500 text-white rounded-xl text-[10px] font-mono uppercase font-bold tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {revokingUid === admin.uid ? 'Revoking...' : 'Confirm Revoke'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeUid(null)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-colors"
                            aria-label="Cancel revoke"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeUid(admin.uid)}
                          className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all rounded-xl flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest"
                          title="Revoke administrator access"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sm:hidden">Revoke</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
