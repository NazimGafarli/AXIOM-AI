import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sigma, Sparkles, History, ArrowRight, Share2, Star, GraduationCap, Brain, Download, Square } from 'lucide-react';
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

export default function Solve() {
  const { user, userPlan } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const abortRef = useRef<boolean>(false);

  const handleSolve = async (problem: string, image?: File) => {
    // Get current solve count from localStorage
    const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');

    // Check limit — userPlan.solveLimit is -1 for unlimited (pro/elite)
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

    try {
      const prompt = `You are AxiomAI, the world's most advanced mathematical problem-solving AI. You can solve ANY math problem from Grade 1 arithmetic to PhD-level research mathematics with perfect accuracy.

      Your capabilities cover ALL levels:
      - Elementary: addition, subtraction, multiplication, division, fractions, decimals
      - Middle School: algebra basics, geometry, ratios, percentages, statistics
      - High School: advanced algebra, trigonometry, calculus, probability, linear algebra
      - University: real analysis, complex analysis, abstract algebra, differential equations, topology, number theory, linear algebra, multivariable calculus, statistics, discrete math
      - Research: advanced proofs, graduate-level theorems, mathematical research

      CRITICAL RULES:
      1. Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text before or after.
      2. Use LaTeX for ALL mathematical notation. Escape ALL backslashes (\\\\frac, \\\\int, \\\\sum, \\\\sqrt, etc.)
      3. Break the solution into clear logical steps — minimum 3 steps, maximum 10 steps.
      4. Make plain_english explanations crystal clear for the student's level.
      5. final_answer_latex must be valid LaTeX that renders correctly.

      Problem: ${problem || 'Solve the math problem'}
      
      Respond with this exact JSON structure:
      {
        "topic": "string",
        "subtopic": "string",
        "difficulty": "Elementary" | "Medium" | "Hard" | "Expert",
        "final_answer": "string",
        "final_answer_latex": "string",
        "problem_summary": "string",
        "steps": [
          {
            "step_number": 1,
            "title": "string",
            "latex": "string",
            "plain_english": "string"
          }
        ],
        "has_graph": false,
        "graph_function": ""
      }`;

      if (abortRef.current) return;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert math solver. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
      });

      if (abortRef.current) {
        toast.info('Generation stopped.');
        return;
      }

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('The AI returned an empty response.');

      const data: SolveResult = parseJSONResponse(text);
      setResult(data);

      // Increment solve count
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
          createdAt: serverTimestamp(),
          isPublic: false,
          isStarred: false,
        }).catch(err => console.error('Failed to save solve:', err));
      }

      toast.success('Problem solved successfully!');
    } catch (error: any) {
      if (abortRef.current) return;
      console.error('Math Solve Error:', error);
      toast.error(
        isQuotaError(error)
          ? 'AI service is at capacity. Try again shortly.'
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

  // Get limit display values
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

            {/* Study session prompt */}
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

            {/* Usage indicator */}
            <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold">
              <div className={`w-2 h-2 rounded-full ${isUnlimited || solveCount < limit ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {isUnlimited
                ? <span className="text-text-muted">Unlimited solves · <span className="text-accent-primary">{planName} plan</span></span>
                : <span className="text-text-muted">{solveCount}/{limit} solves used · <Link to="/pricing" className="text-accent-primary hover:underline">Upgrade</Link></span>
              }
            </div>

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
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-accent-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-glow">
                      {result.topic}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-elevated text-text-muted text-[10px] font-bold uppercase tracking-wider">
                      {result.difficulty}
                    </span>
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
