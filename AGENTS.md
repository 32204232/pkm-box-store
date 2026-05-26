# AGENTS.md

## Project
PKM Box Store is a Korean Pokemon card box shopping mall.

- Backend: Spring Boot, Java 17, MySQL, JPA, JWT, Toss Payments, AWS S3, Flyway
- Frontend: Next.js App Router, TypeScript
- Styling: plain CSS in `frontend/app/globals.css`

For the full project rules, follow `.cursor/rules/project.mdc`. This file is a short always-loaded summary.

## References
- For API changes and frontend API usage, check `docs/api-spec.md`.
- For local end-to-end test flow, check `docs/local-test-checklist.md`.
- For major feature/status context, check `docs/project-status.md`.

## Core Rules
- Always inspect existing files before editing.
- Keep changes scoped to the current task.
- Do not add mock data to replace real API data.
- Do not create fake UI or fake links for unsupported features.
- Preserve existing cart, order, payment, auth, address, email verification, password reset, and admin flows.
- During frontend-only work, do not modify backend code.
- During backend-only work, do not modify frontend code unless clearly required.
- Never revert or overwrite unrelated user changes unless explicitly requested.
- If the working tree has unrelated changes, stage and commit only files related to the current task.

## Secrets
Do not commit secrets or credentials, including:

- `.env`
- API keys
- Toss secret keys
- AWS access keys
- JWT secrets
- SMTP passwords
- private keys
- service account files

Keep Korean strings encoded as UTF-8. Do not introduce mojibake.

## Frontend Rules
- Use existing `frontend/lib/api.ts`.
- Use existing `frontend/types/api.ts`.
- Use existing `RequireAuth`.
- Prefer editing `frontend/app/globals.css` for styling.
- Do not introduce Tailwind CSS or external UI libraries unless explicitly requested.
- Keep mobile responsiveness.
- For customer-facing UI, use KREAM as the visual reference:
  - clean line-based layouts
  - white background
  - black/gray typography
  - thin borders
  - wide spacing
  - minimal shadows
  - left menu + right content for mypage
  - small `변경`/`수정` buttons with modal editing where appropriate
- Do not add unavailable features such as bidding, KREAM Pay, transaction charts, guarantees, points, or coupons unless actually implemented.

## Backend Rules
- Follow existing domain package structure.
- Use existing `BusinessException` and `ErrorCode`.
- Use DTOs for requests/responses.
- Keep existing security rules.
- Do not weaken validation or business logic just to make tests pass.
- For schema changes, add Flyway migration SQL under `backend/src/main/resources/db/migration`.
- Keep `JPA_DDL_AUTO=validate` as the default safe flow.
- For H2-based tests, disable Flyway or use test-specific configuration instead of changing production migrations to fit H2.

## Verification
- Backend changes: run `.\gradlew.bat test --no-daemon` from `backend`.
- Frontend changes: run `npm run build` from `frontend`.
- Full-stack changes: run both backend tests and frontend build.
- If verification fails, explain the exact failure and fix it before calling the task complete.
- If verification is blocked by local environment, credentials, or external services, report the blocker clearly.

## Git
- Prefer small, meaningful commits.
- Use commit messages like:
  - `feat: ...`
  - `fix: ...`
  - `style: ...`
  - `docs: ...`
  - `chore: ...`
- Before committing:
  - run `git status`
  - run `git diff --stat`
  - confirm no secret files are included
  - confirm required build/tests passed
- Do not commit unrelated files without asking.
- After push, report:
  - commit message
  - commit hash
  - final `git status`

## When Unsure
- Explain the tradeoff first.
- Ask before making large architecture changes.
- For UI work, make one page or one component at a time.
- For backend work, keep changes small and test-covered.