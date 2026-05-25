"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PostsIcon,
  DraftsIcon,
  TagsIcon,
  FlameIcon,
  PlusIcon,
  MediaIcon,
  WorldIcon,
  EditIcon,
  ExternalIcon,
  TrashIcon,
  ArrowRightIcon,
  DeployIcon,
} from './Icons';

interface DashboardClientProps {
  initialPosts?: any[];
  initialTags?: string[];
  initialCommits?: any[];
}

function CountUpNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const end = value;
    const duration = 1200; // 1.2 seconds
    const stepTime = Math.max(Math.floor(duration / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
}

export default function DashboardClient({
  initialPosts,
  initialTags,
  initialCommits,
}: DashboardClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts || []);
  const [tags, setTags] = useState(initialTags || []);
  const [commits, setCommits] = useState(initialCommits || []);
  const [loading, setLoading] = useState(!initialPosts && !initialTags && !initialCommits);
  const [greeting, setGreeting] = useState('Welcome back');
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // Client-side fetch
  useEffect(() => {
    if (!loading) return;

    let isMounted = true;
    async function fetchData() {
      try {
        const [postsRes, tagsRes, commitsRes] = await Promise.all([
          fetch('/api/posts?includeDrafts=true'),
          fetch('/api/tags'),
          fetch('/api/deploys'),
        ]);

        if (!isMounted) return;

        let fetchedPosts = [];
        let fetchedTags = [];
        let fetchedCommits = [];

        if (postsRes.ok) fetchedPosts = await postsRes.json();
        if (tagsRes.ok) fetchedTags = await tagsRes.json();
        if (commitsRes.ok) fetchedCommits = await commitsRes.json();

        setPosts(fetchedPosts);
        setTags(fetchedTags);
        setCommits(fetchedCommits);
      } catch (err) {
        console.error('Error fetching dashboard data on client:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [loading]);

  // Time-based greeting
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting('Good morning');
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Good afternoon');
    } else if (hours >= 17 && hours < 21) {
      setGreeting('Good evening');
    } else {
      setGreeting('Working late');
    }
  }, []);

  // Compute Stats
  const publishedCount = posts.filter(p => !p.draft).length;
  const draftsCount = posts.filter(p => p.draft).length;
  
  // Calculate deploy streak (days since last commit containing 'fail' or default to 14)
  const getDeployStreak = () => {
    const failedCommit = commits.find(c => c.message.toLowerCase().includes('fail'));
    if (!failedCommit) return 14; // Default streak if no failures
    const failedDate = new Date(failedCommit.date);
    const diffTime = Math.abs(Date.now() - failedDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const streakDays = getDeployStreak();

  // Delete handler
  const handleDeletePost = async (slug: string) => {
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted successfully');
        setPosts(prev => prev.filter(p => p.slug !== slug));
        setDeleteConfirmSlug(null);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting the post');
    }
  };

  // Toggle draft handler
  const handleToggleDraft = async (slug: string) => {
    try {
      const res = await fetch('/api/posts/toggle-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.draft ? 'Post reverted to draft' : 'Post published!');
        setPosts(prev =>
          prev.map(p => (p.slug === slug ? { ...p, draft: data.draft } : p))
        );
      } else {
        toast.error('Failed to toggle publication status');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    }
  };

  // Get commit status config
  const getCommitConfig = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('delete') || msg.includes('remove')) {
      return { color: 'text-red-600 bg-red-50 border border-red-200/50', iconColor: 'text-red-600' };
    }
    if (msg.includes('save') || msg.includes('create') || msg.includes('publish') || msg.includes('add')) {
      return { color: 'text-emerald-600 bg-emerald-50 border border-emerald-200/50', iconColor: 'text-emerald-600' };
    }
    return { color: 'text-slate-600 bg-slate-50 border border-slate-200/50', iconColor: 'text-slate-600' };
  };

  // Format relative date for commits
  const formatCommitDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Recent';
    }
  };

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      
      {/* Page Title Header */}
      <div className="flex flex-col gap-1.5 select-none animate-in fade-in slide-in-from-top-4 duration-300">
        <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight">
          {greeting}, Navaneth 👋
        </h1>
        <p className="text-[14px] text-slate-500 font-semibold">
          Here's what's happening with your blog today.
        </p>
      </div>

      {/* SECTION A: STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Card 1: Total Posts */}
        <div className="glow-card-3d p-5 group select-none">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="p-2 rounded-xl bg-violet-100 border border-violet-200/60 text-violet-650 group-hover:scale-110 transition-transform duration-200">
              <PostsIcon size={18} />
            </span>
            <span className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Total Posts</span>
          </div>
          {loading ? (
            <div className="h-[36px] w-16 bg-slate-200/60 rounded-xl animate-pulse mb-2" />
          ) : (
            <div className="text-[36px] font-bold text-slate-850 leading-none mb-2">
              <CountUpNumber value={publishedCount} />
            </div>
          )}
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
            {loading ? (
              <span className="h-3 w-20 bg-slate-100/80 rounded animate-pulse" />
            ) : (
              <span className="text-emerald-600 font-bold">+3 this month</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Drafts */}
        <div className="glow-card-3d p-5 group select-none">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="p-2 rounded-xl bg-amber-100 border border-amber-200/60 text-amber-600 group-hover:scale-110 transition-transform duration-200">
              <DraftsIcon size={18} />
            </span>
            <span className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Total Drafts</span>
          </div>
          {loading ? (
            <div className="h-[36px] w-16 bg-slate-200/60 rounded-xl animate-pulse mb-2" />
          ) : (
            <div className="text-[36px] font-bold text-slate-850 leading-none mb-2">
              <CountUpNumber value={draftsCount} />
            </div>
          )}
          <div className="text-[11.5px] text-slate-500 font-semibold">
            {loading ? <span className="h-3.5 w-24 bg-slate-100/80 rounded animate-pulse block" /> : 'Awaiting publication'}
          </div>
        </div>

        {/* Card 3: Total Tags */}
        <div className="glow-card-3d p-5 group select-none">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="p-2 rounded-xl bg-emerald-100 border border-emerald-200/60 text-emerald-600 group-hover:scale-110 transition-transform duration-200">
              <TagsIcon size={18} />
            </span>
            <span className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Total Tags</span>
          </div>
          {loading ? (
            <div className="h-[36px] w-16 bg-slate-200/60 rounded-xl animate-pulse mb-2" />
          ) : (
            <div className="text-[36px] font-bold text-slate-850 leading-none mb-2">
              <CountUpNumber value={tags.length} />
            </div>
          )}
          <div className="text-[11.5px] text-slate-500 font-semibold">
            {loading ? <span className="h-3.5 w-24 bg-slate-100/80 rounded animate-pulse block" /> : 'Unique taxonomies'}
          </div>
        </div>

        {/* Card 4: Deploy Streak */}
        <div className="glow-card-3d p-5 group select-none">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="p-2 rounded-xl bg-rose-100 border border-rose-200/60 text-rose-600 group-hover:scale-110 transition-transform duration-200">
              <FlameIcon size={18} />
            </span>
            <span className="text-[11px] font-extrabold text-slate-450 tracking-wider uppercase">Deploy Streak</span>
          </div>
          {loading ? (
            <div className="h-[36px] w-16 bg-slate-200/60 rounded-xl animate-pulse mb-2" />
          ) : (
            <div className="text-[36px] font-bold text-slate-850 leading-none mb-2">
              <CountUpNumber value={streakDays} />
            </div>
          )}
          <div className="text-[11.5px] text-slate-500 font-semibold">
            {loading ? <span className="h-3.5 w-24 bg-slate-100/80 rounded animate-pulse block" /> : 'Days without failures'}
          </div>
        </div>

      </div>

      {/* SECTION B & C: RECENT POSTS TABLE & ACTIVITY FEED */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Posts Table */}
        <div className="xl:col-span-2 glow-card-3d p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 select-none">
              <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Recent posts</h2>
              <Link href="/admin/posts" className="text-[12.5px] font-bold text-violet-600 hover:text-violet-850 flex items-center gap-1 transition-colors duration-150">
                <span>View all</span>
                <ArrowRightIcon size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 py-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                    <div className="h-4.5 bg-slate-200/80 rounded-lg animate-pulse w-1/3" />
                    <div className="h-4 bg-slate-200/80 rounded-md animate-pulse w-16" />
                    <div className="h-4 bg-slate-200/80 rounded-md animate-pulse w-20" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-12" />
                  </div>
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                <PostsIcon size={40} className="text-slate-400 mx-auto mb-3" />
                <h3 className="text-[15px] font-bold text-slate-700 mb-1">No posts yet</h3>
                <p className="text-[12.5px] text-slate-500 mb-4 max-w-[280px] mx-auto">Create your first blog post to populate your CMS database.</p>
                <button
                  onClick={() => router.push('/admin/editor')}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-750 text-white text-[12px] font-bold transition-all duration-150 cursor-pointer shadow-sm shadow-violet-500/10"
                >
                  Write your first post
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="pb-3.5 font-extrabold">Title</th>
                      <th className="pb-3.5 font-extrabold">Status</th>
                      <th className="pb-3.5 font-extrabold">Tags</th>
                      <th className="pb-3.5 font-extrabold">Date</th>
                      <th className="pb-3.5 font-extrabold">Reading</th>
                      <th className="pb-3.5 text-right font-extrabold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px] font-medium">
                    {recentPosts.map((post) => (
                      <tr key={post.slug} className="group hover:bg-slate-50/60 transition-colors duration-150">
                        {/* Title */}
                        <td className="py-3.5 pr-3 max-w-[220px]">
                          <Link href={`/admin/editor?slug=${post.slug}`} className="text-slate-800 hover:text-violet-600 font-semibold truncate block transition-colors duration-150">
                            {post.title}
                          </Link>
                        </td>
                        {/* Status */}
                        <td className="py-3.5">
                          {post.draft ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[10.5px] font-bold tracking-wide">
                              Draft
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10.5px] font-bold tracking-wide">
                              Published
                            </span>
                          )}
                        </td>
                        {/* Tags */}
                        <td className="py-3.5 pr-2 max-w-[120px]">
                          <div className="flex items-center gap-1 truncate">
                            {post.tags && post.tags.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="px-1.5 py-0.2 rounded bg-violet-50 border border-violet-100/80 text-violet-650 text-[10px] font-bold">
                                {tag}
                              </span>
                            ))}
                            {post.tags && post.tags.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Date */}
                        <td className="py-3.5 text-slate-500 whitespace-nowrap">
                          {post.date ? format(parseISO(post.date), 'MMM d') : '-'}
                        </td>
                        {/* Reading Time */}
                        <td className="py-3.5 text-slate-400 whitespace-nowrap">
                          {post.readingTime || '1 min'}
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          {deleteConfirmSlug === post.slug ? (
                            <div className="flex justify-end gap-1.5 items-center">
                              <span className="text-[11px] text-red-650 font-bold">Delete?</span>
                              <button
                                onClick={() => handleDeletePost(post.slug)}
                                className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] font-bold transition-all duration-150 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmSlug(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[11px] font-bold transition-all duration-150 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={() => router.push(`/admin/editor?slug=${post.slug}`)}
                                className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all duration-150 cursor-pointer"
                                title="Edit Post"
                              >
                                <EditIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleDraft(post.slug)}
                                className={`p-1 rounded border transition-all duration-150 cursor-pointer ${
                                  post.draft
                                    ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50'
                                }`}
                                title={post.draft ? 'Publish Post' : 'Revert to Draft'}
                              >
                                <ExternalIcon size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmSlug(post.slug)}
                                className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all duration-150 cursor-pointer"
                                title="Delete Post"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deploy Activity Feed */}
        <div className="glow-card-3d p-6 flex flex-col justify-between select-none">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight mb-5">
              Deploy activity
            </h2>
            
            {loading ? (
              <div className="space-y-4 py-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 animate-pulse shrink-0 block" />
                      {i !== 5 && <span className="w-[1px] h-9 bg-slate-200 my-1 block" />}
                    </div>
                    <div className="flex-1 space-y-2 mt-0.5">
                      <div className="h-4 bg-slate-200/80 rounded-lg animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-md animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commits.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <DeployIcon size={24} className="mx-auto mb-2 text-slate-350" />
                <span className="text-[12.5px] font-bold block">No commit activity available</span>
              </div>
            ) : (
              <div className="space-y-4">
                {commits.slice(0, 8).map((commit, index) => {
                  const cfg = getCommitConfig(commit.message);
                  
                  return (
                    <div key={commit.hash || index} className="flex gap-3 text-[12.5px] items-start group">
                      
                      {/* Left timeline nodes */}
                      <div className="flex flex-col items-center h-full pt-1">
                        <span className={`w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 ${cfg.color}`} />
                        {index !== commits.slice(0, 8).length - 1 && (
                          <span className="w-[1px] h-9 bg-slate-200 group-hover:bg-slate-350 transition-colors duration-150 my-1" />
                        )}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 leading-tight">
                        <p className="text-slate-700 font-semibold line-clamp-1 group-hover:text-slate-950 transition-colors duration-150">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-450 font-bold mt-1">
                          <span className="truncate max-w-[80px] font-extrabold text-slate-600">
                            {commit.author_name || 'Navaneth'}
                          </span>
                          <span>•</span>
                          <span>{formatCommitDate(commit.date)}</span>
                          {commit.hash && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-violet-600 bg-violet-50 px-1 py-0.2 rounded border border-violet-200/50">
                                {commit.hash.slice(0, 7)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION D: QUICK ACTIONS */}
      <div className="space-y-4 select-none">
        <h2 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase px-1">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Action 1: Write New Post */}
          <Link href="/admin/editor" className="glow-card-3d p-5 group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-violet-100 border border-violet-200/60 text-violet-650 group-hover:scale-105 transition-transform duration-200">
                <EditIcon size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-0.5">Write new post</h3>
                <p className="text-[11.5px] text-slate-500 font-semibold">Publish with one click</p>
              </div>
            </div>
            <ArrowRightIcon size={16} className="text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>

          {/* Action 2: Upload Media */}
          <Link href="/admin/media" className="glow-card-3d p-5 group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-teal-100 border border-teal-200/60 text-teal-650 group-hover:scale-105 transition-transform duration-200">
                <MediaIcon size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-0.5">Upload media</h3>
                <p className="text-[11.5px] text-slate-500 font-semibold">Add images to libraries</p>
              </div>
            </div>
            <ArrowRightIcon size={16} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>

          {/* Action 3: Manage Tags */}
          <Link href="/admin/tags" className="glow-card-3d p-5 group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-100 border border-amber-200/60 text-amber-600 group-hover:scale-105 transition-transform duration-200">
                <TagsIcon size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-0.5">Manage tags</h3>
                <p className="text-[11.5px] text-slate-500 font-semibold">Organise taxonomy</p>
              </div>
            </div>
            <ArrowRightIcon size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>

          {/* Action 4: View Live Blog */}
          <a href="/blog" target="_blank" rel="noopener noreferrer" className="glow-card-3d p-5 group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-200/60 text-emerald-600 group-hover:scale-105 transition-transform duration-200">
                <WorldIcon size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-0.5">View live blog</h3>
                <p className="text-[11.5px] text-slate-500 font-semibold">Check user experience</p>
              </div>
            </div>
            <ArrowRightIcon size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
          </a>

        </div>
      </div>

    </div>
  );
}
