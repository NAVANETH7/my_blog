import PostsManagerClient from '@/components/admin/PostsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminDraftsPage() {
  return <PostsManagerClient defaultStatusFilter="drafts" />;
}
