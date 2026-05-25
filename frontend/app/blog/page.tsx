import { getAllPosts } from '@/lib/posts';
import BlogTabs from '@/components/BlogTabs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publications Feed - DevBlog',
  description: 'Articles and developer guides on web frameworks, backend systems, and frontend aesthetics.',
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="py-12">
      <div className="mb-16 text-left max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-4 leading-tight">
          📚 Publications Feed
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Deep-dives into software design, tutorial series, and engineering paradigms curated for modern builders.
        </p>
      </div>

      <BlogTabs localPosts={posts} />
    </div>
  );
}
