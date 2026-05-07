import { useState, useRef } from 'react';
import { Send, Keyboard, Loader2, Camera, Upload } from 'lucide-react';

interface SolveInputProps {
  id?: string;
  onSolve: (problem: string, image?: File) => void;
  isLoading: boolean;
}

export default function SolveInput({ id, onSolve, isLoading }: SolveInputProps) {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      onSolve(input, selectedImage || undefined);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  return (
    <div id={id} className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your math problem here or upload a photo..."
            className="w-full min-h-[160px] p-6 rounded-2xl bg-card border-2 border-border focus:border-accent-primary outline-none text-text-primary placeholder:text-text-muted resize-none transition-all pr-12 shadow-lg"
            disabled={isLoading}
          />
          
          {selectedImage && (
            <div className="mt-2 p-2 rounded-xl bg-secondary border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                  <Camera size={16} className="text-accent-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">{selectedImage.name}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest">Image captured</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 px-3 rounded-lg hover:bg-elevated text-text-muted text-[10px] font-bold uppercase transition-all"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg bg-secondary border border-border text-text-muted hover:text-accent-primary transition-all"
            title="Upload photo"
          >
            <Upload size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && !selectedImage) || isLoading}
          className="absolute bottom-4 right-4 p-3 rounded-xl bg-accent-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Send size={24} />
          )}
        </button>
      </form>
      
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {['Algebra', 'Calculus', 'Trigonometry', 'Statistics'].map((topic) => (
          <button
            key={topic}
            onClick={() => setInput(`Example ${topic} problem: `)}
            className="px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-all"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
