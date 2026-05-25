import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import MDXContent from '@/components/MDXContent';
import ViewCounter from '@/components/ViewCounter';
import ReadingProgress from '@/components/ReadingProgress';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const { title, summary, tags, date } = post.frontmatter;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-blog.com';

  return {
    title: `${title} - The Developer Blog`,
    description: summary,
    openGraph: {
      title,
      description: summary,
      type: 'article',
      publishedTime: date,
      url: `${siteUrl}/blog/${resolvedParams.slug}`,
      tags,
    },
    twitter: {
      card: 'summary',
      title,
      description: summary,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const { title, date, readingTime, tags } = post.frontmatter;

  return (
    <>
      <ReadingProgress />
      <article className="max-w-3xl mx-auto py-12">
        <div className="mb-10">
          <Link
            href="/blog"
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors mb-8 group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Back to all posts
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6 leading-tight">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <time dateTime={date} className="font-medium text-slate-400 dark:text-slate-500">
              {date
                ? new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown Date'}
            </time>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="font-medium">{readingTime}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <ViewCounter slug={resolvedParams.slug} trackView={true} />
            {tags.length > 0 && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag.toLowerCase()}`}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <hr className="border-slate-200/60 dark:border-slate-800/60" />
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <MDXContent source={post.content} />
        </div>
      </article>
    </>
  );
}
