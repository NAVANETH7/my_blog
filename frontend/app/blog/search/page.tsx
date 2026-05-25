'use client';

import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import PostCard from '@/components/PostCard';
import { Frontmatter } from '@/lib/posts';

// Custom useDebounce hook to prevent excessive search updates
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const [posts, setPosts] = useState<Frontmatter[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchSearchIndex = async () => {
      try {
        const res = await fetch('/api/posts/search');
        if (!res.ok) {
          throw new Error('Failed to load search data');
        }
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'Error occurred fetching search index';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchIndex();
  }, []);

  // Configure fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'tags', weight: 0.3 },
        { name: 'summary', weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [posts]);

  // Compute search results based on debounced query
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return posts;
    }
    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [debouncedQuery, fuse, posts]);

  return (
    <div className="py-12">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl leading-tight">
          Search Publications
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
          Find tutorials, guides, and thoughts by typing keywords.
        </p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Type search queries (e.g. Next.js, typescript, setup)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-5 py-4 pl-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition-all shadow-xs"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
              />
            </svg>
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm">Loading search database...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
            <span>
              Showing {searchResults.length} of {posts.length} publications
            </span>
            {debouncedQuery && (
              <span>
                Fuzzy search matched {searchResults.length} results
              </span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto text-slate-400 mb-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
              <p className="text-base font-semibold">No publications found</p>
              <p className="text-sm mt-1 text-slate-400">
                We couldn&apos;t find any matching results for &ldquo;{debouncedQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {searchResults.map((post) => (
                <div key={post.slug} className="h-full">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
