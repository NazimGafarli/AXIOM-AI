import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sigma, Mail, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSent(true);
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
          <Link to="/" className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 border border-border">
            <Sigma className="text-accent-primary" size={32} />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-text-secondary line-clamp-2">Enter your email and we'll send you instructions to reset your account.</p>
        </div>

        {isSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Email Sent!</h3>
            <p className="text-sm text-text-secondary mb-8">Please check {email} for the reset link.</p>
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-accent-primary font-bold hover:underline"
            >
              <ArrowLeft size={16} />
              <span>Return to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Account Email"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-4 px-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </form>
        )}

        <div className="mt-12 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Axiom Recovery Services</p>
        </div>
      </motion.div>
    </div>
  );
}
