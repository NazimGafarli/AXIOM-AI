import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sigma, Menu, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/solve', label: 'Solve' },
    { to: '/research', label: 'Research' },
    { to: '/dashboard', label: 'Analysis' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/policy', label: 'Return Policy' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-primary/95 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg">
            <Sigma className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AxiomAI</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <div className="h-4 w-[1px] bg-border mx-2" />
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden hover:border-accent-primary transition-all"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-accent-primary to-accent-secondary opacity-80" />
                )}
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

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-elevated transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-primary border-b border-border px-6 py-6 flex flex-col gap-4 shadow-xl z-50">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors py-2 border-b border-border/50"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-2">
            <ThemeSwitcher />
            {user ? (
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
                className="px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-bold hover:opacity-90 shadow-glow"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
