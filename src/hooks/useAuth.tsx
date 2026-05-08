import { useState, useEffect, createContext, useContext } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// ── ADMIN EMAILS — these get full Elite access always ──
const ADMIN_EMAILS = [
  'gafarlin4zim@gmail.com',   // replace with your real email
];

export interface UserPlan {
  isPro: boolean;
  plan: 'free' | 'plus' | 'pro' | 'elite';
  solveLimit: number;
}

interface AuthContextType {
  user: User | null;
  userPlan: UserPlan;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_PLAN: UserPlan = { isPro: false, plan: 'free', solveLimit: 5 };
const ADMIN_PLAN: UserPlan = { isPro: true, plan: 'elite', solveLimit: -1 };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>(DEFAULT_PLAN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Admin bypass — full elite access
        if (firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email)) {
          setUserPlan(ADMIN_PLAN);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserPlan({
              isPro: data.isPro || false,
              plan: data.plan || 'free',
              solveLimit: data.solveLimit ?? 5,
            });
          } else {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              isPro: false,
              plan: 'free',
              solveLimit: 5,
              createdAt: new Date().toISOString(),
            });
            setUserPlan(DEFAULT_PLAN);
          }
        } catch (err) {
          console.error('Failed to fetch user plan:', err);
          setUserPlan(DEFAULT_PLAN);
        }
      } else {
        setUserPlan(DEFAULT_PLAN);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserPlan(DEFAULT_PLAN);
    toast.success('Signed out');
  };

  return (
    <AuthContext.Provider value={{ user, userPlan, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
