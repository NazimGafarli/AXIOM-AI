import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Sigma, Mail, Github, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';

export default function Login() {
  const { user, signInWithGoogle, signInWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/solve" />;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mb-4 shadow-glow">
            <Sigma className="text-white" size={36} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-text-secondary">Sign in to continue your mathematical journey.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border border-border bg-secondary hover:bg-elevated transition-all font-bold text-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-card text-text-muted font-bold uppercase tracking-widest">Or login with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link 
                to="/reset-password"
                className="text-xs font-bold text-accent-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-4 px-4 rounded-2xl bg-accent-primary text-white font-bold shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-primary font-bold hover:underline">Create One</Link>
        </p>

        <p className="mt-8 text-center text-[10px] text-text-muted leading-relaxed">
          By continuing, you agree to our <br />
          <Link to="/policy" className="underline hover:text-white">Terms of Service</Link> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
