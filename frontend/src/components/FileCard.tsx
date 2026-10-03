'use client';

import React, { useState } from 'react';
import { VaultFile } from '../types';

interface FileCardProps {
  file: VaultFile;
  onCopyUrl: (url: string) => void;
  onRename: (file: VaultFile) => void;
  onDelete: (file: VaultFile) => void;
  authToken: string | null;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onCopyUrl,
  onRename,
  onDelete,
  authToken,
}) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const getDirectOpenUrl = () => {
    if (file.vault === 'public') {
      return file.url;
    }
    if (authToken) {
      return `${file.url}?token=${encodeURIComponent(authToken)}`;
    }
    return file.url;
  };

  const handleCopy = () => {
    onCopyUrl(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(file.modified_at * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative rounded-xl bg-white/[0.02] hover:bg-white/[0.04] p-3.5 flex flex-col justify-between border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200">
      {/* Thumbnail / Preview Area */}
      <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#06080E] border border-white/[0.04] flex items-center justify-center mb-3">
        {file.category === 'images' && !imageError && file.vault === 'public' ? (
          <img
            src={file.url}
            alt={file.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            {file.category === 'images' && (
              <svg className="w-8 h-8 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {file.category === 'pdf' && (
              <svg className="w-8 h-8 text-rose-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            {file.category === 'video' && (
              <svg className="w-8 h-8 text-purple-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {file.category === 'audio' && (
              <svg className="w-8 h-8 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            )}
            {file.category === 'others' && (
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
        )}

        {/* Category Badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-black/60 text-slate-300 border border-white/10 backdrop-blur-md">
          {file.category}
        </span>
      </div>

      {/* Meta */}
      <div className="mb-3">
        <h3
          className="text-xs font-medium text-slate-200 truncate hover:text-sky-400 transition-colors cursor-pointer"
          title={file.name}
          onClick={() => window.open(getDirectOpenUrl(), '_blank')}
        >
          {file.name}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1">
          <span>{file.size_formatted}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/[0.04]">
        <button
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy direct URL"}
          className={`p-2 rounded-lg text-xs font-mono transition-all flex items-center justify-center ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
          }`}
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>

        <a
          href={getDirectOpenUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title="Open asset"
          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all flex items-center justify-center text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <button
          onClick={() => onRename(file)}
          title="Rename file"
          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all flex items-center justify-center text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(file)}
          title="Delete file"
          className="p-2 rounded-lg bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-white/[0.06] hover:border-rose-500/20 transition-all flex items-center justify-center text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
