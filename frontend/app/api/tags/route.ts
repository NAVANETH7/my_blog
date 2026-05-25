import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/api/tags`, {
      next: { revalidate: 0 } // Always fresh tags for admin dashboard
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch tags' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding get tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
