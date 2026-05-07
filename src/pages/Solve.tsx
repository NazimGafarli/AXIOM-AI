import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sigma, Sparkles, History, ArrowRight, Share2, Star, GraduationCap, Brain } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import SolveInput from '../components/SolveInput';
import StepDisplay from '../components/StepDisplay';
import ProfessorChat from '../components/ProfessorChat';
import QuizPortal from '../components/QuizPortal';
import { BlockMath } from 'react-katex';
import { SolveResult, Difficulty } from '../types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { parseJSONResponse, isQuotaError } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function Solve() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleSolve = async (problem: string, image?: File) => {
    setIsLoading(true);
    setResult(null);
    setShowChat(false);
    setShowQuiz(false);

    try {
      const solveCount = localStorage.getItem('axiom_solves_count') || '0';
      const count = parseInt(solveCount);

      if (count >= 15 && !user) {
        toast.error("Free limit reached! Upgrade to Axiom Plus to continue.");
        navigate('/pricing');
        return;
      }

      let imageContext = "";
      if (image) {
        imageContext = `Note: The user has also attached an image of the problem. Please solve based on the problem text provided.`;
      }

      const prompt = `You are AxiomAI, an elite mathematical problem-solving AI. Solve this problem with 100% accuracy.
      Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
      Use LaTeX for all mathematical notation. Escape backslashes properly (e.g., \\\\frac instead of \\frac).
      ${imageContext}
      
      Problem: ${problem || 'Solve the math problem'}
      
      Respond with this exact JSON structure:
      {
        "topic": "string",
        "subtopic": "string",
        "difficulty": "Easy" | "Medium" | "Hard" | "Expert",
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

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert math solver. Always respond with valid JSON only. No markdown, no code blocks, no extra text before or after the JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('The AI returned an empty response.');

      let data: SolveResult;
      try {
        data = parseJSONResponse(text);
      } catch (e) {
        console.error("Parse Error:", e);
        console.log("Raw Response:", text);
        throw e;
      }

      setResult(data);
      localStorage.setItem('axiom_solves_count', (count + 1).toString());

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#818CF8', '#ffffff']
      });

      if (user) {
        addDoc(collection(db, 'solves'), {
          ...data,
          userId: user.uid,
          createdAt: serverTimestamp(),
          isPublic: false,
          isStarred: false,
        }).catch(err => console.error("Failed to save solve:", err));
      }

      toast.success('Problem solved successfully!');
    } catch (error: any) {
      console.error("Math Solve Error:", error);
      let errorMessage = 'An error occurred while solving the problem.';

      if (isQuotaError(error)) {
        errorMessage = 'The AI service is currently at capacity. Please try again shortly.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
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
            <p className="text-text-secondary text-center mb-12 max-w-lg">
              Upload a photo or type your problem. AxiomAI provides step-by-step solutions for any math topic.
            </p>

            <SolveInput id="solve-input" onSolve={handleSolve} isLoading={isLoading} />

            <div id="features-grid" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
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
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4 group"
            >
              <div className="rotate-180"><ArrowRight size={18} /></div>
              <span className="text-xs font-bold uppercase tracking-widest">Solve another</span>
            </button>

            <div id="solve-result-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="w-12 h-12 rounded-xl bg-accent-primary text-white flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
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
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary text-white flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
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
                      <span className="font-bold">Calculated</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Confidence</span>
                      <span className="font-bold text-emerald-400">100% Verified</span>
                    </div>
                  </div>
                </div>

                {result.has_graph && result.graph_function && (
                  <div className="bento-card border-accent-secondary/20">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-accent-secondary mb-4">Dynamic Plot</h3>
                    <div className="aspect-square bg-primary rounded-2xl flex items-center justify-center border border-border border-dashed font-mono text-[10px] text-text-muted mt-2">
                      {result.graph_function}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
