import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sigma, ArrowRight, Zap, Target, BookOpen, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-secondary border border-border"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
            </span>
            <span className="text-sm font-bold tracking-wider text-accent-primary uppercase">Alpha Version 2.0 Now Live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
          >
            The AI That Solves <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Any Math Problem
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            AxiomAI combines cutting-edge vision AI with deep mathematical knowledge to help you master any subject. Get step-by-step answers in seconds.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/solve"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-accent-primary text-white text-lg font-bold flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all hover:-translate-y-1"
            >
              <span>Solve a Problem</span>
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/dashboard"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-secondary border border-border text-lg font-bold hover:bg-elevated transition-all"
            >
              My Analysis
            </Link>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-text-muted"
          >
            15-Day No-Questions-Asked Return Policy
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap size={24} />, title: "Instant Solving", desc: "No more waiting. Get detailed mathematical breakdowns in under 5 seconds." },
              { icon: <Target size={24} />, title: "High Accuracy", desc: "Powered by Gemini 1.5 Flash for the most reliable mathematical reasoning." },
              { icon: <BookOpen size={24} />, title: "Deep Learning", desc: "We don't just give you the answer; we explain the 'why' behind every step." },
              { icon: <Shield size={24} />, title: "Privacy First", desc: "Your solve history is encrypted and private. You control what you share." },
              { icon: <Sigma size={24} />, title: "KaTeX Powered", desc: "Crystal clear mathematical rendering for professional-grade readability." },
              { icon: <ArrowRight size={24} />, title: "More Coming", desc: "Interactive graphs, AI tutor chat, and collaborative notebooks are on the way." }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bento-card hover:border-accent-primary group"
              >
                <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center mb-6 text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Sigma className="text-accent-primary" size={24} />
              <span className="font-bold uppercase tracking-widest">AxiomAI</span>
            </div>
            <p className="text-xs text-text-muted font-medium bg-elevated px-3 py-1 rounded-full">Developed by the Axiom Engineering Team</p>
          </div>
          <p className="text-sm text-text-muted">© 2026 AxiomAI. Built for students who demand excellence.</p>
          <div className="flex gap-6 text-sm font-medium text-text-secondary">
            <Link to="/policy" className="hover:text-accent-primary">15-Day Return Policy</Link>
            <Link to="/team" className="hover:text-accent-primary">Who Made It?</Link>
            <Link to="#" className="hover:text-accent-primary">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
