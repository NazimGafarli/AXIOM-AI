import { Link } from 'react-router-dom';
import { Sigma, Shield } from 'lucide-react';

export default function Policy() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
          <Shield size={20} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy & Terms</h1>
      </div>

      <div className="space-y-12 text-text-secondary leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
          <p>Welcome to AxiomAI. By using our service at <strong className="text-white">axiom-math-ai.netlify.app</strong>, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use of the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. Data We Collect</h2>
          <p>When you sign in with Google or email, we collect your email address and display name solely to provide personalized features such as solve history and account management. We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Data</h2>
          <p>Your data is used exclusively to:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Authenticate your account securely via Firebase</li>
            <li>Store your solve history tied to your user ID</li>
            <li>Manage your subscription status via Stripe</li>
            <li>Send transactional emails (receipts, password resets)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong className="text-white">Firebase</strong> — Authentication and database storage</li>
            <li><strong className="text-white">Stripe</strong> — Payment processing (we never store your card details)</li>
            <li><strong className="text-white">Groq AI</strong> — AI inference for math solving</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">5. Subscriptions & Refunds</h2>
          <p>AxiomAI offers a <strong className="text-white">15-Day Money Back Guarantee</strong> on all paid plans. To request a refund, contact us within 15 days of your purchase. Subscriptions auto-renew monthly and can be cancelled at any time from your account settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">6. GDPR & CCPA Rights</h2>
          <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us and we will process your request within 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">7. Cookies</h2>
          <p>We use minimal cookies required for authentication and session management. We do not use advertising or tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">8. Contact</h2>
          <p>For any privacy concerns or support requests, please reach out via our platform. We aim to respond within 48 hours.</p>
        </section>

        <div className="pt-8 border-t border-border text-xs text-text-muted">
          Last updated: May 2026 · AxiomAI ·{' '}
          <Link to="/" className="text-accent-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
