import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  onSnapshot,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const unsubWishlistRef = useRef<(() => void) | null>(null);

  const adminEmailsRef = useRef<string[]>([]);

  // 1. Dedicated Settings Listener
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const emails = snap.data().adminEmails || [];
        const formatted = emails.map((e: string) => e.trim().toLowerCase());
        setAdminEmails(formatted);
        adminEmailsRef.current = formatted;
      }
    }, (error) => {
      console.warn("Settings listener failed:", error);
    });
    return () => unsubSettings();
  }, []);

  // 1. Auth State and Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        if (unsubWishlistRef.current) {
          unsubWishlistRef.current();
          unsubWishlistRef.current = null;
        }

        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (error) {
            userSnap = null;
          }

          // Compute admin status based on current state
          const email = firebaseUser.email?.toLowerCase();
          const isSuperAdmin = email === "motaem23y@gmail.com";
          const isAdminInList = email && adminEmailsRef.current.includes(email);
          const needsAdminRole = isSuperAdmin || isAdminInList;
          
          if (userSnap && !userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: needsAdminRole ? 'admin' : 'user'
            };
            await setDoc(userRef, { ...newProfile, createdAt: serverTimestamp() });
            setProfile(newProfile);
          } else if (userSnap) {
            const currentProfile = userSnap.data() as UserProfile;
            if (needsAdminRole && currentProfile.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              setProfile({ ...currentProfile, role: 'admin' });
            } else {
              setProfile(currentProfile);
            }
          }

          // Wishlist listener
          const wishlistRef = collection(db, 'users', firebaseUser.uid, 'wishlist');
          unsubWishlistRef.current = onSnapshot(wishlistRef, (snap) => {
            setWishlist(snap.docs.map(doc => doc.id));
          });
        } else {
          setProfile(null);
          setWishlist([]);
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubWishlistRef.current) unsubWishlistRef.current();
    };
  }, []);

  // Reactively elevate user to admin if their email is added to global admin list or they are super admin
  useEffect(() => {
    if (!user || !profile) return;
    const email = user.email?.toLowerCase();
    const isSuperAdmin = email === "motaem23y@gmail.com";
    const isAdminInList = email && adminEmails.includes(email);
    const needsAdminRole = isSuperAdmin || isAdminInList;

    if (needsAdminRole && profile.role !== 'admin') {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, { role: 'admin' }, { merge: true })
        .then(() => {
          setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
        })
        .catch(err => console.error("Error upgrading user to admin dynamically:", err));
    }
  }, [user, adminEmails, profile?.role]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'wishlist', productId);
    if (wishlist.includes(productId)) {
      await deleteDoc(itemRef);
    } else {
      await setDoc(itemRef, { productId, addedAt: serverTimestamp() });
    }
  };

  // 1. Role in profile is admin
  // 2. OR Email is super admin
  // 3. OR Email is in staff list from global settings
  const activeEmail = user?.email?.toLowerCase();
  const isAdmin = !!user && (
    (profile?.role === 'admin') ||
    (activeEmail === "motaem23y@gmail.com") ||
    (!!activeEmail && adminEmails.includes(activeEmail))
  );

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      loginWithGoogle, 
      logout,
      wishlist,
      toggleWishlist
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
