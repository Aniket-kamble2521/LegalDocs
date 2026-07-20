# ⚡ LegalDocs — Pay-Per-Document Secure Agreement Generator

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js version](https://img.shields.io/badge/Next.js-14.2.35-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://www.postgresql.org/)

LegalDocs is an automated, self-serve legal agreement builder. It enables users to configure custom statutory documents (NDAs, Service Provider Agreements, etc.), verify clause consistency using **Anthropic Claude**, perform live payments via **Razorpay**, generate tax invoices, and request Aadhaar-based electronic signatures via **Digio**.

---

## 🚀 Core Features

-   **Multi-Step Questionnaire Wizard:** Rich, responsive form steps with `localStorage` autosave cache to protect user progress.
-   **AI Lawyer Copilot:** Context-aware contract validation check powered by **Claude 3.5 Sonnet** (reverts to rule-based verification if Anthropic keys are missing).
-   **Razorpay Live Checkout:** End-to-end payment gateway for single document purchases (₹199) and 3-document credit bundles (₹499). Secured with HMAC-SHA256 signature checks.
-   **Dynamic Invoice PDF Compiler:** Automates tax invoice compilation and dispatches A4 receipts on the fly for successful checkouts.
-   **Digio Aadhaar eSign:** Compliant, legally binding signature envelopes with automatic webhook callbacks.
-   **CRM Workspace & Dashboard:** Manage custom client profiles, log administrative access logs, configure pricing variables, and track SLA check statuses.

---

## 🛠️ Tech Stack

-   **Frontend & Routing:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
-   **Database & ORM:** PostgreSQL 15, Prisma Client (with connection pools and indexed search)
-   **Email Dispatch:** Resend REST API (utilizing exponential backoff retry algorithms)
-   **PDF Engine:** Headless Puppeteer Chromium PDF compiler
-   **Validation & Checksums:** Crypto HMAC-SHA256 checksums

---

## 📐 System Architecture

```mermaid
graph TD
    Client[Next.js Client Wizard] -->|Create Checkout Order| OrdersAPI[Next.js API: /api/orders]
    OrdersAPI -->|Register Order| DB[(PostgreSQL Database)]
    Client -->|Razorpay Popup| RZP[Razorpay Payment Server]
    RZP -->|Callback Verify| VerifyAPI[Next.js API: /api/orders/verify]
    VerifyAPI -->|Query Live Status| RZP
    VerifyAPI -->|Update Order PAID| DB
    Client -->|Generate Document| GenerateAPI[Next.js API: /api/documents/generate]
    GenerateAPI -->|Validate Consistency| Claude[Anthropic Claude API]
    GenerateAPI -->|Compile HTML to PDF| Puppeteer[Headless Puppeteer]
    GenerateAPI -->|Save PDF File| Storage[Local/Cloud File Storage]
    GenerateAPI -->|Dispatch Download Link| Resend[Resend Email API]
    Client -->|Request Aadhaar Sign| EsignAPI[Next.js API: /api/documents/id/esign]
    EsignAPI -->|Create Envelope| Digio[Digio eSign Server]
```

---

## 📦 Directory Structure

```
LegalDocs/
├── app/                      # Next.js App Router (Frontend Pages & API routes)
│   ├── admin/                # SLA Administrative settings page
│   ├── api/                  # Backend REST API endpoints
│   │   ├── admin/            # Administrative parameters configuration
│   │   ├── auth/             # Session callback and magic-link dispatch
│   │   ├── clients/          # CRM Client workspaces CRUD
│   │   ├── documents/        # PDF generation, credit deductions, and downloads
│   │   ├── orders/           # Razorpay checkouts verification and invoicing
│   │   ├── system/           # Backups and public db ping
│   │   └── webhooks/         # Razorpay and Digio checksum receivers
│   ├── dashboard/            # User account console
│   ├── wizard/               # NDA and Service Agreement creation form
│   ├── terms/                # Terms of Service
│   └── privacy/              # Privacy Policy
├── prisma/                   # Schema models and template seeds
├── templates/                # HTML/Handlebars legal layout designs
├── lib/                      # Shared helper wrappers (Auth, Database, Payments, PDF)
├── test/                     # Assertions verifying generation logic
└── docs/                     # Detailed developer architectural logs
```

---

## 🔧 Environment Variables Config

Create a `.env` file in the root directory by duplicating `.env.example`:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pool URL. | `postgresql://postgres:password@localhost:5432/legaldocs?schema=public` |
| `NEXT_PUBLIC_APP_URL` | Host url used for email redirects. | `https://legaldocs.co` |
| `SESSION_SECRET` | 64-character random key to sign HMAC sessions. | `your_64_char_secure_random_string` |
| `ADMIN_EMAILS` | Comma-separated list of admin email bypass keys. | `admin@legaldocs.co,director@legaldocs.co` |
| `RAZORPAY_KEY_ID` | Razorpay Live API Key ID. | `rzp_live_xxxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Live Secret Key. | `yyyyyyyyyyyyyyyyyyyyyyyy` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay event webhook verification token. | `webhook_verification_secret_key` |
| `DIGIO_CLIENT_ID` | Digio B2B Aadhaar Client ID. | `AI_xxxxxxxxxxxxxxxxxxxx` |
| `DIGIO_CLIENT_SECRET` | Digio B2B Aadhaar Client Secret. | `yyyyyyyyyyyyyyyyyyyyyyyy` |
| `DIGIO_WEBHOOK_SECRET` | Digio signature event verification token. | `digio_webhook_verification_key` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API validation token. | `sk-ant-api03-xxxxxxxxxx` |
| `RESEND_API_KEY` | Resend transactional email API key. | `re_xxxxxxxxxxxxxxxxxxxx` |
| `FROM_EMAIL` | Verified sender address in Resend. | `LegalDocs <noreply@legaldocs.co>` |

---

## 🏃 Local Development Setup

Follow these steps to run the application on your computer:

### 1. Install Project Dependencies
Use Node.js v18 or higher (tested on Node v24):
```bash
npm install
```

### 2. Launch Local Database
Spin up the pre-configured PostgreSQL docker container:
```bash
docker-compose up -d
```

### 3. Sync Database Tables & Seed Layouts
Run Prisma migrations and populate the active HTML document templates:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Execute the Developer Build
Run the Next.js local watch engine:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Run Integration Tests
Execute the unit testing assertions to check formatting, PDF compilers, and rate limits:
```bash
npm run test
```

---

## ☁️ Vercel Deployment Instructions

LegalDocs contains serverless Puppeteer engines. To host the application on **Vercel**, deploy the code and configure environment variables in your Vercel Project dashboard.

> [!NOTE]
> Because Vercel serverless functions have a 50MB code size limit (which standard Chromium binaries exceed), it is recommended to compile the app within a Docker container and host it on **Google Cloud Run** or **AWS ECS** for production environments.

### Step-by-Step Vercel Setup:
1.  Connect your GitHub repository to Vercel.
2.  In Vercel **Project Settings**, set the Build Command to `next build` and Output Directory to `.next`.
3.  Configure all environment variables listed in the table above under Vercel **Environment Variables**.
4.  Commit and trigger the deployment.

---

## 🛡️ Security Policies
Refer to [SECURITY.md](./SECURITY.md) to report vulnerabilities. Refer to [LICENSE](./LICENSE) for MIT terms.
