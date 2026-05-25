import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const noOfWords = content.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return `${minutes} min read`;
}

export function getAllPosts(includeDrafts = false): Frontmatter[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const readingTime = calculateReadingTime(content);

      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        tags: data.tags || [],
        draft: data.draft === undefined ? false : !!data.draft,
        summary: data.summary || '',
        readingTime,
      } as Frontmatter;
    });

  const filteredPosts = includeDrafts
    ? allPostsData
    : allPostsData.filter((post) => !post.draft);

  return filteredPosts.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else if (a.date > b.date) {
      return -1;
    } else {
      return 0;
    }
  });
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const readingTime = calculateReadingTime(content);

    const frontmatter: Frontmatter = {
      slug,
      title: data.title || 'Untitled',
      date: data.date || '',
      tags: data.tags || [],
      draft: data.draft === undefined ? false : !!data.draft,
      summary: data.summary || '',
      readingTime,
    };

    return {
      frontmatter,
      content,
    };
  } catch (error) {
    console.error(`Error reading post with slug ${slug}:`, error);
    return null;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts(false);
  const tagsSet = new Set<string>();
  posts.forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => tagsSet.add(tag.trim().toLowerCase()));
    }
  });
  return Array.from(tagsSet).sort();
}
