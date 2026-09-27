import React, { useState } from 'react';
import { ApiClient } from '../../services/apiClient';
import { User, Shield, GraduationCap, Mail, Lock, Sparkles, X, Check, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialMode?: 'login' | 'register' | 'magic' | 'roles';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'roles',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'magic' | 'roles'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSwitch = async (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setLoading(true);
    setError(null);
    try {
      const emailMap = {
        STUDENT: 'alex@chesscadet.com',
        TEACHER: 'grandmaster.elena@chesscadet.com',
        ADMIN: 'admin@chesscadet.com',
      };
      const res = await ApiClient.login({
        email: emailMap[role],
        password: 'Scholar123!',
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate role account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.login({ email, password });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.register({
        email,
        password,
        fullName: fullName || email.split('@')[0],
        role: selectedRole,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.magicLink(email);
      setSuccessMessage('Magic link authenticated successfully!');
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Magic link authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct authenticated OAuth handshake simulation for preview environment
      const res = await ApiClient.googleAuth({
        email: email || 'user.google@chesscadet.com',
        fullName: fullName || 'Google Learner',
        googleId: `goog_${Date.now()}`,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-display">
              {mode === 'roles'
                ? 'Select Persona or Sign In'
                : mode === 'login'
                ? 'Sign In to ChessCadet'
                : mode === 'register'
                ? 'Create Production Account'
                : 'Email Magic-Link Sign In'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-user PostgreSQL database authentication with RBAC
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-lg bg-slate-950/80 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => { setMode('roles'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'roles' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Personas
          </button>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'login' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => { setMode('magic'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'magic' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Magic Link
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'register' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. FAST DEMO PERSONA SWITCHER */}
        {mode === 'roles' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Test server-side role enforcement (RBAC) instantly by switching between real database users:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleRoleSwitch('STUDENT')}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>Alex Vance</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">STUDENT</span>
                    </div>
                    <div className="text-xs text-slate-400">alex@chesscadet.com · Learner role</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleRoleSwitch('TEACHER')}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>Grandmaster Sarah Chen</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">TEACHER</span>
                    </div>
                    <div className="text-xs text-slate-400">teacher@chesscadet.com · Classroom coach</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                disabled={loading}
                className="w-full text-left p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>Master Architect</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">ADMIN</span>
                    </div>
                    <div className="text-xs text-slate-400">admin@chesscadet.com · CMS & FEN validator</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google OAuth</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. PASSWORD LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 3. MAGIC LINK */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-3.5">
            <p className="text-xs text-slate-400">
              Enter your email to receive a passwordless magic session token.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending link...' : 'Send Magic Link'}</span>
            </button>
          </form>
        )}

        {/* 4. REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('STUDENT')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    selectedRole === 'STUDENT'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Student Learner
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('TEACHER')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    selectedRole === 'TEACHER'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Teacher / Coach
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
