import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const res = await fetch(`${backendUrl}/api/posts`);
    const posts = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: posts.error || 'Failed to retrieve posts for search' }, { status: res.status });
    }
    
    // Only return the necessary fields for client-side searching
    const searchData = posts.map(({ title, summary, tags, slug, readingTime, date }: any) => ({
      title,
      summary,
      tags,
      slug,
      readingTime,
      date,
    }));

    return NextResponse.json(searchData);
  } catch (error) {
    console.error('Error generating search index:', error);
    return NextResponse.json({ error: 'Failed to retrieve search data' }, { status: 500 });
  }
}
