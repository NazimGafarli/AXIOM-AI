import { Link, useNavigate } from 'react-router-dom';
import { Sigma, LogIn, User } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-primary/95 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg">
            <Sigma className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AxiomAI</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/solve" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Solve
          </Link>
          <Link to="/research" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Research
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Analysis
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/team" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Our Team
          </Link>
          <Link to="/policy" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Return Policy
          </Link>
          
          <div className="h-4 w-[1px] bg-border mx-2" />
          
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden hover:border-accent-primary transition-all">
                <div className="w-full h-full bg-gradient-to-tr from-accent-primary to-accent-secondary opacity-80" />
              </Link>
              <button 
                onClick={signOut}
                className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-glow"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
