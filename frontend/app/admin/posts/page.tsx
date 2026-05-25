import { getAllPosts, getAllTags } from '@/lib/posts';
import PostsManagerClient from '@/components/admin/PostsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const posts = await getAllPosts(true);
  const tags = await getAllTags();

  return (
    <PostsManagerClient
      initialPosts={posts}
      initialTags={tags}
    />
  );
}
