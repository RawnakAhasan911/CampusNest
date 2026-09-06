import React, { useState } from 'react';
import { User, Mail, Phone, Lock, BookOpen, GraduationCap, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CryptoBadge from '../components/CryptoBadge';

export default function Register({ onClose, onSwitchToLogin, initialUserId = null, initialEmail = '' }) {
  const { register, verifyEmail } = useAuth();

  // Step 1: Form vs Step 2: Email OTP
  const [step, setStep] = useState(initialUserId ? 2 : 1);
  const [userId, setUserId] = useState(initialUserId || '');
  const [demoOtp, setDemoOtp] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState('Junior');

  // Step 2 OTP
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({
        name,
        email,
        phone,
        password,
        department,
        yearOfStudy,
      });

      if (res.success) {
        setUserId(res.userId);
        setDemoOtp(res.demoOtp || '');
        setOtp(res.demoOtp || ''); // prefill for demo convenience
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your university email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyEmail(userId, otp);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
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

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">Student Account Registration</span>
            <CryptoBadge type="rsa" label="Zero-Knowledge Encryption" size="xs" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Student Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              University Email <span className="text-brand-600 font-normal">(.edu / .ac.* domain required)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
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
                  placeholder="Min. 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Biology / Pre-Med">Biology / Pre-Med</option>
                <option value="Psychology">Psychology</option>
                <option value="Architecture">Architecture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study</label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="Freshman">Freshman (1st Year)</option>
                <option value="Sophomore">Sophomore (2nd Year)</option>
                <option value="Junior">Junior (3rd Year)</option>
                <option value="Senior">Senior (4th Year)</option>
                <option value="Graduate">Graduate Student</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Cryptographic Registration Safeguards:</p>
            <p>• Name, phone & email encrypted with RSA-512 before database storage.</p>
            <p>• Individual ECC secp256k1 keypair generated for private messaging.</p>
            <p>• Password salted with PBKDF2-HMAC-SHA256 (2048 rounds).</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Create Account & Send Verification OTP</span>
          </button>

          <div className="pt-1 text-center text-xs text-slate-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-brand-600 hover:underline font-bold"
            >
              Log In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Mail className="w-4 h-4 text-sky-600" />
              <span>Verify Your University Email</span>
            </div>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              We dispatched an ECC-encrypted 6-digit confirmation code to your university email address.
            </p>
            {demoOtp && (
              <div className="mt-1 pt-1 border-t border-sky-200/60 font-mono text-[11px]">
                Demo Verification Code: <strong className="text-sky-950 bg-white px-1.5 py-0.5 rounded border border-sky-300">{demoOtp}</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit Email Code</label>
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
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Confirm University Email</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
          >
            ← Back to Registration Form
          </button>
        </form>
      )}
    </div>
  );
}
