import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/tags/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to rename tag' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding tag rename:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
