'use client';

import React, { useState } from 'react';

interface TotpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, expiresAt: number) => void;
  apiBaseUrl: string;
}

export const TotpModal: React.FC<TotpModalProps> = ({ isOpen, onClose, onSuccess, apiBaseUrl }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setError('Enter a valid 6-digit TOTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp_code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication rejected');
      }

      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_token_expires_at', String(data.expires_at));
      onSuccess(data.token, data.expires_at);
      setCode('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Check Authenticator clock sync.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl bg-[#0B0F19] p-6 shadow-2xl border border-white/[0.08] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Session Authorization</h2>
            <p className="text-[11px] text-slate-500">Google Authenticator TOTP</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full text-center tracking-[0.6em] text-2xl font-mono py-2.5 rounded-xl bg-black/40 border border-white/[0.1] focus:border-sky-500/60 text-slate-100 font-semibold outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 px-3 rounded-lg border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-1/2 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#070A10] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
