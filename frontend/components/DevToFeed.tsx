"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UnifiedArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  cover_image: string | null;
  tags: string[];
  readingTime: string;
  date: string;
  authorName: string;
  authorImage: string | null;
  source: 'devto' | 'hn';
}

export default function DevToFeed() {
  const { data: session } = useSession();
  const [source, setSource] = useState<'devto' | 'hn'>('devto');
  const [articles, setArticles] = useState<UnifiedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side Curation States
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [editedArticles, setEditedArticles] = useState<Record<string, { title: string; description: string }>>({});
  const [editingArticle, setEditingArticle] = useState<{ id: string; title: string; description: string } | null>(null);

  // Load local curation overrides from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHidden = localStorage.getItem('curated_hidden_articles');
      const savedEdited = localStorage.getItem('curated_edited_articles');
      if (savedHidden) {
        setHiddenIds(JSON.parse(savedHidden));
      }
      if (savedEdited) {
        setEditedArticles(JSON.parse(savedEdited));
      }
    }
  }, []);

  const fetchFeed = async (feedSource: 'devto' | 'hn') => {
    setLoading(true);
    setError(null);
    try {
      if (feedSource === 'devto') {
        const res = await fetch('https://dev.to/api/articles?tag=engineering&per_page=9');
        if (!res.ok) throw new Error('Failed to fetch DEV.to engineering articles.');
        const data = await res.json();
        
        const mapped: UnifiedArticle[] = data.map((item: any) => ({
          id: `devto-${item.id}`,
          title: item.title,
          description: item.description || '',
          url: item.url,
          cover_image: item.cover_image || item.social_image,
          tags: item.tag_list || [],
          readingTime: `${item.reading_time_minutes} min read`,
          date: item.published_at,
          authorName: item.user.name,
          authorImage: item.user.profile_image,
          source: 'devto',
        }));
        setArticles(mapped);
      } else {
        // Query Algolia Hacker News search API for software engineering stories
        const res = await fetch('https://hn.algolia.com/api/v1/search?query=software%20engineering&tags=story&hitsPerPage=9');
        if (!res.ok) throw new Error('Failed to fetch Hacker News engineering threads.');
        const data = await res.json();
        
        const mapped: UnifiedArticle[] = data.hits.map((item: any) => ({
          id: `hn-${item.objectID}`,
          title: item.title,
          description: item.story_text || `Hacker News discussion thread with ${item.points} points.`,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          cover_image: null,
          tags: ['hackernews', 'software', 'engineering'],
          readingTime: `${Math.ceil((item.story_text || '').split(/\s+/).length / 200) || 3} min read`,
          date: item.created_at,
          authorName: item.author,
          authorImage: null,
          source: 'hn',
        }));
        setArticles(mapped);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error fetching feed data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(source);
  }, [source]);

  // Curation Operations
  const handleDelete = (id: string) => {
    if (!session) return;
    const updated = [...hiddenIds, id];
    setHiddenIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curated_hidden_articles', JSON.stringify(updated));
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingArticle) return;
    
    const updated = {
      ...editedArticles,
      [editingArticle.id]: {
        title: editingArticle.title,
        description: editingArticle.description,
      },
    };
    setEditedArticles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('curated_edited_articles', JSON.stringify(updated));
    }
    setEditingArticle(null);
  };

  const handleResetCuration = () => {
    if (!session) return;
    if (confirm('Are you sure you want to reset all edits and deleted items for these feeds?')) {
      setHiddenIds([]);
      setEditedArticles({});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('curated_hidden_articles');
        localStorage.removeItem('curated_edited_articles');
      }
    }
  };

  // Filter & Modify Articles dynamically based on client-side Curation state
  const curatedArticles = articles
    .filter((a) => !hiddenIds.includes(a.id))
    .map((a) => {
      if (editedArticles[a.id]) {
        return {
          ...a,
          title: editedArticles[a.id].title,
          description: editedArticles[a.id].description,
        };
      }
      return a;
    });

  const hasCuration = hiddenIds.length > 0 || Object.keys(editedArticles).length > 0;

  return (
    <div>
      {/* Source toggles and curation tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Source Toggle Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800/40 select-none">
          <button
            onClick={() => setSource('devto')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              source === 'devto'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            💻 DEV.to Feed
          </button>
          <button
            onClick={() => setSource('hn')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              source === 'hn'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            🧠 Hacker News Feed
          </button>
        </div>

        {/* Reset Curation Tool */}
        {session && hasCuration && (
          <button
            onClick={handleResetCuration}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer bg-red-50/50 dark:bg-red-950/10 px-3.5 py-2 border border-red-200/30 dark:border-red-900/20 rounded-xl"
          >
            🗑️ Reset Feed Overrides
          </button>
        )}
      </div>

      {loading ? (
        // Skeleton loader grid
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden h-[450px] flex flex-col justify-between p-6">
              <div className="space-y-4 w-full">
                <div className="h-40 bg-slate-100 dark:bg-slate-850 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/4" />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8">
          <div className="text-4xl mb-3 select-none">⚠️</div>
          <p className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">{error}</p>
          <button
            onClick={() => fetchFeed(source)}
            className="mt-2 text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
          >
            🔄 Try Refreshing Feed
          </button>
        </div>
      ) : curatedArticles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8">
          <p className="text-slate-500 dark:text-slate-400 text-base font-semibold">No articles remaining in this feed view.</p>
          <button
            onClick={handleResetCuration}
            className="mt-4 text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
          >
            Restore Hidden Articles
          </button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {curatedArticles.map((article) => {
            const hasBeenEdited = !!editedArticles[article.id];
            
            return (
              <article
                key={article.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-100 dark:hover:border-indigo-950 transition-all duration-500 flex flex-col justify-between h-[450px]"
              >
                {/* Accent indicator border */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${hasBeenEdited ? 'from-amber-400 to-amber-600 opacity-100' : 'from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100'} transition-all duration-350`} />

                <div className="flex flex-col flex-1">
                  {/* Card Cover Image */}
                  <div className="h-40 relative bg-slate-100 dark:bg-slate-800 overflow-hidden select-none border-b border-slate-100 dark:border-slate-850/30">
                    {article.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      // Render code-abstract visual gradients for articles lacking images (HN)
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 flex flex-col items-center justify-center p-4">
                        <span className="text-4xl mb-1 select-none">
                          {article.source === 'hn' ? '🧠' : '💻'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {article.source === 'hn' ? 'Hacker News' : 'DEV.to'}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-900/80 text-white backdrop-blur-xs select-none">
                      {article.source === 'hn' ? 'HN Discussion' : 'DEV.to Post'}
                    </span>
                    
                    {hasBeenEdited && (
                      <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white shadow-xs select-none">
                        ✏️ Locally Edited
                      </span>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="p-6 pb-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
                      <time dateTime={article.date}>
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {article.readingTime}
                      </span>
                    </div>

                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-1">
                        {article.title}
                      </h3>
                    </a>

                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Footer Curation Actions & Details */}
                <div className="px-6 pb-6 pt-2">
                  {/* Author Profile */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 pt-4 mb-3">
                    <div className="flex items-center gap-2">
                      {article.authorImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.authorImage}
                          alt=""
                          className="w-5 h-5 rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {article.authorName[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 line-clamp-1 max-w-[100px]">
                        {article.authorName}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[110px] justify-end">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border border-slate-200/20 dark:border-slate-850 font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Simulated CRUD Controls (Delete / Edit buttons) */}
                  {session && (
                    <div className="flex gap-2 w-full pt-1">
                      <button
                        onClick={() => setEditingArticle({ id: article.id, title: article.title, description: article.description })}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-850 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold rounded-lg border border-slate-200/20 dark:border-slate-800/40 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-red-50 dark:bg-slate-850 dark:hover:bg-red-950/20 text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 text-xs font-bold rounded-lg border border-slate-200/20 dark:border-slate-800/40 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        🗑️ Hide/Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Curation Edit Dialog Modal */}
      {session && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">
              ✏️ Edit External Article (Local UI Override)
            </h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-650 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description / Summary
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingArticle.description}
                  onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-955 border border-slate-200/60 dark:border-slate-855 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-650 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-850/50">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  Save Local Overrides
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
