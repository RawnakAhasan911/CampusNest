import React from 'react';
import { ShieldCheck, Lock, KeyRound, Cpu } from 'lucide-react';

export default function CryptoBadge({ type = 'rsa', label, size = 'sm' }) {
  const isEcc = type.toLowerCase().includes('ecc') || type.toLowerCase().includes('elgamal');
  const isCbc = type.toLowerCase().includes('cbc') || type.toLowerCase().includes('mac');

  const config = isEcc
    ? {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Cpu,
        name: label || 'ECC-secp256k1 Asymmetric',
        tooltip: 'Protected via Elliptic Curve ElGamal on secp256k1 with HMAC-SHA256 integrity tag',
      }
    : isCbc
    ? {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: KeyRound,
        name: label || 'CBC-MAC Verified',
        tooltip: 'Image binary & metadata authenticated via custom Cipher Block Chaining MAC',
      }
    : {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Lock,
        name: label || 'RSA-512 Asymmetric',
        tooltip: 'Encrypted via custom RSA with PKCS#1 v1.5 padding & HMAC-SHA256 verification',
      };

  const Icon = config.icon;
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border font-mono tracking-tight shadow-sm cursor-help transition hover:opacity-90 ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.name}</span>
    </span>
  );
}
