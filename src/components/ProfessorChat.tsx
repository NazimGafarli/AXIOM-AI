import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, X, GraduationCap, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { isQuotaError } from '../lib/gemini';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProfessorChatProps {
  solveContext: any;
  onClose: () => void;
}

export default function ProfessorChat({ solveContext, onClose }: ProfessorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello! I'm Professor Axiom. I see you just solved a problem about **${solveContext.topic}**. How can I help you master this topic today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemInstruction = `You are Professor Axiom, an elite mathematics professor. 
      You are helping a student understand a specific problem: ${solveContext?.problem_summary || "General math questions"}.
      Previous answer was: ${solveContext?.final_answer || "N/A"}.
      
      Rules:
      1. Use LaTeX for all math (wrap in $ or $$).
      2. Be encouraging but rigorous.
      3. Use the Socratic method: guide the student rather than just giving the answer if they ask for one.`;

      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-reasoner",
          messages: [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage.content },
          ],
          temperature: 0,
          max_tokens: 2000,
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) throw new Error('Failed to chat');

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error: any) {
      console.error(error);
      const isQuota = isQuotaError(error);
      const fallbackMsg = isQuota
        ? "I'm a bit overwhelmed with students right now. Please try again in a moment!"
        : "I'm sorry, I encountered an issue. Let me try that again.";
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border z-50 shadow-2xl flex flex-col pt-16"
    >
      <div className="p-4 border-b border-border flex items-center justify-between bg-primary/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Professor Axiom</h3>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">AI Tutor Mode</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-elevated rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'bg-accent-primary text-white rounded-tr-none shadow-glow'
                : 'bg-elevated text-text-primary rounded-tl-none border border-border'
            }`}>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-elevated p-4 rounded-2xl rounded-tl-none border border-border flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-accent-primary" />
              <span className="text-xs font-medium text-text-muted">Professor is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-primary/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="w-full bg-secondary border border-border rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-accent-primary transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 text-text-muted font-medium">
          Axiom plan: Unlimited Professor Chat messages.
        </p>
      </div>
    </motion.div>
  );
}
