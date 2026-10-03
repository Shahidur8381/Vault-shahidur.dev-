'use client';

import React, { useState, useEffect } from 'react';
import { VaultFile } from '../types';

interface RenameModalProps {
  isOpen: boolean;
  file: VaultFile | null;
  onClose: () => void;
  onRenameSuccess: (updatedFile: VaultFile) => void;
  apiBaseUrl: string;
  authToken: string | null;
  onRequireAuth: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  file,
  onClose,
  onRenameSuccess,
  apiBaseUrl,
  authToken,
  onRequireAuth,
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setNewName(file.name);
      setError(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === file.name) {
      onClose();
      return;
    }

    if (!authToken) {
      onRequireAuth();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/files/rename/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          vault: file.vault,
          path: file.path,
          new_name: newName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          onRequireAuth();
          throw new Error('Session expired. Authorize via TOTP.');
        }
        throw new Error(data.error || 'Failed to rename asset');
      }

      onRenameSuccess(data.file);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Rename error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-[#0B0F19] p-5 sm:p-6 shadow-2xl border border-white/[0.08] relative">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg active:scale-95 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-sm font-semibold text-slate-100 mb-1">Rename Asset</h2>
        <p className="text-[11px] text-slate-500 mb-4 font-mono truncate">{file.name}</p>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              New Identifier
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] focus:border-sky-500/60 text-xs text-slate-200 outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-3 rounded-lg border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] active:scale-95 text-xs font-medium min-h-[42px] flex items-center justify-center transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim() || newName.trim() === file.name}
              className="w-1/2 py-2.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-95 text-[#070A10] font-semibold text-xs transition-all disabled:opacity-40 min-h-[42px] flex items-center justify-center"
            >
              {loading ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
