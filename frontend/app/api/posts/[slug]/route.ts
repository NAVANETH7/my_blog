import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/posts/${slug}`);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch post' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding get post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/posts/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to delete post' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding delete post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
