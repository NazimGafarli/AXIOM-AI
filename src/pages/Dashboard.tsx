import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { InlineMath } from 'react-katex';
import { SolveResult } from '../types';
import { Sigma, History, Star, TrendingUp, Book, Microscope, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [solves, setSolves] = useState<SolveResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSolves = async () => {
      try {
        const q = query(
          collection(db, 'solves'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SolveResult));
        setSolves(data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolves();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-text-secondary">Track your progress and review your recent mathematical breakthroughs.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Current Plan</span>
            <span className="text-sm font-bold text-accent-primary">Axiom Free</span>
          </div>
          <Link to="/solve" className="px-6 py-3 rounded-xl bg-accent-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-glow">
            <Sigma size={20} />
            <span>Solve New Problem</span>
          </Link>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="col-span-1 md:col-span-2 bento-card border-accent-primary/20 bg-accent-primary/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-accent-primary">Usage Tracking</h3>
            <span className="text-[10px] font-bold text-text-muted">Resets in 22 days</span>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Monthly Solves</span>
                <span className="text-text-muted">{(localStorage.getItem('axiom_solves_count') || '0')}/5</span>
              </div>
              <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-primary shadow-glow transition-all duration-1000"
                  style={{ width: `${(parseInt(localStorage.getItem('axiom_solves_count') || '0') / 5) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Elite Research Credits</span>
                <span className="text-text-muted">0/50</span>
              </div>
              <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-border w-0" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bento-card flex flex-col justify-between bg-yellow-500/5 border-yellow-500/20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500">Stripe Integration</h3>
          <p className="text-xs text-text-secondary leading-relaxed mt-4">
            To connect your live Stripe account, add your <b>STRIPE_SECRET_KEY</b> and <b>STRIPE_PUBLISHABLE_KEY</b> in the AI Studio Settings menu under the <b>Secrets</b> panel.
          </p>
          <div className="mt-4 p-2 bg-secondary rounded-lg border border-border text-[10px] font-mono text-text-muted break-all">
            VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4">
        {/* Research Lab Card */}
        <Link 
          to="/research" 
          className="col-span-1 md:col-span-2 row-span-1 bento-card group hover:border-accent-primary transition-all overflow-hidden relative flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all rotate-12">
            <Microscope size={120} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest">Elite Feature</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Axiom Research Lab</h3>
            <p className="text-sm text-text-secondary max-w-xs">Analyze complex papers and identify structural fingerprints of mathematical proofs.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-accent-primary">
            <span>Enter Laboratory</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        {/* Main Metric Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2 row-span-2 bento-card relative flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div>
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Mastery Progress</h3>
            <h2 className="text-5xl font-light mt-4">84.2<span className="text-2xl">%</span></h2>
            <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
              <TrendingUp size={16} />
              <span>+12.4% this week</span>
            </p>
          </div>

          <div className="mt-8 flex gap-2 h-24 items-end">
            {[40, 60, 55, 80, 100, 70, 45].map((h, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-md transition-all duration-500 ${i === 4 ? 'bg-accent-primary shadow-glow' : 'bg-elevated'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Secondary Info - Streak */}
        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-between">
          <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Global Rank</h3>
          <p className="text-3xl font-bold mt-4">#1,240</p>
          <div className="mt-4 flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card bg-elevated shadow-sm" />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-accent-secondary/20 flex items-center justify-center text-[10px] font-bold text-accent-secondary">
              +42
            </div>
          </div>
        </div>

        {/* Action Card */}
        <Link 
          to="/solve" 
          className="col-span-1 row-span-1 bg-accent-primary rounded-3xl p-6 text-white flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow"
        >
          <Sigma size={32} />
          <div>
            <h4 className="font-bold text-lg">Solve New</h4>
            <p className="text-white/70 text-xs">Start a new math workflow</p>
          </div>
        </Link>

        {/* Small Info Cards */}
        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-elevated rounded-full mb-2 flex items-center justify-center text-text-muted">
            <Book size={18} />
          </div>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Level</span>
          <span className="font-bold text-lg">12</span>
        </div>

        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-elevated rounded-full mb-2 flex items-center justify-center text-text-muted">
            <Star size={18} />
          </div>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Region</span>
          <span className="font-bold text-lg">US-EAST</span>
        </div>

        {/* Bottom Row - Recent Solves */}
        <div className="col-span-1 md:col-span-4 row-span-1 bento-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Recent Activity</h3>
            <span className="text-accent-primary text-xs font-bold cursor-pointer hover:underline">View All</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-16 bg-elevated rounded-xl animate-pulse" />)
            ) : solves.length === 0 ? (
              <p className="col-span-full text-center py-4 text-text-muted text-sm italic">No recent solves yet.</p>
            ) : (
              solves.slice(0, 4).map(solve => (
                <div key={solve.id} className="p-4 rounded-xl bg-secondary border border-border/50 hover:border-accent-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-accent-primary uppercase truncate max-w-[100px]">{solve.topic}</span>
                    <ArrowRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </div>
                  <p className="text-xs font-medium truncate text-text-primary">{solve.problem_summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
