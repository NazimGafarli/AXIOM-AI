import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, BookOpen, Lock, Crown, Sigma } from 'lucide-react';
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
  { id: 'rain', label: 'Rain', icon: '🌧', desc: 'Gentle rainfall' },
  { id: 'cafe', label: 'Café', icon: '☕', desc: 'Soft chatter' },
  { id: 'night', label: 'Night', icon: '🌙', desc: 'Silent focus' },
  { id: 'fire', label: 'Fireplace', icon: '🔥', desc: 'Warm crackle' },
];

// Fixed star positions — no Math.random() to avoid React issues
const STARS = [
  { top: '8%', left: '12%', size: 1.5 }, { top: '15%', left: '34%', size: 1 },
  { top: '6%', left: '55%', size: 2 },   { top: '20%', left: '72%', size: 1 },
  { top: '11%', left: '88%', size: 1.5 }, { top: '30%', left: '5%', size: 1 },
  { top: '25%', left: '48%', size: 1 },  { top: '18%', left: '91%', size: 2 },
  { top: '35%', left: '22%', size: 1 },  { top: '28%', left: '67%', size: 1.5 },
  { top: '42%', left: '38%', size: 1 },  { top: '38%', left: '80%', size: 1 },
  { top: '5%', left: '78%', size: 1 },   { top: '22%', left: '15%', size: 2 },
  { top: '45%', left: '58%', size: 1.5 },
];

const CLOUDS = [
  { width: 70, left: '4%', bottom: '28%', opacity: 0.07 },
  { width: 100, left: '18%', bottom: '18%', opacity: 0.09 },
  { width: 55, left: '38%', bottom: '32%', opacity: 0.06 },
  { width: 85, left: '55%', bottom: '22%', opacity: 0.08 },
  { width: 60, left: '76%', bottom: '30%', opacity: 0.07 },
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

  const activeMins = showCustom ? parseInt(customMinutes) || 25 : duration;
  const totalSeconds = activeMins * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startSession = () => {
    setSecondsLeft(activeMins * 60);
    setPhase('active');
    setPaused(false);
  };

  const endSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('setup');
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

  const currentSubject = SUBJECTS.find(s => s.id === subject)!;
  const currentAmbience = AMBIENCE.find(a => a.id === ambience)!;

  // ── LOCKED ──
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
            Focus sessions with timers, ambience sounds, and subject tracking are available on Axiom Pro and Research Elite plans.
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
                    <div className="text-[9px] text-text-muted opacity-60 mt-0.5">{a.desc}</div>
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

            <div className="text-center mb-8">
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">
                {currentSubject.icon} {currentSubject.label} · {currentAmbience.icon} {currentAmbience.label}
              </p>
              <h2 className="text-2xl font-bold">Stay focused. You've got this.</h2>
            </div>

            {/* Airplane window */}
            <div
              className="w-full rounded-3xl overflow-hidden mb-8 relative"
              style={{ height: '220px', background: 'linear-gradient(180deg, #05010f 0%, #0f0535 40%, #2d1060 75%, #6d28d9 100%)' }}
            >
              {/* Stars — fixed positions */}
              {STARS.map((star, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{ top: star.top, left: star.left, width: star.size + 'px', height: star.size + 'px', opacity: 0.5 }}
                />
              ))}

              {/* Clouds */}
              {CLOUDS.map((cloud, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: cloud.width + 'px',
                    height: '20px',
                    left: cloud.left,
                    bottom: cloud.bottom,
                    background: `rgba(255,255,255,${cloud.opacity})`,
                  }}
                />
              ))}

              {/* Window grid overlay */}
              <div className="absolute inset-3 rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                  <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }} />
                  <div />
                </div>
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                ✈ Focus flight in progress
              </div>
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <div
                className="text-7xl font-mono font-bold tracking-tight mb-2 transition-colors"
                style={{ color: paused ? 'rgba(255,255,255,0.3)' : 'white' }}
              >
                {formatTime(secondsLeft)}
              </div>
              <p className="text-text-muted text-sm">{paused ? 'Paused — press resume to continue' : 'remaining'}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-secondary rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-accent-primary rounded-full"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-4 mb-10">
              <button
                onClick={() => setPaused(p => !p)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all shadow-glow"
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={endSession}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-elevated transition-all"
              >
                <RotateCcw size={16} />
                End
              </button>
            </div>

            {/* Solve prompt */}
            <Link
              to="/solve"
              className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-border bg-secondary hover:border-accent-primary/30 transition-all w-full"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <Sigma size={18} className="text-accent-primary" />
              </div>
              <div>
                <div className="text-sm font-bold">Stuck on a problem?</div>
                <div className="text-xs text-text-muted">Open AxiomAI Solve — your timer keeps running</div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── COMPLETE ── */}
        {phase === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center pt-20">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-3">Session complete!</h1>
            <p className="text-text-secondary mb-2">
              Great work studying {currentSubject.label}.
            </p>
            <p className="text-emerald-400 text-sm font-bold mb-10">
              {sessionsToday} session{sessionsToday > 1 ? 's' : ''} completed today 🔥
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setPhase('setup')}
                className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all shadow-glow"
              >
                Start Another Session
              </button>
              <Link
                to="/solve"
                className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-elevated transition-all text-center"
              >
                Go Solve a Problem →
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── FIXED TIMER BAR (bottom) ── */}
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
                  {currentSubject.label}
                </span>
              </div>
              <div
                className="text-2xl font-mono font-bold transition-colors"
                style={{ color: paused ? 'rgba(255,255,255,0.3)' : 'white' }}
              >
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
