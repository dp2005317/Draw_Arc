'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  RefreshCw,
  Share2
} from 'lucide-react';
import { Collaborator } from '@/lib/collaboration';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  shareUrl: string;
  collaborators: Record<string, Collaborator>;
  currentUserId: string;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onGenerateNewRoom: () => void;
  theme: 'dark' | 'light';
}

export default function ShareModal({
  isOpen,
  onClose,
  roomId,
  shareUrl,
  collaborators,
  currentUserId,
  userName,
  onUpdateUserName,
  onGenerateNewRoom,
  theme,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateUserName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const activeUsers = Object.values(collaborators);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative transition-all duration-200 animate-in zoom-in-95 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60'
            : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-black/80'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
          }`}
          aria-label="Close share dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="share-modal-title" className="text-base font-bold tracking-tight">
              Collaborative Workspace Link
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Anyone with this editable link can join, draw, and build together in real time.
            </p>
          </div>
        </div>

        {/* Sharable Link Input Card */}
        <div
          className={`p-3 rounded-2xl border mb-4 flex items-center gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs font-mono outline-none truncate select-all"
          />
          <button
            onClick={handleCopy}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* User Identity Customization */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 flex items-center justify-between ${
            isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-neutral-950/40 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{userName}</span>
                <span className="text-[10px] font-normal text-indigo-400">(You)</span>
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                Shown to other collaborators as your cursor badge
              </div>
            </div>
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className={`text-xs px-2 py-1 rounded-lg border outline-none w-28 ${
                  isLight ? 'bg-white border-slate-300' : 'bg-neutral-800 border-neutral-700'
                }`}
              />
              <button
                onClick={handleSaveName}
                className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameInput(userName);
                setIsEditingName(true);
              }}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-400 underline underline-offset-2"
            >
              Change Name
            </button>
          )}
        </div>

        {/* Live Collaborators Online */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Active Collaborators ({Math.max(activeUsers.length, 1)})</span>
            </div>
            <span className="text-[10px] font-mono opacity-60">Room: {roomId}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeUsers.length === 0 ? (
              <div className="text-xs opacity-50 italic">Waiting for others to join...</div>
            ) : (
              activeUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-800/80 border-neutral-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: user.color }}
                  />
                  <span>{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="text-[10px] text-indigo-400 font-bold">(You)</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions & Security Footer */}
        <div className={`pt-4 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Encrypted Room Session · Vercel Edge Synced</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Create a new fresh room? This will change the room ID in your link.')) {
                onGenerateNewRoom();
              }
            }}
            className={`text-xs flex items-center gap-1 font-medium transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Create a new room ID"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New Room</span>
          </button>
        </div>
      </div>
    </div>
  );
}
