"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  PlusIcon,
  ExternalIcon,
} from './Icons';

// Import MD Editor css dynamically on client side
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false, loading: () => (
    <div className="h-[400px] w-full bg-white/2 border border-white/6 rounded-2xl flex items-center justify-center animate-pulse text-zinc-500 font-sans text-[13px]">
      Loading Markdown editor workspace...
    </div>
  )}
);

interface EditorClientProps {
  initialPost?: any | null;
  allTags?: string[];
}

export default function EditorClient({ initialPost, allTags }: EditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slugParam = searchParams ? searchParams.get('slug') : null;
  const [isPending, startTransition] = useTransition();

  // Loading States
  const [postsLoading, setPostsLoading] = useState(!!slugParam && !initialPost);
  const [tagsLoading, setTagsLoading] = useState(!allTags);

  // Core Editor States
  const [title, setTitle] = useState(initialPost?.frontmatter?.title || '');
  const [slug, setSlug] = useState(initialPost?.frontmatter?.slug || '');
  const [summary, setSummary] = useState(initialPost?.frontmatter?.summary || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [tags, setTags] = useState<string[]>(initialPost?.frontmatter?.tags || []);
  const [date, setDate] = useState(initialPost?.frontmatter?.date || new Date().toISOString().split('T')[0]);
  const [draft, setDraft] = useState(initialPost?.frontmatter?.draft !== false);
  const [coverImage, setCoverImage] = useState(initialPost?.frontmatter?.coverImage || '');
  const [originalSlug, setOriginalSlug] = useState(initialPost?.frontmatter?.slug || '');
  const [availableTags, setAvailableTags] = useState<string[]>(allTags || []);

  // UI States
  const [isDirty, setIsDirty] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(!!initialPost || !!slugParam);

  // Client-side fetch
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (slugParam && !initialPost) {
          const res = await fetch(`/api/posts/${slugParam}`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setTitle(data.frontmatter?.title || '');
            setSlug(data.frontmatter?.slug || '');
            setSummary(data.frontmatter?.summary || '');
            setContent(data.content || '');
            setTags(data.frontmatter?.tags || []);
            setDate(data.frontmatter?.date || new Date().toISOString().split('T')[0]);
            setDraft(data.frontmatter?.draft !== false);
            setCoverImage(data.frontmatter?.coverImage || '');
            setOriginalSlug(data.frontmatter?.slug || '');
            setIsSlugLocked(true);
          }
        }
        if (!allTags) {
          const res = await fetch('/api/tags');
          if (res.ok && isMounted) {
            const data = await res.json();
            setAvailableTags(data);
          }
        }
      } catch (err) {
        console.error('Error fetching editor data client-side:', err);
      } finally {
        if (isMounted) {
          setPostsLoading(false);
          setTagsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slugParam, initialPost, allTags]);

  const [showPreview, setShowPreview] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [isTagAutocompleteOpen, setIsTagAutocompleteOpen] = useState(false);
  
  // AI Assist panel states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Deletion state
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isSlugLocked && !initialPost) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [title, isSlugLocked, initialPost]);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Leave anyway?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Word count & reading time calculations
  const stats = React.useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(Math.ceil(words / 200), 1);
    return { words, minutes };
  }, [content]);

  // Handle saving post
  const handleSave = async (isPublishing = false) => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const res = await fetch('/api/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: originalSlug || slug, // keep original slug during edit unless explicitly renamed
          newSlug: slug,
          title,
          tags,
          summary,
          draft: isPublishing ? false : draft,
          content,
          date,
          coverImage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsDirty(false);
        toast.success(isPublishing ? 'Post published and deployed! 🚀' : 'Draft saved!');
        
        if (!initialPost) {
          // Redirect to edit mode for the newly created post
          router.replace(`/admin/editor?slug=${data.slug}`);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving post');
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const uploadToast = toast.loading('Uploading asset...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
        // Insert cover image tag at the top of the content
        setContent((prev: string) => `![cover](${data.url})\n\n` + prev);
        setIsDirty(true);
        toast.success('Image uploaded and inserted!', { id: uploadToast });
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Upload failed', { id: uploadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed due to connection error', { id: uploadToast });
    }
  };

  // Delete post handler
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${initialPost.frontmatter.slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsDirty(false);
        toast.success('Post deleted successfully');
        router.push('/admin/posts');
      } else {
        toast.error('Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error');
    }
  };

  // Tag interactions
  const handleAddTag = (tag: string) => {
    const cleaned = tag.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned) && tags.length < 10) {
      setTags([...tags, cleaned]);
      setIsDirty(true);
    }
    setTagInput('');
    setIsTagAutocompleteOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setIsDirty(true);
  };

  // AI assistant stream query
  const handleAiCall = async (action: string, customPrompt = '') => {
    setAiResponse('');
    setAiLoading(true);
    setIsAiOpen(true);

    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          content,
          title,
          summary,
          prompt: customPrompt,
        }),
      });

      if (!response.body) {
        toast.error('API return body stream is empty');
        setAiLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setAiResponse((prev: string) => prev + chunkValue);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Request failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-inject AI recommendations
  const handleInjectAiContent = (field: 'summary' | 'content' | 'title') => {
    if (!aiResponse) return;
    if (field === 'summary') {
      setSummary(aiResponse.trim());
      setIsDirty(true);
      toast.success('Summary updated!');
    } else if (field === 'title') {
      // Suggestion usually yields alternative titles, extract the first one
      const match = aiResponse.match(/\d\.\s*(.+)/);
      const suggested = match ? match[1] : aiResponse.trim();
      setTitle(suggested);
      setIsDirty(true);
      toast.success('Title updated!');
    } else if (field === 'content') {
      setContent((prev: string) => prev + '\n\n' + aiResponse);
      setIsDirty(true);
      toast.success('AI content appended to post!');
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Leave anyway?')) {
        e.preventDefault();
        return;
      }
    }
  };

  if (postsLoading || tagsLoading) {
    return (
      <div className="h-[calc(100vh-60px)] w-full bg-slate-50/50 border border-slate-200 rounded-2xl flex items-center justify-center animate-pulse text-slate-500 font-sans text-[13px]">
        Loading editor workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] font-sans relative overflow-hidden">
      
      {/* 1. Header Top Bar */}
      <div className="h-14 border-b border-slate-200/50 flex items-center justify-between px-6 shrink-0 select-none bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href="/admin/posts" onClick={handleBackClick} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[13px] font-bold transition-colors shrink-0">
            <ArrowLeftIcon size={14} />
            <span>Back</span>
          </Link>
          <span className="text-slate-300 font-normal">|</span>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            placeholder="Untitled post..."
            className="w-full bg-transparent border-none outline-none text-[18px] font-bold text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {isDirty && (
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[11px] uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved</span>
            </div>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 py-1.8 rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={() => handleSave(false)}
            className="px-3.5 py-1.8 rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="px-4 py-1.8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-bold shadow-sm shadow-violet-500/10 transition-all cursor-pointer"
          >
            Publish
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN A: METADATA PANEL (left, 320px) */}
        <aside className="w-[320px] shrink-0 border-r border-slate-200/50 overflow-y-auto p-5 space-y-5 bg-white/75 backdrop-blur-md custom-scrollbar select-none">
          <h2 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Post Metadata</h2>
          
          {/* Status Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-bold text-slate-500">Publication Status</label>
            <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => { setDraft(true); setIsDirty(true); }}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  draft
                    ? 'bg-amber-50 text-amber-700 border border-amber-250 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => { setDraft(false); setIsDirty(true); }}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  !draft
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-bold text-slate-500">Publish Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setIsDirty(true); }}
              className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none"
            />
          </div>

          {/* Slug Lock Box */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11.5px] font-bold text-slate-500">Post URL Slug</label>
              <button
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={isSlugLocked ? 'Unlock slug to edit' : 'Lock slug'}
              >
                {isSlugLocked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
              </button>
            </div>
            <input
              type="text"
              value={slug}
              disabled={isSlugLocked}
              onChange={(e) => { setSlug(e.target.value); setIsDirty(true); }}
              className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full disabled:opacity-45 disabled:bg-slate-100/50 outline-none font-mono"
            />
            {!isSlugLocked && (
              <span className="text-[10px] text-amber-600 font-bold block leading-tight">
                ⚠️ Warning: Changing the URL slug will break existing direct links.
              </span>
            )}
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-bold text-slate-500">Cover Image</label>
            
            {coverImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-xs">
                <img src={coverImage} alt="Cover image preview" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                  <button
                    onClick={() => { setCoverImage(''); setIsDirty(true); }}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 transition-all cursor-pointer text-[12px] font-bold"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <label className="border border-dashed border-slate-200 hover:border-violet-500/50 hover:bg-violet-50 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-150 bg-slate-50/50">
                <PlusIcon size={20} className="text-slate-400 mb-1" />
                <span className="text-[12px] font-bold text-slate-500">Upload cover image</span>
                <span className="text-[10px] text-slate-400 mt-1 block font-semibold">JPG, PNG, WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Tags manager */}
          <div className="space-y-1.5 relative">
            <label className="text-[11.5px] font-bold text-slate-500">Tags (Max 10)</label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[42px]">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 border border-violet-100 text-violet-650 text-[10.5px] font-bold">
                  <span>{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="text-violet-500 hover:text-violet-750 font-extrabold cursor-pointer">×</button>
                </span>
              ))}
              {tags.length < 10 && (
                <input
                  type="text"
                  placeholder={tags.length === 0 ? "Add tag..." : ""}
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setIsTagAutocompleteOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (tagInput.trim()) handleAddTag(tagInput);
                    }
                  }}
                  className="bg-transparent border-none outline-none text-[12.5px] text-slate-700 flex-1 min-w-[60px] font-semibold"
                />
              )}
            </div>
            
            {/* Autocomplete */}
            {isTagAutocompleteOpen && tagInput && (
              <div className="absolute left-0 right-0 mt-1 z-25 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {availableTags
                  .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
                  .map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTag(t)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-[12.5px] text-slate-700 cursor-pointer font-bold"
                    >
                      {t}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-50 text-[12.5px] text-violet-650 font-bold cursor-pointer border-t border-slate-100"
                >
                  Create tag "{tagInput}"
                </button>
              </div>
            )}
          </div>

          {/* Summary Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11.5px] font-bold text-slate-500">Post Summary</label>
              <span className={`text-[10px] font-bold ${summary.length > 140 ? 'text-red-650 font-bold' : 'text-slate-400'}`}>
                {summary.length} / 160
              </span>
            </div>
            <textarea
              value={summary}
              maxLength={160}
              onChange={(e) => { setSummary(e.target.value); setIsDirty(true); }}
              placeholder="Write a brief excerpt for index pages..."
              rows={3}
              className="admin-input-3d px-3 py-2 text-[13px] font-bold w-full outline-none font-sans resize-none"
            />
          </div>

          {/* Google SEO Mock Box */}
          <div className="space-y-2 border-t border-slate-150 pt-4">
            <label className="text-[11px] font-extrabold text-slate-400 tracking-wider block uppercase">Google Search Preview</label>
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-[12px] font-sans shadow-xs">
              <span className="text-violet-600 hover:underline cursor-pointer font-bold block truncate max-w-full">
                {title || 'Untitled Post'}
              </span>
              <span className="text-[10.5px] text-slate-450 block mt-0.5 truncate max-w-full font-semibold">
                localhost:3000/blog/{slug || 'untitled-post'}
              </span>
              <p className="text-slate-600 text-[11px] mt-1 leading-normal line-clamp-2 font-semibold">
                {summary || 'No summary excerpt provided yet. Google will crawl a fallback text snippet here.'}
              </p>
            </div>
          </div>

          {/* Info stats */}
          <div className="flex justify-between items-center text-[11px] text-slate-450 font-bold border-t border-slate-150 pt-4">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.minutes} min read</span>
          </div>

          {/* Delete Button (Edit Mode only) */}
          {initialPost && (
            <div className="pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={handleDelete}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer font-bold text-[12.5px] ${
                  confirmDelete
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <TrashIcon size={14} />
                <span>{confirmDelete ? 'Confirm delete?' : 'Delete post'}</span>
              </button>
            </div>
          )}

        </aside>

        {/* COLUMN B: MARKDOWN EDITOR (center, flex-1) */}
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
          
          <div className="flex-1 overflow-auto custom-scrollbar" data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => { setContent(val || ''); setIsDirty(true); }}
              height="100%"
              preview="edit"
              visibleDragbar={false}
            />
          </div>

          {/* Floating Sparkles Trigger Button */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-650 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.3)] hover:scale-110 active:scale-95 transition-all duration-150 z-30 cursor-pointer border border-violet-400/20 group"
            title="Open AI Writing Assistant"
          >
            <span className="animate-pulse group-hover:scale-110 duration-200 text-white font-sans text-lg font-bold">✨</span>
          </button>
        </div>

        {/* COLUMN C: LIVE PREVIEW (right, 320px or collapsible) */}
        {showPreview && (
          <aside className="w-[320px] shrink-0 border-l border-slate-200/50 overflow-y-auto p-5 space-y-4 bg-white/70 backdrop-blur-md custom-scrollbar select-none">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[11px] font-bold text-slate-450 tracking-wider uppercase">Live Preview</h2>
              {initialPost && (
                <a
                  href={`/blog/${initialPost.frontmatter.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-violet-650 font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>Open in blog</span>
                  <ExternalIcon size={11} />
                </a>
              )}
            </div>

            <article className="prose prose-slate max-w-full text-[13px] leading-relaxed select-text font-sans">
              <h1 className="text-[20px] font-bold text-slate-800 border-b border-slate-150 pb-2 mb-3 leading-tight">
                {title || 'Untitled Post'}
              </h1>
              {coverImage && (
                <img src={coverImage} alt="Cover image preview" className="rounded-xl border border-slate-200 w-full mb-4" />
              )}
              {content ? (
                <div className="whitespace-pre-wrap font-sans text-slate-700 font-semibold leading-relaxed">
                  {content.slice(0, 800)}
                  {content.length > 800 && <span className="text-slate-450 block mt-2 italic font-medium">Content truncated in sidebar preview...</span>}
                </div>
              ) : (
                <span className="text-slate-400 italic font-semibold">No content written yet. Use markdown text to populate this article.</span>
              )}
            </article>
          </aside>
        )}

      </div>

      {/* 3. Claude AI Assist Panel overlay (slide-in, 400px wide) */}
      {isAiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-[400px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between select-none animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-violet-600 text-lg font-bold">✨</span>
              <h2 className="text-[14.5px] font-bold text-slate-800 tracking-tight">AI Writing Assistant</h2>
            </div>
            <button
              onClick={() => setIsAiOpen(false)}
              className="text-slate-400 hover:text-slate-650 font-extrabold text-base cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Action Grid & Stream Window */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white">
            
            {/* Quick Prompts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Preset Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAiCall('improve_summary')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Improve summary
                </button>
                <button
                  onClick={() => handleAiCall('suggest_title')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Suggest title
                </button>
                <button
                  onClick={() => handleAiCall('generate_tags')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Generate tags
                </button>
                <button
                  onClick={() => handleAiCall('fix_grammar')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Fix grammar
                </button>
                <button
                  onClick={() => handleAiCall('expand_paragraph')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Expand paragraph
                </button>
                <button
                  onClick={() => handleAiCall('add_code')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-650 rounded-xl text-[11.5px] font-bold text-slate-600 text-left transition-all duration-150 cursor-pointer disabled:opacity-40"
                >
                  Add code example
                </button>
              </div>
            </div>

            {/* AI Streaming Response Window */}
            {(aiLoading || aiResponse) && (
              <div className="space-y-2 select-text">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Claude Response</span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] leading-relaxed text-slate-850 font-sans whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar relative font-medium shadow-xs">
                  {aiLoading && !aiResponse && (
                    <span className="text-slate-450 animate-pulse italic font-semibold">Thinking...</span>
                  )}
                  {aiResponse}
                </div>

                {/* Inject triggers */}
                {aiResponse && !aiLoading && (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleInjectAiContent('title')}
                      className="px-2.5 py-1.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-650 text-[11.5px] font-bold border border-violet-200 cursor-pointer"
                    >
                      Use Title
                    </button>
                    <button
                      onClick={() => handleInjectAiContent('summary')}
                      className="px-2.5 py-1.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-650 text-[11.5px] font-bold border border-violet-200 cursor-pointer"
                    >
                      Use Summary
                    </button>
                    <button
                      onClick={() => handleInjectAiContent('content')}
                      className="px-2.5 py-1.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-650 text-[11.5px] font-bold border border-violet-200 cursor-pointer"
                    >
                      Append to post
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Input Prompt Box */}
          <div className="p-4 border-t border-slate-150 bg-slate-50/50 space-y-2">
            <span className="text-[10.5px] font-bold text-slate-450 tracking-wider uppercase">Free Prompt</span>
            <div className="flex gap-2 items-end">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to write a specific section or guide..."
                rows={2}
                className="admin-input-3d px-3 py-2 text-[12.5px] focus:border-violet-500 w-full outline-none font-sans resize-none font-bold"
              />
              <button
                onClick={() => {
                  if (aiPrompt.trim()) {
                    handleAiCall('free_prompt', aiPrompt);
                    setAiPrompt('');
                  }
                }}
                disabled={aiLoading || !aiPrompt.trim()}
                className="h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 cursor-pointer shadow-sm shadow-violet-500/10"
              >
                🚀
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
