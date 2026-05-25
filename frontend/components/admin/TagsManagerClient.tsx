"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  TagsIcon,
  EditIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from './Icons';

interface TagsManagerClientProps {
  initialPosts: any[];
  initialTags: string[];
}

export default function TagsManagerClient({
  initialPosts,
  initialTags,
}: TagsManagerClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [tags, setTags] = useState(initialTags);
  const [renameTag, setRenameTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeSourceTag, setMergeSourceTag] = useState<string | null>(null);
  const [mergeTargetTag, setMergeTargetTag] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate post counts per tag dynamically
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    // Initialize tags
    tags.forEach(t => {
      stats[t] = 0;
    });

    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach((tag: string) => {
          stats[tag] = (stats[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [posts, tags]);

  // Rename tag handler
  const handleRenameTag = async (oldTag: string) => {
    const cleaned = renameValue.trim().toLowerCase();
    if (!cleaned) {
      toast.error('Tag name cannot be empty');
      return;
    }
    if (cleaned === oldTag) {
      setRenameTag(null);
      return;
    }

    setLoading(true);
    const renameToast = toast.loading(`Renaming "${oldTag}" to "${cleaned}"...`);

    try {
      const res = await fetch('/api/tags/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTag, newTag: cleaned }),
      });

      if (res.ok) {
        toast.success(`Tag renamed successfully!`, { id: renameToast });
        // Update tags list
        setTags(prev => prev.map(t => (t === oldTag ? cleaned : t)));
        // Update local posts tags
        setPosts(prev =>
          prev.map(p => {
            if (p.tags && p.tags.includes(oldTag)) {
              return { ...p, tags: p.tags.map((t: string) => (t === oldTag ? cleaned : t)) };
            }
            return p;
          })
        );
        setRenameTag(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to rename tag', { id: renameToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred', { id: renameToast });
    } finally {
      setLoading(false);
    }
  };

  // Merge tag handler
  const handleMergeTag = async () => {
    if (!mergeSourceTag || !mergeTargetTag) {
      toast.error('Please select a target tag');
      return;
    }
    if (mergeSourceTag === mergeTargetTag) {
      toast.error('Cannot merge a tag into itself');
      return;
    }

    setLoading(true);
    const mergeToast = toast.loading(`Merging "${mergeSourceTag}" into "${mergeTargetTag}"...`);

    try {
      const res = await fetch('/api/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTag: mergeSourceTag, targetTag: mergeTargetTag }),
      });

      if (res.ok) {
        toast.success('Tags merged successfully!', { id: mergeToast });
        // Remove source tag from list
        setTags(prev => prev.filter(t => t !== mergeSourceTag));
        // Update posts
        setPosts(prev =>
          prev.map(p => {
            if (p.tags && p.tags.includes(mergeSourceTag)) {
              const updatedTags = p.tags.filter((t: string) => t !== mergeSourceTag);
              if (!updatedTags.includes(mergeTargetTag)) {
                updatedTags.push(mergeTargetTag);
              }
              return { ...p, tags: updatedTags };
            }
            return p;
          })
        );
        setMergeSourceTag(null);
        setMergeTargetTag('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to merge tags', { id: mergeToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during merge', { id: mergeToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header */}
      <div className="flex justify-between items-center select-none animate-in fade-in slide-in-from-top-4 duration-300">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-2">
            Tags
          </h1>
          <p className="text-[13px] text-slate-500 font-semibold">
            Manage your taxonomy and rename or merge topics dynamically
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-violet-650 text-[12.5px] font-bold">
          {tagStats.length} Unique tags
        </span>
      </div>

      {/* 2. Tags Grid list */}
      {tagStats.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-slate-200 rounded-2xl select-none bg-slate-50/50">
          <TagsIcon size={48} className="text-slate-350 mx-auto mb-3" />
          <h3 className="text-[16px] font-bold text-slate-700 mb-1">No tags found</h3>
          <p className="text-[12.5px] text-slate-450 font-semibold">Create tags in post editor metadata panels.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tagStats.map(([tagName, postCount]) => {
            const isEditing = renameTag === tagName;

            return (
              <div
                key={tagName}
                className="glow-card-3d p-5 rounded-2xl flex flex-col justify-between h-[135px] group select-none relative"
              >
                {/* Pill Top & Rename Action toggles */}
                <div className="flex justify-between items-start">
                  {isEditing ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameTag(tagName);
                        if (e.key === 'Escape') setRenameTag(null);
                      }}
                      className="admin-input-3d px-2.5 py-1 text-[12.5px] outline-none w-full mr-2 font-mono font-bold"
                      autoFocus
                    />
                  ) : (
                    <span className="px-2.5 py-0.8 rounded-lg bg-violet-50 border border-violet-100/80 text-violet-650 text-[11.5px] font-bold tracking-wide truncate max-w-[150px]">
                      {tagName}
                    </span>
                  )}

                  {!isEditing && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-155 shrink-0">
                      <button
                        onClick={() => {
                          setRenameTag(tagName);
                          setRenameValue(tagName);
                        }}
                        className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 cursor-pointer"
                        title="Rename Tag"
                      >
                        <EditIcon size={12} />
                      </button>
                      <button
                        onClick={() => setMergeSourceTag(tagName)}
                        className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
                        title="Merge Tag"
                      >
                        <ArrowRightIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Substats */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[12.5px] text-slate-500 font-semibold">{postCount} posts</span>
                  <Link
                    href={`/admin/posts?tag=${tagName}`}
                    className="text-[11.5px] font-bold text-violet-650 hover:text-violet-850 flex items-center gap-0.5 transition-all duration-150 decoration-violet-500 hover:underline"
                  >
                    <span>View posts</span>
                    <ArrowRightIcon size={11} />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. Merge Tags Modal dialog */}
      {mergeSourceTag && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[8px] flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 select-none animate-in zoom-in-95 duration-150 space-y-4">
            
            {/* Modal Head */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Merge Tag</h3>
              <button
                onClick={() => { setMergeSourceTag(null); setMergeTargetTag(''); }}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="space-y-3.5">
              <p className="text-[12.5px] text-slate-500 leading-relaxed font-semibold">
                Merge all articles tagged <span className="font-bold text-violet-650 font-mono">"{mergeSourceTag}"</span> into another tag. The source tag will be deleted permanently.
              </p>

              {/* Selector */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-bold text-slate-400">Select Target Tag</label>
                <div className="relative">
                  <select
                    value={mergeTargetTag}
                    onChange={(e) => setMergeTargetTag(e.target.value)}
                    className="appearance-none w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-[13px] text-slate-700 outline-none focus:border-violet-500 cursor-pointer pr-9 font-bold shadow-xs"
                  >
                    <option value="">-- Choose target tag --</option>
                    {tags
                      .filter(t => t !== mergeSourceTag)
                      .map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                  </select>
                  <ChevronDownIcon size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-150">
              <button
                onClick={() => { setMergeSourceTag(null); setMergeTargetTag(''); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650 text-[12px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeTag}
                disabled={loading || !mergeTargetTag}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-violet-500/10"
              >
                Merge tags
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
