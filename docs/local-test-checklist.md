# Local Test Checklist

로컬에서 백엔드와 프론트엔드를 실행한 뒤 쇼핑몰의 일반 사용자, 결제, 관리자 흐름을 점검하기 위한 체크리스트입니다.

## 1. 사전 준비

### MySQL 실행

- [ ] MySQL 8.x를 실행한다.
- [ ] 로컬 테스트 DB와 계정을 만든다.

```sql
CREATE DATABASE pkm_box_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pkm_user'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON pkm_box_store.* TO 'pkm_user'@'%';
FLUSH PRIVILEGES;
```

- [ ] `JPA_DDL_AUTO=validate`를 사용할 경우 필요한 테이블이 이미 생성되어 있어야 한다.
- [ ] 최초 로컬 테스트에서 스키마가 없다면 임시로 `JPA_DDL_AUTO=update`를 사용해 구동한 뒤 테이블 생성을 확인한다.

### Backend 환경변수

- [ ] `backend/.env.example`을 참고해 백엔드 실행 환경변수를 준비한다.
- [ ] Spring Boot는 `.env` 파일을 자동 로드하지 않으므로 IDE 실행 설정, 터미널 환경변수, Docker 설정 등으로 주입한다.

필수 값:

- [ ] `SERVER_PORT=8080`
- [ ] `DB_URL=jdbc:mysql://localhost:3306/pkm_box_store?serverTimezone=Asia/Seoul&characterEncoding=UTF-8`
- [ ] `DB_USERNAME=pkm_user`
- [ ] `DB_PASSWORD=change-me`
- [ ] `JWT_SECRET`: 32바이트 이상 긴 랜덤 문자열
- [ ] `TOSS_PAYMENTS_SECRET_KEY`: Toss 테스트 Secret Key, 보통 `test_sk...`

이미지 업로드 테스트 시 추가:

- [ ] `AWS_S3_BUCKET`
- [ ] `AWS_REGION=ap-northeast-2`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`

### Frontend `.env.local`

- [ ] `frontend/.env.example`을 참고해 `frontend/.env.local`을 만든다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
```

### Toss 테스트 키

- [ ] Toss Payments 개발자센터에서 테스트 Client Key와 Secret Key를 확인한다.
- [ ] 프론트엔드에는 `NEXT_PUBLIC_TOSS_CLIENT_KEY`로 Client Key를 넣는다.
- [ ] 백엔드에는 `TOSS_PAYMENTS_SECRET_KEY`로 Secret Key를 넣는다.
- [ ] Client Key와 Secret Key가 같은 상점의 테스트 키인지 확인한다.

## 2. 백엔드 실행 방법

- [ ] 터미널에서 백엔드 디렉터리로 이동한다.

```powershell
cd backend
```

- [ ] 환경변수를 주입한 상태에서 실행한다.

```powershell
.\gradlew.bat bootRun
```

- [ ] 정상 실행 후 아래 URL을 확인한다.
  - [ ] Swagger UI: `http://localhost:8080/swagger-ui.html`
  - [ ] 상품 목록 API: `http://localhost:8080/api/products`

## 3. 프론트엔드 실행 방법

- [ ] 터미널에서 프론트엔드 디렉터리로 이동한다.

```powershell
cd frontend
```

- [ ] 의존성을 설치한다.

```powershell
npm install
```

- [ ] 개발 서버를 실행한다.

```powershell
npm run dev
```

- [ ] 브라우저에서 `http://localhost:3000`에 접속한다.

## 4. 일반 사용자 흐름 테스트

### 회원가입

- [ ] `/signup`으로 이동한다.
- [ ] 이메일, 비밀번호, 이름을 입력해 회원가입한다.
- [ ] DB `members` 테이블에 새 회원이 `ROLE_MEMBER`로 생성되었는지 확인한다.

### 로그인

- [ ] `/login`으로 이동한다.
- [ ] 가입한 계정으로 로그인한다.
- [ ] 헤더에 장바구니와 주문 메뉴가 보이는지 확인한다.
- [ ] 브라우저 localStorage에 `pkm_access_token`이 저장되었는지 확인한다.

### 상품 조회

- [ ] `/`에서 상품 목록이 보이는지 확인한다.
- [ ] 상품을 클릭해 `/products/{id}` 상세 페이지가 보이는지 확인한다.
- [ ] 상품이 없으면 관리자 계정으로 상품을 먼저 등록한다.

### 장바구니 담기

- [ ] 상품 상세에서 수량을 입력하고 장바구니에 담는다.
- [ ] `/cart`로 이동해 상품명, 단가, 수량, 합계, 총 금액이 맞는지 확인한다.
- [ ] 수량 변경과 삭제가 정상 동작하는지 확인한다.

### 주문 생성

- [ ] `/cart`에서 수령인, 연락처, 주소를 입력한다.
- [ ] 주문 생성 버튼을 누른다.
- [ ] 성공 시 메시지만 보여주는 것이 아니라 `/orders/{orderId}/payment`로 이동하는지 확인한다.
- [ ] DB에서 `orders.status`가 `PAYMENT_PENDING`인지 확인한다.
- [ ] DB에서 `products.stock_quantity`가 주문 수량만큼 감소했는지 확인한다.
- [ ] DB에서 `inventory_histories.type=RESERVED` 기록이 생성되었는지 확인한다.

### 결제 대기 페이지 이동

- [ ] `/orders/{orderId}/payment`에서 주문번호, 주문 상태, 상품 목록, 총 금액, 배송 정보, 만료 시간이 보이는지 확인한다.
- [ ] 주문 상태가 `PAYMENT_PENDING`일 때만 결제하기와 결제 취소 버튼이 보이는지 확인한다.
- [ ] 결제하기 클릭 시 Toss Payments 결제창이 열리는지 확인한다.

### Toss 결제 성공

- [ ] Toss 테스트 결제창에서 테스트 카드 또는 제공되는 테스트 수단으로 결제를 성공시킨다.
- [ ] Toss 리다이렉트 후 `/payments/success?orderId={order.id}` 페이지로 이동하는지 확인한다.
- [ ] URL에 Toss가 추가한 `paymentKey`, `amount`가 포함되는지 확인한다.
- [ ] 성공 페이지가 먼저 `api.order(orderId)`를 조회한 뒤 `order.orderUid`를 `providerOrderId`로 사용해 결제 승인을 요청하는지 네트워크 탭에서 확인한다.
- [ ] 결제 완료 메시지와 주문 목록 이동 버튼이 보이는지 확인한다.
- [ ] `/orders`에서 주문 상태가 `PAID`로 바뀌었는지 확인한다.
- [ ] DB에서 `payments` 행이 생성되었는지 확인한다.
- [ ] DB에서 `inventory_histories.type=CONFIRMED` 기록이 생성되었는지 확인한다.

### Toss 결제 실패/취소

- [ ] 새 주문을 생성해 결제 대기 페이지로 이동한다.
- [ ] Toss 결제창에서 결제를 취소하거나 실패 케이스를 발생시킨다.
- [ ] `/payments/fail?orderId={order.id}` 페이지로 이동하는지 확인한다.
- [ ] `orderId`가 있으면 `api.failPayment(orderId)`가 한 번 호출되는지 네트워크 탭에서 확인한다.
- [ ] 실패/취소 안내와 주문 목록 이동 버튼이 보이는지 확인한다.
- [ ] `/orders`에서 주문 상태가 `FAILED`로 바뀌었는지 확인한다.
- [ ] DB에서 `products.stock_quantity`가 예약 전 수량으로 복구되었는지 확인한다.
- [ ] DB에서 `inventory_histories.type=RELEASED` 기록이 생성되었는지 확인한다.

## 5. 관리자 흐름 테스트

### 관리자 권한 부여 방법

- [ ] 일반 회원가입으로 관리자 테스트 계정을 만든다.
- [ ] MySQL에서 해당 계정의 권한을 `ROLE_ADMIN`으로 변경한다.

```sql
UPDATE members
SET role = 'ROLE_ADMIN'
WHERE email = 'admin@example.com';
```

- [ ] 기존 로그인 토큰에는 이전 권한이 들어 있으므로 로그아웃 후 다시 로그인한다.
- [ ] 헤더에 관리자 상품, 관리자 주문 메뉴가 보이는지 확인한다.

### 상품 등록

- [ ] `/admin/products`로 이동한다.
- [ ] 상품명, 설명, 가격, 카테고리, 시리즈, 출시일, 재고, 상태를 입력한다.
- [ ] 등록 후 상품 목록과 메인 상품 목록에 표시되는지 확인한다.
- [ ] DB `products` 테이블에 행이 생성되었는지 확인한다.

### 이미지 업로드

- [ ] `/admin/products`에서 `jpg`, `jpeg`, `png`, `webp` 파일을 선택한다.
- [ ] 이미지 업로드 버튼을 누른다.
- [ ] 업로드 성공 시 이미지 URL 필드가 채워지는지 확인한다.
- [ ] S3 버킷에 이미지가 생성되었는지 확인한다.
- [ ] 업로드된 URL로 상품을 등록하거나 수정한 뒤 이미지 미리보기가 보이는지 확인한다.

### 상품 수정

- [ ] 관리자 상품 목록에서 수정 버튼을 누른다.
- [ ] 가격, 재고, 상태, 이미지 URL 중 일부를 변경한다.
- [ ] 저장 후 목록과 DB `products` 값이 변경되었는지 확인한다.

### 상품 숨김

- [ ] 관리자 상품 목록에서 숨김 버튼을 누른다.
- [ ] DB `products.status`가 `HIDDEN`으로 변경되었는지 확인한다.
- [ ] 일반 상품 목록에서 숨김 상품의 노출 여부가 기획 의도와 맞는지 확인한다.

### 주문 상태 변경

- [ ] 결제 성공으로 `PAID` 상태의 주문을 만든다.
- [ ] `/admin/orders`로 이동한다.
- [ ] 상태를 `PREPARING`으로 변경한다.
- [ ] 이어서 `SHIPPED`, `DELIVERED` 순서로 변경한다.
- [ ] 허용 흐름은 `PAID -> PREPARING -> SHIPPED -> DELIVERED`이다.
- [ ] 잘못된 상태 변경 시 `INVALID_ORDER_STATUS` 오류가 나는지 확인한다.

## 6. DB에서 확인할 항목

### `orders.status`

- [ ] 주문 생성 직후: `PAYMENT_PENDING`
- [ ] Toss 결제 승인 후: `PAID`
- [ ] Toss 결제 실패/취소 또는 결제 취소 버튼 클릭 후: `FAILED`
- [ ] 관리자 처리 후: `PREPARING`, `SHIPPED`, `DELIVERED`
- [ ] 만료 스케줄러 처리 후: `EXPIRED`

예시:

```sql
SELECT id, order_uid, member_id, status, total_price, expires_at, created_at, updated_at
FROM orders
ORDER BY id DESC;
```

### `products.stock_quantity`

- [ ] 주문 생성 시 주문 수량만큼 감소하는지 확인한다.
- [ ] 결제 실패/취소 시 주문 수량만큼 복구되는지 확인한다.
- [ ] 결제 성공 시 감소된 수량이 유지되는지 확인한다.

```sql
SELECT id, name, stock_quantity, status
FROM products
ORDER BY id DESC;
```

### `payments`

- [ ] 결제 성공 시 `order_id`당 하나의 결제 행이 생성되는지 확인한다.
- [ ] `provider`가 `TOSS`인지 확인한다.
- [ ] `status`가 `APPROVED`인지 확인한다.
- [ ] `payment_key`, `provider_order_id`, `amount`, `approved_at`이 채워졌는지 확인한다.

```sql
SELECT id, order_id, provider, status, payment_key, provider_order_id, amount, approved_at
FROM payments
ORDER BY id DESC;
```

### `inventory_histories`

- [ ] 주문 생성 시 `RESERVED` 기록이 생성되는지 확인한다.
- [ ] 결제 성공 시 `CONFIRMED` 기록이 생성되는지 확인한다.
- [ ] 결제 실패/취소 시 `RELEASED` 기록이 생성되는지 확인한다.

```sql
SELECT id, product_id, type, quantity, reason, created_at
FROM inventory_histories
ORDER BY id DESC;
```

## 7. 자주 발생할 수 있는 오류와 해결 방법

### 401 Unauthorized

- 원인:
  - 로그인하지 않았거나 localStorage의 `pkm_access_token`이 없다.
  - JWT가 만료되었다.
  - `JWT_SECRET`이 서버 재시작 전후로 달라져 기존 토큰 검증에 실패했다.
- 해결:
  - 로그아웃 후 다시 로그인한다.
  - localStorage의 `pkm_access_token`을 삭제하고 다시 로그인한다.
  - 백엔드의 `JWT_SECRET`을 고정된 값으로 설정한다.

### 403 Forbidden

- 원인:
  - 관리자 API에 `ROLE_MEMBER` 계정으로 접근했다.
  - DB에서 `ROLE_ADMIN`으로 변경한 뒤 재로그인하지 않아 토큰에 이전 권한이 남아 있다.
- 해결:
  - DB `members.role`을 `ROLE_ADMIN`으로 변경한다.
  - 반드시 로그아웃 후 다시 로그인한다.

### CORS

- 원인:
  - 프론트엔드 `http://localhost:3000`에서 백엔드 `http://localhost:8080`으로 직접 요청할 때 백엔드 CORS 허용 설정이 없으면 브라우저가 차단한다.
- 해결:
  - 브라우저 개발자 도구 콘솔에서 CORS 오류 여부를 확인한다.
  - 로컬 검증만 급하면 API 클라이언트나 프록시 설정을 맞춘 환경에서 실행한다.
  - 근본 해결은 백엔드에 로컬 프론트 origin 허용 설정을 추가하는 것이다. 이 체크리스트 작성 작업에서는 백엔드 코드를 수정하지 않는다.

### Toss client key 누락

- 증상:
  - 결제하기 클릭 시 `Toss Payments 클라이언트 키가 설정되지 않았습니다.` 메시지가 표시된다.
- 해결:
  - `frontend/.env.local`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...`를 추가한다.
  - 프론트엔드 dev 서버를 재시작한다.

### Toss secret key 누락

- 증상:
  - Toss 결제창 인증은 성공했지만 `/payments/success`에서 결제 승인 API가 실패한다.
  - 백엔드 로그에 Toss 승인 실패 또는 인증 실패가 남는다.
- 해결:
  - 백엔드 실행 환경에 `TOSS_PAYMENTS_SECRET_KEY=test_sk_...`를 설정한다.
  - 프론트의 Client Key와 같은 Toss 테스트 상점의 Secret Key인지 확인한다.
  - 백엔드를 재시작한다.

### S3 업로드 실패

- 원인:
  - `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 누락
  - IAM 권한 부족
  - 파일 형식 또는 크기 제한
- 해결:
  - 환경변수가 모두 설정되었는지 확인한다.
  - IAM 사용자/역할에 S3 업로드 권한이 있는지 확인한다.
  - 테스트 파일 확장자가 `jpg`, `jpeg`, `png`, `webp`인지 확인한다.
  - 백엔드 로그의 `INVALID_IMAGE_FILE`, `IMAGE_FILE_TOO_LARGE`, `IMAGE_UPLOAD_FAILED` 오류를 확인한다.

