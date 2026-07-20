# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-20

### Added
- **Database Indexing:** Configured index optimizations for `PartnerRequest`, `PaymentAudit`, `SupportTicket`, `Feedback`, and `AdminActivityLog` models in `schema.prisma`.
- **System SLA Probe:** Implemented public, authenticated-free health ping route `/api/system/ping` to support SLA status page queries safely.
- **Invoice Delivery System:** Set up `templates/invoice.html` and dynamic server-side tax invoice PDF dispatches.
- **API Webhooks verification:** Secured the Razorpay webhooks listener and the Digio e-sign webhooks listener with HMAC-SHA256 signature verification.

### Changed
- **Production Email Delivery:** Migrated the email utility in `lib/email.ts` away from mock console-only fallbacks to real dispatches via Resend.
- **Strict Format Validations:** Implemented regular expression email checks on all input points including checkout, signers list, and client CRUD endpoints.
- **Secure Cookies:** Hardened session callback cookies by enforcing the `secure: true` flag in production environments.

### Removed
- **Development Mocks:** Removed simulated checkout visual modals, visual e-sign simulators, and magic-link development bypass links.
- **Sandbox Credentials:** Deleted all local test/sandbox API credentials from the system configuration.
