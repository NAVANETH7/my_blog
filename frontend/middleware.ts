import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/lib/auth';

// NextAuth auth middleware for protected admin routes
const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);

    if (token && token.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(
        new URL('/admin/login?error=AccessDenied', req.url)
      );
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

// Main middleware wrapper
export default async function middleware(req: NextRequest, event: any) {
  const pathname = req.nextUrl.pathname;

  // Set x-pathname header and bypass NextAuth for the login page to prevent redirect loops
  if (pathname === '/admin/login') {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  // Run authorization check for all other admin routes
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
