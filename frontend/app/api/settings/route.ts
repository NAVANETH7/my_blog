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

    const res = await fetch(`${backendUrl}/api/settings`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch settings' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding get settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/settings/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to save settings' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding save settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
