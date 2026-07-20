// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.headers.set(
    'Set-Cookie',
    `legaldocs_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
