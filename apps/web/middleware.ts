import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/meeting'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const path = req.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((route) => path === route || path.startsWith(route + '/'));
  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
