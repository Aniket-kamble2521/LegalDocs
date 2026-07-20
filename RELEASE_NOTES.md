# Release Notes — LegalDocs v1.0.0 (Production Release)

We are thrilled to announce the official **v1.0.0 production release** of LegalDocs! 

LegalDocs is a self-serve platform designed to compile, verify, invoice, and electronically sign statutory agreements. This release marks the culmination of the production hardening phase, shifting all sandbox and development features into a secure, robust live architecture.

## Key Features in v1.0.0

### 1. Production Payment Gateway & Webhooks
- Fully integrated Razorpay Live APIs for pay-per-document single sales (₹199) and 3-document credit bundles (₹499).
- Standard HMAC-SHA256 signature verification protects the webhook endpoint from malicious payloads.
- Automated creation of database activity log tracking.

### 2. Transactional Email Delivery & PDF Invoicing
- Production-grade emails dispatched using **Resend** (with exponential backoff retries).
- Automation sends document delivery confirmation emails with absolute secure download links immediately upon compilation.
- Dynamic tax invoice PDF generator serves A4 invoices on the fly for successful purchases.

### 3. Digio Aadhaar e-Sign Integration
- Production Digio REST integrations.
- Webhook signature validation verifies e-sign success payloads securely using checksum headers.

### 4. Hardened Security
- **Access Isolation:** Credit balances, generated documents, and company profiles are strictly gated to their respective owners.
- **Session Safety:** Session cookies enforce `secure` in production.
- **Path Traversal Protection:** Sanity checks on database backup files reject directory traversal parameters.
- **Input Sanitization:** Added regex validation checks to all endpoints accepting email addresses.

---

## Deploying to Production
For full environment setup guidelines and deployment configurations (Next.js serverless on Vercel or containerized on Google Cloud Run/AWS ECS), refer to the [README.md](file:///Users/aniketkamble/Downloads/LegalDocs/README.md).
