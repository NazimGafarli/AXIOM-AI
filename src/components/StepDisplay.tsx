import { motion } from 'motion/react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { SolveStep } from '../types';

interface StepDisplayProps {
  steps: SolveStep[];
}

export default function StepDisplay({ steps }: StepDisplayProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <motion.div
          key={step.step_number}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative pl-12 pb-8 border-l-2 border-border last:pb-0"
        >
          <div className="absolute left-[-13px] top-0 w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-bold ring-4 ring-bg-primary">
            {step.step_number}
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-accent-primary mb-2 tracking-tight">
              {step.title}
            </h3>
            
            <div className="overflow-x-auto py-4 bg-secondary/50 rounded-xl mb-4 px-4 border border-border/50">
              <BlockMath math={step.latex} />
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              {step.plain_english}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
