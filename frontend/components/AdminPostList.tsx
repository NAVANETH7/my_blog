'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Frontmatter } from '@/lib/posts';

interface AdminPostListProps {
  initialPosts: Frontmatter[];
}

export default function AdminPostList({ initialPosts }: AdminPostListProps) {
  const [posts, setPosts] = useState<Frontmatter[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.summary.toLowerCase().includes(search.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post? This will delete the file permanently.')) {
      return;
    }

    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
      } else {
        const data = await res.json();
        alert(`Failed to delete post: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete request failed:', err);
      alert('An error occurred while deleting the post.');
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Post Manager</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, or delete markdown publications.
          </p>
        </div>
        <Link
          href="/admin/editor"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Post
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, summary, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition-all shadow-xs"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-md">
        {filteredPosts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
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
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v3.75m-9.75-3h.008v.008H12V6.75z"
              />
            </svg>
            <p className="text-base font-semibold">No posts found</p>
            <p className="text-sm mt-1">Try checking for spelling or create a new post.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-955/50 border-b border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                {filteredPosts.map((post) => (
                  <tr key={post.slug} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {post.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-400">
                      {post.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.draft ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                          Published
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/30 font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <div className="flex justify-end gap-4">
                        <Link
                          href={`/admin/editor?slug=${post.slug}`}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-semibold"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          disabled={deletingSlug === post.slug}
                          className="text-red-500 hover:text-red-600 disabled:text-slate-400 font-semibold cursor-pointer transition-colors"
                        >
                          {deletingSlug === post.slug ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
