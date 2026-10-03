'use client';

import React from 'react';

interface HeaderProps {
  isAuthenticated: boolean;
  sessionRemaining: number | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  sessionRemaining,
  onOpenAuth,
  onLogout,
  onOpenUpload,
  onRefresh,
}: HeaderProps) => {
  const formatTimer = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isExpiringSoon = sessionRemaining !== null && sessionRemaining <= 120; // less than 2 minutes

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#070A10]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.2)] bg-[#0C1220] flex-shrink-0">
            <img
              src="/logo.png"
              alt="Sanctum Vault Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-wider text-slate-100 uppercase truncate">
                Sanctum
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 flex-shrink-0">
                Sovereign
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block truncate">
              vault.shahidur.dev
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <button
            onClick={onRefresh}
            title="Reload repository"
            aria-label="Reload repository"
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all flex items-center justify-center active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Auth State & Timer */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 15-Minute Session Timer Pill */}
              <div
                title="15-minute TOTP admin session"
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isExpiringSoon
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isExpiringSoon ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}></span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <svg className="w-3.5 h-3.5 text-current flex-shrink-0 hidden xs:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-[11px] sm:text-xs">{formatTimer(sessionRemaining)}</span>
                </div>
              </div>

              {/* Extend / Lock buttons */}
              <button
                onClick={onOpenAuth}
                title="Renew session (+15 min)"
                className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all active:scale-95"
              >
                +15m
              </button>
              <button
                onClick={onLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all active:scale-95"
              >
                Lock
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 border border-white/[0.08] hover:border-sky-500/30 text-xs font-medium transition-all active:scale-95"
              title="Unlock Session with TOTP (15 minutes)"
            >
              <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="hidden sm:inline">Unlock Session (15m)</span>
              <span className="inline sm:hidden">Unlock</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-95 text-[#070A10] font-semibold text-xs transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            title="Upload File"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="inline">Upload</span>
            <span className="hidden sm:inline">File</span>
          </button>
        </div>
      </div>
    </header>
  );
};
