import Link from 'next/link';
import { Frontmatter } from '@/lib/posts';

interface PostCardProps {
  post: Frontmatter;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group relative p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-indigo-100 dark:hover:border-indigo-950 transition-all duration-300 flex flex-col justify-between h-full">
      {/* Dynamic hover accent border */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
          <time dateTime={post.date} className="font-semibold text-slate-400 dark:text-slate-500">
            {post.date
              ? new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Unknown Date'}
          </time>
          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full font-semibold text-slate-600 dark:text-slate-300">
            {post.readingTime}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
          {post.summary}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/blog/tag/${tag.toLowerCase()}`}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all font-semibold"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
