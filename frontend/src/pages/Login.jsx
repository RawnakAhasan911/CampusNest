import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, KeyRound, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onClose, onSwitchToRegister, onEmailNeedsVerify }) {
  const { login, complete2FA } = useAuth();

  // Step 1 vs Step 2 (2FA OTP)
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Submit Primary Credentials
  async function handleStep1Submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.needsEmailVerification) {
        if (onEmailNeedsVerify) {
          onEmailNeedsVerify(res.userId, email);
        } else {
          setError(res.message);
        }
        return;
      }

      if (res.requires2FA) {
        setTempToken(res.tempToken);
        setDemoOtp(res.demoOtp || '');
        setOtp(res.demoOtp || ''); // prefill for demo convenience
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Submit 2FA OTP
  async function handleStep2Submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await complete2FA(tempToken, otp);
      if (res.success) {
        onClose();
      }
    } catch (err) {
      setError(err.message || '2FA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="text-xs text-slate-500 mb-2">
            Step 1 of 2: Authenticate with your university email credentials.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">University Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>Proceed to 2FA Verification</span>
          </button>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-brand-600 hover:underline font-bold"
            >
              Sign Up (.edu)
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Two-Factor Authentication (2FA)</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              A 6-digit one-time passcode was encrypted with system ECC keys and dispatched to <strong>{email}</strong>.
            </p>
            {demoOtp && (
              <div className="mt-1 pt-1 border-t border-emerald-200/60 font-mono text-[11px]">
                Demo Verification Code: <strong className="text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{demoOtp}</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP Code</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Verify 2FA & Complete Login</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
          >
            ← Back to Step 1
          </button>
        </form>
      )}
    </div>
  );
}
