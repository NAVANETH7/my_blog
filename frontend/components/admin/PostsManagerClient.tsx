"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import Fuse from 'fuse.js';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  ExternalIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from './Icons';

interface PostsManagerClientProps {
  initialPosts: any[];
  initialTags: string[];
  defaultStatusFilter?: 'all' | 'published' | 'drafts';
}

export default function PostsManagerClient({
  initialPosts,
  initialTags,
  defaultStatusFilter = 'all',
}: PostsManagerClientProps) {
  const router = useRouter();
  
  // State
  const [posts, setPosts] = useState(initialPosts);
  const [tags] = useState(initialTags);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'drafts'>(defaultStatusFilter);
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  // Checkbox Selection
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Inline confirmation & row expansion
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Published / Draft stats count
  const publishedCount = posts.filter(p => !p.draft).length;
  const draftsCount = posts.filter(p => p.draft).length;

  // Tag filter helper
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  // Bulk select toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSlugs(paginatedPosts.map(p => p.slug));
    } else {
      setSelectedSlugs([]);
    }
  };

  const handleSelectRow = (slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Toggle draft status
  const handleToggleDraft = async (slug: string) => {
    // Optimistic Update
    const originalPosts = [...posts];
    const postToToggle = posts.find(p => p.slug === slug);
    if (!postToToggle) return;

    setPosts(prev =>
      prev.map(p => (p.slug === slug ? { ...p, draft: !p.draft } : p))
    );

    try {
      const res = await fetch('/api/posts/toggle-draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      const data = await res.json();
      toast.success(data.draft ? 'Reverted to draft' : 'Published post!');
    } catch (err) {
      console.error(err);
      toast.error('Could not toggle draft status. Reverting change.');
      setPosts(originalPosts);
    }
  };

  // Delete post
  const handleDeletePost = async (slug: string) => {
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Post deleted successfully');
        setPosts(prev => prev.filter(p => p.slug !== slug));
        setSelectedSlugs(prev => prev.filter(s => s !== slug));
        setDeleteConfirmSlug(null);
      } else {
        toast.error('Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    setBulkLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        selectedSlugs.map(async (slug) => {
          const post = posts.find(p => p.slug === slug);
          if (post && post.draft) {
            const res = await fetch('/api/posts/toggle-draft', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug }),
            });
            if (res.ok) successCount++;
          }
        })
      );
      toast.success(`Published ${successCount} posts!`);
      // Reload posts
      const res = await fetch('/api/posts?includeDrafts=true');
      if (res.ok) setPosts(await res.json());
      setSelectedSlugs([]);
    } catch (err) {
      console.error(err);
      toast.error('Error during bulk publication');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDraft = async () => {
    setBulkLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        selectedSlugs.map(async (slug) => {
          const post = posts.find(p => p.slug === slug);
          if (post && !post.draft) {
            const res = await fetch('/api/posts/toggle-draft', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug }),
            });
            if (res.ok) successCount++;
          }
        })
      );
      toast.success(`Reverted ${successCount} posts to drafts`);
      const res = await fetch('/api/posts?includeDrafts=true');
      if (res.ok) setPosts(await res.json());
      setSelectedSlugs([]);
    } catch (err) {
      console.error(err);
      toast.error('Error reverting posts to drafts');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedSlugs.length} posts permanently?`)) return;
    setBulkLoading(true);
    let successCount = 0;
    try {
      await Promise.all(
        selectedSlugs.map(async (slug) => {
          const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
          if (res.ok) successCount++;
        })
      );
      toast.success(`Successfully deleted ${successCount} posts`);
      setPosts(prev => prev.filter(p => !selectedSlugs.includes(p.slug)));
      setSelectedSlugs([]);
    } catch (err) {
      console.error(err);
      toast.error('Error deleting posts');
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter, Search, Sort logic
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Status Filter
    if (statusFilter === 'published') {
      result = result.filter(p => !p.draft);
    } else if (statusFilter === 'drafts') {
      result = result.filter(p => p.draft);
    }

    // Selected Tags
    if (selectedTags.length > 0) {
      result = result.filter(p =>
        selectedTags.every(t => p.tags && p.tags.includes(t))
      );
    }

    // Search query using Fuse.js if query exists
    if (search.trim() !== '') {
      const fuse = new Fuse(result, {
        keys: ['title', 'summary', 'tags'],
        threshold: 0.35,
      });
      result = fuse.search(search).map(r => r.item);
    }

    // Sort key logic
    if (sortKey === 'newest') {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortKey === 'oldest') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortKey === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [posts, search, statusFilter, sortKey, selectedTags]);

  // Pagination logic
  const totalPages = Math.max(Math.ceil(filteredAndSortedPosts.length / itemsPerPage), 1);
  
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPosts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedPosts, currentPage]);

  const handleJumpToPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Detect selection checks
  const isAllSelectedOnPage = useMemo(() => {
    if (paginatedPosts.length === 0) return false;
    return paginatedPosts.every(p => selectedSlugs.includes(p.slug));
  }, [paginatedPosts, selectedSlugs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none animate-in fade-in slide-in-from-top-4 duration-350">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-2">
            Posts
          </h1>
          <p className="text-[13px] text-slate-500 font-semibold">
            {publishedCount} published · {draftsCount} drafts
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/editor')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-750 text-white text-[13px] font-bold transition-all duration-150 shadow-[0_4px_12px_rgba(124,58,237,0.15)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusIcon size={15} />
          <span>New Post</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="p-4 glow-card-3d flex flex-col gap-4 select-none">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search box */}
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/50 focus-within:border-violet-500/50 focus-within:bg-white transition-all duration-150">
            <SearchIcon size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search posts..."
              className="bg-transparent border-none outline-none text-slate-850 placeholder-slate-400 font-sans text-[13.5px] w-full font-medium"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Segmented Controls: Status Filter */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shrink-0">
            {(['all', 'published', 'drafts'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold uppercase tracking-wide transition-all duration-150 cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white text-violet-600 border border-slate-200/50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortKey}
              onChange={(e: any) => setSortKey(e.target.value)}
              className="appearance-none bg-slate-100/50 border border-slate-200 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:text-slate-800 hover:border-slate-350 cursor-pointer outline-none w-full md:w-auto pr-9"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="az">Sort: A–Z</option>
            </select>
            <ChevronDownIcon size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Tag Dropdown Filter */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-slate-100/50 border border-slate-200 px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:text-slate-800 hover:border-slate-350 cursor-pointer w-full md:w-auto"
            >
              <span>Tags Filter ({selectedTags.length})</span>
              <ChevronDownIcon size={14} className="text-slate-500" />
            </button>
            {isTagDropdownOpen && (
              <div className="absolute right-0 mt-2 z-20 w-52 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-2 custom-scrollbar">
                {tags.length === 0 ? (
                  <div className="py-2 text-center text-slate-400 text-[12px]">No tags found</div>
                ) : (
                  tags.map(tag => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-[12.5px] text-slate-700 select-none font-semibold"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTagToggle(tag)}
                          className="rounded accent-violet-650 border-slate-200"
                        />
                        <span>{tag}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>

        {/* Selected tag chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-2.5 py-0.8 rounded-lg bg-violet-50 border border-violet-100/80 text-violet-650 text-[11.5px] font-bold"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="text-violet-550 hover:text-violet-850 font-extrabold cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-[11.5px] text-slate-500 hover:text-slate-700 font-bold ml-1.5"
            >
              Clear all
            </button>
          </div>
        )}

      </div>

      {/* 3. Posts Table Card */}
      <div className="glow-card-3d overflow-hidden flex flex-col justify-between">
        
        {paginatedPosts.length === 0 ? (
          <div className="py-24 text-center select-none">
            <SearchIcon size={48} className="text-slate-350 mx-auto mb-3" />
            <h3 className="text-[17px] font-bold text-slate-600 mb-1">No posts found</h3>
            <p className="text-[13px] text-slate-400 font-semibold">Adjust your search or filter tags query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/20">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelectedOnPage}
                      onChange={handleSelectAll}
                      className="rounded accent-violet-650 border-slate-200"
                    />
                  </th>
                  <th className="py-3.5 px-3 font-extrabold">Title</th>
                  <th className="py-3.5 px-3 font-extrabold">Status</th>
                  <th className="py-3.5 px-3 font-extrabold">Tags</th>
                  <th className="py-3.5 px-3 font-extrabold">Date</th>
                  <th className="py-3.5 px-3 font-extrabold">Reading</th>
                  <th className="py-3.5 px-4 text-right font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13.5px] font-medium">
                {paginatedPosts.map((post) => {
                  const isChecked = selectedSlugs.includes(post.slug);
                  const isConfirmingDelete = deleteConfirmSlug === post.slug;

                  return (
                    <React.Fragment key={post.slug}>
                      <tr className={`group hover:bg-slate-50/50 transition-colors duration-150 ${isChecked ? 'bg-violet-50/30' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-4 px-4">
                          <input
                             type="checkbox"
                             checked={isChecked}
                             onChange={() => handleSelectRow(post.slug)}
                             className="rounded accent-violet-650 border-slate-200"
                          />
                        </td>
                        {/* Title */}
                        <td className="py-4 px-3 max-w-[280px]">
                          <Link href={`/admin/editor?slug=${post.slug}`} className="text-slate-800 hover:text-violet-600 font-bold truncate block hover:underline transition-colors duration-150 decoration-violet-500">
                            {post.title}
                          </Link>
                        </td>
                        {/* Status */}
                        <td className="py-4 px-3">
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
                        <td className="py-4 px-3 max-w-[150px]">
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
                        <td className="py-4 px-3 text-slate-500 whitespace-nowrap">
                          {post.date ? format(parseISO(post.date), 'MMM d, yyyy') : '-'}
                        </td>
                        {/* Reading Time */}
                        <td className="py-4 px-3 text-slate-400 whitespace-nowrap">
                          {post.readingTime || '1 min'}
                        </td>
                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => router.push(`/admin/editor?slug=${post.slug}`)}
                              className="p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all duration-150 cursor-pointer"
                              title="Edit"
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleDraft(post.slug)}
                              className={`p-1.5 rounded border transition-all duration-150 cursor-pointer ${
                                post.draft
                                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50'
                              }`}
                              title={post.draft ? 'Publish' : 'Revert to Draft'}
                            >
                              <ExternalIcon size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmSlug(post.slug)}
                              className="p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all duration-150 cursor-pointer"
                              title="Delete"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Confirmation Row */}
                      {isConfirmingDelete && (
                        <tr className="bg-red-50/20">
                          <td colSpan={7} className="py-3 px-6 border-b border-red-150">
                            <div className="flex justify-between items-center text-[13px]">
                              <span className="text-red-650 font-bold flex items-center gap-1.5">
                                <TrashIcon size={14} />
                                Delete this post permanently? This breaks existing URLs.
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeletePost(post.slug)}
                                  className="px-3 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] font-bold transition-all duration-150 cursor-pointer shadow-xs"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmSlug(null)}
                                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 text-[11px] font-bold transition-all duration-150 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Table Pagination controls */}
        <div className="px-6 py-4 border-t border-slate-200/50 flex items-center justify-between text-[13px] text-slate-500 select-none bg-slate-50/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-45 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 cursor-pointer transition-all duration-150 font-bold"
            >
              <ArrowLeftIcon size={13} />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-45 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 cursor-pointer transition-all duration-150 font-bold"
            >
              <span>Next</span>
              <ArrowRightIcon size={13} />
            </button>
          </div>

          <div className="flex items-center gap-2 font-semibold">
            <span>Page {currentPage} of {totalPages}</span>
            <span>•</span>
            <span>Jump to page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handleJumpToPage}
              className="w-12 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-center outline-none text-slate-800 focus:border-violet-500 font-bold shadow-xs"
            />
          </div>
        </div>

      </div>

      {/* 5. Sticky Bulk Actions Bar */}
      {selectedSlugs.length > 0 && (
        <div className="fixed bottom-6 left-[280px] right-6 z-50 bg-white/85 border border-slate-200 shadow-2xl backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center justify-between select-none animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-violet-600 animate-ping" />
            <span className="text-[13.5px] font-bold text-slate-700">
              {selectedSlugs.length} selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkPublish}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 text-[12.5px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Publish selected
            </button>
            <button
              onClick={handleBulkDraft}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 text-[12.5px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Draft selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-250 text-red-700 text-[12.5px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelectedSlugs([])}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[12.5px] font-bold transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
