import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import DeploysClient from '@/components/admin/DeploysClient';

export const dynamic = 'force-dynamic';

export default async function AdminDeploysPage() {
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
    console.error('Error fetching git log for deploys page:', err);
  }

  return (
    <DeploysClient
      initialCommits={commits}
      repoUrl={process.env.GITHUB_REPO_URL || ''}
    />
  );
}
