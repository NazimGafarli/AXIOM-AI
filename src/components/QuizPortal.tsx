import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ArrowRight, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { parseJSONResponse, isQuotaError } from '../lib/gemini';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface Quiz {
  topic: string;
  questions: Question[];
}

interface QuizPortalProps {
  topic: string;
  onClose: () => void;
}

export default function QuizPortal({ topic, onClose }: QuizPortalProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQuiz = async () => {
      try {
        const prompt = `Generate a 3-question math quiz on the topic of "${topic}" with "Medium" difficulty.
        Respond ONLY with valid JSON in this exact format, no extra text:
        {
          "topic": "${topic}",
          "questions": [
            {
              "id": 1,
              "text": "string",
              "options": ["string", "string", "string", "string"],
              "correct_index": number,
              "explanation": "string"
            }
          ]
        }`;

        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a math quiz generator. Always respond with valid JSON only, no markdown, no extra text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const text = response.choices[0]?.message?.content;
        if (!text) throw new Error('Failed to generate quiz');

        const data = parseJSONResponse(text);
        setQuiz(data);
      } catch (err) {
        console.error('Quiz Generation Error:', err);
        if (isQuotaError(err)) {
          toast.error('The quiz engine is currently busy. Try again later.');
        } else {
          toast.error('Could not generate quiz. Try again later.');
        }
        onClose();
      } finally {
        setLoading(false);
      }
    };
    generateQuiz();
  }, [topic, onClose]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    if (idx === quiz!.questions[currentIdx].correct_index) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < quiz!.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bento-card relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary">
          <motion.div
            className="h-full bg-accent-primary"
            initial={{ width: 0 }}
            animate={{ width: quiz ? `${((currentIdx + (selectedIdx !== null ? 1 : 0)) / quiz.questions.length) * 100}%` : 0 }}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <Loader2 size={48} className="animate-spin text-accent-primary mx-auto" />
            <p className="text-lg font-bold tracking-tight">Generating personalized challenge...</p>
          </div>
        ) : isCompleted ? (
          <div className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="text-accent-primary" size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-text-secondary mb-8">You scored {score} out of {quiz?.questions.length}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-secondary border border-border">
                <span className="block text-xs text-text-muted font-bold uppercase mb-1">Accuracy</span>
                <span className="text-2xl font-bold">{Math.round((score / quiz!.questions.length) * 100)}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary border border-border">
                <span className="block text-xs text-text-muted font-bold uppercase mb-1">XP Earned</span>
                <span className="text-2xl font-bold">+{score * 20}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:opacity-90 transition-all shadow-glow"
            >
              Finish Challenge
            </button>
          </div>
        ) : (
          <div className="py-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-accent-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Problem {currentIdx + 1} of {quiz?.questions.length}</span>
              </div>
              <button onClick={onClose} className="text-xs font-bold text-text-muted hover:text-white transition-colors">Abort</button>
            </div>

            <h3 className="text-xl font-bold mb-8 leading-tight">{quiz?.questions[currentIdx].text}</h3>

            <div className="grid grid-cols-1 gap-3 mb-8">
              {quiz?.questions[currentIdx].options.map((option, i) => {
                const isSelected = selectedIdx === i;
                const isCorrect = i === quiz.questions[currentIdx].correct_index;
                const showResult = selectedIdx !== null;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      !showResult
                        ? 'bg-secondary border-border hover:border-accent-primary hover:bg-elevated'
                        : isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                          : isSelected
                            ? 'bg-red-500/10 border-red-500 text-red-500'
                            : 'bg-secondary border-border opacity-50'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {showResult && isCorrect && <CheckCircle2 size={20} />}
                    {showResult && isSelected && !isCorrect && <XCircle size={20} />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedIdx !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-2xl bg-accent-primary/5 border border-accent-primary/20">
                    <p className="text-xs font-bold text-accent-primary uppercase mb-1">Explanation</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{quiz.questions[currentIdx].explanation}</p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                  >
                    <span>{currentIdx === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
