import { motion } from 'motion/react';
import { Check, Zap, Shield, Star, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "Perfect for casual learners and homework help.",
      features: [
        "5 solves per month",
        "Standard solving speed",
        "Community support",
        "Basic history tracking"
      ],
      button: "Current Plan",
      highlight: false
    },
    {
      name: "Axiom Plus",
      price: "$34.99",
      desc: "For active students who need more power.",
      features: [
        "100 solves per month",
        "Image upload solving",
        "Standard AI Professor Chat",
        "Basic Quiz Generation",
        "Email support"
      ],
      button: "Upgrade Now",
      highlight: false
    },
    {
      name: "Axiom Pro",
      price: "$59.99",
      desc: "Our most popular plan for deep mastery.",
      features: [
        "Unlimited solves",
        "Unlimited Image uploads",
        "Advanced Professor Chat",
        "Unlimited Quizzes",
        "Interactive graphing tools",
        "15-Day Money Back Guarantee"
      ],
      button: "Get Pro",
      highlight: true
    },
    {
      name: "Research Elite",
      price: "$79.99",
      desc: "The ultimate suite for mathematical innovation.",
      features: [
        "All Pro features",
        "Mathematical Insight Engine",
        "AI Paper Breakdown (PDF/Image)",
        "Structural Fingerprinting",
        "Experimental LaTeX Lab",
        "Dedicated Research Channel"
      ],
      button: "Go Elite",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-widest"
        >
          Simple Pricing & 15-Day Return Policy
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mt-6 mb-6 tracking-tight"
        >
          The power of Axiom,<br />scaled to your needs.
        </motion.h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Choose a plan that matches your mathematical journey. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-3xl border flex flex-col ${
              plan.highlight 
                ? 'bg-gradient-to-b from-accent-primary/10 to-transparent border-accent-primary shadow-glow' 
                : 'bg-card border-border'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                <Crown size={12} />
                <span>Most Popular</span>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-text-muted">{plan.desc}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-text-muted text-sm">/month</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                  <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <Check size={10} strokeWidth={4} />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/login')}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                plan.highlight 
                  ? 'bg-accent-primary text-white hover:opacity-90 shadow-glow' 
                  : 'bg-elevated text-text-primary hover:bg-secondary border border-border'
              }`}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-32 max-w-4xl mx-auto rounded-3xl p-12 bg-secondary/50 border border-border text-center overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <h2 className="text-3xl font-bold mb-4">Enterprise Grade Security</h2>
        <p className="text-text-secondary mb-8">We use industry-standard encryption to protect your data. All solutions are processed with privacy-preserving AI models.</p>
        <div className="flex flex-wrap justify-center gap-10">
          {[
            { icon: <Shield size={20} />, text: 'AES-256 Encryption' },
            { icon: <Zap size={20} />, text: '99.9% Uptime' },
            { icon: <Star size={20} />, text: 'SOC2 Compliant' }
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
