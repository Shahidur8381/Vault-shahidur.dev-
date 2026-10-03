'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/Header';
import { FileCard } from '../components/FileCard';
import { UploadModal } from '../components/UploadModal';
import { RenameModal } from '../components/RenameModal';
import { TotpModal } from '../components/TotpModal';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { VaultFile, VaultType, FileCategory, VaultStats } from '../types';

export default function VaultDashboard() {
  const [activeVault, setActiveVault] = useState<VaultType>('public');
  const [activeCategory, setActiveCategory] = useState<FileCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VaultStats | null>(null);

  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [sessionRemaining, setSessionRemaining] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<VaultFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<VaultFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // API URL
  const apiBaseUrl = useMemo(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return 'https://api.vault.shahidur.dev';
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_token_expires_at');
    setAuthToken(null);
    setExpiresAt(null);
    setSessionRemaining(null);
    addToast('info', 'Session locked');
    setActiveVault('public');
  }, []);

  // Restore token on mount with expiration check
  useEffect(() => {
    const stored = localStorage.getItem('vault_token');
    const storedExp = localStorage.getItem('vault_token_expires_at');
    if (stored && storedExp) {
      const expNum = parseInt(storedExp, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (expNum > nowSec) {
        setAuthToken(stored);
        setExpiresAt(expNum);
        setSessionRemaining(expNum - nowSec);
      } else {
        localStorage.removeItem('vault_token');
        localStorage.removeItem('vault_token_expires_at');
      }
    }
  }, []);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!expiresAt || !authToken) {
      setSessionRemaining(null);
      return;
    }

    const updateTimer = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = expiresAt - nowSec;
      if (diff <= 0) {
        setSessionRemaining(0);
        handleLogout();
        addToast('info', 'Admin session expired after 15 minutes. Re-authenticate with TOTP.');
      } else {
        setSessionRemaining(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, authToken, handleLogout]);

  // Window drop listener: if a file is dropped into the window, open upload modal
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        setDroppedFile(e.dataTransfer.files[0]);
        setIsUploadModalOpen(true);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/stats/`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore background stats error
    }
  }, [apiBaseUrl]);

  // Fetch file list
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        vault: activeVault,
        category: activeCategory,
      });
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${apiBaseUrl}/api/files/?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        if (res.status === 401 && activeVault === 'protected') {
          setFiles([]);
          setIsAuthModalOpen(true);
          addToast('info', 'Session authorization required for protected partition.');
          return;
        }
        throw new Error('Failed to load assets');
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      addToast('error', err.message || 'Error fetching repository');
    } finally {
      setLoading(false);
    }
  }, [activeVault, activeCategory, searchQuery, authToken, apiBaseUrl]);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('success', 'Public asset link copied to clipboard');
  };

  const handleAuthSuccess = (token: string, exp: number) => {
    setAuthToken(token);
    setExpiresAt(exp);
    const nowSec = Math.floor(Date.now() / 1000);
    setSessionRemaining(Math.max(0, exp - nowSec));
    addToast('success', 'Admin session authorized for 15 minutes via TOTP');
  };

  const handleUploadSuccess = (newFile: VaultFile) => {
    addToast('success', `Stored in /${newFile.vault}/${newFile.subfolder}/${newFile.name}`);
    setDroppedFile(null);
    fetchFiles();
    fetchStats();
  };

  const handleRenameSuccess = (updatedFile: VaultFile) => {
    addToast('success', `Renamed asset to '${updatedFile.name}'`);
    fetchFiles();
    fetchStats();
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    if (!authToken) {
      setIsAuthModalOpen(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/files/delete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          vault: fileToDelete.vault,
          path: fileToDelete.path,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove asset');
      }

      addToast('success', `Removed '${fileToDelete.name}'`);
      setFileToDelete(null);
      fetchFiles();
      fetchStats();
    } catch (err: any) {
      addToast('error', err.message || 'Removal failed');
    } finally {
      setDeleting(false);
    }
  };

  const categories: { key: FileCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All Assets', icon: '📁' },
    { key: 'images', label: 'Images', icon: '🖼️' },
    { key: 'pdf', label: 'PDFs', icon: '📄' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'audio', label: 'Audio', icon: '🎵' },
    { key: 'others', label: 'Other', icon: '📦' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070A10] text-slate-100 relative">
      <Header
        isAuthenticated={!!authToken}
        sessionRemaining={sessionRemaining}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenUpload={() => {
          if (!authToken) {
            setIsAuthModalOpen(true);
          } else {
            setIsUploadModalOpen(true);
          }
        }}
        onRefresh={() => {
          fetchFiles();
          fetchStats();
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Vault Selector with Emojis */}
          <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] max-w-md w-full sm:w-auto shadow-sm">
            <button
              onClick={() => setActiveVault('public')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                activeVault === 'public'
                  ? 'bg-sky-500 text-[#070A10] font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐 Public Vault</span>
              {stats?.public && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeVault === 'public' ? 'bg-[#070A10]/20 text-[#070A10]' : 'bg-white/[0.06] text-slate-400'
                }`}>
                  {stats.public.total_files}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                }
                setActiveVault('protected');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                activeVault === 'protected'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔒 Protected Vault</span>
              {stats?.protected && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeVault === 'protected' ? 'bg-purple-900/60 text-purple-200' : 'bg-white/[0.06] text-slate-400'
                }`}>
                  {stats.protected.total_files}
                </span>
              )}
            </button>
          </div>

          {/* Direct Link Information Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono text-slate-400">
            {activeVault === 'public' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>CDN: <span className="text-slate-200">api.vault.shahidur.dev/public/...</span></span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Encrypted: 6-digit TOTP session required</span>
              </>
            )}
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Category Tabs with Emojis */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.key
                    ? 'bg-white/[0.08] text-slate-100 border border-white/[0.12] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-8 pr-4 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] focus:border-sky-500/50 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* File Grid Area */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <svg className="animate-spin h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-xs font-mono">Indexing repository assets...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 rounded-2xl bg-white/[0.015] border border-white/[0.06] flex flex-col items-center justify-center text-center p-8 space-y-5">
            {/* Generated Nanobanana Cryptographic Vault Emblem */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-white/[0.1] shadow-[0_0_40px_rgba(56,189,248,0.12)]">
              <img
                src="/vault-core.jpg"
                alt="Vault Core Emblem"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070A10] via-transparent to-transparent opacity-40"></div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {searchQuery ? 'No matching assets found' : `Empty ${activeVault === 'public' ? 'Public' : 'Protected'} Vault`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchQuery
                  ? `No items found matching "${searchQuery}".`
                  : `Drag & drop a file here, or click upload to store your first asset.`}
              </p>
            </div>

            <button
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#070A10] text-xs font-semibold shadow-sm transition-all"
            >
              + Upload to Sanctum
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {files.map((file) => (
              <FileCard
                key={`${file.vault}-${file.path}`}
                file={file}
                onCopyUrl={handleCopyUrl}
                onRename={(f) => setFileToRename(f)}
                onDelete={(f) => setFileToDelete(f)}
                authToken={authToken}
              />
            ))}
          </div>
        )}
      </main>

      {/* Author Footer */}
      <footer className="w-full border-t border-white/[0.04] bg-[#05070C] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Md. Shahidur Rahman</span>
            <span>•</span>
            <a
              href="https://shahidur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
            >
              shahidur.dev
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@shahidur.dev"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>hello@shahidur.dev</span>
            </a>
            <span>•</span>
            <span>Sanctum Sovereign Vault</span>
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B0F19] p-6 shadow-2xl border border-rose-500/20">
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Confirm Asset Deletion</h3>
            <p className="text-xs text-slate-400 mb-5">
              Permanently delete <span className="text-rose-400 font-mono font-medium">{fileToDelete.name}</span>? This action cannot be reversed.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="w-1/2 py-2 px-3 rounded-lg border border-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="w-1/2 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-sm transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setDroppedFile(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        onRequireAuth={() => setIsAuthModalOpen(true)}
        initialVault={activeVault}
        droppedFile={droppedFile}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!fileToRename}
        file={fileToRename}
        onClose={() => setFileToRename(null)}
        onRenameSuccess={handleRenameSuccess}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        onRequireAuth={() => setIsAuthModalOpen(true)}
      />

      {/* TOTP Login Modal */}
      <TotpModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
