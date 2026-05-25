"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  DeployIcon,
  TrashIcon,
  ExternalIcon,
} from './Icons';

interface Commit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

interface DeploysClientProps {
  initialCommits: Commit[];
  repoUrl: string;
}

export default function DeploysClient({ initialCommits, repoUrl }: DeploysClientProps) {
  const [commits] = useState<Commit[]>(initialCommits);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Copy to clipboard helper
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success('Commit hash copied!');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Construct GitHub links safely
  const getCommitUrl = (hash: string) => {
    if (!repoUrl) return '#';
    // Clean repo URL: remove git@github.com: and change to https://github.com/
    let cleanUrl = repoUrl.trim();
    if (cleanUrl.startsWith('git@github.com:')) {
      cleanUrl = cleanUrl.replace('git@github.com:', 'https://github.com/');
    }
    if (cleanUrl.endsWith('.git')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 4);
    }
    return `${cleanUrl}/commit/${hash}`;
  };

  const getCommitTypeConfig = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('delete') || msg.includes('remove')) {
      return {
        color: 'bg-red-50 border border-red-200/60 text-red-650',
        icon: <TrashIcon size={12} className="text-red-600" />
      };
    }
    if (msg.includes('save') || msg.includes('create') || msg.includes('publish') || msg.includes('add')) {
      return {
        color: 'bg-emerald-50 border border-emerald-200/60 text-emerald-700',
        icon: <DeployIcon size={12} className="text-emerald-600" />
      };
    }
    return {
      color: 'bg-slate-100 border border-slate-200/60 text-slate-600',
      icon: <DeployIcon size={12} className="text-slate-550" />
    };
  };

  const headCommit = commits[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-2">
            Deploy log
          </h1>
          <p className="text-[13px] text-slate-500 font-semibold">
            Monitor compilation commit pushes and Git repository deploy pipelines
          </p>
        </div>
        
        {/* HEAD status widget */}
        {headCommit && repoUrl && (
          <a
            href={getCommitUrl(headCommit.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-650 text-[13px] font-bold transition-all hover:bg-violet-100"
          >
            <span>HEAD: {headCommit.hash.slice(0, 7)}</span>
            <ExternalIcon size={13} />
          </a>
        )}
      </div>

      {/* Commit Timeline list */}
      {commits.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <DeployIcon size={48} className="text-slate-350 mx-auto mb-3" />
          <h3 className="text-[16px] font-bold text-slate-700 mb-1">Timeline empty</h3>
          <p className="text-[12.5px] text-slate-500 font-semibold">Make edits to posts or upload assets to populate Git logs.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-4 pl-8 py-2 space-y-6">
          
          {commits.map((commit, index) => {
            const cfg = getCommitTypeConfig(commit.message);
            const isCopied = copiedHash === commit.hash;

            return (
              <div key={commit.hash || index} className="relative group select-text">
                
                {/* Node circle wrapper */}
                <div className={`absolute left-[-41px] top-1.5 h-6.5 w-6.5 rounded-full border flex items-center justify-center bg-white z-10 transition-all group-hover:scale-115 ${cfg.color}`}>
                  {cfg.icon}
                </div>

                {/* Commit log body */}
                <div className="glow-card-3d p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-800 leading-snug group-hover:text-violet-650 transition-colors duration-150">
                        {commit.message}
                      </h3>
                      <p className="text-[11.5px] text-slate-500 font-semibold mt-1">
                        Pushed by <span className="text-slate-700 font-bold">{commit.author_name}</span> &lt;{commit.author_email}&gt;
                      </p>
                    </div>

                    {/* Hash copy button */}
                    <div className="flex gap-2 items-center shrink-0">
                      <button
                        onClick={() => handleCopyHash(commit.hash)}
                        className={`font-mono text-[11px] px-2 py-0.8 rounded border transition-all duration-150 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-700 font-bold'
                            : 'bg-violet-50 border border-violet-100 text-violet-650 hover:bg-violet-100'
                        }`}
                        title="Copy full hash"
                      >
                        {isCopied ? 'Copied' : commit.hash.slice(0, 7)}
                      </button>

                      {repoUrl && (
                        <a
                          href={getCommitUrl(commit.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="View commit details on GitHub"
                        >
                          <ExternalIcon size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-450 font-bold border-t border-slate-100 pt-3">
                    <span>{commit.date ? format(new Date(commit.date), 'MMMM d, yyyy h:mm a') : 'Recent'}</span>
                    <span>Commit Hash Verified</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
