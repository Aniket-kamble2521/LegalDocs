# LegalDocs Developer Documentation

LegalDocs is an automated, self-serve legal document creation and workspace management platform designed specifically for Indian jurisdictions. This document serves as the developer reference guide for the application architecture, data design, integration services, security practices, and administrative controls.

---

## 1. Folder Structure

The project follows the Next.js App Router directory structure:

```
├── app/                      # Next.js pages and API route handlers
│   ├── admin/                # Admin Panel console page
│   ├── api/                  # Server-side API endpoints
│   │   ├── admin/            # Administrative APIs (auth-check, settings, backups, etc.)
│   │   ├── auth/             # Magic link login & callback endpoints
│   │   ├── clients/          # Client profile CRM CRUD
│   │   ├── company-profile/  # User company profile CRUD
│   │   ├── credits/          # Credit checking APIs
│   │   ├── documents/        # PDF generation, download, eSign endpoints
│   │   ├── orders/           # Order creation & signature verification
│   │   ├── system/           # Health monitoring & database backups
│   │   ├── v1/               # B2B Partner B2B APIs
│   │   ├── webhooks/         # Callback entrypoints (eSign, Razorpay)
│   │   └── workflows/        # Dynamic form questionnaire configurations
│   ├── dashboard/            # User workspace dashboard
│   ├── esign/                # Digital signing client views
│   ├── login/                # Passwordless magic-link login form
│   ├── onboarding/           # New-user preference stepper page
│   ├── status/               # Public SLA status monitoring console
│   └── wizard/               # Dynamic form NDA & Service Agreement compilation wizard
├── components/               # Shareable React UI components
│   ├── ui/                   # Reusable atomic design-system wrappers
│   ├── DashboardConsole.tsx  # Dashboard client rendering
│   ├── Header.tsx            # Global application header
│   └── ScrollReveal.tsx      # Entry viewport animation helper
├── docs/                     # Documentation files
│   ├── setup.md              # Setup and environment guide
│   └── developer_documentation.md  # This document
├── lib/                      # Server-side helper scripts & business logic wrappers
│   ├── admin.ts              # Administrative session context lookup
│   ├── auth.ts               # B2B API Key validation & sliding-window rate limiter
│   ├── db.ts                 # Prisma client instantiation
│   ├── email.ts              # Resend email transaction dispatcher
│   ├── esign.ts              # Digio Aadhaar e-Sign API bridge
│   ├── llm.ts                # Anthropic Claude consistency checker / local rule engines
│   ├── payments.ts           # Razorpay Order Creation & server signature validator
│   ├── pdf.ts                # Puppeteer PDF generator
│   └── session.ts            # HmacSHA256 session cookie signing
├── prisma/                   # Database schemas and seeds
│   ├── schema.prisma         # Prisma Schema model mapping
│   └── seed.ts               # Database table seed scripts
├── storage/                  # Server disk storage (PDF documents, backups)
├── templates/                # HTML source templates for Handlebars compilation
└── test/                     # Core unit test runner
```

---

## 2. Architecture Details

### Backend Architecture
The backend is structured as a collection of **Next.js Route Handlers** (App Router APIs) running on Node.js. It integrates directly with a PostgreSQL database using the **Prisma ORM**. Direct filesystem operations are executed for archiving generated PDFs and handling local database backups in JSON formats. External services (Anthropic Claude, Razorpay, Digio, Resend) are accessed via standard HTTPS REST fetch calls encapsulated in modular service wrappers under `lib/`.

### Frontend Architecture
The frontend is a single-page style React application using Next.js client-side routing. Styling is built using **Tailwind CSS** with a dark, premium aesthetic featuring sleek slate colors, subtle borders, backdrop-blur filters, and custom SVG animations. Icons are powered by `lucide-react`. Interactivity relies on hooks (`useState`, `useEffect`, `useRouter`) keeping operations reactive.

---

## 3. Database Design & Models

The PostgreSQL schema (`prisma/schema.prisma`) comprises the following models:
*   **Order**: Tracks purchase details, amount, status (PENDING, PAID, FAILED, REFUNDED), and Razorpay references.
*   **Document**: Contains NDA/Service Agreement form answers, serving URLs, eSign status, expiration timestamps, and client linkages.
*   **Template**: Stores Handlebars HTML raw content, types, variants (MUTUAL, UNILATERAL), and version states.
*   **WizardEvent**: Tracks step completion logs for analytics purposes.
*   **CreditBalance**: Tracks remaining prepaid document compilation credits.
*   **MagicToken**: Manages 15-minute validity passwordless login codes.
*   **Partner & PartnerRequest**: Manage B2B keys and sliding-window rate limit counters.
*   **AdminActivityLog**: Captures admin console operation histories.
*   **WebhookLog**: Persists incoming JSON payloads for auditing and deduplication.
*   **PaymentAudit**: Records every payment lifecycle success/failure transition.
*   **SupportTicket**: Manages client-submitted tickets and administrator replies.
*   **ContentConfig**: Houses key-value JSON configurations for landing page components.
*   **CompanyProfile**: Stores user business information for document autofill.
*   **UserPreferences**: Stores onboarding selections.
*   **Feedback**: Stores ratings and NPS feedback data.
*   **HelpArticle & BlogPost**: Power dynamic guide CMS sections.
*   **Notification**: Dispatches in-app event updates.
*   **SystemLog & SystemSetting**: Provide monitoring logs and administrative configurations.
*   **Client & ClientActivity**: CRM workspaces for tracking client profiles and document associations.

---

## 4. Key Workflows & Flows

### Authentication Flow (Passwordless Magic Links)
1.  User submits their email at `/login`.
2.  Server creates a cryptographically secure random token (32 bytes), saves it to `MagicToken` with a 15-minute expiration, and logs a `USER_LOGIN` attempt.
3.  Server sends an email containing the callback link: `/api/auth/callback?token=<token>`.
4.  When clicked, the token is verified, marked as `used`, and a signed cookie `legaldocs_session` containing the email payload signed with `SESSION_SECRET` (HmacSHA256) is issued.
5.  All protected routes verify this cookie signature on each load.

### AI Workflow (Consistency Auditing)
1.  Form questionnaire parameters are gathered by the Wizard.
2.  Before document compilation, answers are validated by the `checkAnswersConsistency` service.
3.  First, local constraints (non-identical names, positive amounts, correct milestones) are validated.
4.  Next, a JSON query containing form metrics is sent to the Anthropic Claude API using `claude-3-5-sonnet-20240620`.
5.  Claude evaluates logical discrepancies, ensuring dates are chronological, amount values align with sum calculations, and text values contain coherent details.
6.  The combined feedback is returned to the user; compilation blocks if discrepancies exist.

### Document Generation Flow
1.  Upon verified payment or credit deduction, `POST /api/documents/generate` is triggered.
2.  The template HTML is retrieved from the database (or filesystem fallback).
3.  Handlebars compiles the template variables with the snake-cased user answers.
4.  Puppeteer launches a headless browser, sets the compiled HTML as the viewport content, and renders a clean, margin-padded A4 PDF layout to the server's local file store (`storage/documents/`).
5.  The database `Document` state is updated with a unique `/download` endpoint URL valid for 48 hours.

### Payment Flow (Razorpay Integration)
1.  **Order Generation**: Client requests `/api/orders` to create a pending order. Server instantiates the transaction with Razorpay.
2.  **Verification**: After payment, client submits credentials to `/api/orders/verify`. The server verifies the signature with Razorpay's SDK and executes a direct HTTP lookup validation to crosscheck that the order is captured.
3.  **Webhook Validation**: Razorpay sends `payment.captured` webhooks. The server calculates raw-body `HmacSHA256` checksums, checks for status duplicates, generates the PDF, and issues invoice records.

### Admin System
The admin control panel (`/admin`) allows:
*   Real-time system diagnostics (latencies, server memory, disk storage) via `/api/system/health`.
*   JSON schema backup and restoration configurations via `/api/system/backup`.
*   CMS controls (help articles, blog edits), ticket response managers, coupon creations, and toggle settings.

---

## 5. Security Architecture

*   **Authentication & Session Control**: State parameters are encapsulated in cryptographic tokens. Cookies are kept `httpOnly` and configured with `sameSite: 'lax'` (or `secure: true` in production).
*   **Authorization Gating**: Admin operations require emails matching verified system administrators. User documents are guarded; dynamic B2B keys isolate partners so they cannot access documents generated by other B2B accounts.
*   **Input Validation**: Dynamic parameters are schema-constrained. Database queries run strictly parameterized inputs via Prisma, eliminating risks of SQL Injection.
*   **Rate Limiting**: sliding-window logging rules govern partner APIs to mitigate DDoS or credential-guessing attempts.
*   **Path Traversal Prevention**: File access endpoints validate path segments, ensuring file operations cannot read files outside targeted workspace storage subdirectories.
