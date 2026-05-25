import DeploysClient from '@/components/admin/DeploysClient';

export const dynamic = 'force-dynamic';

export default async function AdminDeploysPage() {
  return (
    <DeploysClient
      repoUrl={process.env.GITHUB_REPO_URL || ''}
    />
  );
}
