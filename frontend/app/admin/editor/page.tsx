import { getPostBySlug, getAllTags } from '@/lib/posts';
import EditorClient from '@/components/admin/EditorClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export default async function AdminEditorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const slug = params.slug;
  let post = null;

  if (slug) {
    post = await getPostBySlug(slug);
  }
  
  const tags = await getAllTags();

  return <EditorClient initialPost={post} allTags={tags} />;
}
