import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const includeDrafts = req.nextUrl.searchParams.get('includeDrafts') === 'true';
  const session = await getServerSession(authOptions);

  if (includeDrafts && !session) {
    return NextResponse.json({ error: 'Unauthorized view of drafts' }, { status: 401 });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const headers: Record<string, string> = {};
    
    if (includeDrafts && process.env.BACKEND_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.BACKEND_API_KEY}`;
    }

    const res = await fetch(`${backendUrl}/api/posts?includeDrafts=${includeDrafts}`, {
      headers,
      next: { revalidate: 0 } // Bypass Next.js cache for admin queries
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch posts' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding get posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
