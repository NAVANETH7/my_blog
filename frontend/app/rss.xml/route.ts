import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await getAllPosts(false); // Get only published posts
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-blog.com';

  const xmlItems = posts
    .map((post) => {
      // Parse YYYY-MM-DD to UTC RFC-822 date format for RSS
      const pubDate = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>`;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Developer Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Tutorials, guides, and thoughts on web development and tech.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${xmlItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
