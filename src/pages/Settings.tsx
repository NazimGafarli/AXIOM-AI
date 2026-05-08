import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Lock, Trash2, Loader2, Save, Crown, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import {
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Settings() {
  const { user, userPlan, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const solveCount = parseInt(localStorage.getItem('axiom_solves_count') || '0');
  const solveLimit = userPlan?.solveLimit ?? 5;
  const isUnlimited = solveLimit === -1;
  const planName = userPlan?.plan
    ? userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)
    : 'Free';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoadingPassword(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Not authenticated');
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect.');
      } else {
        toast.error(error.message || 'Failed to update password.');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoadingDelete(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      await deleteUser(currentUser);
      toast.success('Account deleted successfully.');
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign back in before deleting your account.');
      } else {
        toast.error(error.message || 'Failed to delete account.');
      }
    } finally {
      setLoadingDelete(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-white">
          <SettingsIcon size={20} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
      </div>

      <div className="space-y-6">

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-card">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
            <User size={14} /> Profile Information
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-accent-primary overflow-hidden flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-accent-primary to-accent-secondary" />
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.displayName || 'User'}</p>
              <p className="text-text-muted text-sm">{user?.email}</p>
              <p className="text-[10px] text-accent-primary font-bold uppercase tracking-widest mt-1">
                {user?.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Email Account'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Plan Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bento-card">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
            <Crown size={14} /> Current Plan
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userPlan?.isPro ? 'bg-accent-primary/10' : 'bg-secondary'}`}>
                {userPlan?.isPro ? <Crown size={18} className="text-accent-primary" /> : <Zap size={18} className="text-text-muted" />}
              </div>
              <div>
                <p className="font-bold">{planName} Plan</p>
                <p className="text-xs text-text-muted">
                  {isUnlimited ? 'Unlimited solves' : `${solveLimit} solves/month`}
                </p>
              </div>
            </div>
            {!userPlan?.isPro && (
              <Link
                to="/pricing"
                className="px-4 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-glow"
              >
                Upgrade
              </Link>
            )}
          </div>
        </motion.div>

        {/* Usage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bento-card">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6">
            Usage This Month
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Solves Used</span>
                <span className="text-text-muted">
                  {isUnlimited ? `${solveCount} · unlimited` : `${solveCount} / ${solveLimit}`}
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-1000 rounded-full"
                  style={{
                    width: isUnlimited
                      ? '100%'
                      : `${Math.min((solveCount / solveLimit) * 100, 100)}%`,
                    opacity: isUnlimited ? 0.4 : 1,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Study Sessions Today</span>
                <span className="text-text-muted">
                  {localStorage.getItem('axiom_study_sessions_today') || '0'}
                </span>
              </div>
            </div>
            {!userPlan?.isPro && (
              <p className="text-xs text-text-muted">
                Upgrade to <Link to="/pricing" className="text-accent-primary font-bold hover:underline">Axiom Plus</Link> for 100 solves/month.
              </p>
            )}
          </div>
        </motion.div>

        {/* Change Password — email users only */}
        {user?.providerData[0]?.providerId !== 'google.com' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bento-card">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
              <Lock size={14} /> Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-accent-primary outline-none text-sm transition-all"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className={`w-full px-4 py-3 rounded-xl bg-secondary border focus:border-accent-primary outline-none text-sm transition-all ${
                  confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-500' : 'border-border'
                }`}
              />
              <button
                type="submit"
                disabled={loadingPassword}
                className="w-full py-3 rounded-xl bg-accent-primary text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loadingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Update Password
              </button>
            </form>
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bento-card border-red-500/20 bg-red-500/5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-6 flex items-center gap-2">
            <Trash2 size={14} /> Danger Zone
          </h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-all text-sm"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-400 font-medium">
                Are you sure? This permanently deletes your account and all data. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-elevated transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loadingDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {loadingDelete && <Loader2 size={16} className="animate-spin" />}
                  Yes, Delete
                </button>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
