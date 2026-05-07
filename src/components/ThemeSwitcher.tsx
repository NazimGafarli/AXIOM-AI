import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from '../types';

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.MidnightAxiom);

  useEffect(() => {
    const savedTheme = localStorage.getItem('axiom-theme') as Theme || Theme.MidnightAxiom;
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('axiom-theme', theme);
  };

  const themes = [
    { id: Theme.MidnightAxiom, name: 'Midnight', color: '#06B6D4' },
    { id: Theme.SolarCalculus, name: 'Solar', color: '#D97706' },
    { id: Theme.MatrixProtocol, name: 'Matrix', color: '#00FF41' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-secondary border border-border text-text-primary hover:bg-elevated transition-colors"
        aria-label="Toggle theme"
      >
        <Palette size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute right-0 mt-2 w-48 p-2 rounded-xl bg-card border border-border shadow-xl z-50"
          >
            <div className="grid grid-cols-1 gap-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    applyTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-sm font-medium">{theme.name}</span>
                  </div>
                  {currentTheme === theme.id && (
                    <Check size={16} className="text-accent-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
