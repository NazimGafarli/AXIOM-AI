import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sigma, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Signup() {
  const { user, signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/solve" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
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
        <div className="flex flex-col items-center text-center mb-10">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mb-6 shadow-glow">
            <Sigma className="text-white" size={32} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-text-secondary">Join AxiomAI and master mathematics.</p>
        </div>

        {/* Google Sign Up */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border border-border bg-secondary hover:bg-elevated transition-all font-bold text-sm mb-6"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <div className="relative py-4 mb-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="px-4 bg-card text-text-muted font-bold uppercase tracking-widest">Or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Password (min 6 characters)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border focus:border-accent-primary outline-none text-sm transition-all ${
                confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-border'
              }`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-2">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email || !password || !confirmPassword}
            className="w-full py-4 px-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin text-white" size={20} />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-primary font-bold hover:underline">Sign In</Link>
        </p>

        <p className="mt-6 text-center text-[10px] text-text-muted leading-relaxed">
          By creating an account you agree to our{' '}
          <Link to="/policy" className="underline hover:text-white">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/policy" className="underline hover:text-white">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
