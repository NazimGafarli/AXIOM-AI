import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Solve from './pages/Solve';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import ResearchLab from './pages/ResearchLab';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Guide from './pages/Guide';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-primary/30">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/solve" element={<Solve />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/research" element={
              <ProtectedRoute>
                <ResearchLab />
              </ProtectedRoute>
            } />
            <Route path="/policy" element={
              <div className="pt-32 px-6 max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Return Policy</h1>
                <p className="text-text-secondary leading-relaxed mb-6">
                  We believe in our product, but we understand it might not be for everyone.
                  That's why we offer a <b>15-Day No-Questions-Asked Return Policy</b>.
                </p>
                <div className="p-6 rounded-2xl bg-accent-primary/5 border border-accent-primary/20">
                  <h3 className="font-bold text-accent-primary mb-2">How it works:</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary">
                    <li>Send an email to support@axiomai.com within 15 days of your first payment.</li>
                    <li>Provide your account email and transaction ID.</li>
                    <li>Receive your full refund within 5-7 business days.</li>
                  </ul>
                </div>
              </div>
            } />
            <Route path="/team" element={
              <div className="pt-32 px-6 max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-12">Who Made AxiomAI?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bento-card">
                    <div className="w-20 h-20 bg-accent-primary rounded-full mx-auto mb-4" />
                    <h3 className="font-bold">Axiom Engineering</h3>
                    <p className="text-sm text-text-muted">Focusing on AI model optimization and mathematical reasoning accuracy.</p>
                  </div>
                  <div className="bento-card">
                    <div className="w-20 h-20 bg-accent-secondary rounded-full mx-auto mb-4" />
                    <h3 className="font-bold">Axiom Design</h3>
                    <p className="text-sm text-text-muted">Crafting the intuitive bento-style user interface for a seamless learning experience.</p>
                  </div>
                </div>
              </div>
            } />
          </Routes>
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
