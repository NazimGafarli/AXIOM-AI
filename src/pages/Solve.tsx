import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sigma, Sparkles, History, ArrowRight, Share2, Star, GraduationCap, Brain, Download, Square, ChevronDown, Lock, Cpu } from 'lucide-react';
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
import { parseJSONResponse, isQuotaError } from '../lib/gemini';
import { Link } from 'react-router-dom';
import Groq from 'groq-sdk';
 
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});
 
// ── AI MODEL DEFINITIONS ──────────────────────────────────────────────────────
// All models verified live on Groq as of May 2026
const AI_MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    badge: 'Best for Math',
    description: 'Fast & reliable. Great for algebra, geometry, and word problems.',
    badgeColor: 'bg-emerald-500',
    minPlan: 'free',
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen3 32B',
    badge: 'Chain-of-Thought',
    description: 'Deep reasoning chains. Excellent for multi-step algebra & calculus.',
    badgeColor: 'bg-blue-500',
    minPlan: 'free',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    badge: 'Versatile',
    description: 'OpenAI open-weight model. Fast and accurate for most math problems.',
    badgeColor: 'bg-purple-500',
    minPlan: 'pro',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    badge: 'Elite Only',
    description: 'OpenAI flagship open-weight model. Research-level proofs and graduate math.',
    badgeColor: 'bg-amber-500',
    minPlan: 'elite',
  },
] as const;
 
type ModelId = typeof AI_MODELS[number]['id'];
 
const PLAN_MODEL_COUNT: Record<string, number> = {
  free: 2,
  plus: 2,
  pro: 3,
  elite: 4,
};
 
// ── MATH SYSTEM PROMPT ────────────────────────────────────────────────────────
const buildMathPrompt = (problem: string): string => `You are AxiomAI, the world's most precise mathematical problem-solving AI. You MUST solve every problem with 100% numerical accuracy. Never approximate unless explicitly asked.
 
CRITICAL ACCURACY RULES:
- For word problems: extract ALL numerical values carefully before computing. Re-read the problem after extraction to verify you haven't missed any constraint.
- For arithmetic/algebra: compute EXACT values. If the answer is a fraction, keep it as a fraction (e.g. 7/3 not 2.333...). If decimal is required, give full precision (e.g. 2.333... → 7/3 ≈ 2.3333).
- For equations/parabolas: show vertex form, standard form, roots, and axis of symmetry where applicable.
- For geometry: include units in every step and the final answer.
- NEVER skip steps. Each step must follow logically from the previous one with the formula shown.
- Double-check your final answer by substituting back into the original equation/problem before responding.
 
RESPONSE FORMAT — respond ONLY with valid JSON. No markdown, no code blocks, no text outside the JSON.
 
Problem to solve: ${problem || 'Solve the math problem in the image'}
 
Return this EXACT JSON structure:
{
  "topic": "string (e.g. Quadratic Equations, Word Problems, Calculus)",
  "subtopic": "string (e.g. Parabolas, Rate Problems, Integration)",
  "difficulty": "Elementary" | "Medium" | "Hard" | "Expert",
  "final_answer": "string (human-readable, e.g. x = 3 or Area = 24 cm²)",
  "final_answer_latex": "string (valid LaTeX, e.g. x = 3 or A = 24\\\\text{ cm}^2)",
  "problem_summary": "string (1-2 sentence explanation of what this problem teaches)",
  "steps": [
    {
      "step_number": 1,
      "title": "string (short step name)",
      "latex": "string (the formula/calculation in LaTeX with escaped backslashes)",
      "plain_english": "string (clear explanation a student can follow)"
    }
  ],
  "has_graph": false,
  "graph_function": ""
}`;
 
export default function Solve() {
  const { user, userPlan } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  // ✅ Default model updated to llama-3.3-70b-versatile (verified live)
  const [selectedModelId, setSelectedModelId] = useState<ModelId>('llama-3.3-70b-versatile');
  const [activeModelUsed, setActiveModelUsed] = useState<string>('');
  const abortRef = useRef<boolean>(false);
 
  const plan = userPlan?.plan ?? 'free';
  const unlockedCount = PLAN_MODEL_COUNT[plan] ?? 2;
 
  const isModelUnlocked = (model: typeof AI_MODELS[number]) => {
    const planOrder = ['free', 'plus', 'pro', 'elite'];
    return planOrder.indexOf(plan) >= planOrder.indexOf(model.minPlan);
  };
 
  const selectedModel = AI_MODELS.find(m => m.id === selectedModelId) ?? AI_MODELS[0];
 
  const handleSolve = async (problem: string, image?: File) => {
    const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');
    const limit = userPlan?.solveLimit ?? 5;
    if (limit !== -1 && solveCount >= limit) {
      setShowLimitModal(true);
      return;
    }
 
    setIsLoading(true);
    abortRef.current = false;
    setResult(null);
    setShowChat(false);
    setShowQuiz(false);
    setActiveModelUsed(selectedModel.name);
 
    try {
      const prompt = buildMathPrompt(problem);
 
      if (abortRef.current) return;
 
      const response = await groq.chat.completions.create({
        model: selectedModelId,
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class math solver. Always respond with ONLY a valid JSON object — no markdown, no code fences, no preamble. Your numerical answers must be 100% correct. Double-check every calculation before responding.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });
 
      if (abortRef.current) {
        toast.info('Generation stopped.');
        return;
      }
 
      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('The AI returned an empty response.');
 
      const data: SolveResult = parseJSONResponse(text);
      setResult(data);
 
      localStorage.setItem('axiom_solves_count', (solveCount + 1).toString());
 
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
          modelUsed: selectedModelId,
          createdAt: serverTimestamp(),
          isPublic: false,
          isStarred: false,
        }).catch(err => console.error('Failed to save solve:', err));
      }
 
      toast.success(`Solved with ${selectedModel.name}!`);
    } catch (error: any) {
      if (abortRef.current) return;
      console.error('Math Solve Error:', error);
 
      const isModelError =
        error?.status === 404 ||
        (error?.message || '').toLowerCase().includes('model') ||
        (error?.message || '').toLowerCase().includes('not found');
 
      toast.error(
        isQuotaError(error)
          ? 'AI service is at capacity. Try switching to a different model.'
          : isModelError
          ? `Model unavailable. Try switching AI model.`
          : error.message || 'An error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleStop = () => {
    abortRef.current = true;
    setIsLoading(false);
    toast.info('Generation stopped.');
  };
 
  const handleExportPDF = () => {
    if (!result) return;
    const content = `
AXIOM AI - Math Solution
========================
Topic: ${result.topic} | ${result.subtopic}
Difficulty: ${result.difficulty}
Model: ${activeModelUsed}
 
FINAL ANSWER:
${result.final_answer}
 
PROBLEM SUMMARY:
${result.problem_summary}
 
STEP-BY-STEP SOLUTION:
${result.steps.map(s => `
Step ${s.step_number}: ${s.title}
${s.plain_english}
Formula: ${s.latex}
`).join('\n')}
 
Generated by AxiomAI - axiom-math-ai.netlify.app
    `.trim();
 
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom-solution-${result.topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Solution exported!');
  };
 
  const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');
  const limit = userPlan?.solveLimit ?? 5;
  const isUnlimited = limit === -1;
  const planName = userPlan?.plan
    ? userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)
    : 'Free';
 
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
 
      {/* Limit Modal */}
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
                  : `You've used all 5 free solves. Upgrade to Axiom Plus for 100 solves/month or Pro for unlimited access.`
                }
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
 
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mb-6 shadow-glow">
              <Sigma className="text-white" size={36} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
              What are we solving today?
            </h1>
            <p className="text-text-secondary text-center mb-4 max-w-lg">
              Upload a photo or type your problem. AxiomAI provides step-by-step solutions for any math topic.
            </p>
 
            {(userPlan?.plan === 'pro' || userPlan?.plan === 'elite') && (
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
 
            <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold">
              <div className={`w-2 h-2 rounded-full ${isUnlimited || solveCount < limit ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {isUnlimited
                ? <span className="text-text-muted">Unlimited solves · <span className="text-accent-primary">{planName} plan</span></span>
                : <span className="text-text-muted">{solveCount}/{limit} solves used · <Link to="/pricing" className="text-accent-primary hover:underline">Upgrade</Link></span>
              }
            </div>
 
            {/* ── AI MODEL SELECTOR ─────────────────────────────── */}
            <div className="mb-6 w-full max-w-lg relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5">
                <Cpu size={11} />
                Select AI Model
                <span className="ml-auto text-[10px] font-normal text-text-muted normal-case tracking-normal">
                  {unlockedCount} of {AI_MODELS.length} unlocked
                </span>
              </p>
 
              <button
                onClick={() => setShowModelDropdown(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-accent-primary/40 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{selectedModel.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-white text-[9px] font-bold uppercase tracking-wide ${selectedModel.badgeColor}`}>
                      {selectedModel.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{selectedModel.description}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-text-muted transition-transform flex-shrink-0 ${showModelDropdown ? 'rotate-180' : ''}`}
                />
              </button>
 
              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 right-0 z-40 bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
                  >
                    {AI_MODELS.map((model, i) => {
                      const unlocked = isModelUnlocked(model);
                      const isSelected = model.id === selectedModelId;
 
                      return (
                        <button
                          key={model.id}
                          disabled={!unlocked}
                          onClick={() => {
                            if (unlocked) {
                              setSelectedModelId(model.id as ModelId);
                              setShowModelDropdown(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                            ${i > 0 ? 'border-t border-border' : ''}
                            ${unlocked ? 'hover:bg-elevated cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                            ${isSelected ? 'bg-accent-primary/8' : ''}
                          `}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${isSelected ? 'text-accent-primary' : ''}`}>
                                {model.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-white text-[9px] font-bold uppercase tracking-wide ${model.badgeColor}`}>
                                {model.badge}
                              </span>
                              {isSelected && (
                                <span className="ml-auto text-[9px] font-bold text-accent-primary uppercase tracking-wider">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-muted mt-0.5">{model.description}</p>
                          </div>
                          {!unlocked && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Lock size={12} className="text-text-muted" />
                              <span className="text-[10px] text-text-muted font-bold capitalize">
                                {model.minPlan}+
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
 
                    {plan !== 'elite' && (
                      <div className="px-4 py-2.5 bg-accent-primary/5 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">
                          Unlock all {AI_MODELS.length} models with Elite
                        </span>
                        <Link
                          to="/pricing"
                          onClick={() => setShowModelDropdown(false)}
                          className="text-[10px] font-bold text-accent-primary hover:underline"
                        >
                          Upgrade →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* ── END MODEL SELECTOR ────────────────────────────── */}
 
            <SolveInput id="solve-input" onSolve={handleSolve} isLoading={isLoading} />
 
            {isLoading && (
              <button
                onClick={handleStop}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
              >
                <Square size={16} />
                Stop Generation
              </button>
            )}
 
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              {[
                { icon: <Sparkles className="text-accent-primary" />, title: 'Smart Steps', desc: 'Clear, logical breakdowns of every problem.' },
                { icon: <History className="text-accent-secondary" />, title: 'Auto-History', desc: 'Never lose a solution again with cloud sync.' },
                { icon: <Sigma className="text-warning" />, title: 'Any Topic', desc: 'From basics to advanced university research.' },
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
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
              <div className="md:col-span-2 bento-card border-accent-primary/20 bg-gradient-to-br from-card to-secondary">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-md bg-accent-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-glow">
                      {result.topic}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-elevated text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      {result.difficulty}
                    </span>
                    {activeModelUsed && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-md bg-elevated border border-border text-text-muted text-[10px] font-bold">
                        <Cpu size={9} />
                        {activeModelUsed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPDF}
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
 
                <div className="mb-10 text-center">
                  <p className="text-[10px] text-text-muted mb-4 font-bold uppercase tracking-[0.2em]">Final Answer</p>
                  <div className="text-4xl font-bold text-white overflow-x-auto py-4 font-mono">
                    <BlockMath math={result.final_answer_latex} />
                  </div>
                </div>
 
                <div className="space-y-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted border-b border-border pb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-accent-primary" />
                    <span>Analytical Breakdown</span>
                  </h2>
                  <StepDisplay steps={result.steps} />
                </div>
              </div>
 
              <div className="space-y-6">
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full bento-card bg-accent-primary/5 border-accent-primary/20 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
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
                  className="w-full bento-card bg-accent-secondary/5 border-accent-secondary/20 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
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
                      <span className="text-text-muted">Complexity</span>
                      <span className="font-bold">{result.difficulty}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Confidence</span>
                      <span className="font-bold text-emerald-400">100% Verified</span>
                    </div>
                    {activeModelUsed && (
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">Model</span>
                        <span className="font-bold text-accent-primary">{activeModelUsed}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      <AnimatePresence>
        {showChat && result && <ProfessorChat solveContext={result} onClose={() => setShowChat(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showQuiz && result && <QuizPortal topic={result.topic} onClose={() => setShowQuiz(false)} />}
      </AnimatePresence>
    </div>
  );
}
