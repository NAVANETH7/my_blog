import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import SettingsClient from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const headers = {
    'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
  };

  let initialSettings = null;
  let initialGitStatus = null;

  try {
    const settingsRes = await fetch(`${backendUrl}/api/settings`, { headers, next: { revalidate: 0 } });
    if (settingsRes.ok) {
      initialSettings = await settingsRes.json();
    }
  } catch (err) {
    console.error('Error fetching settings in server page:', err);
  }

  try {
    const gitRes = await fetch(`${backendUrl}/api/git/status`, { headers, next: { revalidate: 0 } });
    if (gitRes.ok) {
      initialGitStatus = await gitRes.json();
    }
  } catch (err) {
    console.error('Error fetching git status in server page:', err);
  }

  return (
    <SettingsClient
      session={session}
      initialSettings={initialSettings}
      initialGitStatus={initialGitStatus}
    />
  );
}
