import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sigma, Sparkles, History, ArrowRight, Share2, Star,
  GraduationCap, Brain, Download, Square, ChevronDown, Lock,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import SolveInput from '../components/SolveInput';
import StepDisplay from '../components/StepDisplay';
import ProfessorChat from '../components/ProfessorChat';
import QuizPortal from '../components/QuizPortal';
import { BlockMath } from 'react-katex';
import { SolveResult } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import {
  AI_MODELS,
  PLAN_RANK,
  callAI,
  parseJSONResponse,
  isQuotaError,
  isAuthError,
  getErrorMessage,
} from '../lib/ai';

// ─── Math prompt builder ──────────────────────────────────────────────────────
function buildMathPrompt(problem: string): string {
  return `Solve the following mathematics problem completely and accurately.

Problem: ${problem}

Remember:
- Return ONLY valid JSON matching the exact schema in your system prompt.
- No markdown, no backticks, no extra commentary outside the JSON.
- Show every algebraic/calculus/arithmetic step.
- Decimals must be precise to 4+ decimal places.
- Use proper escaped LaTeX for all expressions.`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Solve() {
  const { user, userPlan } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('deepseek-r1');

  const abortRef = useRef<boolean>(false);

  const currentPlan: string = userPlan?.plan || 'free';
  const currentPlanRank = PLAN_RANK[currentPlan] ?? 0;
  const selectedModel = AI_MODELS.find((m) => m.id === selectedModelId) || AI_MODELS[0];

  const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');
  const limit: number = userPlan?.solveLimit ?? 5;
  const isUnlimited = limit === -1;
  const planName = userPlan?.plan
    ? userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)
    : 'Free';

  // ─── Solve handler ────────────────────────────────────────────────────────
  const handleSolve = async (problem: string, _image?: File) => {
    if (limit !== -1 && solveCount >= limit) {
      setShowLimitModal(true);
      return;
    }

    if (!problem.trim()) {
      toast.error('Please enter a math problem.');
      return;
    }

    setIsLoading(true);
    abortRef.current = false;
    setResult(null);
    setShowChat(false);
    setShowQuiz(false);

    try {
      const prompt = buildMathPrompt(problem);
      if (abortRef.current) return;

      const rawText = await callAI(selectedModel.id, prompt);

      if (abortRef.current) {
        toast.info('Generation stopped.');
        return;
      }

      if (!rawText) throw new Error('The AI returned an empty response. Please try again.');

      const data: SolveResult = parseJSONResponse(rawText);
      setResult(data);
      localStorage.setItem('axiom_solves_count', String(solveCount + 1));

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#818CF8', '#ffffff'],
      });

      if (user) {
        addDoc(collection(db, 'solves'), {
          ...data,
          userId: user.uid,
          aiModel: selectedModel.name,
          aiProvider: selectedModel.provider,
          createdAt: serverTimestamp(),
          isPublic: false,
          isStarred: false,
        }).catch((err) => console.error('[AxiomAI] Failed to save solve:', err));
      }

      toast.success(`Solved with ${selectedModel.name}!`);
    } catch (error: any) {
      if (abortRef.current) return;
      console.error('[AxiomAI] Solve error:', error);

      if (isQuotaError(error)) {
        toast.error(`${selectedModel.name} is at capacity. Try a different AI model.`);
      } else if (isAuthError(error)) {
        toast.error(
          `${selectedModel.name} API key is missing or invalid. ` +
          'Add it in Netlify → Project configuration → Environment variables.'
        );
      } else {
        toast.error(getErrorMessage(error, selectedModel.name));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsLoading(false);
    toast.info('Generation stopped.');
  };

  const handleExport = () => {
    if (!result) return;
    const content = [
      'AXIOM AI — Math Solution',
      '════════════════════════',
      `Topic:      ${result.topic} › ${result.subtopic}`,
      `Difficulty: ${result.difficulty}`,
      `AI Model:   ${selectedModel.name} (${selectedModel.provider})`,
      '',
      'FINAL ANSWER',
      '────────────',
      result.final_answer,
      '',
      'SUMMARY',
      '────────',
      result.problem_summary,
      '',
      'STEP-BY-STEP SOLUTION',
      '──────────────────────',
      ...result.steps.map(
        (s) => `Step ${s.step_number}: ${s.title}\n${s.plain_english}\nFormula: ${s.latex}\n`
      ),
      '',
      'Generated by AxiomAI · www.axiomai.website',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom-${result.topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Solution exported!');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">

      {/* ── Limit Modal ── */}
      <AnimatePresence>
        {showLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sigma className="text-accent-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {userPlan?.isPro ? 'Monthly Limit Reached' : 'Free Limit Reached'}
              </h2>
              <p className="text-text-secondary mb-8">
                {userPlan?.isPro
                  ? `You've used all ${limit} solves on your ${planName} plan this month.`
                  : `You've used all 5 free solves. Upgrade to Axiom Plus for 100 solves/month, or Pro for unlimited access.`}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/pricing"
                  onClick={() => setShowLimitModal(false)}
                  className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all shadow-glow"
                >
                  View Plans & Upgrade
                </Link>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-elevated transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            {/* Header */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mb-6 shadow-glow">
              <Sigma className="text-white" size={36} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
              What are we solving today?
            </h1>
            <p className="text-text-secondary text-center mb-4 max-w-lg">
              Upload a photo or type your problem. AxiomAI provides accurate, step-by-step solutions for any math topic.
            </p>

            {/* Study Session CTA (Pro+) */}
            {(currentPlan === 'pro' || currentPlan === 'research' || currentPlan === 'elite') && (
              <Link
                to="/study"
                className="mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl bg-accent-primary/8 border border-accent-primary/20 hover:bg-accent-primary/12 transition-all"
              >
                <span className="text-lg">📚</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-accent-primary">Start a Focus Session</p>
                  <p className="text-[11px] text-text-muted">Study with a timer, ambience & subject tracking</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-text-muted" />
              </Link>
            )}

            {/* Solve counter badge */}
            <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold">
              <div className={`w-2 h-2 rounded-full ${isUnlimited || solveCount < limit ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {isUnlimited
                ? <span className="text-text-muted">Unlimited solves · <span className="text-accent-primary">{planName} plan</span></span>
                : <span className="text-text-muted">{solveCount}/{limit} solves used · <Link to="/pricing" className="text-accent-primary hover:underline">Upgrade</Link></span>
              }
            </div>

            {/* ── AI Model Dropdown ── */}
            <div className="relative mb-6 w-full max-w-lg">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                AI Model
              </label>
              <button
                onClick={() => setShowModelDropdown((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-accent-primary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${selectedModel.color}`}>
                    {selectedModel.name}
                  </span>
                  <span className="text-xs text-text-muted">{selectedModel.desc}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-text-muted transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl overflow-hidden z-30 shadow-2xl"
                  >
                    {AI_MODELS.map((model) => {
                      const locked = PLAN_RANK[model.minPlan] > currentPlanRank;
                      const isSelected = selectedModelId === model.id;
                      return (
                        <button
                          key={model.id}
                          disabled={locked}
                          onClick={() => {
                            if (!locked) {
                              setSelectedModelId(model.id);
                              setShowModelDropdown(false);
                            }
                          }}
                          className={[
                            'w-full flex items-center justify-between px-4 py-3 transition-all text-left',
                            isSelected ? 'bg-accent-primary/10' : '',
                            locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-elevated cursor-pointer',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${model.color}`}>{model.name}</span>
                            <span className="text-xs text-text-muted">{model.desc}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {locked ? (
                              <>
                                <Lock size={12} className="text-text-muted" />
                                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                  {model.badge}
                                </span>
                              </>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                model.badge === 'FREE'
                                  ? 'text-emerald-400 bg-emerald-400/10'
                                  : 'text-yellow-400 bg-yellow-400/10'
                              }`}>
                                {isSelected ? '✓ ' : ''}{model.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <div className="px-4 py-2 border-t border-border bg-elevated/50">
                      <Link
                        to="/pricing"
                        onClick={() => setShowModelDropdown(false)}
                        className="text-xs text-accent-primary hover:underline"
                      >
                        Unlock all 5 AI models → View plans
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Problem Input */}
            <SolveInput id="solve-input" onSolve={handleSolve} isLoading={isLoading} />

            {/* Stop button */}
            {isLoading && (
              <button
                onClick={handleStop}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
              >
                <Square size={16} />
                Stop Generation
              </button>
            )}

            {/* Feature cards */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              {[
                { icon: <Sparkles className="text-accent-primary" />, title: 'Smart Steps', desc: 'Clear, logical breakdowns of every problem.' },
                { icon: <History className="text-accent-secondary" />, title: 'Auto-History', desc: 'Never lose a solution again with cloud sync.' },
                { icon: <Sigma className="text-warning" />, title: 'Any Topic', desc: 'From basics to advanced university research.' },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Result Screen ── */
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
            >
              <div className="rotate-180"><ArrowRight size={18} /></div>
              <span className="text-xs font-bold uppercase tracking-widest">Solve another</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ── Left: Solution card ── */}
              <div className="md:col-span-2 bento-card border-accent-primary/20 bg-gradient-to-br from-card to-secondary">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-md bg-accent-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-glow">
                      {result.topic}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-elevated text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      {result.difficulty}
                    </span>
                    <span className={`px-3 py-1 rounded-md bg-elevated text-[10px] font-bold uppercase tracking-wider ${selectedModel.color}`}>
                      {selectedModel.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1 p-2 rounded-lg hover:bg-elevated text-text-muted hover:text-accent-primary transition-all text-xs font-bold"
                      title="Export Solution"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-elevated text-text-muted transition-all">
                      <Share2 size={16} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-elevated text-text-muted transition-all">
                      <Star size={16} />
                    </button>
                  </div>
                </div>

                {/* Final answer */}
                <div className="mb-10 text-center">
                  <p className="text-[10px] text-text-muted mb-4 font-bold uppercase tracking-[0.2em]">Final Answer</p>
                  <div className="text-4xl font-bold text-white overflow-x-auto py-4">
                    <BlockMath math={result.final_answer_latex} />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted border-b border-border pb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-accent-primary" />
                    <span>Analytical Breakdown</span>
                  </h2>
                  <StepDisplay steps={result.steps} />
                </div>
              </div>

              {/* ── Right: Sidebar ── */}
              <div className="space-y-6">
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full bento-card bg-accent-primary/5 border-accent-primary/20 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-primary text-white flex items-center justify-center shadow-glow">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Ask AI Professor</h3>
                    <p className="text-xs text-text-secondary">Talk to our tutor about this problem</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowQuiz(true)}
                  className="w-full bento-card bg-accent-secondary/5 border-accent-secondary/20 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary text-white flex items-center justify-center shadow-glow">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Instant Challenge</h3>
                    <p className="text-xs text-text-secondary">Test your knowledge on this topic</p>
                  </div>
                </button>

                <div className="bento-card">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Mastery Insight</h3>
                  <p className="text-sm text-text-secondary leading-relaxed italic">"{result.problem_summary}"</p>
                  <div className="mt-6 space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Subtopic</span>
                      <span className="font-bold">{result.subtopic}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Complexity</span>
                      <span className="font-bold">{result.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">AI Model</span>
                      <span className={`font-bold ${selectedModel.color}`}>{selectedModel.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Confidence</span>
                      <span className="font-bold text-emerald-400">Verified ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showChat && result && (
          <ProfessorChat solveContext={result} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQuiz && result && (
          <QuizPortal topic={result.topic} onClose={() => setShowQuiz(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
