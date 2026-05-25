import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/deploys`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch deploy logs' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding get deploys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
