import { motion } from 'motion/react';
import { Check, X, Loader2, Crown, Zap, Shield, Star } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { STRIPE_PLANS, createCheckoutSession } from '../lib/stripe';
import { useState } from 'react';
import { toast } from 'sonner';

const plans = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Get started with the basics.',
    priceId: null,
    features: [
      { text: '5 solves per month', included: true },
      { text: 'Step-by-step breakdowns', included: true },
      { text: 'Basic history tracking', included: true },
      { text: 'Image upload solving', included: false },
      { text: 'AI Professor Chat', included: false },
      { text: 'Quiz generation', included: false },
      { text: 'Research Lab access', included: false },
      { text: 'Export solutions', included: false },
      { text: '15-Day money back', included: false },
    ],
    buttonLabel: 'Current Free Plan',
    highlight: false,
  },
  {
    key: 'plus',
    name: 'Axiom Plus',
    price: '$26.99',
    period: '/mo',
    desc: 'For active students who need more.',
    priceId: STRIPE_PLANS.plus.priceId,
    features: [
      { text: '100 solves per month', included: true },
      { text: 'Step-by-step breakdowns', included: true },
      { text: 'Full history tracking', included: true },
      { text: 'Image upload solving', included: true },
      { text: 'AI Professor Chat', included: true },
      { text: 'Quiz generation', included: true },
      { text: 'Research Lab access', included: false },
      { text: 'Export solutions', included: true },
      { text: '15-Day money back', included: true },
    ],
    buttonLabel: 'Get Plus',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Axiom Pro',
    price: '$49.99',
    period: '/mo',
    desc: 'Most popular — unlimited everything.',
    priceId: STRIPE_PLANS.pro.priceId,
    features: [
      { text: 'Unlimited solves', included: true },
      { text: 'Step-by-step breakdowns', included: true },
      { text: 'Full history tracking', included: true },
      { text: 'Image upload solving', included: true },
      { text: 'AI Professor Chat (unlimited)', included: true },
      { text: 'Unlimited quizzes', included: true },
      { text: 'Research Lab access', included: true },
      { text: 'Export solutions', included: true },
      { text: '15-Day money back', included: true },
    ],
    buttonLabel: 'Get Pro',
    highlight: true,
  },
  {
    key: 'elite',
    name: 'Research Elite',
    price: '$69.99',
    period: '/mo',
    desc: 'The full suite for mathematical innovation.',
    priceId: STRIPE_PLANS.elite.priceId,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'AI Paper Analysis (PDF)', included: true },
      { text: 'Structural Fingerprinting', included: true },
      { text: 'Experimental LaTeX Lab', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Research Lab access', included: true },
      { text: 'Export solutions', included: true },
      { text: '15-Day money back', included: true },
    ],
    buttonLabel: 'Go Elite',
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, userPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string, priceId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (userPlan.plan === planKey) {
      toast.info("You're already on this plan!");
      return;
    }
    setLoadingPlan(planKey);
    try {
      await createCheckoutSession(priceId, user.email!, user.uid);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-widest"
        >
          Simple Pricing · 15-Day Money Back Guarantee
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mt-6 mb-4 tracking-tight"
        >
          The power of Axiom,<br />scaled to your needs.
        </motion.h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Upgrade or downgrade anytime. Cancel in one click.
        </p>
        {userPlan.isPro && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
            <Crown size={14} />
            You're on {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)} plan
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => {
          const isCurrentPlan = userPlan.plan === plan.key;
          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl border flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-accent-primary/10 to-transparent border-accent-primary shadow-glow'
                  : isCurrentPlan
                    ? 'bg-card border-emerald-500/40'
                    : 'bg-card border-border'
              }`}
            >
              {plan.highlight && !isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Crown size={10} /> Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Your Plan
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-text-muted">{plan.desc}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-text-muted text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(feature => (
                  <li key={feature.text} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-text-secondary' : 'text-text-muted opacity-50'}`}>
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      feature.included ? 'bg-emerald-500/20 text-emerald-400' : 'bg-elevated text-text-muted'
                    }`}>
                      {feature.included ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.priceId ? handleUpgrade(plan.key, plan.priceId) : null}
                disabled={!plan.priceId || loadingPlan === plan.key || isCurrentPlan}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                  isCurrentPlan
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : plan.highlight
                      ? 'bg-accent-primary text-white hover:opacity-90 shadow-glow'
                      : plan.priceId
                        ? 'bg-elevated text-text-primary hover:bg-secondary border border-border'
                        : 'bg-elevated text-text-muted border border-border opacity-60 cursor-default'
                }`}
              >
                {loadingPlan === plan.key
                  ? <Loader2 size={18} className="animate-spin" />
                  : isCurrentPlan
                    ? 'Current Plan'
                    : plan.buttonLabel}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 max-w-4xl mx-auto rounded-3xl p-12 bg-secondary/50 border border-border text-center">
        <h2 className="text-3xl font-bold mb-4">Questions? We've got answers.</h2>
        <p className="text-text-secondary mb-4">
          All plans include a <strong className="text-white">15-Day Money Back Guarantee</strong>. No questions asked.
        </p>
        <p className="text-sm text-text-muted">
          To cancel or get a refund, contact us via <Link to="/policy" className="text-accent-primary hover:underline">our policy page</Link>.
        </p>
        <div className="flex flex-wrap justify-center gap-10 mt-8">
          {[
            { icon: <Shield size={20} />, text: 'AES-256 Encryption' },
            { icon: <Zap size={20} />, text: '99.9% Uptime' },
            { icon: <Star size={20} />, text: '15-Day Refund' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest">
              <div className="text-accent-primary">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
