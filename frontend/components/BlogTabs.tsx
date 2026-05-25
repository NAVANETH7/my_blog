"use client";

import { useState } from 'react';
import { Frontmatter } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import DevToFeed from '@/components/DevToFeed';

interface BlogTabsProps {
  localPosts: Frontmatter[];
}

export default function BlogTabs({ localPosts }: BlogTabsProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'external'>('local');

  return (
    <div>
      {/* Sleek Tab Toggles */}
      <div className="flex gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-4 mb-10 select-none">
        <button
          onClick={() => setActiveTab('local')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'local'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          ✍️ MDX Publications
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'external'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          🚀 Global Engineering Feed
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'local' ? (
        <div>
          {localPosts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl">
              <p className="text-slate-500 dark:text-slate-400 text-lg">No publications available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {localPosts.map((post) => (
                <div key={post.slug} className="h-full">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <DevToFeed />
      )}
    </div>
  );
}
