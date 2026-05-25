import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/lib/auth';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);

    if (pathname === '/admin/login') {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      });
    }

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
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname === '/admin/login') return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin',
    '/admin/posts/:path*',
    '/admin/drafts/:path*',
    '/admin/tags/:path*',
    '/admin/editor/:path*',
    '/admin/media/:path*',
    '/admin/settings/:path*',
    '/admin/analytics/:path*',
    '/admin/deploys/:path*',
    '/admin/curation/:path*',
    '/admin/feeds/:path*',
  ],
};
