import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const path = req.nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

  // If user already has a cookie and visits login/register, redirect to dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // For all other routes, let client-side handle auth checks.
  // Cross-domain setups (Vercel frontend ↔ Railway backend) mean HttpOnly cookies
  // set by the backend are NOT visible to this edge middleware.
  // The AppLayout component handles client-side auth via fetchUser() + axios withCredentials.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
