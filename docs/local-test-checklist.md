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

### Backend 환경변수

- [ ] `backend/.env.example`을 참고해 백엔드 실행 환경변수를 준비한다.
- [ ] Spring Boot는 `.env` 파일을 자동 로드하지 않으므로 IDE 실행 설정, 터미널 환경변수, Docker 설정 등으로 주입한다.
- [ ] 아래 환경변수를 확인한다.
  - [ ] `DB_URL`
  - [ ] `DB_USERNAME`
  - [ ] `DB_PASSWORD`
  - [ ] `JWT_SECRET`
  - [ ] `TOSS_PAYMENTS_SECRET_KEY`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] Toss 키, AWS 키, DB 비밀번호, JWT Secret은 `.env`, `.env.local`, 문서, 커밋에 남기지 않는다.
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

- [ ] `/signup`에서 회원가입한다.
- [ ] `/login`에서 로그인한다.
- [ ] localStorage에 `pkm_access_token`이 저장되는지 확인한다.
- [ ] Header에 장바구니와 주문 메뉴가 보이는지 확인한다.
- [ ] localStorage의 `pkm_access_token`을 잘못된 값으로 변경한다.
- [ ] `/cart`, `/orders`, `/admin` 같은 보호 페이지에 접근한다.
- [ ] `/login?reason=expired`로 이동하는지 확인한다.
- [ ] 로그인 만료 안내 메시지가 표시되는지 확인한다.

## 4. 상품/장바구니/주문 흐름

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

## 5. Toss 결제 및 멱등성

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

## 6. 관리자 흐름과 감사 로그

### 관리자 권한

- [ ] 테스트 계정의 DB `members.role`을 `ROLE_ADMIN`으로 변경한다.
- [ ] 로그아웃 후 다시 로그인한다.
- [ ] Header에 관리자 대시보드, 상품, 주문, 감사 로그 링크가 보이는지 확인한다.

### 관리자 상품

- [ ] `/admin/products`에서 상품을 등록한다.
- [ ] 상품을 수정한다.
- [ ] 상품 수정에서 출시일과 이미지 URL을 비우고 저장하면 기존 `releaseDate`, `imageUrl`이 제거되는지 확인한다.
- [ ] 상품을 숨김 처리한다.
- [ ] 숨김 처리된 상품이 일반 상품 목록에서는 보이지 않고 `/admin/products` 관리자 상품 목록에는 계속 보이는지 확인한다.
- [ ] 숨김 처리된 상품을 관리자 상품 수정으로 `ON_SALE` 등 다른 상태로 변경할 수 있는지 확인한다.
- [ ] `/admin/audit-logs`에서 `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_HIDDEN` 로그를 확인한다.

### 관리자 주문/배송

- [ ] `/admin/orders`에서 주문 목록을 확인한다.
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

## 7. CORS 확인

- [ ] `CORS_ALLOWED_ORIGINS`에 로컬 프론트 Origin을 설정한다.
- [ ] 로컬 프론트에서 백엔드 API 호출이 정상 동작하는지 확인한다.
- [ ] 허용되지 않은 Origin으로 preflight 요청 시 CORS 허용 응답이 내려오지 않는지 확인한다.
- [ ] 운영/스테이징 배포 시 실제 프론트 도메인을 `CORS_ALLOWED_ORIGINS`에 설정한다.
- [ ] 여러 Origin은 쉼표로 구분하고 공백이 trim되는지 확인한다.

## 8. S3 이미지 업로드 검증

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

## 9. DB 확인 쿼리

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

## 10. 자주 발생하는 오류

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
