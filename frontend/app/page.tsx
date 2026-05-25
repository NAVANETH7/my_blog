import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import ThreeScene from '@/components/ThreeScene';
import BlogHeader from '@/components/BlogHeader';
import BlogFooter from '@/components/BlogFooter';

export const metadata = {
  title: 'DevBlog - Modern Git-Backed Tech Blog & CMS',
  description: 'A cutting-edge tech blog exploring Next.js, React, and modern software architecture.',
};

export default async function HomePage() {
  const posts = (await getAllPosts()).slice(0, 3); // Get top 3 recent posts

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      <BlogHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Latest Tech &amp; Architecture
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              A Modern Space for <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Creative Developers
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Exploring cutting-edge software design, headless architectures, and hands-on developer guides. Backed by GitHub, managed with Markdown.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/blog"
                className="px-6 py-3.5 rounded-xl bg-accent text-white font-medium shadow-md shadow-indigo-100 dark:shadow-none hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Read the Blog
              </Link>
              <Link
                href="/admin"
                className="px-6 py-3.5 rounded-xl border border-card-border bg-card-bg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Access CMS
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 w-full flex justify-center items-center">
            <div className="w-full">
              <ThreeScene />
            </div>
          </div>
        </section>

        {/* Featured Publications Section */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Recent Publications
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Freshly committed insights directly from our GitHub repository.
              </p>
            </div>
            <Link
              href="/blog"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover transition-colors group"
            >
              See all articles
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-card-bg/50 border border-card-border rounded-3xl">
              <p className="text-slate-500 dark:text-slate-400">No blog posts available yet. Fire up the admin panel and write your first post!</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div key={post.slug} className="h-full">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BlogFooter />
    </div>
  );
}
