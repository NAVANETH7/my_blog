import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';

interface MDXContentProps {
  source: string;
}

export default function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose dark:prose-invert max-w-none hover:prose-a:text-accent transition-colors duration-200">
      <MDXRemote
        source={source}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeHighlight as unknown as import('unified').Pluggable,
              rehypeSlug as unknown as import('unified').Pluggable,
            ],
          },
        }}
      />
    </div>
  );
}
