import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, BookOpen, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', icon: '∑' },
  { id: 'physics', label: 'Physics', icon: '⚛' },
  { id: 'biology', label: 'Biology', icon: '🧬' },
  { id: 'chemistry', label: 'Chemistry', icon: '⚗' },
  { id: 'cs', label: 'Computer Science', icon: '💻' },
  { id: 'other', label: 'Other', icon: '📖' },
];

const DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

const AMBIENCE = [
  { id: 'rain', label: 'Rain', icon: '🌧' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'night', label: 'Night', icon: '🌙' },
  { id: 'fire', label: 'Fireplace', icon: '🔥' },
];

type Phase = 'setup' | 'active' | 'complete';

export default function Study() {
  const { userPlan } = useAuth();
  const canAccess = userPlan?.plan === 'pro' || userPlan?.plan === 'elite';

  const [phase, setPhase] = useState<Phase>('setup');
  const [subject, setSubject] = useState('math');
  const [duration, setDuration] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [ambience, setAmbience] = useState('rain');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(() =>
    parseInt(localStorage.getItem('axiom_study_sessions_today') || '0')
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = (showCustom ? parseInt(customMinutes) || 25 : duration) * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startSession = () => {
    const mins = showCustom ? parseInt(customMinutes) || 25 : duration;
    setSecondsLeft(mins * 60);
    setPhase('active');
    setPaused(false);
  };

  useEffect(() => {
    if (phase !== 'active' || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('complete');
          const newCount = sessionsToday + 1;
          setSessionsToday(newCount);
          localStorage.setItem('axiom_study_sessions_today', String(newCount));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase, paused]);

  // ── LOCKED: not pro/elite ──
  if (!canAccess) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-accent-primary" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-widest mb-5">
            <Crown size={12} /> Pro & Elite Feature
          </div>
          <h1 className="text-3xl font-bold mb-3">Study Sessions</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Focus sessions with timers, ambience, and subject tracking are available on Axiom Pro and Research Elite plans.
          </p>
          <Link
            to="/pricing"
            className="inline-block px-8 py-4 rounded-2xl bg-accent-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow"
          >
            Upgrade to Pro
          </Link>
          <div className="mt-4">
            <Link to="/solve" className="text-text-muted text-sm hover:text-white transition-colors">
              ← Back to Solve
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-widest mb-5">
                <BookOpen size={12} /> Focus Session
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Ready to focus?</h1>
              <p className="text-text-secondary">Pick your subject, set your time, and enter the zone.</p>
              {sessionsToday > 0 && (
                <p className="mt-3 text-xs text-emerald-400 font-bold">
                  ✓ {sessionsToday} session{sessionsToday > 1 ? 's' : ''} completed today
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="bento-card mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">What are you studying?</h3>
              <div className="grid grid-cols-3 gap-3">
                {SUBJECTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSubject(s.id)}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      subject === s.id
                        ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                        : 'bg-secondary border-border text-text-muted hover:border-accent-primary/30'
                    }`}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-[11px] font-bold">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bento-card mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">How long?</h3>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { setDuration(d.value); setShowCustom(false); }}
                    className={`flex-1 min-w-[70px] py-3 rounded-xl border text-sm font-bold transition-all ${
                      duration === d.value && !showCustom
                        ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                        : 'bg-secondary border-border text-text-muted hover:border-accent-primary/30'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(true)}
                  className={`flex-1 min-w-[70px] py-3 rounded-xl border text-sm font-bold transition-all ${
                    showCustom
                      ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                      : 'bg-secondary border-border text-text-muted hover:border-accent-primary/30'
                  }`}
                >
                  Custom
                </button>
              </div>
              {showCustom && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    placeholder="Enter minutes"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-accent-primary"
                  />
                  <span className="text-text-muted text-sm">min</span>
                </div>
              )}
            </div>

            {/* Ambience */}
            <div className="bento-card mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Ambience</h3>
              <div className="grid grid-cols-4 gap-3">
                {AMBIENCE.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAmbience(a.id)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      ambience === a.id
                        ? 'bg-accent-primary/10 border-accent-primary/40'
                        : 'bg-secondary border-border hover:border-accent-primary/30'
                    }`}
                  >
                    <div className="text-xl mb-1">{a.icon}</div>
                    <div className="text-[10px] text-text-muted font-bold">{a.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startSession}
              className="w-full py-5 rounded-2xl bg-accent-primary text-white font-bold text-base hover:opacity-90 transition-all shadow-glow flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Start Focus Session
            </button>
          </motion.div>
        )}

        {/* ── ACTIVE ── */}
        {phase === 'active' && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
            <div className="text-center mb-10">
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">
                {SUBJECTS.find(s => s.id === subject)?.icon} {SUBJECTS.find(s => s.id === subject)?.label} · {AMBIENCE.find(a => a.id === ambience)?.icon} {AMBIENCE.find(a => a.id === ambience)?.label}
              </p>
              <h2 className="text-2xl font-bold">Stay focused. You've got this.</h2>
            </div>

            {/* Airplane window visual */}
            <div className="w-full rounded-3xl overflow-hidden mb-8 relative" style={{ height: '220px', background: 'linear-gradient(180deg, #0a0520 0%, #1a0a5e 50%, #6d28d9 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Stars */}
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white opacity-40" style={{
                    width: Math.random() * 2 + 1 + 'px',
                    height: Math.random() * 2 + 1 + 'px',
                    top: Math.random() * 60 + '%',
                    left: Math.random() * 100 + '%',
                  }} />
                ))}
                {/* Clouds */}
                <div className="absolute bottom-12 left-0 right-0 flex justify-around px-4">
                  {[60, 90, 50, 75, 40].map((w, i) => (
                    <div key={i} className="rounded-full" style={{
                      width: w + 'px',
                      height: '18px',
                      background: 'rgba(255,255,255,0.07)',
                      marginTop: i % 2 === 0 ? '0' : '10px',
                    }} />
                  ))}
                </div>
              </div>
              {/* Window frame overlay */}
              <div className="absolute inset-3 rounded-2xl border border-white/8 grid grid-cols-2 grid-rows-2 gap-0">
                <div className="border-r border-b border-white/5" />
                <div className="border-b border-white/5" />
                <div className="border-r border-white/5" />
                <div />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-white/25 text-xs font-bold tracking-widest uppercase">
                ✈ Focus flight in progress
              </div>
            </div>

            {/* Timer — bottom of page via fixed bar, also shown here in content */}
            <div className="text-center mb-6">
              <div className="text-7xl font-mono font-bold tracking-tight mb-2" style={{ color: paused ? '#888' : 'white' }}>
                {formatTime(secondsLeft)}
              </div>
              <p className="text-text-muted text-sm">{paused ? 'Paused' : 'remaining'}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-secondary rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-accent-primary rounded-full"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all"
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => { setPhase('setup'); clearInterval(intervalRef.current!); }}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-elevated transition-all"
              >
                <RotateCcw size={16} />
                End
              </button>
            </div>
          </motion.div>
        )}

        {/* ── COMPLETE ── */}
        {phase === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center pt-20">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-3">Session complete!</h1>
            <p className="text-text-secondary mb-2">
              Great work studying {SUBJECTS.find(s => s.id === subject)?.label}.
            </p>
            <p className="text-emerald-400 text-sm font-bold mb-10">
              {sessionsToday} session{sessionsToday > 1 ? 's' : ''} completed today 🔥
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setPhase('setup')}
                className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all"
              >
                Start Another Session
              </button>
              <Link
                to="/solve"
                className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-elevated transition-all text-center"
              >
                Go Solve a Problem
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FIXED TIMER BAR (bottom) — only during active session ── */}
      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
          >
            <div className="max-w-2xl mx-auto bento-card border-accent-primary/20 flex items-center justify-between gap-4 py-4 px-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  {SUBJECTS.find(s => s.id === subject)?.label}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: paused ? '#888' : 'white' }}>
                {formatTime(secondsLeft)}
              </div>
              <button
                onClick={() => setPaused(p => !p)}
                className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-all"
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
