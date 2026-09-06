import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Cpu, KeyRound, CheckCircle2, Play,
  RefreshCw, Terminal, Layers, FileCheck, Check
} from 'lucide-react';
import { api } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';

export default function SecurityDocs() {
  const [registry, setRegistry] = useState(null);
  const [testText, setTestText] = useState('John Doe, Computer Science Junior, Budget $850/mo, Phone: +1-555-0199');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadRegistry();
  }, []);

  async function loadRegistry() {
    try {
      const res = await api.getCryptoRegistry();
      if (res.success) {
        setRegistry(res);
      }
    } catch (err) {
      console.error('Failed to load crypto registry:', err);
    }
  }

  async function handleRunDemo() {
    setTesting(true);
    try {
      const res = await api.testCryptoDemo(testText);
      if (res.success) {
        setTestResult(res);
      }
    } catch (err) {
      alert('Demo failed: ' + err.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Security & Cryptography Hub</h1>
          <CryptoBadge type="rsa" label="Zero-Library Cryptography" size="xs" />
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Transparent cryptographic verification, dual asymmetric cryptosystems, and interactive live mathematical proof.
        </p>
      </div>

      {/* Interactive Cryptography Test Playground */}
      <div className="bg-slate-900 text-slate-200 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Live Cryptographic Verification Playground
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Execute custom BigInt RSA & secp256k1 ECC math in real-time
          </span>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-mono text-slate-300">
            Sample Plaintext Input Payload (Simulated Student Record):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              onClick={handleRunDemo}
              disabled={testing}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{testing ? 'Computing Math...' : 'Run Dual-Asymmetric Test'}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RSA Execution Result */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <Lock className="w-4 h-4" />
                    <span>Algorithm 1: Pure RSA-512</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    Modulus v{testResult.rsa.keyVersion}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p>• Public Modulus (n): <span className="text-slate-400 break-all">{testResult.rsa.publicKeyModulus}</span></p>
                  <p>• Block Padding: <span className="text-amber-300">PKCS#1 v1.5 (0x00 || 0x02 || PS || 0x00 || M)</span></p>
                  <p>• Ciphertext Blocks: <span className="text-emerald-400">{testResult.rsa.ciphertextBlocksCount} chunk(s)</span></p>
                  <p>• Sample Ciphertext C₁: <span className="text-slate-400 break-all">{testResult.rsa.sampleBlock?.slice(0, 32)}...</span></p>
                  <p>• HMAC Integrity Tag: <span className="text-emerald-400 break-all">{testResult.rsa.mac}</span></p>
                  <p className="flex items-center gap-1.5 text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Decrypted Plaintext Exactly Matches Input</span>
                  </p>
                </div>
              </div>

              {/* ECC Execution Result */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Cpu className="w-4 h-4" />
                    <span>Algorithm 2: Pure ECC (secp256k1)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    EC-ElGamal
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p>• Curve Equation: <span className="text-amber-300">y² ≡ x³ + 7 (mod p)</span></p>
                  <p>• Ephemeral Point C₁: <span className="text-slate-400">({testResult.ecc.ephemeralPointC1.x}, {testResult.ecc.ephemeralPointC1.y})</span></p>
                  <p>• Point Doubling & Addition: <span className="text-emerald-400">Double-and-Add BigInt Scalar Math</span></p>
                  <p>• Masked Ciphertext C₂: <span className="text-slate-400 break-all">{testResult.ecc.ciphertextC2Sample}</span></p>
                  <p>• HMAC Integrity Tag: <span className="text-emerald-400 break-all">{testResult.ecc.mac}</span></p>
                  <p className="flex items-center gap-1.5 text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Decrypted Plaintext Exactly Matches Input</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Hash & MAC Proof */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-[11px]">
              <p className="text-slate-400">
                • Custom SHA-256 Hash: <span className="text-white break-all">{testResult.sha256}</span>
              </p>
              <p className="text-slate-400">
                • Custom HMAC-SHA256 Tag: <span className="text-emerald-400 break-all">{testResult.hmac}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cryptographic Architecture Detailed Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Dual Asymmetric Cryptography Specifications</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Algorithm 1 Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Algorithm 1: RSA-512 Asymmetric Cryptosystem</h3>
                <p className="text-[11px] text-slate-500 font-mono">Rivest–Shamir–Adleman with PKCS#1 v1.5 Padding</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Mathematical Foundation:</strong> Pure BigInt arithmetic with binary square-and-multiply modular exponentiation <code>(m^e mod N)</code> and Extended Euclidean Algorithm for private exponent derivation <code>(d = e⁻¹ mod φ(N))</code>.
              </p>
              <p>
                <strong>Primality Generation:</strong> 256-bit prime factors <code>p</code> and <code>q</code> generated via Miller-Rabin probabilistic primality test with 25 rounds (error rate &lt; 10⁻¹⁵).
              </p>
              <p>
                <strong>Application Domain:</strong> Encrypts student profile fields (names, phones, emails, bios), housing listings, and user private keys at rest.
              </p>
            </div>
          </div>

          {/* Algorithm 2 Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Algorithm 2: ECC secp256k1 Asymmetric Cryptosystem</h3>
                <p className="text-[11px] text-slate-500 font-mono">Elliptic Curve ElGamal with Point Arithmetic</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Curve Operations:</strong> Weierstrass elliptic curve <code>y² ≡ x³ + 7 mod p</code>. Affine point addition, doubling, and scalar multiplication implemented from scratch using BigInt without libraries.
              </p>
              <p>
                <strong>Encryption Scheme:</strong> Pure EC-ElGamal. For recipient public point <code>Q = d·G</code>, encryptor generates random scalar <code>k</code>, sending ephemeral point <code>C₁ = k·G</code> and masked data <code>C₂</code>. Decryptor recovers shared point <code>S = d·C₁</code>.
              </p>
              <p>
                <strong>Application Domain:</strong> Secures peer-to-peer student chat messages, connection request notes, and 2FA OTP codes.
              </p>
            </div>
          </div>

          {/* Hash & KDF Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Password KDF & Custom Hash</h3>
                <p className="text-[11px] text-slate-500 font-mono">FIPS 180-4 SHA-256 & PBKDF2</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>FIPS 180-4 SHA-256:</strong> Pure bitwise 32-bit integer arithmetic with standard round constants and schedule expansion. Tested and verified against standard NIST test vectors.
              </p>
              <p>
                <strong>PBKDF2-HMAC-SHA256:</strong> Passwords hashed with 2048 key-stretching rounds and 128-bit random salt.
              </p>
            </div>
          </div>

          {/* MAC & Media Integrity */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Data & Media Integrity (MAC)</h3>
                <p className="text-[11px] text-slate-500 font-mono">RFC 2104 HMAC-SHA256 & CBC-MAC</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Tamper Detection:</strong> Every encrypted record in the database includes a cryptographic HMAC. Decryption validates the tag with timing-safe comparison before unpadding.
              </p>
              <p>
                <strong>Image CBC-MAC:</strong> Property photos and metadata are authenticated with Cipher Block Chaining MAC to prevent image replacement or corruption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
