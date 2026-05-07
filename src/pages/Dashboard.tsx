import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, orderBy, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { SolveResult } from '../types';
import { Sigma, History, Star, TrendingUp, Book, Microscope, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user } = useAuth();
  const [solves, setSolves] = useState<SolveResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');

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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'solves', id));
      setSolves(prev => prev.filter(s => s.id !== id));
      toast.success('Solve deleted.');
    } catch (error) {
      toast.error('Failed to delete. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

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

      {/* Usage Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="col-span-1 md:col-span-2 bento-card border-accent-primary/20 bg-accent-primary/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-accent-primary">Usage Tracking</h3>
            <Link to="/pricing" className="text-[10px] font-bold text-accent-primary hover:underline">Upgrade Plan</Link>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Monthly Solves</span>
                <span className={`font-bold ${solveCount >= 5 ? 'text-red-400' : 'text-text-muted'}`}>
                  {solveCount}/5
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${solveCount >= 5 ? 'bg-red-500' : 'bg-accent-primary shadow-glow'}`}
                  style={{ width: `${Math.min((solveCount / 5) * 100, 100)}%` }}
                />
              </div>
              {solveCount >= 5 && (
                <p className="text-xs text-red-400 mt-2 font-medium">
                  Limit reached. <Link to="/pricing" className="underline">Upgrade to continue solving.</Link>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bento-card flex flex-col justify-between bg-accent-primary/5 border-accent-primary/20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-accent-primary">Quick Actions</h3>
          <div className="space-y-3 mt-4">
            <Link to="/pricing" className="block w-full py-2 px-4 rounded-xl bg-accent-primary text-white text-xs font-bold text-center hover:opacity-90 transition-all">
              Upgrade Plan
            </Link>
            <Link to="/settings" className="block w-full py-2 px-4 rounded-xl bg-elevated border border-border text-xs font-bold text-center hover:bg-secondary transition-all">
              Account Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4">
        <Link to="/research" className="col-span-1 md:col-span-2 row-span-1 bento-card group hover:border-accent-primary transition-all overflow-hidden relative flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all rotate-12">
            <Microscope size={120} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-widest">Elite Feature</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Axiom Research Lab</h3>
            <p className="text-sm text-text-secondary max-w-xs">Analyze complex papers and identify structural fingerprints.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-accent-primary">
            <span>Enter Laboratory</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2 row-span-2 bento-card relative flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div>
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Mastery Progress</h3>
            <h2 className="text-5xl font-light mt-4">{Math.min(solveCount * 20, 100)}<span className="text-2xl">%</span></h2>
            <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
              <TrendingUp size={16} />
              <span>{solveCount} problems solved</span>
            </p>
          </div>
          <div className="mt-8 flex gap-2 h-24 items-end">
            {[40, 60, 55, 80, 100, 70, 45].map((h, i) => (
              <div key={i} className={`flex-1 rounded-t-md transition-all duration-500 ${i === 4 ? 'bg-accent-primary shadow-glow' : 'bg-elevated'}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </motion.div>

        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-between">
          <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Total Solves</h3>
          <p className="text-3xl font-bold mt-4">{solveCount}</p>
        </div>

        <Link to="/solve" className="col-span-1 row-span-1 bg-accent-primary rounded-3xl p-6 text-white flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow">
          <Sigma size={32} />
          <div>
            <h4 className="font-bold text-lg">Solve New</h4>
            <p className="text-white/70 text-xs">Start a new math workflow</p>
          </div>
        </Link>

        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-elevated rounded-full mb-2 flex items-center justify-center text-text-muted">
            <Book size={18} />
          </div>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Level</span>
          <span className="font-bold text-lg">{Math.floor(solveCount / 3) + 1}</span>
        </div>

        <div className="col-span-1 row-span-1 bento-card flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 bg-elevated rounded-full mb-2 flex items-center justify-center text-text-muted">
            <Star size={18} />
          </div>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Streak</span>
          <span className="font-bold text-lg">{solveCount > 0 ? '🔥' : '—'}</span>
        </div>

        {/* Recent Solves with Delete */}
        <div className="col-span-1 md:col-span-4 row-span-1 bento-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Recent Activity</h3>
            <Link to="/solve" className="text-accent-primary text-xs font-bold hover:underline">+ New Solve</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-16 bg-elevated rounded-xl animate-pulse" />)
            ) : solves.length === 0 ? (
              <p className="col-span-full text-center py-4 text-text-muted text-sm italic">No recent solves yet. <Link to="/solve" className="text-accent-primary hover:underline">Solve your first problem!</Link></p>
            ) : (
              solves.slice(0, 4).map(solve => (
                <div key={solve.id} className="p-4 rounded-xl bg-secondary border border-border/50 hover:border-accent-primary/50 transition-all group relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-accent-primary uppercase truncate max-w-[100px]">{solve.topic}</span>
                    <button
                      onClick={() => solve.id && handleDelete(solve.id)}
                      disabled={deletingId === solve.id}
                      className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-red-500/10 text-red-400"
                    >
                      {deletingId === solve.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
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
