import { getAllPosts, getAllTags } from '@/lib/posts';
import DashboardClient from '@/components/admin/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
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
    console.error('Failed to fetch deploys in dashboard server component:', err);
  }

  const posts = await getAllPosts(true);
  const tags = await getAllTags();

  return (
    <DashboardClient
      initialPosts={posts}
      initialTags={tags}
      initialCommits={commits}
    />
  );
}
