// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardConsole from '@/components/DashboardConsole';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Authenticate user session from HTTP-only cookie
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('legaldocs_session')?.value;
  
  if (!sessionCookie) {
    redirect('/login');
  }

  const email = verifySession(sessionCookie);
  if (!email) {
    redirect('/login');
  }

  // 2. Check onboarding status
  const preferences = await prisma.userPreferences.findUnique({
    where: { email },
  });

  if (!preferences || !preferences.onboarded) {
    redirect('/onboarding');
  }

  // 3. Query credit balance
  const creditBalance = await prisma.creditBalance.findUnique({
    where: { email },
  });
  const credits = creditBalance ? creditBalance.credits : 0;

  // 4. Query company profile
  const profile = await prisma.companyProfile.findUnique({
    where: { email },
  });

  // 5. Query past generated documents for this user
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { email },
        { order: { email } },
      ],
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // 6. Query announcements from SystemSetting table
  const announcementSetting = await prisma.systemSetting.findUnique({
    where: { key: 'announcement' },
  });
  const announcement = announcementSetting 
    ? (typeof announcementSetting.value === 'string' 
        ? announcementSetting.value 
        : (announcementSetting.value as any)?.text)
    : null;

  return (
    <DashboardConsole
      email={email}
      initialCredits={credits}
      initialDocuments={documents}
      preferences={preferences}
      profile={profile}
      announcement={announcement}
    />
  );
}
