# Local Test Checklist

로컬에서 PKM Box Store의 회원, 관리자, 결제, 배송, 운영 안정성 흐름을 재현하기 위한 체크리스트입니다.

## 0. 자동 검증

- [ ] 백엔드 단위/슬라이스 테스트를 실행한다.

```powershell
cd backend
.\gradlew.bat test --no-daemon
```

- [ ] 프론트엔드 프로덕션 빌드를 실행한다.

```powershell
cd frontend
npm run build
```

## 1. 로컬 실행 전 준비

### MySQL

- [ ] MySQL 8.x를 실행한다.
- [ ] 로컬 테스트 DB와 계정을 만든다.

```sql
CREATE DATABASE pkm_box_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pkm_user'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON pkm_box_store.* TO 'pkm_user'@'%';
FLUSH PRIVILEGES;
```

- [ ] 스키마가 없으면 최초 구동 시 임시로 `JPA_DDL_AUTO=update`를 사용한다.
- [ ] `JPA_DDL_AUTO=validate`를 사용할 경우 필요한 테이블이 이미 생성되어 있어야 한다.
- [ ] 기본 로컬/운영 흐름은 `JPA_DDL_AUTO=validate`와 Flyway migration을 함께 사용한다.
- [ ] 새 엔티티나 컬럼을 추가하면 `backend/src/main/resources/db/migration`에 MySQL migration SQL을 추가한다.
- [ ] migration SQL은 기존 데이터 삭제, 테이블 drop, 운영 Secret 기록을 포함하지 않는다.
- [ ] 기존 DB에 Flyway 이력이 없으면 `FLYWAY_BASELINE_ON_MIGRATE=true`, `FLYWAY_BASELINE_VERSION=0`으로 baseline 후 신규 migration을 실행한다.
- [ ] `JPA_DDL_AUTO=update`는 로컬 긴급 확인용으로만 사용하고, 작업 완료 전에는 migration SQL을 작성한다.

### Backend 환경변수

- [ ] `backend/.env.example`을 참고해 백엔드 실행 환경변수를 준비한다.
- [ ] Spring Boot는 `.env` 파일을 자동 로드하지 않으므로 IDE 실행 설정, 터미널 환경변수, Docker 설정 등으로 주입한다.
- [ ] 아래 환경변수를 확인한다.
  - [ ] `DB_URL`
  - [ ] `DB_USERNAME`
  - [ ] `DB_PASSWORD`
  - [ ] `FLYWAY_ENABLED`
  - [ ] `FLYWAY_BASELINE_ON_MIGRATE`
  - [ ] `FLYWAY_BASELINE_VERSION`
  - [ ] `JPA_DDL_AUTO`
  - [ ] `HIBERNATE_FORMAT_SQL`
  - [ ] `HIBERNATE_DEFAULT_BATCH_FETCH_SIZE`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_ACCESS_TOKEN_EXPIRATION_MS`
  - [ ] `JWT_REFRESH_TOKEN_EXPIRATION_MS`
  - [ ] `MAIL_MODE`
  - [ ] `MAIL_FROM`
  - [ ] `MAIL_HOST`
  - [ ] `MAIL_PORT`
  - [ ] `MAIL_USERNAME`
  - [ ] `MAIL_PASSWORD`
  - [ ] `MAIL_SMTP_AUTH`
  - [ ] `MAIL_SMTP_STARTTLS_ENABLE`
  - [ ] `EMAIL_VERIFICATION_CODE_TTL_SECONDS`
  - [ ] `EMAIL_VERIFICATION_TOKEN_TTL_SECONDS`
  - [ ] `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS`
  - [ ] `EMAIL_VERIFICATION_MAX_FAILED_ATTEMPTS`
  - [ ] `EMAIL_VERIFICATION_MAX_SENDS_PER_WINDOW`
  - [ ] `EMAIL_VERIFICATION_SEND_WINDOW_SECONDS`
  - [ ] `EMAIL_VERIFICATION_CLEANUP_RETENTION_DAYS`
  - [ ] `EMAIL_VERIFICATION_CLEANUP_CRON`
  - [ ] `TOSS_PAYMENTS_SECRET_KEY`
  - [ ] `TOSS_PAYMENTS_CLIENT_KEY`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `SPRINGDOC_API_DOCS_ENABLED`
  - [ ] `SPRINGDOC_SWAGGER_UI_ENABLED`
  - [ ] `LOGGING_LEVEL_HIBERNATE_SQL`
- [ ] Toss 키, AWS 키, DB 비밀번호, JWT Secret은 `.env`, `.env.local`, 문서, 커밋에 남기지 않는다.
- [ ] 로컬 이메일 인증은 기본적으로 `MAIL_MODE=LOG`를 사용한다.
- [ ] 실제 SMTP를 테스트할 때만 `MAIL_MODE=SMTP`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`를 로컬 환경변수로 설정한다.
- [ ] SMTP 비밀번호나 앱 비밀번호는 문서, 코드, 커밋에 남기지 않는다.
- [ ] S3 실제 업로드를 테스트하려면 유효한 버킷, 리전, 접근 키, 권한 정책을 준비한다.

### Frontend 환경변수

- [ ] `frontend/.env.example`을 참고해 `frontend/.env.local`을 만든다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TOSS_CLIENT_KEY=
```

- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 Toss 개발자센터에서 발급받은 테스트 상점 Client Key를 로컬 환경변수로만 설정한다.
- [ ] 백엔드 `TOSS_PAYMENTS_SECRET_KEY`와 같은 Toss 테스트 상점의 키인지 확인한다.
- [ ] 테스트 키 값도 커밋하지 않는다.

## 2. 실행 방법

### Backend

```powershell
cd backend
.\gradlew.bat bootRun
```

- [ ] Swagger UI: `http://localhost:8080/swagger-ui.html`
- [ ] 상품 목록 API: `http://localhost:8080/api/products`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

- [ ] 브라우저에서 `http://localhost:3000`에 접속한다.

## 3. 회원/인증 흐름

- [ ] `MAIL_MODE=LOG`로 백엔드를 실행한다.
- [ ] `/signup`에서 이메일을 입력하고 인증번호 발송을 누른다.
- [ ] 백엔드 로그의 `[EMAIL_VERIFICATION] purpose=SIGNUP` 항목에서 인증번호를 확인한다.
- [ ] 인증번호를 입력해 이메일 인증을 완료한다.
- [ ] 인증 완료 후 회원가입한다.
- [ ] `/login`에서 로그인한다.
- [ ] localStorage에 `pkm_access_token`이 저장되는지 확인한다.
- [ ] Header에 장바구니와 주문 메뉴가 보이는지 확인한다.
- [ ] localStorage의 `pkm_access_token`을 잘못된 값으로 변경한다.
- [ ] `/cart`, `/orders`, `/admin` 같은 보호 페이지에 접근한다.
- [ ] `/login?reason=expired`로 이동하는지 확인한다.
- [ ] 로그인 만료 안내 메시지가 표시되는지 확인한다.
- [ ] `/login`에서 비밀번호 찾기 링크를 클릭한다.
- [ ] `/password-reset`에서 이메일 인증번호를 발송한다.
- [ ] 백엔드 로그의 `[EMAIL_VERIFICATION] purpose=PASSWORD_RESET` 항목에서 인증번호를 확인한다.
- [ ] 인증번호 확인 후 새 비밀번호로 재설정한다.
- [ ] 기존 비밀번호로 로그인이 실패하고 새 비밀번호로 로그인이 성공하는지 확인한다.
- [ ] 주문 생성, 결제 완료, 배송 시작, 배송 완료 시 `MAIL_MODE=LOG`에서 `[CUSTOMER_EMAIL]` 로그가 남는지 확인한다.

## 4. 마이페이지 흐름

- [ ] Header의 마이페이지 링크가 `/mypage`로 이동하는지 확인한다.
- [ ] `/mypage` 홈에서 프로필, 주문 요약, 최근 주문, 기본 배송지, 최근 본 상품이 실제 API/localStorage 데이터로 표시되는지 확인한다.
- [ ] 최근 본 상품은 상품 상세 또는 상품 카드 진입 후 `/mypage`에 반영되는지 확인한다.
- [ ] `/mypage/orders`에서 주문 목록이 표시되고 주문 상세 링크가 `/orders/{orderId}`로 이동하는지 확인한다.
- [ ] 기존 `/orders` 경로가 `/mypage/orders`로 이동하는지 확인한다.
- [ ] `/mypage/login-info`에서 이메일과 비밀번호 마스킹이 표시되는지 확인한다.
- [ ] 비밀번호 `변경` 버튼 클릭 시 작은 모달이 열리는지 확인한다.
- [ ] 현재 비밀번호가 틀리면 비밀번호 변경이 실패하는지 확인한다.
- [ ] 새 비밀번호와 확인 값이 다르면 프론트에서 변경이 차단되는지 확인한다.
- [ ] 비밀번호 변경 후 기존 비밀번호 로그인이 실패하고 새 비밀번호 로그인이 성공하는지 확인한다.
- [ ] `/mypage/profile`에서 프로필 이미지, 이름, 소개가 표시되는지 확인한다.
- [ ] 프로필 이미지/이름/소개의 `변경` 버튼 클릭 시 작은 모달이 열리는지 확인한다.
- [ ] 프로필 변경 저장 후 새로고침해도 변경 내용이 유지되는지 확인한다.
- [ ] `/mypage/addresses`에서 기본 배송지와 저장된 주소가 분리 표시되는지 확인한다.
- [ ] `+ 새 주소 추가하기` 클릭 시 주소 입력 모달이 열리는지 확인한다.
- [ ] 주소 추가 모달에서 다음 우편번호 검색이 동작하는지 확인한다.
- [ ] 주소 수정, 삭제, 기본 배송지 설정이 실제 배송지 API 결과와 일치하는지 확인한다.
- [ ] 기존 `/my/addresses` 경로가 `/mypage/addresses`로 이동하는지 확인한다.

## 5. 상품/장바구니/주문 흐름

- [ ] `/`에서 상품 목록이 보이는지 확인한다.
- [ ] keyword/category/series/status/inStockOnly/sort 필터가 동작하는지 확인한다.
- [ ] 상품 상세에서 장바구니 담기와 바로 구매가 동작하는지 확인한다.
- [ ] `ON_SALE`이 아닌 상품은 상품 상세에서 구매 버튼이 비활성화되는지 확인한다.
- [ ] `SOLD_OUT`, `COMING_SOON`, `HIDDEN` 상품을 API로 장바구니에 담으려 하면 `PRODUCT_NOT_PURCHASABLE`로 거부되는지 확인한다.
- [ ] 재고가 0이거나 요청 수량보다 부족한 상품을 장바구니에 담으려 하면 `OUT_OF_STOCK`으로 거부되는지 확인한다.
- [ ] `/cart`에서 수량 변경, 삭제, 비우기가 동작하는지 확인한다.
- [ ] `/cart`에서 재고보다 큰 수량으로 변경하려 하면 `OUT_OF_STOCK`으로 거부되는지 확인한다.
- [ ] 배송지를 선택하거나 직접 입력해 주문을 생성한다.
- [ ] 주문 생성 직전 상품 상태가 `ON_SALE`이 아니거나 재고가 부족해진 경우 주문 생성이 거부되는지 확인한다.
- [ ] 주문 생성 후 `/orders/{orderId}/payment`로 이동하는지 확인한다.
- [ ] DB에서 주문 상태가 `PAYMENT_PENDING`, 재고 이력이 `RESERVED`인지 확인한다.

## 6. Toss 결제 및 멱등성

- [ ] 결제하기 클릭 시 Toss 결제창이 정상 호출되는지 확인한다.
- [ ] Toss `requestPayment.orderId`가 내부 숫자 ID가 아니라 주문 `orderUid`인지 확인한다.
- [ ] 성공 URL과 실패 URL에 `internalOrderId`가 포함되는지 확인한다.
- [ ] 결제 성공 후 `/payments/success`로 복귀하는지 확인한다.
- [ ] 결제 승인 API `POST /api/payments/confirm`이 호출되는지 확인한다.
- [ ] 주문 상태가 `PAID`, 결제 상태가 `APPROVED`, 재고 이력이 `CONFIRMED`인지 확인한다.
- [ ] 결제 성공 페이지를 새로고침한다.
- [ ] 같은 `paymentKey`, `providerOrderId`, `amount` 중복 승인 요청이 기존 결제 응답을 반환하는지 확인한다.
- [ ] 중복 승인 시 주문/결제/`CONFIRMED` 재고 이력이 중복 처리되지 않는지 확인한다.
- [ ] 결제 실패 또는 결제 대기 페이지 취소 시 주문 상태가 `FAILED`, 재고 이력이 `RELEASED`인지 확인한다.
- [ ] 사용자 결제 취소/환불 시 주문과 결제 상태가 `CANCELED`인지 확인한다.
- [ ] 같은 주문에 다른 `paymentKey` 또는 Toss 주문번호가 들어오면 승인이 거부되는지 확인한다.
- [ ] 같은 관리자 환불 요청을 반복해도 재고와 `RELEASED` 이력이 중복 처리되지 않는지 확인한다.

## 7. 관리자 흐름과 감사 로그

### 관리자 권한

- [ ] 테스트 계정의 DB `members.role`을 `ROLE_ADMIN`으로 변경한다.
- [ ] 로그아웃 후 다시 로그인한다.
- [ ] Header에 관리자 대시보드, 카탈로그, 상품, 주문, 감사 로그 링크가 보이는지 확인한다.

### 관리자 Catalog

- [ ] `/admin/catalog`에 접속한다.
- [ ] Category 탭에서 새 Category를 생성한다.
- [ ] Category 이름, slug, 설명, 표시 순서, active 값을 수정한다.
- [ ] Category를 `active=false`로 숨김 처리하고 목록의 상태 배지가 바뀌는지 확인한다.
- [ ] 숨김 처리한 Category를 다시 활성화한다.
- [ ] ProductType 탭에서 Category를 선택해 새 ProductType을 생성한다.
- [ ] ProductType 이름, slug, 설명, 표시 순서, active 값을 수정한다.
- [ ] ProductType을 `active=false`로 숨김 처리하고 목록의 상태 배지가 바뀌는지 확인한다.
- [ ] 숨김 처리한 ProductType을 다시 활성화한다.
- [ ] Series 탭에서 새 Series를 생성한다.
- [ ] Series 이름, slug, 설명, 표시 순서, active 값을 수정한다.
- [ ] Series를 `active=false`로 숨김 처리하고 목록의 상태 배지가 바뀌는지 확인한다.
- [ ] 숨김 처리한 Series를 다시 활성화한다.
- [ ] Catalog 생성/수정/숨김 처리 중 slug 중복, 잘못된 slug 형식, 권한 없음 오류가 사용자에게 표시되는지 확인한다.

### 관리자 상품

- [ ] `/admin/products`에서 상품을 등록한다.
- [ ] 상품 등록 폼에서 Category, ProductType, Series를 선택할 수 있는지 확인한다.
- [ ] Category 선택 시 ProductType 목록이 해당 Category에 속한 항목으로 제한되는지 확인한다.
- [ ] Series는 전체 Series 목록에서 선택할 수 있고, 선택 안 함 옵션이 있는지 확인한다.
- [ ] Language select에서 한국어판, 일본어판, 영어판을 선택할 수 있는지 확인한다.
- [ ] 정가 또는 소비자가 입력 없이 저장하면 `retailPrice`가 비워지는지 확인한다.
- [ ] 정가를 입력해 저장하면 관리자 상품 목록에 정가가 표시되는지 확인한다.
- [ ] 기존 `category`/`series` 문자열만 있는 상품을 수정 화면에서 열어도 레거시 값이 유지되고 저장 흐름이 깨지지 않는지 확인한다.
- [ ] 상품 저장 후 관리자 상품 목록에서 `categoryName`, `productTypeName`, `seriesName`, `language`, `retailPrice` 표시를 확인한다.
- [ ] `/admin/products`에서 상품명, master 카테고리, master 상품 유형, master 시리즈, 레거시 카테고리/시리즈, 상태, 재고 부족 필터가 동작하는지 확인한다.
- [ ] 상품을 수정한다.
- [ ] 상품 수정에서 출시일과 이미지 URL을 비우고 저장하면 기존 `releaseDate`, `imageUrl`이 제거되는지 확인한다.
- [ ] 상품을 숨김 처리한다.
- [ ] 숨김 처리된 상품이 일반 상품 목록에서는 보이지 않고 `/admin/products` 관리자 상품 목록에는 계속 보이는지 확인한다.
- [ ] 숨김 처리된 상품을 관리자 상품 수정으로 `ON_SALE` 등 다른 상태로 변경할 수 있는지 확인한다.
- [ ] `/admin/audit-logs`에서 `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_HIDDEN` 로그를 확인한다.

### 관리자 주문/배송

- [ ] `/admin/orders`에서 주문 목록을 확인한다.
- [ ] `/admin/orders`에서 주문 상태, 회원 이메일, 기간 필터가 동작하는지 확인한다.
- [ ] `/admin/orders/{id}`에서 주문 상세를 확인한다.
- [ ] `PAID -> PREPARING` 처리 후 `/admin/audit-logs`에서 `ORDER_PREPARED` 로그를 확인한다.
- [ ] `PREPARING -> SHIPPED` 처리 시 택배사와 운송장 번호를 입력한다.
- [ ] `/admin/audit-logs`에서 `ORDER_SHIPPED` 로그와 설명의 택배사/운송장 번호를 확인한다.
- [ ] `SHIPPED -> DELIVERED` 처리 후 `/admin/audit-logs`에서 `ORDER_DELIVERED` 로그를 확인한다.

### 관리자 결제 취소/환불

- [ ] `PAID` 주문의 관리자 주문 상세에서 취소 사유를 입력한다.
- [ ] 관리자 결제 취소/환불을 실행한다.
- [ ] 주문 상태와 결제 상태가 `CANCELED`인지 확인한다.
- [ ] 재고가 복구되고 `RELEASED` 이력이 저장되는지 확인한다.
- [ ] 같은 관리자 환불 요청을 재시도한다.
- [ ] 재고 복구와 `RELEASED` 이력이 중복 처리되지 않는지 확인한다.
- [ ] `/admin/audit-logs`에서 `PAYMENT_CANCELED` 로그를 확인한다.

## 8. CORS 확인

- [ ] `CORS_ALLOWED_ORIGINS`에 로컬 프론트 Origin을 설정한다.
- [ ] 로컬 프론트에서 백엔드 API 호출이 정상 동작하는지 확인한다.
- [ ] 허용되지 않은 Origin으로 preflight 요청 시 CORS 허용 응답이 내려오지 않는지 확인한다.
- [ ] 운영/스테이징 배포 시 실제 프론트 도메인을 `CORS_ALLOWED_ORIGINS`에 설정한다.
- [ ] 여러 Origin은 쉼표로 구분하고 공백이 trim되는지 확인한다.

## 9. S3 이미지 업로드 검증

- [ ] `/admin/products`에서 이미지 업로드를 실행한다.
- [ ] `jpg`, `jpeg`, `png`, `webp` 파일 업로드가 허용되는지 확인한다.
- [ ] 확장자가 없는 파일이 거부되는지 확인한다.
- [ ] 허용되지 않은 확장자 파일이 거부되는지 확인한다.
- [ ] 빈 파일이 거부되는지 확인한다.
- [ ] 5MB 초과 파일이 거부되는지 확인한다.
- [ ] MIME 타입이 허용 목록에 없으면 거부되는지 확인한다.
- [ ] 확장자와 MIME 타입이 불일치하면 거부되는지 확인한다.
- [ ] 업로드된 S3 key가 `products/{uuid}.{extension}` 형태인지 확인한다.
- [ ] 원본 파일명의 공백, 한글, 특수문자가 S3 key에 직접 반영되지 않는지 확인한다.

## 10. 출시 전 회귀 QA

- [ ] 회원가입, 로그인, 비밀번호 재설정이 정상 동작한다.
- [ ] 마이페이지 홈, 로그인 정보, 프로필 관리, 주소록, 주문 내역이 모바일/데스크톱에서 깨지지 않는다.
- [ ] 상품 목록, 상품 상세, 장바구니, 주문 생성, 결제 대기 페이지가 정상 동작한다.
- [ ] 결제 성공, 결제 실패, 결제 대기 취소, 관리자 환불을 각각 확인한다.
- [ ] 관리자 Catalog 생성/수정/숨김, 상품 등록/수정/숨김, 이미지 업로드, 주문 검색/필터, 배송 상태 변경, 감사 로그 조회를 확인한다.
- [ ] 고객 이메일 알림 또는 `MAIL_MODE=LOG` 로그가 회원/주문/결제/배송 흐름에 맞게 남는지 확인한다.
- [ ] 운영/스테이징 배포 전에는 [release-qa-checklist.md](release-qa-checklist.md)와 [operations-readiness.md](operations-readiness.md)의 스테이징, Secret, 결제 검증, 모니터링 항목을 함께 확인한다.

## 11. DB 확인 쿼리

### 주문

```sql
SELECT id, order_uid, member_id, status, total_price, courier_company, tracking_number, shipped_at, delivered_at, created_at, updated_at
FROM orders
ORDER BY id DESC;
```

### 결제

```sql
SELECT id, order_id, provider, status, payment_key, provider_order_id, amount, approved_at
FROM payments
ORDER BY id DESC;
```

### 재고 이력

```sql
SELECT id, product_id, type, quantity, reason, created_at
FROM inventory_histories
ORDER BY id DESC;
```

### 관리자 감사 로그

```sql
SELECT id, admin_id, admin_email, action_type, target_type, target_id, description, created_at
FROM admin_audit_logs
ORDER BY id DESC;
```

### 회원 프로필

```sql
SELECT id, email, name, profile_image_url, bio, role, created_at, updated_at
FROM members
ORDER BY id DESC;
```

### 배송지

```sql
SELECT id, member_id, label, receiver_name, receiver_phone, zip_code, address1, address2, is_default, created_at, updated_at
FROM delivery_addresses
ORDER BY member_id, is_default DESC, created_at DESC;
```

## 12. 자주 발생하는 오류

### 401 Unauthorized

- 원인: 로그인하지 않았거나 JWT가 만료/변조되었거나 `JWT_SECRET`이 변경되었다.
- 해결: localStorage의 `pkm_access_token`을 삭제하고 다시 로그인한다.
- 프론트 UX: 보호 API에서 401이 발생하면 `/login?reason=expired`로 이동하고 만료 안내 메시지를 표시한다.

### 403 Forbidden

- 원인: 관리자 API에 일반 회원 권한으로 접근했다.
- 해결: DB에서 `ROLE_ADMIN`으로 변경한 뒤 로그아웃 후 다시 로그인한다.

### PRODUCT_NOT_PURCHASABLE

- 원인: 상품 상태가 `ON_SALE`이 아니라 장바구니 담기 또는 주문 생성이 허용되지 않는다.
- 해결: 관리자 상품 관리에서 상품 상태를 확인하고, 판매 가능한 상품만 `ON_SALE`로 변경한다.

### OUT_OF_STOCK

- 원인: 상품 재고가 0이거나 요청 수량보다 부족하다.
- 해결: 관리자 상품 관리에서 재고를 확인하거나 주문 수량을 줄인다.

### Toss 키 누락 또는 상점 불일치

- 원인: 프론트 Client Key 또는 백엔드 Secret Key가 없거나 서로 다른 테스트 상점의 키이다.
- 해결: Toss 개발자센터에서 같은 테스트 상점의 키를 확인해 로컬 환경변수로 설정하고 서버를 재시작한다.
- 주의: 키 값은 문서나 커밋에 남기지 않는다.

### S3 업로드 실패

- 원인: AWS/S3 환경변수 누락, IAM 권한 부족, 파일 형식/크기 검증 실패.
- 해결: `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`와 IAM 권한을 확인한다.
- 파일 검증 오류는 `INVALID_IMAGE_FILE`, `IMAGE_FILE_TOO_LARGE`, `IMAGE_UPLOAD_FAILED` 응답을 확인한다.
