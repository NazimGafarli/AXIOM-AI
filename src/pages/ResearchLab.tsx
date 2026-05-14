import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Microscope, FileText, Fingerprint, FlaskConical as Flask, Send, Loader2, Sparkles, Binary, Beaker } from 'lucide-react';
import { isQuotaError } from '../lib/gemini';
import { toast } from 'sonner';

// ─── DeepSeek caller (no SDK needed — plain fetch) ────────────────────────────
async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!key) throw new Error("VITE_DEEPSEEK_API_KEY is not configured.");

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "deepseek-reasoner",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`DeepSeek API error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek returned an empty response.");
  return text.trim();
}

export default function ResearchLab() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'fingerprint' | 'lab'>('analyzer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Paper Analyzer ─────────────────────────────────────────────────────────
  const analyzePaper = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const reader = new FileReader();
      const fileText = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(file);
      });

      const userPrompt = `Analyze this mathematical research document.
Identify:
1. Core Theorem / Hypothesis
2. Methodology used
3. Key mathematical breakthroughs
4. Theoretical dependencies (what other theories it builds on)

Provide a concise, high-level summary for a fast-reading researcher.
Respond in clear Markdown with LaTeX for all formulas.

Document content:
${fileText.slice(0, 8000)}`;

      const text = await callDeepSeek(
        'You are an expert mathematical research analyst. Provide precise, structured analysis.',
        userPrompt
      );

      setResult(text);
    } catch (err: any) {
      console.error("Research Lab Error:", err);
      toast.error(
        isQuotaError(err)
          ? "The research engine is at capacity. Please try again later."
          : err.message || "Analysis failed. Ensure the file is a valid text-based document."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Structural Fingerprint ─────────────────────────────────────────────────
  const getFingerprint = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const userPrompt = `Analyze the mathematical structure of this expression: "${input}"

Identify its "Structural Fingerprint":
- Field of Study (e.g. Topology, Number Theory, Analysis)
- Complexity Class
- Deep Theoretical Connections (identify similar famous theorems or structures)
- Symmetries and Invariants
- Known applications or open problems related to this structure

Respond in a structured research summary format. Use LaTeX for all formulas.`;

      const text = await callDeepSeek(
        'You are an expert mathematician specializing in structural analysis and mathematical theory.',
        userPrompt
      );

      setResult(text);
    } catch (err: any) {
      console.error("Fingerprint Error:", err);
      toast.error(
        isQuotaError(err)
          ? "Fingerprint engine busy. Try again later."
          : err.message || "Fingerprinting failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white shadow-glow">
                <Microscope size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Research Lab</h1>
            </div>
            <p className="text-text-secondary max-w-xl">
              Advanced computational tools for the modern mathematician. Analyze papers, identify structural patterns, and experiment with complex reasoning.
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div className="flex p-1 bg-secondary rounded-xl border border-border">
            {[
              { id: 'analyzer',    icon: <FileText size={16} />,    label: 'Paper Analysis' },
              { id: 'fingerprint', icon: <Fingerprint size={16} />, label: 'Fingerprinting' },
              { id: 'lab',         icon: <Beaker size={16} />,      label: 'Workbench' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setResult(null); setInput(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent-primary text-white shadow-glow'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left panel ── */}
          <div className="lg:col-span-1 space-y-6">

            {activeTab === 'analyzer' && (
              <div className="bento-card border-accent-primary/20 bg-accent-primary/5">
                <h3 className="text-sm font-bold mb-4">Upload Research Paper</h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  Upload a text-based document of a mathematical publication. Axiom will identify proofs, methodologies, and core logic.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-border rounded-2xl hover:border-accent-primary transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-text-muted group-hover:bg-accent-primary group-hover:text-white transition-all">
                    <Send size={24} className="-rotate-45" />
                  </div>
                  <span className="text-xs font-bold text-text-muted">Drop file here or click to browse</span>
                  <span className="text-[10px] text-text-muted opacity-60">Supports .txt · .md · .tex</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.md,.tex"
                  onChange={(e) => e.target.files?.[0] && analyzePaper(e.target.files[0])}
                />
              </div>
            )}

            {activeTab === 'fingerprint' && (
              <div className="bento-card">
                <h3 className="text-sm font-bold mb-4">Input Expression</h3>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Enter a formula or expression\ne.g. e^{i\\pi} + 1 = 0`}
                  className="w-full h-32 bg-secondary border border-border rounded-xl p-4 text-sm font-mono focus:border-accent-primary outline-none transition-all resize-none mb-4"
                />
                <button
                  onClick={getFingerprint}
                  disabled={loading || !input.trim()}
                  className="w-full py-4 rounded-xl bg-accent-primary text-white font-bold text-sm shadow-glow hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Fingerprint size={20} />}
                  <span>Generate Structural Fingerprint</span>
                </button>
              </div>
            )}

            {activeTab === 'lab' && (
              <div className="bento-card border-accent-secondary/20 bg-accent-secondary/5">
                <h3 className="text-sm font-bold mb-4">Workbench</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  The experimental workbench is coming soon. This will support LaTeX live preview, symbolic computation, and multi-step proof building.
                </p>
                <div className="mt-6 py-8 flex flex-col items-center gap-3 opacity-40">
                  <Beaker size={40} />
                  <span className="text-xs font-bold">Coming Soon</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: output ── */}
          <div className="lg:col-span-2">
            <div className="bento-card min-h-[500px] flex flex-col bg-gradient-to-br from-bg-card to-bg-secondary border-accent-primary/10">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    Analytical Output · DeepSeek R1
                  </span>
                </div>
                {result && (
                  <button
                    onClick={() => setResult(null)}
                    className="text-[10px] font-bold text-accent-primary hover:underline"
                  >
                    Clear Result
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <Loader2 size={48} className="animate-spin text-accent-primary" />
                    <Binary size={20} className="absolute inset-0 m-auto text-white" />
                  </div>
                  <p className="text-lg font-bold tracking-tight">Processing through DeepSeek R1 Reasoning Engine...</p>
                  <p className="text-xs text-text-muted animate-pulse">Running chain-of-thought analysis · may take 15–30 seconds</p>
                </div>
              ) : result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed"
                >
                  <div className="markdown-body whitespace-pre-wrap font-sans">
                    {result}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none">
                  <Flask className="w-20 h-20 mb-4" />
                  <p className="text-sm font-medium">Lab is idle. Select a tool to begin research.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
