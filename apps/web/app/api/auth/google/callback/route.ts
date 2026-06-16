import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  const backendUrl = `https://syncspace-server-production.up.railway.app/api/auth/google/callback${search}`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
        'Accept': request.headers.get('Accept') || '',
      },
      redirect: 'manual',
    });

    const locationHeader = backendResponse.headers.get('location');
    let redirectUrl = new URL('/dashboard', request.url);

    if (locationHeader) {
      try {
        const parsedLocation = new URL(locationHeader);
        if (parsedLocation.searchParams.has('error')) {
          redirectUrl = new URL(`/login?error=${parsedLocation.searchParams.get('error')}`, request.url);
        }
      } catch (e) {
        if (locationHeader.includes('error=')) {
          const match = locationHeader.match(/error=[^&]+/);
          if (match) {
            redirectUrl = new URL(`/login?${match[0]}`, request.url);
          }
        }
      }
    }

    const response = NextResponse.redirect(redirectUrl);

    // Retrieve Set-Cookie headers
    let setCookies: string[] = [];
    if (typeof backendResponse.headers.getSetCookie === 'function') {
      setCookies = backendResponse.headers.getSetCookie();
    } else if (
      (backendResponse.headers as any).raw &&
      typeof (backendResponse.headers as any).raw === 'function'
    ) {
      const rawHeaders = (backendResponse.headers as any).raw();
      setCookies = rawHeaders['set-cookie'] || [];
    } else {
      const singleSetCookie = backendResponse.headers.get('set-cookie');
      if (singleSetCookie) {
        setCookies = [singleSetCookie];
      }
    }

    let count = 0;
    for (const cookieStr of setCookies) {
      const parts = cookieStr.split(';').map(p => p.trim());
      
      // Filter out domain attribute
      const cleanParts = parts.filter(part => !part.toLowerCase().startsWith('domain='));

      // Ensure HttpOnly is present
      if (!cleanParts.some(part => part.toLowerCase() === 'httponly')) {
        cleanParts.push('HttpOnly');
      }

      // Ensure Secure is present
      if (!cleanParts.some(part => part.toLowerCase() === 'secure')) {
        cleanParts.push('Secure');
      }

      // Handle Path attribute
      const pathIdx = cleanParts.findIndex(part => part.toLowerCase().startsWith('path='));
      if (pathIdx !== -1) {
        cleanParts[pathIdx] = 'Path=/';
      } else {
        cleanParts.push('Path=/');
      }

      // Handle SameSite attribute
      const sameSiteIdx = cleanParts.findIndex(part => part.toLowerCase().startsWith('samesite='));
      if (sameSiteIdx !== -1) {
        cleanParts[sameSiteIdx] = 'SameSite=Lax';
      } else {
        cleanParts.push('SameSite=Lax');
      }

      const formattedCookie = cleanParts.join('; ');
      response.headers.append('Set-Cookie', formattedCookie);
      count++;
    }

    console.log(`Forwarding backend Set-Cookie count: ${count}`);

    return response;
  } catch (error) {
    console.error('Error in Google OAuth callback handler:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
  }
}
