"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  DashboardIcon,
  PostsIcon,
  PlusIcon,
  MediaIcon,
  DraftsIcon,
  TagsIcon,
  RssIcon,
  HnIcon,
  CurationIcon,
  SettingsIcon,
  AnalyticsIcon,
  DeployIcon,
  LogoutIcon,
} from './Icons';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeType?: 'default' | 'violet';
  count?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Dynamic states for stats and badges
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [postsThisMonth, setPostsThisMonth] = useState<number>(0);
  const [lastDeployTime, setLastDeployTime] = useState<string>('Never');
  const [confirmSignOut, setConfirmSignOut] = useState<boolean>(false);

  useEffect(() => {
    // Fetch posts to calculate statistics
    const loadStats = async () => {
      try {
        const res = await fetch('/api/posts?includeDrafts=true');
        if (res.ok) {
          const posts = await res.json();
          const published = posts.filter((p: any) => !p.draft);
          const drafts = posts.filter((p: any) => p.draft);
          setPublishedCount(published.length);
          setDraftsCount(drafts.length);

          // Calculate posts this month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthPosts = posts.filter((p: any) => {
            const date = new Date(p.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });
          setPostsThisMonth(thisMonthPosts.length);
        }
      } catch (err) {
        console.error('Error fetching sidebar stats:', err);
      }
    };

    const loadLastDeploy = async () => {
      try {
        const res = await fetch('/api/deploys');
        if (res.ok) {
          const deploys = await res.json();
          if (deploys.length > 0) {
            const latest = new Date(deploys[0].date);
            // Format time difference
            const diffMs = Date.now() - latest.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) {
              setLastDeployTime(`${diffMins}m ago`);
            } else {
              const diffHours = Math.floor(diffMins / 60);
              if (diffHours < 24) {
                setLastDeployTime(`${diffHours}h ago`);
              } else {
                setLastDeployTime(`${Math.floor(diffHours / 24)}d ago`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching latest deploy for sidebar:', err);
      }
    };

    loadStats();
    loadLastDeploy();
  }, []);

  const handleSignOutClick = () => {
    if (confirmSignOut) {
      signOut({ callbackUrl: '/admin/login' });
    } else {
      setConfirmSignOut(true);
      setTimeout(() => setConfirmSignOut(false), 3000);
    }
  };

  const NavItem = ({ label, icon, href, badge, badgeType = 'default', count }: NavItemProps) => {
    const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
    
    return (
      <Link href={href} className="relative block group">
        {isActive && (
          <div className="absolute left-0 top-[25%] w-[3px] h-[50%] bg-violet-600 rounded-r-[3px]" />
        )}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 active:scale-[0.97] cursor-pointer ${
            isActive
              ? 'nav-item-glass-active font-medium'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 nav-item-glass-hover'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`transition-colors duration-150 ${isActive ? 'text-violet-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
              {icon}
            </span>
            <span className="text-[13.5px] leading-none">{label}</span>
          </div>

          {count !== undefined && count > 0 && (
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${
              isActive 
                ? 'bg-violet-100 text-violet-700 border border-violet-200/50' 
                : 'bg-slate-150 border border-slate-200 text-slate-600'
            }`}>
              {count}
            </span>
          )}

          {badge && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                badgeType === 'violet'
                  ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20'
                  : 'bg-slate-150 text-slate-600 border border-slate-200'
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const SectionLabel = ({ text }: { text: string }) => (
    <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 pt-4 pb-1.5 uppercase select-none">
      {text}
    </div>
  );

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <aside className="w-[260px] h-screen bg-white/75 border-r border-slate-200/60 backdrop-blur-[20px] flex flex-col justify-between overflow-hidden relative font-sans">
      
      {/* 1. Logo Area */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3 select-none">
        <div className="w-7 h-7 rotate-45 bg-gradient-to-br from-violet-600 to-indigo-650 rounded flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.25)] border border-violet-400/20">
          <div className="-rotate-45 text-white font-bold text-sm">d</div>
        </div>
        <div>
          <div className="flex items-center gap-2 leading-none">
            <span className="font-semibold text-[17px] text-slate-800 tracking-tight">devlog</span>
            <span className="text-[9.5px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-600 font-bold rounded">
              v2.0
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block leading-none font-semibold">CMS Dashboard</span>
        </div>
      </div>

      {/* 2. Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
        <SectionLabel text="Workspace" />
        <NavItem label="Dashboard" icon={<DashboardIcon size={18} />} href="/admin" />
        <NavItem label="Posts" icon={<PostsIcon size={18} />} href="/admin/posts" count={publishedCount} />
        <NavItem label="New Post" icon={<PlusIcon size={18} />} href="/admin/editor" badge="New" badgeType="violet" />

        <SectionLabel text="Content" />
        <NavItem label="Media Library" icon={<MediaIcon size={18} />} href="/admin/media" />
        <NavItem label="Drafts" icon={<DraftsIcon size={18} />} href="/admin/drafts" count={draftsCount} />
        <NavItem label="Tags" icon={<TagsIcon size={18} />} href="/admin/tags" />

        <SectionLabel text="Feeds" />
        <NavItem label="DEV.to Feed" icon={<RssIcon size={18} />} href="/admin/feeds/devto" />
        <NavItem label="Hacker News" icon={<HnIcon size={18} />} href="/admin/feeds/hn" />
        <NavItem label="Curation" icon={<CurationIcon size={18} />} href="/admin/curation" />

        <SectionLabel text="System" />
        <NavItem label="Settings" icon={<SettingsIcon size={18} />} href="/admin/settings" />
        <NavItem label="Analytics" icon={<AnalyticsIcon size={18} />} href="/admin/analytics" />
        <NavItem label="Deploy Log" icon={<DeployIcon size={18} />} href="/admin/deploys" />
      </nav>

      {/* 3. Quick Stats */}
      <div className="px-5 py-4 border-t border-slate-200/60 select-none bg-slate-50/40">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">
          Quick Stats
        </div>
        <div className="space-y-2 text-[12px] font-semibold">
          <div className="flex justify-between items-center text-slate-500">
            <span>Posts this month</span>
            <span className="text-slate-800 font-bold">{postsThisMonth}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Last deploy</span>
            <span className="text-slate-800 font-bold">{lastDeployTime}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Site status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 font-bold text-[11.5px]">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. User Profile */}
      <div className="px-5 py-4 border-t border-slate-200/60 flex items-center justify-between select-none bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden relative bg-violet-600 border border-slate-200 flex items-center justify-center font-bold text-sm text-white shadow-sm">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-slate-800 truncate leading-none mb-1 max-w-[110px]">
              {session?.user?.name || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-450 leading-none">
              via {session?.user?.provider ? (session.user.provider.charAt(0).toUpperCase() + session.user.provider.slice(1)) : 'OAuth'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOutClick}
          className={`h-7 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            confirmSignOut
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:border-slate-300 hover:text-red-550'
          }`}
          title={confirmSignOut ? 'Click again to log out' : 'Sign out'}
        >
          {confirmSignOut ? (
            <span className="text-[11px] font-bold tracking-wide">Sure?</span>
          ) : (
            <LogoutIcon size={15} />
          )}
        </button>
      </div>

    </aside>
  );
}
