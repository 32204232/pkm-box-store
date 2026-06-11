# AI Development Guide

This document is a high-level project map for Cursor, AI agents, and developers. It does not replace the detailed documents; use it to decide which document to open next.

## 1. Project Snapshot

PKM Box Store is a Pokemon TCG commerce project. The initial focus is sealed Pokemon card box products, while the product model is being shaped so it can later support single cards, promo cards, supplies, sleeves, playmats, and other Pokemon TCG products.

Main implemented or documented areas:

- Signup and login
- Email verification
- Password reset
- Product listing and detail APIs
- Cart
- Order creation and order lookup
- Toss Payments approval, failure, cancel, and refund flows
- Delivery address management
- Admin product management
- Admin Catalog management
- Security documentation and partial P0 security test automation

## 2. Tech Stack

- Backend: Spring Boot 3.3.x, Java 17, MySQL/TiDB, JPA, JWT, Flyway, Toss Payments, AWS S3
- Frontend: Next.js App Router, React 19, TypeScript
- Styling: plain CSS in `frontend/app/globals.css`
- Deployment:
  - Frontend: Vercel
  - Backend: Railway
  - DB: TiDB Cloud Starter

## 3. Current Architecture Summary

- `Product` has nullable references to catalog master data.
- `Category`, `ProductType`, and `Series` live under `domain/catalog`.
- `ProductType` belongs to `Category`.
- `Series` is independent reusable master data.
- Existing `products.category` and `products.series` string columns remain for legacy compatibility during the catalog transition.
- `ProductLanguage` and `retailPrice` have been added to product modeling.
- `/admin/catalog` manages Category, ProductType, and Series.
- `/admin/products` uses catalog select fields for product create/edit flows.

## 4. Important Rules for AI Development

- Inspect existing files before changing behavior.
- Keep existing cart, order, payment, auth, address, email verification, password reset, admin, and catalog flows working.
- For frontend-only work, do not modify backend code.
- For backend-only work, do not modify frontend code unless the task clearly requires it.
- Never commit secrets, credentials, `.env`, `.env.local`, API keys, Toss secret keys, AWS keys, JWT secrets, SMTP passwords, private keys, or service account files.
- Update `docs/api-spec.md` when API contracts change.
- Update `docs/staging-deployment-notes.md` when deployment settings, Vercel/Railway/TiDB setup, or staging troubleshooting changes.
- For auth, authorization, order, payment, upload, CORS, secret, or dependency changes, check the security documents first.
- Do not mark a code task complete before the required test/build passes or the blocker is clearly reported.
- Before real operation, check P0 security gaps and all `Needs Verification` items.

## 5. Document Map

| Document | Purpose | When to Update |
| --- | --- | --- |
| `AGENTS.md` | Always-loaded short project rules for agents. | When global agent guidance or high-level references change. |
| `.cursor/rules/project.mdc` | Detailed Cursor project rules and development constraints. | When project-wide rules, architecture rules, verification rules, or deployment rules change. |
| `docs/project-status.md` | Current feature status, architecture summary, completed work, and next priorities. | When meaningful feature/status changes land. |
| `docs/api-spec.md` | Backend API contract, request/response shapes, auth requirements, and error notes. | Whenever API paths, fields, responses, validation, or frontend API usage changes. |
| `docs/local-test-checklist.md` | Local end-to-end test checklist for auth, product, cart, order, payment, admin, S3, and CORS flows. | When setup steps, environment variables, or user/admin flows change. |
| `docs/staging-deployment-notes.md` | Vercel/Railway/TiDB staging setup, environment variables, migration notes, and troubleshooting history. | When deployment settings, staging URLs, env var requirements, migrations, or troubleshooting change. |
| `docs/secure-sdlc.md` | Lightweight secure development process for new features. | When security review workflow or minimum secure development steps change. |
| `docs/security-requirements.md` | Security requirements with current status, evidence, and needed tests. | When security-sensitive behavior changes or new requirements are identified. |
| `docs/threat-model.md` | Lightweight threat model for assets, trust boundaries, threats, controls, and gaps. | When new flows, assets, integrations, or major risks are added. |
| `docs/security-test-checklist.md` | Checklist of security tests and which items are automated. | When security tests are added, run, completed, or reclassified. |
| `docs/security-test-plan.md` | Design plan for P0 security automation, target APIs, test style, mocks, and file structure. | When adding or restructuring security test automation. |
| `docs/security-gap-backlog.md` | Prioritized backlog of security gaps and verification tasks. | When a gap is closed, reprioritized, or newly discovered. |
| `docs/sbom.md` | SBOM-lite dependency inventory and vulnerability check guidance. | Whenever backend or frontend dependencies change. |

## 6. Current Feature Status

### Completed

- Catalog master data structure
- Admin Catalog API
- `/admin/catalog` management screen
- Admin product form catalog select connection
- Pretendard font application
- Secure SDLC documentation
- Security requirements, threat model, and SBOM-lite documentation
- Partial P0 security test automation

### In Progress / Next

- Improve user product list/detail display and filters using catalog master data
- Enter and validate real product data
- Re-verify order, payment, and inventory flows after catalog/product updates
- Expand MockMvc/JWT-based security integration tests
- Add or verify concurrent order oversell prevention tests
- Redeploy and verify staging

### Deferred

- Kakao login
- Apple login
- CSV/JSON product import
- Single-card-specific fields such as `rarity`, `cardNumber`, `condition`, and `grade`
- Advanced inventory adjustment modal
- Formal CycloneDX/SPDX SBOM
- Rate limit
- Broader advanced audit logging

## 7. Security Development Map

Current security documentation exists for:

- Secure requirements: `docs/security-requirements.md`
- Threat modeling: `docs/threat-model.md`
- Security test checklist: `docs/security-test-checklist.md`
- Security test plan: `docs/security-test-plan.md`
- Security gap backlog: `docs/security-gap-backlog.md`

P0 security tests are partially automated. Current `Needs Verification` items include:

- Production/staging secret values are configured safely without documenting actual values
- Staging/production `CORS_ALLOWED_ORIGINS` values
- S3 bucket permissions and IAM policy
- MockMvc/JWT integration coverage for key protected APIs
- Concurrent order oversell prevention tests

## 8. Deployment Notes Summary

- Vercel root directory: `frontend`
- Railway root directory: `backend`
- Railway Java setting: `RAILPACK_JDK_VERSION=17`
- `NEXT_PUBLIC_API_BASE_URL` must point to the deployed backend URL.
- `CORS_ALLOWED_ORIGINS` must be the Vercel origin without a trailing slash.
- Confirm Flyway migrations apply successfully before relying on `JPA_DDL_AUTO=validate`.
- Real secrets must be managed only through environment variables or deployment platform secret storage.

See `docs/staging-deployment-notes.md` for detailed staging setup and troubleshooting.

## 9. Recommended Next Work

1. Check current `git status` and commit safe, related changes only.
2. Verify local admin catalog and product registration/edit flows.
3. Improve user product list/detail pages with catalog-based display and filters.
4. Enter sample product data.
5. Run cart, order, payment, and inventory regression checks.
6. Expand P0 security integration tests.
7. Redeploy staging and verify the deployed flow.

## 10. How to Use This Document

- Ask Cursor to read this document before starting a new project task.
- For detailed API contracts, open `docs/api-spec.md`.
- For security work, open `docs/security-test-plan.md` and `docs/security-gap-backlog.md` first.
- For deployment work, open `docs/staging-deployment-notes.md`.
- For project rules, follow `AGENTS.md` and `.cursor/rules/project.mdc`.
- If a detail is not confirmed in the linked documents or code, mark it as `Needs Verification` instead of guessing.
