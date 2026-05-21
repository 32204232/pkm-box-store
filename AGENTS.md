# AGENTS.md

## Project

- This project is a Korean Pokemon card box shopping mall.
- Backend: Spring Boot, MySQL, JWT, S3, Toss Payments.
- Frontend: Next.js App Router, TypeScript.

## References

- For API changes and frontend API usage, check `docs/api-spec.md` first.
- For local end-to-end test flow, check `docs/local-test-checklist.md`.

## Work Rules

- Do not break existing cart, order, payment, auth, or admin flows.
- Modify only the minimum files needed for the requested task.
- During frontend work, do not modify backend code.
- During backend work, do not modify frontend code unless clearly required.
- Do not commit secrets or credentials:
  - API keys
  - Toss Secret Key
  - AWS access keys
  - JWT secrets
- Keep Korean strings encoded as UTF-8. Do not introduce mojibake.

## Verification

- Backend changes: run `.\gradlew.bat test --no-daemon` from `backend`.
- Frontend changes: run `npm run build` from `frontend`.

