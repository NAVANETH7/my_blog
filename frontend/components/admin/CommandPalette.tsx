"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Fuse from 'fuse.js';
import {
  SearchIcon,
  PlusIcon,
  MediaIcon,
  WorldIcon,
  LogoutIcon,
  DashboardIcon,
  PostsIcon,
  EditIcon,
  TagsIcon,
  SettingsIcon,
  AnalyticsIcon,
  DeployIcon,
  DraftsIcon,
} from './Icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  group: 'Actions' | 'Navigation' | 'Posts';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'default' | 'violet' | 'amber' | 'emerald';
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load posts for indexing
  useEffect(() => {
    if (!isOpen) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts?includeDrafts=true');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Error fetching posts for command palette:', err);
      }
    };
    fetchPosts();
  }, [isOpen]);

  // Handle focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // static items
  const staticItems: CommandItem[] = [
    // Actions Group
    {
      id: 'act-new-post',
      group: 'Actions',
      title: 'New post',
      subtitle: 'Create a new blog post',
      badge: 'Action',
      badgeType: 'violet',
      icon: <PlusIcon size={16} className="text-violet-400" />,
      action: () => {
        router.push('/admin/editor');
        onClose();
      },
    },
    {
      id: 'act-upload',
      group: 'Actions',
      title: 'Upload image',
      subtitle: 'Add new image or asset',
      badge: 'Action',
      badgeType: 'violet',
      icon: <MediaIcon size={16} className="text-teal-400" />,
      action: () => {
        router.push('/admin/media');
        onClose();
      },
    },
    {
      id: 'act-live',
      group: 'Actions',
      title: 'View live blog',
      subtitle: 'Open the public website',
      badge: 'Live',
      badgeType: 'emerald',
      icon: <WorldIcon size={16} className="text-emerald-400" />,
      action: () => {
        window.open('/blog', '_blank');
        onClose();
      },
    },
    {
      id: 'act-logout',
      group: 'Actions',
      title: 'Sign out',
      subtitle: 'Log out of admin panel',
      icon: <LogoutIcon size={16} className="text-red-400" />,
      action: () => {
        signOut({ callbackUrl: '/admin/login' });
      },
    },
    // Navigation Group
    {
      id: 'nav-dash',
      group: 'Navigation',
      title: 'Go to Dashboard',
      subtitle: 'Admin overview metrics',
      icon: <DashboardIcon size={16} />,
      action: () => {
        router.push('/admin');
        onClose();
      },
    },
    {
      id: 'nav-posts',
      group: 'Navigation',
      title: 'Go to Posts Manager',
      subtitle: 'List & modify posts',
      icon: <PostsIcon size={16} />,
      action: () => {
        router.push('/admin/posts');
        onClose();
      },
    },
    {
      id: 'nav-editor',
      group: 'Navigation',
      title: 'Go to Editor',
      subtitle: 'Write markdown content',
      icon: <EditIcon size={16} />,
      action: () => {
        router.push('/admin/editor');
        onClose();
      },
    },
    {
      id: 'nav-media',
      group: 'Navigation',
      title: 'Go to Media Library',
      subtitle: 'Manage uploads',
      icon: <MediaIcon size={16} />,
      action: () => {
        router.push('/admin/media');
        onClose();
      },
    },
    {
      id: 'nav-drafts',
      group: 'Navigation',
      title: 'Go to Drafts',
      subtitle: 'Unpublished articles',
      icon: <DraftsIcon size={16} />,
      action: () => {
        router.push('/admin/drafts');
        onClose();
      },
    },
    {
      id: 'nav-tags',
      group: 'Navigation',
      title: 'Go to Tags Manager',
      subtitle: 'Manage tags taxonomy',
      icon: <TagsIcon size={16} />,
      action: () => {
        router.push('/admin/tags');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      group: 'Navigation',
      title: 'Go to Settings',
      subtitle: 'Configure CMS & integrations',
      icon: <SettingsIcon size={16} />,
      action: () => {
        router.push('/admin/settings');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      group: 'Navigation',
      title: 'Go to Analytics',
      subtitle: 'View blog metrics',
      icon: <AnalyticsIcon size={16} />,
      action: () => {
        router.push('/admin/analytics');
        onClose();
      },
    },
    {
      id: 'nav-deploys',
      group: 'Navigation',
      title: 'Go to Deploy Logs',
      subtitle: 'View commit timeline',
      icon: <DeployIcon size={16} />,
      action: () => {
        router.push('/admin/deploys');
        onClose();
      },
    },
  ];

  // Convert posts to command items
  const postItems: CommandItem[] = posts.map((post) => ({
    id: `post-${post.slug}`,
    group: 'Posts',
    title: post.title,
    subtitle: post.summary || `Created on ${post.date}`,
    badge: post.draft ? 'Draft' : 'Published',
    badgeType: post.draft ? 'amber' : 'emerald',
    icon: <PostsIcon size={16} className={post.draft ? 'text-amber-400' : 'text-emerald-400'} />,
    action: () => {
      router.push(`/admin/editor?slug=${post.slug}`);
      onClose();
    },
  }));

  const allItems = [...staticItems, ...postItems];

  // Setup Fuse.js
  const fuse = new Fuse(allItems, {
    keys: ['title', 'subtitle', 'group'],
    threshold: 0.35,
  });

  const filteredItems = search
    ? fuse.search(search).map((res) => res.item)
    : allItems.slice(0, 15); // Show first 15 default actions & navigations when empty

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        const listHeight = listRef.current.clientHeight;
        const activeTop = activeEl.offsetTop;
        const activeHeight = activeEl.clientHeight;

        if (activeTop + activeHeight > listRef.current.scrollTop + listHeight) {
          listRef.current.scrollTop = activeTop + activeHeight - listHeight;
        } else if (activeTop < listRef.current.scrollTop) {
          listRef.current.scrollTop = activeTop;
        }
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered items for rendering
  const groups: Record<string, CommandItem[]> = {};
  filteredItems.forEach((item) => {
    if (!groups[item.group]) {
      groups[item.group] = [];
    }
    groups[item.group].push(item);
  });

  // Flat list reference for index matching
  const flatFilteredList: CommandItem[] = [];
  const groupKeys = Object.keys(groups);
  groupKeys.forEach((groupName) => {
    flatFilteredList.push(...groups[groupName]);
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[6px] flex justify-center pt-[15vh] px-4 font-sans transition-all duration-200"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[560px] h-[450px] bg-white/90 border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 glow-card-3d">
        
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/60 bg-white/50">
          <SearchIcon size={20} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent outline-none border-none text-slate-800 placeholder-slate-400 font-sans text-[15px] font-medium"
            placeholder="Search posts, navigate, or run actions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 select-none font-bold">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar bg-slate-50/20"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-[14px] text-slate-500 font-semibold">No results found for "{search}"</span>
            </div>
          ) : (
            Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                  {groupName}
                </div>
                {items.map((item) => {
                  const globalIndex = flatFilteredList.findIndex((fi) => fi.id === item.id);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-violet-50 text-slate-900 border-l-2 border-violet-600 pl-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                          : 'text-slate-600 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex-shrink-0 ${isSelected ? 'text-violet-600' : 'text-slate-450'}`}>
                          {item.icon}
                        </span>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className={`text-[13.5px] font-semibold truncate ${isSelected ? 'text-slate-800' : 'text-slate-700'}`}>
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-450'}`}>
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            item.badgeType === 'violet'
                              ? 'bg-violet-50 text-violet-650 border-violet-100'
                              : item.badgeType === 'amber'
                              ? 'bg-amber-50 text-amber-650 border-amber-100'
                              : item.badgeType === 'emerald'
                              ? 'bg-emerald-50 text-emerald-650 border-emerald-100'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-sans font-semibold select-none">
          <div className="flex items-center gap-1">
            <span>Use</span>
            <span className="px-1.5 py-0.2 bg-white border border-slate-200 rounded font-bold text-[9.5px]">↑↓</span>
            <span>to navigate</span>
            <span className="ml-1.5">and</span>
            <span className="px-1.5 py-0.2 bg-white border border-slate-200 rounded font-bold text-[9.5px]">ENTER</span>
            <span>to select</span>
          </div>
          <span>CMS Command Center</span>
        </div>

      </div>
    </div>
  );
}
