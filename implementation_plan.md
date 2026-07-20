# Technical Implementation Plan - Production Readiness Phase

This implementation plan outlines the structural updates, database extensions, user interface additions, security controls, and optimization strategies to transform LegalDocs into a premium, commercial-grade AI-powered Legal Operating System for India.

---

## User Review Required

> [!IMPORTANT]
> The database schema will be extended with:
> - **Collaboration and Organizations:** Models `Organization`, `OrgMembership`, `Subscription` (retaining status gates in disabled mode).
> - **Company Profile:** Model `CompanyProfile` for auto-filling contracts.
> - **Feedback & NPS:** Model `Feedback` to capture bug reports, ratings, and NPS metrics.
> - **Blog & Help Center CMS:** Models `BlogPost` and `HelpArticle`.
> - **System Status & Settings:** Model `SystemSetting` for feature flags, maintenance modes, announcements, and pricing rules.
> We will execute `npx prisma db push` to safely sync these new tables and indexes.

---

## Proposed Changes

### 1. Database Model Schema Upgrades
#### [MODIFY] [schema.prisma](file:///Users/aniketkamble/Downloads/LegalDocs/prisma/schema.prisma)
- Extend user records and settings:
  ```prisma
  model CompanyProfile {
    email              String   @id
    company_name       String
    gst                String?
    pan                String?
    address            String
    state              String
    country            String   @default("India")
    representative     String
    phone              String
    website            String?
    created_at         DateTime @default(now())
    updated_at         DateTime @updatedAt
  }

  model UserPreferences {
    email      String  @id
    onboarded  Boolean @default(false)
    user_type  String? // "FREELANCER", "STARTUP", "BUSINESS", "INDIVIDUAL"
    categories String[]
  }

  model Feedback {
    id         String   @id @default(uuid())
    email      String
    type       String   // "BUG", "FEATURE_REQUEST", "GENERAL", "NPS"
    rating     Int?     // 1 to 5 star rating
    nps_score  Int?     // 0 to 10 NPS score
    message    String
    status     String   @default("NEW") // "NEW", "REVIEWED", "ARCHIVED"
    created_at DateTime @default(now())
  }

  model HelpArticle {
    id         String   @id @default(uuid())
    slug       String   @unique
    title      String
    category   String   // "GUIDE", "FAQ", "TUTORIAL"
    content    String   @db.Text
    created_at DateTime @default(now())
  }

  model SystemSetting {
    key        String   @id
    value      Json
  }
  ```

---

### 2. UI Onboarding Flow & Profile Autofill
#### [NEW] [onboarding/route.ts](file:///Users/aniketkamble/Downloads/LegalDocs/app/api/onboarding/route.ts)
- Save preferences and onboarding status inside the DB.

#### [NEW] [profile/route.ts](file:///Users/aniketkamble/Downloads/LegalDocs/app/api/company-profile/route.ts)
- Expose CRUD actions for user company parameters.

#### [MODIFY] [page.tsx](file:///Users/aniketkamble/Downloads/LegalDocs/app/wizard/page.tsx)
- Inject the step-by-step first-time onboarding stepper modal interface.
- Automatically request company metadata on step loads and autofill party details (name, address, signatory).

---

### 3. Smart Document Library, Recommendations & Insights
#### [MODIFY] [page.tsx](file:///Users/aniketkamble/Downloads/LegalDocs/app/dashboard/page.tsx)
- Reorganize dashboard to show a **Premium Searchable Library**:
  - Filter by Favorites, Pinned, Categories, or Archived states.
  - Expose checkbox columns for bulk deletion.
- Insert the **"Recommended for You"** section based on current User Type and recent compilation categories.
- Introduce **Business Insights**:
  - Mini stats graphs tracking completion rates, documents created count, money saved metrics, and dynamic activity heatmaps.

---

### 4. Advanced Global Search & Help Desk
#### [NEW] [search/route.ts](file:///Users/aniketkamble/Downloads/LegalDocs/app/api/search/route.ts)
- A unified search utility executing fuzzy queries on Documents, Templates, Blogs, and Help Center guides.

#### [NEW] [/help](file:///Users/aniketkamble/Downloads/LegalDocs/app/help/page.tsx)
- Fully accessible knowledge base index with FAQs and guide categories.

---

### 5. System Status Page
#### [NEW] [/status](file:///Users/aniketkamble/Downloads/LegalDocs/app/status/page.tsx)
- A public service checks interface displaying operation status parameters (API, Database, PDF Generator, Razorpay Sandbox) and incident histories.

---

### 6. Branded UI Design System & Micro-Interactions
#### [NEW] Reusable layout styles:
- Standardized skeleton loaders, success animations, transition wrappers, interactive modal alerts.

---

### 7. Administrative Enhancements
#### [MODIFY] [page.tsx](file:///Users/aniketkamble/Downloads/LegalDocs/app/admin/page.tsx)
- Add administrative control tabs for:
  - Coupon Code generators & Pricing limits.
  - Setting site Announcements and Maintenance Mode flags.
  - Support Tickets, Blog CMS, and System Logs viewing dashboards.

---

## Verification Plan

### Automated Coverage suite:
- Run `npx tsx test/runner.ts` to assert that core parameters checks, templates, and sandbox integrations are intact.
- Verify Next.js bundle compiles clean with `npm run build`.
