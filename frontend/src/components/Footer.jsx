import React from 'react';
import { Shield, Lock, Cpu, CheckCircle } from 'lucide-react';

export default function Footer({ setTab }) {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
              <span>Campus<span className="text-sky-400">Nest</span></span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                Pure Crypto
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              University Student Housing & Compatible Roommate Finder with pure from-scratch asymmetric cryptographic architecture.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">Navigation</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setTab('listings')} className="hover:text-white transition">Housing Listings</button></li>
              <li><button onClick={() => setTab('roommates')} className="hover:text-white transition">Roommate Matching</button></li>
              <li><button onClick={() => setTab('crypto-hub')} className="hover:text-white transition">Security Architecture</button></li>
            </ul>
          </div>

          {/* Col 3: Cryptography Audit */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">Cryptography Specs</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-sky-400">
                <Lock className="w-3.5 h-3.5" />
                <span>RSA-512 (PKCS#1 v1.5 + HMAC)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>ECC secp256k1 (EC-ElGamal)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Shield className="w-3.5 h-3.5" />
                <span>PBKDF2-HMAC-SHA256 (2048)</span>
              </div>
            </div>
          </div>

          {/* Col 4: Safety & Verification */}
          <div>
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">University Safety</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Only verified university emails (.edu, .ac.*) can register. All student phone numbers and sensitive profile fields are encrypted at rest.
            </p>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Library Cryptography</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 CampusNest Security Platform. Built for University Student Housing & Safety.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>2FA OTP Active</span>
            <span>•</span>
            <span>Anti-Hijacking Sessions</span>
            <span>•</span>
            <span>CBC-MAC Media</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
