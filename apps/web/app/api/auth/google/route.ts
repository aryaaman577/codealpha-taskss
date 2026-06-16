import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.redirect('https://syncspace-server-production.up.railway.app/api/auth/google');
}
