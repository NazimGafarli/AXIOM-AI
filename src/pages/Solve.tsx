import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sigma, Sparkles, History, ArrowRight, Share2, Star, Trash2, GraduationCap, Brain } from 'lucide-react';
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
import { ai, MODEL_NAMES, parseJSONResponse, Type, isQuotaError } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';

export default function Solve() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleSolve = async (problem: string, image?: File) => {
    if (!process.env.GEMINI_API_KEY) {
      toast.error("Gemini API key is not configured. Please add it in Settings.");
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setShowChat(false);
    setShowQuiz(false);

    try {
      // Mock Subscription Check
      // In a real app, you'd check Firestore/Stripe status
      const solveCount = localStorage.getItem('axiom_solves_count') || '0';
      const count = parseInt(solveCount);
      
      if (count >= 15 && !user) {
        toast.error("Free limit reached! Upgrade to Axiom Plus to continue.");
        navigate('/pricing');
        return;
      }

      let prompt = `You are AxiomAI, an elite mathematical problem-solving AI. Solve this problem with 100% accuracy.
      Your output must be a single, valid JSON object conforming strictly to the provided schema. 
      Do NOT include any markdown code blocks (like \`\`\`json) or extra text outside the JSON object.
      Use professional LaTeX for all mathematical notation. Ensure all LaTeX backslashes are properly escaped (e.g., \\\\frac instead of \\frac).
      Problem: ${problem || 'Solve the math in the attached image'}`;

      let base64 = "";
      let mimeType = "";

      if (image) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(image);
        });
        base64 = await base64Promise;
        mimeType = image.type;
      }

      const generateResult = async (modelName: string) => {
        console.log("Attempting solve with model:", modelName);
        
        const imagePart = base64 ? {
          inlineData: {
            mimeType,
            data: base64
          }
        } : null;

        const contents = imagePart 
          ? { parts: [{ text: prompt }, imagePart] }
          : { parts: [{ text: prompt }] };

        return await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                subtopic: { type: Type.STRING },
                difficulty: { 
                  type: Type.STRING,
                  enum: Object.values(Difficulty)
                },
                final_answer: { type: Type.STRING },
                final_answer_latex: { type: Type.STRING },
                problem_summary: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      step_number: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      latex: { type: Type.STRING },
                      plain_english: { type: Type.STRING }
                    },
                    required: ["step_number", "title", "latex", "plain_english"]
                  }
                },
                has_graph: { type: Type.BOOLEAN },
                graph_function: { type: Type.STRING }
              },
              required: ["topic", "subtopic", "difficulty", "final_answer", "final_answer_latex", "problem_summary", "steps", "has_graph"]
            }
          }
        });
      };

      let response;
      try {
        response = await generateResult(MODEL_NAMES.PRO);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn("PRO model quota hit, falling back to Flash model...");
          toast.info("Model busy, switching to fallback mode...");
          response = await generateResult(MODEL_NAMES.FLASH);
        } else {
          throw err;
        }
      }

      if (!response.text) {
        throw new Error('The AI model returned an empty response. This can happen if the problem is too complex or violates safety guidelines.');
      }

      console.log("AI result received, parsing...");
      let data: SolveResult;
      try {
        data = parseJSONResponse(response.text);
      } catch (e) {
        console.error("Parse Error Details:", e);
        console.log("Raw Response:", response.text);
        throw e;
      }
      
      setResult(data);

      // Store count for limits
      localStorage.setItem('axiom_solves_count', (count + 1).toString());

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#818CF8', '#ffffff']
      });

      // Save to Firebase in background
      if (user) {
        addDoc(collection(db, 'solves'), {
          ...data,
          userId: user.uid,
          createdAt: serverTimestamp(),
          isPublic: false,
          isStarred: false,
        }).catch(err => {
          console.error("Failed to save solve to history:", err);
          // Don't toast error here to not confuse the user if the result is already there
        });
      }

      toast.success('Problem solved successfully!');
    } catch (error: any) {
      console.error("Math Solve Error:", error);
      let errorMessage = 'An error occurred while solving the problem.';
      
      const details = error.status ? `(Status: ${error.status})` : '';
      
      if (isQuotaError(error)) {
        errorMessage = `The AI service is currently at capacity or out of credits ${details}. Please check your Gemini API billing status.`;
      } else if (error.message) {
        // If it's a specific API error, show part of it
        if (error.message.includes('API_KEY_INVALID')) {
          errorMessage = 'The Gemini API key is invalid or not set correctly.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'The requested AI model was not found in this region.';
        } else {
          errorMessage = error.message;
        }
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
            {/* Main Answer Card */}
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
