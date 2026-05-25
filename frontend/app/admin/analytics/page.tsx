import { getAllPosts } from '@/lib/posts';
import AnalyticsClient from '@/components/admin/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const posts = await getAllPosts(true);
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  let commits = [];

  try {
    const res = await fetch(`${backendUrl}/api/deploys`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      next: { revalidate: 0 }
    });
    if (res.ok) {
      commits = await res.json();
    }
  } catch (err) {
    console.error('Error fetching git logs for analytics:', err);
  }

  return (
    <AnalyticsClient
      posts={posts}
      commits={commits}
    />
  );
}
