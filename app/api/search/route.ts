// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    if (!query) {
      return NextResponse.json({
        success: true,
        results: {
          documents: [],
          templates: [],
          blogs: [],
          faqs: [],
          users: [],
        },
      });
    }

    const isUserAdmin = isAdmin(email);

    // 1. Search user's documents (or all if admin)
    const documents = await prisma.document.findMany({
      where: {
        AND: [
          isUserAdmin ? {} : { OR: [{ email }, { order: { email } }] },
          {
            OR: [
              { id: { contains: query, mode: 'insensitive' } },
              { type: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 10,
    });

    // 2. Search templates
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // 3. Search blog posts
    const blogs = await prisma.blogPost.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // 4. Search help articles (FAQs/Guides)
    const faqs = await prisma.helpArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    // 5. Search users (Admin only)
    let users: any[] = [];
    if (isUserAdmin) {
      const userPrefs = await prisma.userPreferences.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { user_type: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      const companyProfiles = await prisma.companyProfile.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { company_name: { contains: query, mode: 'insensitive' } },
            { representative: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      // Merge and deduplicate by email
      const emailMap = new Map();
      userPrefs.forEach(u => emailMap.set(u.email, { email: u.email, user_type: u.user_type, onboarded: u.onboarded }));
      companyProfiles.forEach(c => {
        const existing = emailMap.get(c.email) || { email: c.email };
        emailMap.set(c.email, { ...existing, company_name: c.company_name, representative: c.representative });
      });
      users = Array.from(emailMap.values());
    }

    return NextResponse.json({
      success: true,
      results: {
        documents,
        templates,
        blogs,
        faqs,
        users,
      },
    });
  } catch (error: any) {
    console.error('Error executing global search:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
