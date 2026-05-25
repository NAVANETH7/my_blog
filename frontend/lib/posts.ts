export interface Frontmatter {
  title: string;
  date: string;
  tags: string[];
  draft: boolean;
  summary: string;
  slug: string;
  readingTime: string;
}

export interface Post {
  frontmatter: Frontmatter;
  content: string;
}

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

export async function getAllPosts(includeDrafts = false): Promise<Frontmatter[]> {
  try {
    const headers: Record<string, string> = {};
    if (includeDrafts && process.env.BACKEND_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.BACKEND_API_KEY}`;
    }
    const res = await fetch(`${backendUrl}/api/posts?includeDrafts=${includeDrafts}`, {
      headers,
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching all posts from backend:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${backendUrl}/api/posts/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching post ${slug} from backend:`, error);
    return null;
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const res = await fetch(`${backendUrl}/api/tags`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching all tags from backend:', error);
    return [];
  }
}
