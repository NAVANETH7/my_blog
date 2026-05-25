import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getAllTags } from '@/lib/posts';
import PostCard from '@/components/PostCard';

export const dynamic = 'force-dynamic';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const capitalizedTag = decodedTag.charAt(0).toUpperCase() + decodedTag.slice(1);
  return {
    title: `Posts Tagged "${capitalizedTag}" - The Developer Blog`,
    description: `Browse all articles tagged with ${decodedTag}.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag).toLowerCase();
  
  const allPosts = await getAllPosts();
  const filteredPosts = allPosts.filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(decodedTag)
  );

  if (filteredPosts.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-10">
        <Link
          href="/blog"
          className="text-sm font-medium text-accent hover:text-accent-hover inline-flex items-center gap-1.5 transition-colors mb-4"
        >
          &larr; Back to all posts
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Posts tagged with <span className="text-accent">#{decodedTag}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Found {filteredPosts.length} {filteredPosts.length === 1 ? 'publication' : 'publications'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredPosts.map((post) => (
          <div key={post.slug} className="h-full">
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
