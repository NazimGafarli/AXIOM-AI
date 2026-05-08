import { motion } from 'motion/react';
import { Sigma, Camera, Brain, GraduationCap, Microscope, Zap, ChevronRight, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Guide() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-5xl mx-auto">

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <span className="px-4 py-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold uppercase tracking-widest">
          Complete Guide
        </span>
        <h1 className="text-5xl font-bold mt-6 mb-4 tracking-tight">How to Use AxiomAI</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Master every feature — from solving basic arithmetic to university-level proofs.
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bento-card mb-8 border-accent-primary/20 bg-accent-primary/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
            <Zap size={20} />
          </div>
          <h2 className="text-2xl font-bold">Quick Start</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Type or Upload', desc: 'Enter your math problem in the text box or upload a photo of it' },
            { step: '2', title: 'Click Solve', desc: 'Hit the Solve button and AxiomAI will analyze your problem instantly' },
            { step: '3', title: 'Review Steps', desc: 'Get a full step-by-step breakdown with LaTeX formulas and plain English explanations' },
          ].map(item => (
            <div key={item.step} className="p-4 rounded-2xl bg-card border border-border">
              <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center font-bold text-sm mb-3">
                {item.step}
              </div>
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What You Can Solve */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bento-card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
            <Sigma size={20} />
          </div>
          <h2 className="text-2xl font-bold">What You Can Solve</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              level: 'Grade 1–5 · Elementary',
              color: 'text-emerald-400',
              examples: ['25 + 47 = ?', 'What is 8 × 7?', '3/4 + 1/2 = ?', 'What is 15% of 200?'],
            },
            {
              level: 'Grade 6–8 · Middle School',
              color: 'text-blue-400',
              examples: ['Solve: 3x + 5 = 20', 'Area of a circle with radius 6', 'Simplify: (2x + 3)(x - 4)', 'Mean of 4, 7, 9, 12, 18'],
            },
            {
              level: 'Grade 9–12 · High School',
              color: 'text-purple-400',
              examples: ['Solve x² - 5x + 6 = 0', 'Derivative of f(x) = x³ + 2x²', 'Prove sin²θ + cos²θ = 1', 'Integral of 3x² + 2x dx'],
            },
            {
              level: 'University Level',
              color: 'text-accent-primary',
              examples: ['Solve dy/dx = 2xy', 'Eigenvalues of [[3,1],[1,3]]', 'Prove √2 is irrational', 'Laplace transform of e^(2t)'],
            },
          ].map(section => (
            <div key={section.level} className="p-5 rounded-2xl bg-secondary border border-border">
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${section.color}`}>
                {section.level}
              </h3>
              <ul className="space-y-2">
                {section.examples.map(ex => (
                  <li key={ex} className="flex items-center gap-2 text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-accent-primary flex-shrink-0" />
                    <span className="font-mono">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Features */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bento-card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
            <Brain size={20} />
          </div>
          <h2 className="text-2xl font-bold">Features Guide</h2>
        </div>
        <div className="space-y-6">
          {[
            {
              icon: <Camera size={20} />,
              title: 'Image Upload',
              badge: 'Plus & above',
              badgeColor: 'bg-blue-500/10 text-blue-400',
              desc: 'Take a photo of any handwritten or printed math problem and upload it. AxiomAI will read and solve it automatically.',
              steps: ['Click the camera icon in the solve box', 'Select or drag your image', 'Click Solve — AxiomAI reads the problem from the image'],
            },
            {
              icon: <GraduationCap size={20} />,
              title: 'AI Professor Chat',
              badge: 'Plus & above',
              badgeColor: 'bg-purple-500/10 text-purple-400',
              desc: 'After solving a problem, click "Ask AI Professor" to have a conversation with an AI tutor. Ask follow-up questions, request alternative methods, or explore related concepts.',
              steps: ['Solve any problem first', 'Click "Ask AI Professor" on the right', 'Type your question and press Enter'],
            },
            {
              icon: <Brain size={20} />,
              title: 'Instant Challenge Quiz',
              badge: 'Plus & above',
              badgeColor: 'bg-emerald-500/10 text-emerald-400',
              desc: 'Test your understanding after solving. AxiomAI generates a custom 3-question quiz based on the exact topic you just solved.',
              steps: ['Solve any problem', 'Click "Instant Challenge"', 'Answer 3 questions and see your score'],
            },
            {
              icon: <Microscope size={20} />,
              title: 'Research Lab',
              badge: 'Pro & Elite',
              badgeColor: 'bg-accent-primary/10 text-accent-primary',
              desc: 'Advanced tools for researchers and university students. Analyze mathematical papers, identify structural fingerprints, and explore deep theoretical connections.',
              steps: ['Go to Research in the navbar', 'Choose Paper Analysis or Fingerprinting', 'Upload a document or enter a formula'],
            },
          ].map(feature => (
            <div key={feature.title} className="p-6 rounded-2xl bg-secondary border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-lg">{feature.title}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${feature.badgeColor}`}>
                  {feature.badge}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">{feature.desc}</p>
              <div className="space-y-2">
                {feature.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-text-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bento-card mb-8">
        <h2 className="text-2xl font-bold mb-6">Pro Tips for Best Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { tip: 'Be specific', desc: 'Write "solve x² - 4 = 0" instead of just "quadratic"' },
            { tip: 'Use proper notation', desc: 'Write x^2 for x², sqrt(x) for √x, and x/y for fractions' },
            { tip: 'Include context', desc: 'Add "using integration by parts" if you want a specific method' },
            { tip: 'Upload clear images', desc: 'Make sure the photo is well-lit and the writing is legible' },
            { tip: 'Ask follow-ups', desc: 'Use Professor Chat to ask "why does this step work?"' },
            { tip: 'Practice with quizzes', desc: 'After every solve, take the Instant Challenge to reinforce understanding' },
          ].map(item => (
            <div key={item.tip} className="flex gap-3 p-4 rounded-xl bg-secondary border border-border">
              <div className="w-2 h-2 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm mb-1">{item.tip}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Copyright */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bento-card border-border/50 text-center">
        <h2 className="text-xl font-bold mb-4">Copyright & Legal</h2>
        <div className="space-y-3 text-sm text-text-secondary max-w-2xl mx-auto">
          <p>© 2026 AxiomAI. All rights reserved.</p>
          <p>AxiomAI is a proprietary AI-powered mathematics platform. All content, interfaces, algorithms, and brand assets are the exclusive intellectual property of AxiomAI.</p>
          <p>Solutions generated by AxiomAI are for educational purposes only. Users are responsible for verifying results for academic or professional use.</p>
          <p>Unauthorized reproduction, distribution, or commercial use of any part of this platform is strictly prohibited.</p>
          <div className="flex justify-center gap-6 mt-6 text-xs">
            <Link to="/policy" className="text-accent-primary hover:underline">Privacy Policy</Link>
            <Link to="/policy" className="text-accent-primary hover:underline">Terms of Service</Link>
            <Link to="/pricing" className="text-accent-primary hover:underline">Pricing</Link>
          </div>
        </div>
        <div className="flex justify-center gap-10 mt-8">
          {[
            { icon: <Shield size={20} />, text: 'AES-256 Encryption' },
            { icon: <Zap size={20} />, text: '99.9% Uptime' },
            { icon: <Star size={20} />, text: '15-Day Refund' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest">
              <div className="text-accent-primary">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
