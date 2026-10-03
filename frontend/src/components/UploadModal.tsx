'use client';

import React, { useState, useRef, useEffect } from 'react';
import { VaultType } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: any) => void;
  apiBaseUrl: string;
  authToken: string | null;
  onRequireAuth: () => void;
  initialVault?: VaultType;
  droppedFile?: File | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  apiBaseUrl,
  authToken,
  onRequireAuth,
  initialVault = 'public',
  droppedFile = null,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [targetVault, setTargetVault] = useState<VaultType>(initialVault);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (droppedFile) {
      handleSetFile(droppedFile);
    }
  }, [droppedFile]);

  useEffect(() => {
    setTargetVault(initialVault);
  }, [initialVault]);

  if (!isOpen) return null;

  const handleSetFile = (file: File) => {
    setSelectedFile(file);
    const lastDot = file.name.lastIndexOf('.');
    const stem = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
    setCustomName(stem);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSetFile(e.dataTransfer.files[0]);
    }
  };

  const getSubfolderHint = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
    const videoExts = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

    if (ext === 'pdf') return 'pdf';
    if (imageExts.includes(ext)) return 'images';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    return 'others';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Select or drop a file to proceed');
      return;
    }

    if (!authToken) {
      onRequireAuth();
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('vault', targetVault);
    if (customName.trim()) {
      formData.append('custom_name', customName.trim());
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          onRequireAuth();
          throw new Error('TOTP session expired. Please re-authenticate.');
        }
        throw new Error(data.error || 'Failed to upload asset');
      }

      onUploadSuccess(data.file);
      setSelectedFile(null);
      setCustomName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const predictedFolder = selectedFile ? getSubfolderHint(selectedFile.name) : 'auto';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0B0F19] p-6 shadow-2xl border border-white/[0.08] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Upload to Repository</h2>
            <p className="text-[11px] text-slate-500">Categorized by extension automatically</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Target Partition */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
              Target Partition
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTargetVault('public')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  targetVault === 'public'
                    ? 'bg-sky-500 text-[#070A10] font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌐 Public Vault</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetVault('protected')}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  targetVault === 'protected'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔒 Protected Vault</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/[0.12] hover:border-sky-500/40 bg-white/[0.01]'
              }`}
            >
              {selectedFile ? (
                <div className="text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-100 truncate">{selectedFile.name}</p>
                    <span className="text-[10px] text-emerald-400 font-mono">Ready to upload</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'binary'}
                  </p>
                  <p className="text-[10px] text-sky-400/80 mt-1">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-slate-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">
                    {isDragOver ? 'Drop file here now' : 'Drag & drop file here, or browse'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Images, PDF, Video, Audio, Archives
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Rename */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Asset Name (Optional)
              </label>
              {selectedFile && (
                <span className="text-[10px] text-sky-400 font-mono">
                  → /{targetVault}/{predictedFolder}/
                </span>
              )}
            </div>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. project-banner (extension auto-preserved)"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] focus:border-sky-500/60 text-xs text-slate-200 outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 px-3 rounded-lg border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-1/2 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#070A10] font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-[#070A10]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                'Upload Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
