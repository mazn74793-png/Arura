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
  const unsubWishlistRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Test Connection as per guidelines
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        // Clean up previous wishlist subscription
        if (unsubWishlistRef.current) {
          unsubWishlistRef.current();
          unsubWishlistRef.current = null;
        }

        if (firebaseUser) {
          // Sync user profile
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            // If permissions fail, we still want to show the app (maybe limited access)
            userSnap = null;
          }
          
          const isAdminEmail = firebaseUser.email === "motaem23y@gmail.com";
          
          if (userSnap && !userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: isAdminEmail ? 'admin' : 'user'
            };
            try {
              await setDoc(userRef, {
                ...newProfile,
                createdAt: serverTimestamp()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            setProfile(newProfile);
          } else if (userSnap) {
            const currentProfile = userSnap.data() as UserProfile;
            // Auto-upgrade if email matches but role isn't admin
            if (isAdminEmail && currentProfile.role !== 'admin') {
              try {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
                setProfile({ ...currentProfile, role: 'admin' });
              } catch (e) {
                console.error("Failed to auto-upgrade admin", e);
                setProfile(currentProfile);
              }
            } else {
              setProfile(currentProfile);
            }
          }

          // Listen to wishlist
          const wishlistRef = collection(db, 'users', firebaseUser.uid, 'wishlist');
          unsubWishlistRef.current = onSnapshot(wishlistRef, (snap) => {
            setWishlist(snap.docs.map(doc => doc.id));
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/wishlist`);
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'wishlist', productId);
    try {
      if (wishlist.includes(productId)) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          productId,
          addedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/wishlist/${productId}`);
    }
  };

  const isAdmin = profile?.role === 'admin' && (user?.email === "motaem23y@gmail.com");

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
