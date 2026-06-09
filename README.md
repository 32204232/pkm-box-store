# PKM Box Store

한국어판 포켓몬 카드 박스만 판매하는 커머스 프로젝트입니다.

## Tech Stack

- Backend: Spring Boot 3.3.x, Java 17, Gradle, JPA, MySQL, Spring Security, JWT, Flyway
- Frontend: Next.js App Router, React 19, TypeScript
- Payment: Toss Payments
- Image Storage: AWS S3
- Deploy: AWS

## Core Features

- 상품 목록 / 상세 조회
- 이메일 인증 기반 회원가입 / 로그인 / 비밀번호 재설정
- 관리자 상품 등록 / 수정 / 삭제
- S3 상품 이미지 업로드
- 장바구니
- 주문 생성
- 재고 관리
- Toss Payments 결제
- 관리자 주문 관리

## Backend 실행 방법

### 1. 환경변수 준비

```bash
cd backend
cp .env.example .env
```

`.env` 값을 로컬 환경에 맞게 수정합니다. 민감정보는 커밋하지 않습니다.

Spring Boot는 기본적으로 `.env` 파일을 자동 로드하지 않으므로, 실행 환경에서 환경변수로 주입해야 합니다. IDE 실행 설정, Docker, 배포 환경 변수, 또는 셸 환경변수를 사용합니다.

로컬 실행에 필요한 주요 값은 다음과 같습니다.

- `SERVER_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `FLYWAY_ENABLED`
- `FLYWAY_BASELINE_ON_MIGRATE`
- `FLYWAY_BASELINE_VERSION`
- `JPA_DDL_AUTO`
- `HIBERNATE_FORMAT_SQL`
- `HIBERNATE_DEFAULT_BATCH_FETCH_SIZE`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRATION_MS`
- `JWT_REFRESH_TOKEN_EXPIRATION_MS`
- `MAIL_MODE`
- `MAIL_FROM`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_SMTP_AUTH`
- `MAIL_SMTP_STARTTLS_ENABLE`
- `EMAIL_VERIFICATION_CODE_TTL_SECONDS`
- `EMAIL_VERIFICATION_TOKEN_TTL_SECONDS`
- `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS`
- `EMAIL_VERIFICATION_MAX_FAILED_ATTEMPTS`
- `EMAIL_VERIFICATION_MAX_SENDS_PER_WINDOW`
- `EMAIL_VERIFICATION_SEND_WINDOW_SECONDS`
- `EMAIL_VERIFICATION_CLEANUP_RETENTION_DAYS`
- `EMAIL_VERIFICATION_CLEANUP_CRON`
- `TOSS_PAYMENTS_SECRET_KEY`
- `TOSS_PAYMENTS_CLIENT_KEY`
- `CORS_ALLOWED_ORIGINS`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SPRINGDOC_API_DOCS_ENABLED`
- `SPRINGDOC_SWAGGER_UI_ENABLED`
- `LOGGING_LEVEL_HIBERNATE_SQL`

Toss 테스트 결제를 하려면 Toss 개발자센터에서 발급받은 같은 테스트 상점의 Secret Key와 Client Key를 각각 백엔드와 프론트엔드 환경변수로 설정합니다. 실제 키 값은 README, 예시 파일, 커밋 이력에 남기지 않습니다.

로컬 이메일 인증은 기본적으로 `MAIL_MODE=LOG`를 사용합니다. 이 경우 실제 SMTP 발송 없이 백엔드 로그의 `[EMAIL_VERIFICATION]` 항목에서 인증번호를 확인할 수 있습니다. 실제 SMTP를 테스트할 때만 `MAIL_MODE=SMTP`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`를 로컬/배포 환경변수로 설정하고, SMTP 비밀번호는 문서나 커밋에 남기지 않습니다.

S3 실제 업로드를 테스트하지 않더라도 로컬 부팅을 위해 AWS/S3 환경변수에 더미 값이 필요할 수 있습니다. 실제 업로드 테스트에는 유효한 버킷, 리전, 접근 키, 권한 정책이 필요하며, AWS Access Key와 Secret Access Key는 커밋하지 않습니다.

CORS 허용 Origin은 `CORS_ALLOWED_ORIGINS`로 설정합니다. 여러 Origin은 쉼표로 구분하고, 로컬 기본값은 `http://localhost:3000`입니다.

### 2. MySQL 준비

로컬 MySQL에 데이터베이스와 계정을 준비합니다.

```sql
CREATE DATABASE pkm_box_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pkm_user'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON pkm_box_store.* TO 'pkm_user'@'%';
FLUSH PRIVILEGES;
```

### 3. DB 마이그레이션

DB 스키마 변경은 Flyway migration으로 관리합니다.

- Migration 파일 위치: `backend/src/main/resources/db/migration`
- 파일명 예시: `V2__add_member_phone.sql`
- 기본 실행 흐름: Flyway가 SQL migration을 먼저 실행하고, JPA는 `JPA_DDL_AUTO=validate`로 엔티티와 DB 스키마를 검증합니다.
- 기존 로컬/운영 DB에 Flyway 이력이 없을 수 있으므로 `FLYWAY_BASELINE_ON_MIGRATE=true`, `FLYWAY_BASELINE_VERSION=0`을 기본값으로 둡니다.
- `JPA_DDL_AUTO=update`는 로컬 긴급 확인용으로만 사용하고, 기본 운영 흐름은 `validate + Flyway`입니다.

Migration SQL은 기존 데이터를 삭제하거나 테이블을 drop하지 않아야 합니다.

### 4. 애플리케이션 실행

Gradle Wrapper로 실행합니다.

Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

macOS/Linux:

```bash
cd backend
./gradlew bootRun
```

실행 후 API 문서는 다음 경로에서 확인합니다.

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Local Run & Test

### 실행 순서

1. MySQL을 실행하고 `pkm_box_store` DB와 `pkm_user` 계정을 준비합니다.
2. `backend/.env.example`을 참고해 백엔드 환경변수를 실행 환경에 주입합니다.
3. 백엔드를 실행합니다.

```powershell
cd backend
.\gradlew.bat bootRun
```

4. `frontend/.env.example`을 참고해 `frontend/.env.local`을 만듭니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TOSS_CLIENT_KEY=
```

5. 프론트엔드를 실행합니다.

```powershell
cd frontend
npm install
npm run dev
```

Toss 테스트 결제를 하려면 다음 두 값이 필요합니다.

- Backend: `TOSS_PAYMENTS_SECRET_KEY`
- Frontend: `NEXT_PUBLIC_TOSS_CLIENT_KEY`

두 키는 같은 Toss 테스트 상점의 Secret Key와 Client Key여야 합니다.

키 값은 Toss 개발자센터에서 발급받아 로컬 환경변수에만 저장하고, `.env`, `.env.local`, 문서, 커밋에는 남기지 않습니다.

브라우저에서 `http://localhost:3000`에 접속합니다. 결제 멱등성, 감사 로그, 토큰 만료, CORS, S3 업로드 검증 등 상세 테스트는 [docs/local-test-checklist.md](docs/local-test-checklist.md)를 참고하세요.

신규 DB에서 빠르게 로컬 확인할 때는 임시로 `JPA_DDL_AUTO=update`를 사용할 수 있습니다. `validate` 환경에서는 `email_verifications`를 포함한 필요한 테이블이 미리 생성되어 있어야 합니다.
