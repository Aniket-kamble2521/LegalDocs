import { cookies } from 'next/headers';
import { verifySession, isAdmin } from './session';

export function getAdminUser(): string | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;
    if (!sessionCookie) return null;
    const email = verifySession(sessionCookie);
    if (!email || !isAdmin(email)) return null;
    return email;
  } catch (e) {
    return null;
  }
}
