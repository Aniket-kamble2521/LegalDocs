# Developer Setup Notes & Production Deployment Guide

This document contains additional setup guides, including payment testing credentials and production hosting recommendations.

---

## 1. Razorpay Test Mode Credentials

When the app is configured with active Razorpay test keys (`rzp_test_...`), you can simulate payments using the official Razorpay test cards.

### Test Cards

| Card Type | Card Number | Expiry | CVV | OTP / PIN |
| :--- | :--- | :--- | :--- | :--- |
| **Visa** | `4111 1111 1111 1111` | Any future date | `123` | `123456` or click success |
| **Mastercard** | `5123 4567 8901 2345` | Any future date | `123` | `123456` or click success |
| **RuPay** | `6071 5612 3456 7890` | Any future date | `123` | `123456` or click success |

For netbanking or UPI mock testing, simply select any bank or enter any virtual payment address (VPA, e.g. `success@razorpay`) and click **Success** in the mock Razorpay modal.

---

## 2. Deploying Puppeteer in Production (Google Cloud Run)

To run Next.js + Puppeteer in a containerized environment, use the following `Dockerfile` to ensure the required headless Chrome dependencies are installed.

### Recommended Dockerfile

```dockerfile
# Use official Node.js base image
FROM node:20-slim AS base

# Install Chromium and required fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer env vars to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 3. Storage Cleanup Cron Job

To comply with the DPDP Act 2023 48-hour retention policy, configure a recurring task to remove expired files and database records.

### Sample Script (`scripts/cleanup.ts`)
```typescript
import { prisma } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function purgeExpiredDocuments() {
  const now = new Date();
  
  // Find expired documents
  const expiredDocs = await prisma.document.findMany({
    where: {
      expires_at: { lt: now }
    }
  });

  console.log(`Found ${expiredDocs.length} expired documents to purge.`);

  for (const doc of expiredDocs) {
    const filePath = path.join(process.cwd(), 'storage', 'documents', `${doc.id}.pdf`);
    
    // Delete file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
    
    // Delete document from DB
    await prisma.document.delete({
      where: { id: doc.id }
    });
  }
}

purgeExpiredDocuments();
```

Run this script daily via a cron job or using a serverless scheduler hitting an authorized admin route (e.g. `GET /api/cron/cleanup`).
