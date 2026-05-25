"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, SearchIcon, BellIcon } from './Icons';
import CommandPalette from './CommandPalette';

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'success' | 'building' | 'failed'>('success');
  const [unreadNotifications, setUnreadNotifications] = useState(false);

  // Sync deploy status from backend or mock
  useEffect(() => {
    const checkDeployStatus = async () => {
      try {
        const res = await fetch('/api/deploys');
        if (res.ok) {
          const deploys = await res.json();
          if (deploys.length > 0) {
            // Find if there is any failed deploy or if it's currently building
            // For mock/development simplicity, let's look at the latest commit
            const latest = deploys[0];
            if (latest.message.toLowerCase().includes('fail')) {
              setDeployStatus('failed');
            } else {
              setDeployStatus('success');
            }
          }
        }
      } catch (err) {
        console.error('Error checking deploy status:', err);
      }
    };
    checkDeployStatus();
    // Poll status every 60 seconds
    const interval = setInterval(checkDeployStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);  // Breadcrumb generator
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) {
      return (
        <span className="text-[13.5px] font-bold text-slate-800 tracking-tight font-sans">
          Dashboard
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-[13px] font-semibold font-sans">
        <Link href="/admin" className="text-slate-500 hover:text-slate-800 transition-colors duration-150">
          Dashboard
        </Link>
        {parts.slice(1).map((part, index) => {
          const isLast = index === parts.length - 2;
          const href = '/' + parts.slice(0, index + 2).join('/');
          const label = part.charAt(0).toUpperCase() + part.slice(1);

          if (isLast) {
            return (
              <React.Fragment key={part}>
                <span className="text-slate-300 font-normal">/</span>
                <span className="text-slate-800 font-bold tracking-tight">{label}</span>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={part}>
              <span className="text-slate-300 font-normal">/</span>
              <Link href={href} className="text-slate-500 hover:text-slate-800 transition-colors duration-150">
                {label}
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <header className="h-[60px] w-full sticky top-0 z-50 bg-white/60 backdrop-blur-[16px] border-b border-slate-200/50 px-6 flex items-center justify-between select-none">
        
        {/* Left: Breadcrumbs */}
        <div className="flex items-center">
          {getBreadcrumbs()}
        </div>

        {/* Center: Search Box Trigger */}
        <div className="flex-1 max-w-lg mx-6 flex justify-center">
          <div
            onClick={() => setIsPaletteOpen(true)}
            className="w-[180px] focus-within:w-[320px] transition-all duration-250 ease-out flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100/50 cursor-pointer hover:bg-slate-100 hover:border-slate-350 group"
          >
            <SearchIcon size={14} className="text-slate-500 group-hover:text-slate-700 transition-colors duration-150" />
            <span className="text-[12.5px] text-slate-400 group-hover:text-slate-600 transition-colors duration-150 font-sans flex-1 text-left font-semibold">
              Search posts, tags...
            </span>
            <span className="text-[10px] px-1.5 py-0.2 border border-slate-200 bg-white text-slate-500 rounded font-bold">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Actions and Indicators */}
        <div className="flex items-center gap-3">
          
          {/* Deploy status */}
          <Link
            href="/admin/deploys"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/60 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150"
          >
            {deployStatus === 'success' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-bold text-emerald-600 font-sans">Deployed</span>
              </>
            )}
            {deployStatus === 'building' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[12px] font-bold text-amber-600 font-sans animate-pulse">Building</span>
              </>
            )}
            {deployStatus === 'failed' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[12px] font-bold text-red-600 font-sans">Failed</span>
              </>
            )}
          </Link>

          {/* New Post CTA */}
          <button
            onClick={() => router.push('/admin/editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-750 text-white text-[12.5px] font-bold font-sans transition-all duration-150 shadow-[0_4px_12px_rgba(124,58,237,0.15)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon size={14} />
            <span>New Post</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              setUnreadNotifications(false);
              router.push('/admin/deploys');
            }}
            className="h-8 w-8 rounded-lg border border-slate-200 bg-white/60 flex items-center justify-center text-slate-550 hover:bg-slate-100 hover:text-slate-800 transition-all duration-150 relative cursor-pointer"
          >
            <BellIcon size={16} />
            {unreadNotifications && (
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

        </div>

      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
}
