# PKM Box Store

한국어판 포켓몬 카드 박스만 판매하는 커머스 프로젝트입니다.

## Tech Stack

- Backend: Spring Boot 3.x, Java 17, Gradle, JPA, MySQL, Spring Security, JWT
- Frontend: Next.js, TypeScript
- Payment: Toss Payments
- Image Storage: AWS S3
- Deploy: AWS

## Core Features

- 상품 목록 / 상세 조회
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
- `JWT_SECRET`
- `TOSS_PAYMENTS_SECRET_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Toss 테스트 결제를 하려면 백엔드에 `TOSS_PAYMENTS_SECRET_KEY`를 설정해야 합니다. 이 값은 프론트엔드의 `NEXT_PUBLIC_TOSS_CLIENT_KEY`와 같은 Toss 테스트 상점의 키여야 합니다.

S3 실제 업로드를 테스트하지 않더라도 로컬 부팅을 위해 AWS/S3 환경변수에 더미 값이 필요할 수 있습니다. 실제 업로드 테스트에는 유효한 버킷, 리전, 접근 키, 권한 정책이 필요합니다.

### 2. MySQL 준비

로컬 MySQL에 데이터베이스와 계정을 준비합니다.

```sql
CREATE DATABASE pkm_box_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pkm_user'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON pkm_box_store.* TO 'pkm_user'@'%';
FLUSH PRIVILEGES;
```

### 3. 애플리케이션 실행

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

브라우저에서 `http://localhost:3000`에 접속합니다. 자세한 쇼핑몰 흐름 테스트는 [docs/local-test-checklist.md](docs/local-test-checklist.md)를 참고하세요.
