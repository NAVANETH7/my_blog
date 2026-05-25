import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import SettingsClient from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <SettingsClient
      session={session}
    />
  );
}
