import { getAllPosts, getAllTags } from '@/lib/posts';
import TagsManagerClient from '@/components/admin/TagsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const posts = await getAllPosts(true);
  const tags = await getAllTags();

  return (
    <TagsManagerClient
      initialPosts={posts}
      initialTags={tags}
    />
  );
}
