# Local Test Checklist

로컬에서 PKM Box Store의 회원, 관리자, 결제, 배송 흐름을 재현하기 위한 체크리스트입니다.

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

필수 확인:

- [ ] `DB_URL=jdbc:mysql://localhost:3306/pkm_box_store?serverTimezone=Asia/Seoul&characterEncoding=UTF-8`
- [ ] `DB_USERNAME=pkm_user`
- [ ] `DB_PASSWORD=change-me`
- [ ] `JWT_SECRET`: 32바이트 이상 긴 랜덤 문자열
- [ ] `TOSS_PAYMENTS_SECRET_KEY=test_sk_...`
- [ ] `AWS_S3_BUCKET`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION=ap-northeast-2`

주의:

- [ ] S3 실제 업로드를 테스트하지 않더라도 백엔드 부팅을 위해 AWS 더미 값이 필요할 수 있다.
- [ ] 실제 S3 업로드를 테스트하려면 유효한 버킷, 리전, 접근 키, 권한 정책이 필요하다.

### Frontend 환경변수

- [ ] `frontend/.env.example`을 참고해 `frontend/.env.local`을 만든다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
```

### Toss 테스트 키

- [ ] 프론트엔드에는 `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...`를 넣는다.
- [ ] 백엔드에는 `TOSS_PAYMENTS_SECRET_KEY=test_sk_...`를 넣는다.
- [ ] 두 키가 같은 Toss 테스트 상점의 Client Key와 Secret Key인지 확인한다.
- [ ] 프론트엔드와 백엔드를 환경변수 적용 후 재시작한다.

## 2. 실행 방법

### Backend

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

### Frontend

- [ ] 터미널에서 프론트엔드 디렉터리로 이동한다.

```powershell
cd frontend
```

- [ ] 의존성을 설치하고 개발 서버를 실행한다.

```powershell
npm install
npm run dev
```

- [ ] 브라우저에서 `http://localhost:3000`에 접속한다.

## 3. 사용자 구매 흐름

### 회원가입/로그인

- [ ] `/signup`에서 회원가입한다.
- [ ] DB `members` 테이블에 `ROLE_MEMBER`로 생성되었는지 확인한다.
- [ ] `/login`에서 로그인한다.
- [ ] 헤더에 장바구니와 주문 메뉴가 보이는지 확인한다.
- [ ] 브라우저 localStorage에 `pkm_access_token`이 저장되었는지 확인한다.

### 상품 검색/필터

- [ ] `/`에서 상품 목록이 보이는지 확인한다.
- [ ] `keyword` 검색으로 상품명 또는 설명 검색이 동작하는지 확인한다.
- [ ] `category` 필터가 동작하는지 확인한다.
- [ ] `series` 필터가 동작하는지 확인한다.
- [ ] `status` 필터에서 `ON_SALE`, `SOLD_OUT`, `COMING_SOON`이 동작하는지 확인한다.
- [ ] `재고 있는 상품만` 선택 시 `stockQuantity > 0` 상품만 보이는지 확인한다.
- [ ] 정렬 `latest`, `priceAsc`, `priceDesc`, `releaseDateDesc`가 동작하는지 확인한다.
- [ ] 필터 초기화 버튼을 누르면 전체 목록으로 돌아오는지 확인한다.
- [ ] 네트워크 탭에서 `/api/products` query parameter가 조건에 맞게 붙는지 확인한다.

### 상품 상세/바로 구매하기

- [ ] 상품을 클릭해 `/products/{id}` 상세 페이지로 이동한다.
- [ ] 상품 이미지, 상품명, 가격, 상태, 재고, 설명이 보이는지 확인한다.
- [ ] 수량을 선택하고 장바구니 담기를 누른다.
- [ ] 성공 메시지와 장바구니 이동 링크가 보이는지 확인한다.
- [ ] 바로 구매하기 버튼을 누르면 현재 수량으로 장바구니에 담긴 뒤 `/cart`로 이동하는지 확인한다.
- [ ] `ON_SALE`이 아니거나 재고가 0이면 장바구니 담기/바로 구매하기 버튼이 비활성화되는지 확인한다.

### 장바구니

- [ ] `/cart`에서 상품명, 단가, 수량, 합계, 총 금액이 맞는지 확인한다.
- [ ] 수량 변경이 정상 동작하는지 확인한다.
- [ ] 상품 삭제가 정상 동작하는지 확인한다.
- [ ] 주문 생성 중 버튼 중복 클릭 방지 disabled 처리가 동작하는지 확인한다.

### 배송지 관리/선택

- [ ] `/my/addresses`로 이동한다.
- [ ] 배송지명, 수령인, 연락처, 우편번호, 기본주소, 상세주소를 입력해 배송지를 추가한다.
- [ ] 기본 배송지 설정이 동작하는지 확인한다.
- [ ] 배송지 수정이 동작하는지 확인한다.
- [ ] 배송지 삭제가 동작하는지 확인한다.
- [ ] `/cart`에서 저장된 배송지를 선택한다.
- [ ] 선택된 배송지 요약 카드가 표시되는지 확인한다.
- [ ] 배송지가 없을 때 `/my/addresses`로 이동하는 안내가 보이는지 확인한다.

### 주문 생성

- [ ] `/cart`에서 저장된 배송지를 선택하거나 직접 배송 정보를 입력한다.
- [ ] 주문 생성 버튼을 누른다.
- [ ] 성공 시 `/orders/{orderId}/payment`로 이동하는지 확인한다.
- [ ] 결제 대기 페이지에서 주문 상품, 총 금액, 배송 정보, 주문 상태, 만료 시간이 보이는지 확인한다.
- [ ] DB `orders.status`가 `PAYMENT_PENDING`인지 확인한다.
- [ ] DB `orders.order_uid`가 생성되었는지 확인한다.
- [ ] DB `products.stock_quantity`가 주문 수량만큼 감소했는지 확인한다.
- [ ] DB `inventory_histories.type=RESERVED` 기록이 생성되었는지 확인한다.

### Toss orderId 확인

- [ ] 결제하기 클릭 전 주문의 `orderUid`가 6자 이상 64자 이하인지 확인한다.
- [ ] Toss `requestPayment.orderId`는 내부 숫자 `orders.id`가 아니라 `orders.order_uid`를 사용해야 한다.
- [ ] `/orders/{id}/payment`에서 결제하기 클릭 시 Toss 결제창이 정상 호출되는지 확인한다.
- [ ] 성공 URL에는 Toss가 돌려주는 `orderId`와 별도로 `internalOrderId` query parameter가 전달되어야 한다.
- [ ] 실패 URL에도 Toss가 돌려주는 `orderId`와 별도로 `internalOrderId` query parameter가 전달되어야 한다.
- [ ] `/payments/success`에서 Toss `orderId`는 `providerOrderId`로, `internalOrderId`는 내부 주문 조회/승인용으로 구분되는지 네트워크 탭에서 확인한다.

### Toss 테스트 결제 성공

- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY`가 `test_ck...` 형식인지 확인한다.
- [ ] `TOSS_PAYMENTS_SECRET_KEY`가 `test_sk...` 형식인지 확인한다.
- [ ] 두 키가 같은 Toss 테스트 상점의 키인지 확인한다.
- [ ] Toss 결제창에서 테스트 결제를 성공시킨다.
- [ ] `/payments/success`로 복귀하는지 확인한다.
- [ ] 결제 승인 API `POST /api/payments/confirm`이 호출되는지 확인한다.
- [ ] 승인 요청에 `paymentKey`, `providerOrderId`, `amount`, 내부 `orderId`가 올바르게 들어가는지 확인한다.
- [ ] 성공 페이지에 결제 완료 안내와 주문 상세 이동 버튼이 보이는지 확인한다.
- [ ] `/orders` 또는 `/orders/{id}`에서 주문 상태가 `PAID`인지 확인한다.
- [ ] `/admin/orders/{id}`에서 관리자도 `PAID` 주문을 확인할 수 있는지 확인한다.
- [ ] DB `payments.status=APPROVED`인지 확인한다.
- [ ] DB `payments.provider_order_id=orders.order_uid`인지 확인한다.
- [ ] DB `inventory_histories.type=CONFIRMED` 기록이 생성되었는지 확인한다.

### 결제 실패/취소

- [ ] 새 주문을 생성해 결제 대기 페이지로 이동한다.
- [ ] 결제 대기 페이지에서 결제 취소 버튼을 클릭한다.
- [ ] `/orders`로 이동하고 주문 상태가 `FAILED`인지 확인한다.
- [ ] DB `products.stock_quantity`가 예약 전 수량으로 복구되었는지 확인한다.
- [ ] DB `inventory_histories.type=RELEASED` 기록이 생성되었는지 확인한다.
- [ ] 새 주문을 다시 만들고 Toss 결제창에서 취소 또는 실패 케이스를 발생시킨다.
- [ ] `/payments/fail`로 복귀하는지 확인한다.
- [ ] 실패 안내와 주문 목록/상품 목록 이동 버튼이 보이는지 확인한다.
- [ ] `internalOrderId` 기준으로 실패 처리 API가 호출되는지 확인한다.

### 사용자 주문 상세

- [ ] `/orders`에서 주문 목록이 보이는지 확인한다.
- [ ] 주문번호를 클릭해 `/orders/{id}`로 이동한다.
- [ ] 주문 상태, 주문번호, 생성 시간, 총 금액 요약이 보이는지 확인한다.
- [ ] 주문 상품 목록과 배송 정보가 분리되어 보이는지 확인한다.
- [ ] `PAYMENT_PENDING` 주문이면 결제하러 가기 버튼이 보이는지 확인한다.
- [ ] `SHIPPED` 주문이면 택배사와 운송장 번호가 보이는지 확인한다.
- [ ] `DELIVERED` 주문이면 배송 완료 상태가 명확히 보이는지 확인한다.

## 4. 관리자 흐름

### 관리자 권한

- [ ] 일반 회원가입으로 관리자 테스트 계정을 만든다.
- [ ] MySQL에서 해당 계정의 권한을 `ROLE_ADMIN`으로 변경한다.

```sql
UPDATE members
SET role = 'ROLE_ADMIN'
WHERE email = 'admin@example.com';
```

- [ ] 로그아웃 후 다시 로그인한다.
- [ ] 헤더에 관리자 대시보드, 관리자 상품, 관리자 주문 메뉴가 보이는지 확인한다.

### 관리자 대시보드

- [ ] `/admin`으로 이동한다.
- [ ] 오늘 주문 수, 오늘 매출, 재고 부족 상품 카드가 보이는지 확인한다.
- [ ] 결제 대기, 결제 완료, 배송 준비 중, 배송 중 주문 수가 보이는지 확인한다.
- [ ] 최근 주문 5개 표가 보이는지 확인한다.
- [ ] 최근 주문의 주문 상세 링크가 `/admin/orders/{id}`로 이동하는지 확인한다.
- [ ] 재고 부족 상품 목록이 보이는지 확인한다.
- [ ] 재고 부족 상품의 상품 관리 버튼이 `/admin/products`로 이동하는지 확인한다.
- [ ] 최근 주문 또는 재고 부족 상품이 없을 때 empty 안내가 자연스럽게 보이는지 확인한다.

### 관리자 상품 등록/수정/숨김

- [ ] `/admin/products`로 이동한다.
- [ ] 상품 폼 상단에 등록 모드가 표시되는지 확인한다.
- [ ] 상품명, 설명, 가격, 카테고리, 시리즈, 출시일, 재고, 상태를 입력해 상품을 등록한다.
- [ ] 이미지 파일을 선택하고 이미지 업로드 버튼을 눌러 이미지 URL이 채워지는지 확인한다.
- [ ] 이미지 URL 입력과 이미지 미리보기가 동작하는지 확인한다.
- [ ] 상품 목록에서 상품명, 가격, 재고, 상태, 수정/숨김 액션이 구분되어 보이는지 확인한다.
- [ ] 수정 버튼을 누르면 수정 모드가 표시되는지 확인한다.
- [ ] 수정 취소 버튼을 누르면 등록 모드로 돌아오는지 확인한다.
- [ ] 가격, 재고, 상태, 이미지 URL 중 일부를 변경하고 저장한다.
- [ ] 숨김 버튼을 누르면 DB `products.status=HIDDEN`으로 변경되는지 확인한다.
- [ ] 숨김 상품이 일반 상품 목록에서 제외되는지 확인한다.

### 관리자 주문 상세

- [ ] `/admin/orders`로 이동한다.
- [ ] 주문번호를 클릭해 `/admin/orders/{id}`로 이동한다.
- [ ] 주문 상태, 주문번호, 회원 정보, 총 금액이 상단 요약 카드에 보이는지 확인한다.
- [ ] 주문 상품 목록이 별도 영역으로 보이는지 확인한다.
- [ ] 배송 정보와 운송장 정보가 별도 영역으로 보이는지 확인한다.
- [ ] 중복 클릭 방지 disabled 처리가 동작하는지 확인한다.

### 관리자 결제 취소/환불

- [ ] 결제 성공으로 `PAID` 상태의 주문을 만든다.
- [ ] `/admin/orders/{id}`로 이동한다.
- [ ] 결제 취소/환불 영역이 보이는지 확인한다.
- [ ] 취소 사유를 입력한다.
- [ ] 결제 취소/환불 버튼을 클릭한다.
- [ ] 주문 상태가 `CANCELED`로 변경되었는지 확인한다.
- [ ] DB `payments.status=CANCELED`인지 확인한다.
- [ ] DB `products.stock_quantity`가 주문 수량만큼 복구되었는지 확인한다.
- [ ] DB `inventory_histories.type=RELEASED` 기록이 생성되고 `reason`에 `PAYMENT_CANCELED`가 포함되는지 확인한다.

### 배송 상태 변경

- [ ] 결제 성공으로 `PAID` 상태의 주문을 만든다.
- [ ] `PAID` 상태에서 배송 준비 처리 버튼이 보이는지 확인한다.
- [ ] 배송 준비 처리 버튼을 클릭해 `PREPARING`으로 변경한다.
- [ ] `PREPARING` 상태에서 택배사와 운송장 번호 입력란이 보이는지 확인한다.
- [ ] 택배사 또는 운송장 번호가 비어 있으면 발송 처리 버튼이 비활성화되는지 확인한다.
- [ ] 택배사와 운송장 번호를 입력하고 발송 처리 버튼을 클릭한다.
- [ ] 주문 상태가 `SHIPPED`로 변경되는지 확인한다.
- [ ] DB `orders.courier_company`, `orders.tracking_number`, `orders.shipped_at`이 채워지는지 확인한다.
- [ ] `SHIPPED` 상태에서 배송 완료 처리 버튼이 보이는지 확인한다.
- [ ] 배송 완료 처리 버튼을 클릭해 `DELIVERED`로 변경한다.
- [ ] DB `orders.delivered_at`이 채워지는지 확인한다.
- [ ] `CANCELED`, `DELIVERED` 상태에서는 더 이상 처리할 액션이 없다는 안내가 보이는지 확인한다.

## 5. DB 확인 항목

### 주문

- [ ] `orders.status`
  - 주문 생성 직후: `PAYMENT_PENDING`
  - Toss 결제 승인 후: `PAID`
  - 결제 실패/취소 후: `FAILED`
  - 관리자 환불 후: `CANCELED`
  - 배송 처리 후: `PREPARING`, `SHIPPED`, `DELIVERED`
- [ ] `orders.order_uid`
  - Toss `requestPayment.orderId`와 같은 값인지 확인한다.
- [ ] `orders.courier_company`
- [ ] `orders.tracking_number`
- [ ] `orders.shipped_at`
- [ ] `orders.delivered_at`

```sql
SELECT id,
       order_uid,
       member_id,
       status,
       total_price,
       zip_code,
       address1,
       address2,
       courier_company,
       tracking_number,
       shipped_at,
       delivered_at,
       expires_at,
       created_at,
       updated_at
FROM orders
ORDER BY id DESC;
```

### 결제

- [ ] `payments.status`
  - 결제 성공 후: `APPROVED`
  - 관리자 결제 취소/환불 후: `CANCELED`
- [ ] `payments.provider_order_id`
  - `orders.order_uid`와 같은 값인지 확인한다.
- [ ] `payment_key`, `amount`, `approved_at`이 채워졌는지 확인한다.

```sql
SELECT id,
       order_id,
       provider,
       status,
       payment_key,
       provider_order_id,
       amount,
       approved_at
FROM payments
ORDER BY id DESC;
```

### 재고

- [ ] `products.stock_quantity`
  - 주문 생성 시 주문 수량만큼 감소하는지 확인한다.
  - 결제 성공 시 감소된 수량이 유지되는지 확인한다.
  - 결제 실패/취소 또는 관리자 환불 시 주문 수량만큼 복구되는지 확인한다.

```sql
SELECT id, name, stock_quantity, status
FROM products
ORDER BY id DESC;
```

### 재고 이력

- [ ] `inventory_histories.type`
  - 주문 생성 시 `RESERVED`
  - 결제 성공 시 `CONFIRMED`
  - 결제 실패/취소 또는 관리자 환불 시 `RELEASED`

```sql
SELECT id, product_id, type, quantity, reason, created_at
FROM inventory_histories
ORDER BY id DESC;
```

## 6. 자주 발생할 수 있는 오류와 해결 방법

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

### Toss client key 누락

- 증상:
  - 결제하기 클릭 시 `Toss Payments 클라이언트 키가 설정되지 않았습니다.` 메시지가 표시된다.
- 해결:
  - `frontend/.env.local`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...`를 추가한다.
  - 프론트엔드 dev 서버를 재시작한다.

### Toss secret key 누락 또는 상점 불일치

- 증상:
  - Toss 결제창은 열리지만 `/payments/success`에서 결제 승인 API가 실패한다.
  - 백엔드 로그에 Toss 승인 실패 또는 인증 실패가 남는다.
- 해결:
  - 백엔드 실행 환경에 `TOSS_PAYMENTS_SECRET_KEY=test_sk_...`를 설정한다.
  - 프론트의 Client Key와 같은 Toss 테스트 상점의 Secret Key인지 확인한다.
  - 백엔드를 재시작한다.

### Toss orderId 오류

- 증상:
  - Toss 결제창에서 `orderId`는 영문 대소문자, 숫자, 특수문자 `-`, `_`만 허용하며 6자 이상 64자 이하여야 한다는 오류가 표시된다.
- 확인:
  - Toss `requestPayment.orderId`가 내부 숫자 `orders.id`가 아니라 `orders.order_uid`인지 확인한다.
  - success/fail URL에 내부 ID가 `internalOrderId`로 별도 전달되는지 확인한다.

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
