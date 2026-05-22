# Backend API Spec

기준 경로는 `/api`이다. 인증이 필요한 API는 `Authorization: Bearer {accessToken}` 헤더를 사용한다.

## 공통 에러 응답

```json
{
  "code": "INVALID_REQUEST",
  "message": "잘못된 요청입니다.",
  "fieldErrors": [],
  "timestamp": "2026-05-21T09:00:00"
}
```

## 1. 인증 API

### 회원가입

- Method: `POST`
- URL: `/api/members/signup`
- 인증: 불필요

Request:

```json
{
  "email": "member@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

`releaseDate`와 `imageUrl`은 `null`을 보내면 기존 값을 제거한다. 그 외 필드는 값이 있는 경우 해당 값으로 수정한다.

Response:

```json
{
  "id": 1,
  "email": "member@example.com",
  "name": "홍길동",
  "role": "ROLE_MEMBER",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `EMAIL_ALREADY_EXISTS`
- `INVALID_REQUEST`

### 로그인

- Method: `POST`
- URL: `/api/members/login`
- 인증: 불필요

Request:

```json
{
  "email": "member@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

주요 예외:

- `MEMBER_NOT_FOUND`
- `INVALID_PASSWORD`
- `INVALID_REQUEST`

## 2. 상품 API

### 상품 목록 조회

- Method: `GET`
- URL: `/api/products`
- 인증: 불필요

Query Parameters:

- `keyword`: 상품명 또는 설명 검색어
- `category`: 카테고리 필터
- `series`: 시리즈 필터
- `status`: 판매 상태 필터. 일반 목록 조회 예시는 `ON_SALE`, `SOLD_OUT`, `COMING_SOON`만 사용한다.
- `inStockOnly`: `true`이면 `stockQuantity > 0` 상품만 조회
- `sort`: 정렬 기준. `latest`, `priceAsc`, `priceDesc`, `releaseDateDesc`

예시:

```http
GET /api/products?keyword=피카츄&category=부스터%20박스&series=스칼렛%26바이올렛&status=ON_SALE&inStockOnly=true&sort=priceAsc
```

`HIDDEN` 상품은 일반 상품 목록 조회에서 항상 제외된다.

Response:

```json
[
  {
    "id": 1,
    "name": "포켓몬 카드 박스",
    "description": "한국어판 포켓몬 카드 박스",
    "price": 30000,
    "category": "부스터 박스",
    "series": "스칼렛&바이올렛",
    "releaseDate": "2026-01-01",
    "stockQuantity": 20,
    "imageUrl": "https://example.com/product.jpg",
    "status": "ON_SALE",
    "createdAt": "2026-05-21T09:00:00",
    "updatedAt": "2026-05-21T09:00:00"
  }
]
```

주요 예외:

- 없음

### 상품 상세 조회

- Method: `GET`
- URL: `/api/products/{id}`
- 인증: 불필요

Request: 없음

Response:

```json
{
  "id": 1,
  "name": "포켓몬 카드 박스",
  "description": "한국어판 포켓몬 카드 박스",
  "price": 30000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "releaseDate": "2026-01-01",
  "stockQuantity": 20,
  "imageUrl": "https://example.com/product.jpg",
  "status": "ON_SALE",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `PRODUCT_NOT_FOUND`

### 관리자 상품 목록 조회

- Method: `GET`
- URL: `/api/admin/products`
- 인증: 관리자 필요

Request: 없음

`HIDDEN` 상품을 포함해 모든 상품을 최신순으로 조회한다. 관리자 상품 관리 화면에서 숨김 상품을 다시 확인하고 수정할 때 사용한다.

Response:

```json
[
  {
    "id": 1,
    "name": "포켓몬 카드 박스",
    "description": "한국어판 포켓몬 카드 박스",
    "price": 30000,
    "category": "부스터 박스",
    "series": "스칼렛&바이올렛",
    "releaseDate": "2026-01-01",
    "stockQuantity": 20,
    "imageUrl": "https://example.com/product.jpg",
    "status": "HIDDEN",
    "createdAt": "2026-05-21T09:00:00",
    "updatedAt": "2026-05-21T09:00:00"
  }
]
```

주요 예외:

- `401 Unauthorized`
- `403 Forbidden`

### 관리자 상품 등록

- Method: `POST`
- URL: `/api/admin/products`
- 인증: 관리자 필요

Request:

```json
{
  "name": "포켓몬 카드 박스",
  "description": "한국어판 포켓몬 카드 박스",
  "price": 30000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "releaseDate": "2026-01-01",
  "stockQuantity": 20,
  "imageUrl": "https://example.com/product.jpg",
  "status": "ON_SALE"
}
```

Response: `201 Created`

```json
{
  "id": 1,
  "name": "포켓몬 카드 박스",
  "description": "한국어판 포켓몬 카드 박스",
  "price": 30000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "releaseDate": "2026-01-01",
  "stockQuantity": 20,
  "imageUrl": "https://example.com/product.jpg",
  "status": "ON_SALE",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

### 관리자 상품 수정

- Method: `PATCH`
- URL: `/api/admin/products/{id}`
- 인증: 관리자 필요

Request:

```json
{
  "name": "포켓몬 카드 박스 수정",
  "price": 32000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "releaseDate": "2026-01-01",
  "stockQuantity": 10,
  "imageUrl": "https://example.com/product-updated.jpg",
  "status": "ON_SALE"
}
```

Response:

```json
{
  "id": 1,
  "name": "포켓몬 카드 박스 수정",
  "description": "한국어판 포켓몬 카드 박스",
  "price": 32000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "releaseDate": "2026-01-01",
  "stockQuantity": 10,
  "imageUrl": "https://example.com/product-updated.jpg",
  "status": "ON_SALE",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:10:00"
}
```

주요 예외:

- `PRODUCT_NOT_FOUND`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

### 관리자 상품 삭제

- Method: `DELETE`
- URL: `/api/admin/products/{id}`
- 인증: 관리자 필요

Request: 없음

Response: `204 No Content`

주요 예외:

- `PRODUCT_NOT_FOUND`
- `401 Unauthorized`
- `403 Forbidden`

## 3. 이미지 API

### 관리자 이미지 업로드

- Method: `POST`
- URL: `/api/admin/images`
- 인증: 관리자 필요
- Content-Type: `multipart/form-data`

Request:

```text
image: box.png
```

Response:

```json
{
  "imageUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/products/{uuid}.png"
}
```

업로드 검증:

- 허용 확장자: `jpg`, `jpeg`, `png`, `webp`
- 허용 MIME 타입: `image/jpeg`, `image/png`, `image/webp`
- 최대 크기: 5MB
- 빈 파일은 거부한다.
- 원본 파일명이 비어 있거나 확장자가 없으면 거부한다.
- 확장자와 MIME 타입이 일치하지 않으면 거부한다.
- S3 key는 원본 파일명을 사용하지 않고 `products/{uuid}.{extension}` 형식으로 생성한다.

주요 예외:

- `INVALID_IMAGE_FILE`
- `IMAGE_FILE_TOO_LARGE`
- `IMAGE_UPLOAD_FAILED`
- `401 Unauthorized`
- `403 Forbidden`

## 4. 장바구니 API

### 내 장바구니 조회

- Method: `GET`
- URL: `/api/cart`
- 인증: 회원 필요

Request: 없음

Response:

```json
{
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "포켓몬 카드 박스",
      "imageUrl": "https://example.com/product.jpg",
      "price": 30000,
      "productStatus": "ON_SALE",
      "quantity": 2,
      "lineTotal": 60000,
      "createdAt": "2026-05-21T09:00:00",
      "updatedAt": "2026-05-21T09:00:00"
    }
  ],
  "totalQuantity": 2,
  "totalPrice": 60000
}
```

주요 예외:

- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 장바구니 상품 추가

- Method: `POST`
- URL: `/api/cart/items`
- 인증: 회원 필요

Request:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Response:

```json
{
  "id": 1,
  "productId": 1,
  "productName": "포켓몬 카드 박스",
  "imageUrl": "https://example.com/product.jpg",
  "price": 30000,
  "productStatus": "ON_SALE",
  "quantity": 2,
  "lineTotal": 60000,
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `PRODUCT_NOT_FOUND`
- `PRODUCT_NOT_AVAILABLE`
- `INVALID_CART_QUANTITY`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 장바구니 수량 변경

- Method: `PATCH`
- URL: `/api/cart/items/{cartItemId}`
- 인증: 회원 필요

Request:

```json
{
  "quantity": 3
}
```

Response:

```json
{
  "id": 1,
  "productId": 1,
  "productName": "포켓몬 카드 박스",
  "imageUrl": "https://example.com/product.jpg",
  "price": 30000,
  "productStatus": "ON_SALE",
  "quantity": 3,
  "lineTotal": 90000,
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:10:00"
}
```

주요 예외:

- `CART_ITEM_NOT_FOUND`
- `INVALID_CART_QUANTITY`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 장바구니 항목 삭제

- Method: `DELETE`
- URL: `/api/cart/items/{cartItemId}`
- 인증: 회원 필요

Request: 없음

Response: `204 No Content`

주요 예외:

- `CART_ITEM_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 장바구니 전체 비우기

- Method: `DELETE`
- URL: `/api/cart/items`
- 인증: 회원 필요

Request: 없음

Response: `204 No Content`

주요 예외:

- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

## 5. 배송지 API

### 내 배송지 목록 조회

- Method: `GET`
- URL: `/api/me/addresses`
- 인증: 회원 필요

Request: 없음

Response:

```json
[
  {
    "id": 1,
    "label": "집",
    "receiverName": "홍길동",
    "receiverPhone": "010-1234-5678",
    "zipCode": "06123",
    "address1": "서울시 강남구 테헤란로 1",
    "address2": "101동 1001호",
    "isDefault": true,
    "createdAt": "2026-05-21T09:00:00",
    "updatedAt": "2026-05-21T09:00:00"
  }
]
```

주요 예외:

- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 배송지 등록

- Method: `POST`
- URL: `/api/me/addresses`
- 인증: 회원 필요

Request:

```json
{
  "label": "집",
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 1",
  "address2": "101동 1001호",
  "isDefault": true
}
```

Response: `201 Created`

```json
{
  "id": 1,
  "label": "집",
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 1",
  "address2": "101동 1001호",
  "isDefault": true,
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `INVALID_REQUEST`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 배송지 수정

- Method: `PATCH`
- URL: `/api/me/addresses/{addressId}`
- 인증: 회원 필요

Request:

```json
{
  "label": "회사",
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 2",
  "address2": "20층",
  "isDefault": false
}
```

Response: 배송지 등록 응답과 동일한 객체 구조

주요 예외:

- `ADDRESS_NOT_FOUND`
- `INVALID_ADDRESS_REQUEST`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 배송지 삭제

- Method: `DELETE`
- URL: `/api/me/addresses/{addressId}`
- 인증: 회원 필요

Request: 없음

Response: `204 No Content`

주요 예외:

- `ADDRESS_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 기본 배송지 설정

- Method: `PATCH`
- URL: `/api/me/addresses/{addressId}/default`
- 인증: 회원 필요

Request: 없음

Response: 배송지 등록 응답과 동일한 객체 구조

주요 예외:

- `ADDRESS_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

## 6. 주문 API

### 장바구니 기반 주문 생성

- Method: `POST`
- URL: `/api/orders`
- 인증: 회원 필요

Request:

```json
{
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "서울시 강남구",
  "deliveryAddressId": null
}
```

`deliveryAddressId`는 선택 필드이다. 값이 있으면 저장된 배송지를 사용하고, 없으면 `receiverName`, `receiverPhone`, `address`를 직접 입력 배송지로 사용한다.

Response:

```json
{
  "id": 1,
  "orderUid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PAYMENT_PENDING",
  "totalPrice": 60000,
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "06123 서울시 강남구 테헤란로 1 101동 1001호",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 1",
  "address2": "101동 1001호",
  "expiresAt": "2026-05-21T09:30:00",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productNameSnapshot": "포켓몬 카드 박스",
      "orderPrice": 30000,
      "quantity": 2,
      "lineTotal": 60000
    }
  ],
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `EMPTY_CART`
- `ADDRESS_NOT_FOUND`
- `INVALID_ADDRESS_REQUEST`
- `ORDER_NOT_ALLOWED`
- `OUT_OF_STOCK`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 내 주문 목록 조회

- Method: `GET`
- URL: `/api/orders`
- 인증: 회원 필요

Request: 없음

Response:

```json
[
  {
    "id": 1,
    "orderUid": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PAYMENT_PENDING",
    "totalPrice": 60000,
    "receiverName": "홍길동",
    "receiverPhone": "010-1234-5678",
    "address": "06123 서울시 강남구 테헤란로 1 101동 1001호",
    "zipCode": "06123",
    "address1": "서울시 강남구 테헤란로 1",
    "address2": "101동 1001호",
    "expiresAt": "2026-05-21T09:30:00",
    "items": [],
    "createdAt": "2026-05-21T09:00:00",
    "updatedAt": "2026-05-21T09:00:00"
  }
]
```

주요 예외:

- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 내 주문 상세 조회

- Method: `GET`
- URL: `/api/orders/{orderId}`
- 인증: 회원 필요

Request: 없음

Response: 주문 생성 응답과 동일한 객체 구조

주요 예외:

- `ORDER_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

## 7. 결제 API

### 결제 승인

- Method: `POST`
- URL: `/api/payments/confirm`
- 인증: 회원 필요

Request:

```json
{
  "orderId": 1,
  "provider": "TOSS",
  "paymentKey": "payment-key-from-provider",
  "providerOrderId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 60000
}
```

필드 의미:

- `orderId`: PKM Box Store 내부 주문 ID이다. 주문 조회, 권한 확인, 주문 상태 변경에 사용한다.
- `paymentKey`: Toss가 성공 리다이렉트로 내려준 결제 키이다.
- `providerOrderId`: Toss가 성공 리다이렉트 query의 `orderId`로 내려준 값이다. PKM Box Store 주문의 `orderUid`와 같아야 한다.
- `amount`: Toss가 성공 리다이렉트로 내려준 결제 금액이다.

Toss 결제창 호출 시 주의:

- Toss `requestPayment.orderId`에는 내부 숫자 ID인 `order.id`를 넣지 않는다.
- Toss `requestPayment.orderId`에는 주문 응답의 `orderUid`를 넣는다.
- Toss `orderId`는 영문 대소문자, 숫자, `-`, `_`만 허용하며 6자 이상 64자 이하여야 한다.

결제 승인 처리 시 검증:

- `paymentKey`가 비어 있지 않아야 한다.
- `providerOrderId`가 내부 주문의 `orderUid`와 일치해야 한다.
- `amount`가 내부 주문의 `totalPrice`와 일치해야 한다.
- 이미 승인된 결제는 중복 승인하지 않아야 한다.
- 주문이 이미 `PAID`이고 `APPROVED` 결제가 존재하는 경우, 같은 `paymentKey`, `providerOrderId`, `amount` 요청이면 기존 결제 응답을 반환한다.
- 같은 주문에 다른 `paymentKey` 또는 다른 `providerOrderId`가 들어오면 예외가 발생한다.
- 중복 승인 요청에서는 `CONFIRMED` 재고 이력이 중복 저장되지 않는다.

프론트 성공 리다이렉트 처리 참고:

- Toss success redirect query의 `orderId`는 내부 주문 ID가 아니라 `providerOrderId`로 취급한다.
- 내부 주문 조회에는 별도 query parameter인 `internalOrderId`를 사용한다.
- `internalOrderId`로 조회한 주문의 `orderUid`와 Toss가 돌려준 `providerOrderId`가 일치해야 결제 승인 API를 호출한다.

Response:

```json
{
  "paymentId": 1,
  "orderId": 1,
  "provider": "TOSS",
  "status": "APPROVED",
  "amount": 60000,
  "approvedAt": "2026-05-21T09:05:00"
}
```

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_ORDER_MISMATCH`
- `PAYMENT_ALREADY_APPROVED`
- `PAYMENT_PROVIDER_NOT_SUPPORTED`
- `PAYMENT_APPROVAL_FAILED`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 결제 실패

- Method: `POST`
- URL: `/api/payments/fail`
- 인증: 회원 필요

Request:

```json
{
  "orderId": 1
}
```

`orderId`는 PKM Box Store 내부 주문 ID이다.

프론트 실패/취소 리다이렉트 처리 참고:

- Toss fail redirect query의 `orderId`는 내부 주문 ID가 아니라 `providerOrderId`로 취급한다.
- 내부 주문 실패 처리는 별도 query parameter인 `internalOrderId` 기준으로 호출한다.
- Toss `orderId`는 실패 사유 표시나 검증용 provider 주문번호로만 취급하고, 내부 주문 조회에는 사용하지 않는다.

Response: `204 No Content`

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 결제 취소/환불

- Method: `POST`
- URL: `/api/payments/cancel`
- 인증: 회원 필요

Request:

```json
{
  "orderId": 1,
  "cancelReason": "고객 요청"
}
```

`orderId`는 PKM Box Store 내부 주문 ID이다. 해당 주문의 승인된 결제를 찾아 결제사 취소 API를 호출한다.

멱등성 정책:

- 이미 `CANCELED`인 주문에 취소 요청이 다시 들어오면 기존 취소 결제 응답을 반환한다.
- 중복 취소 요청에서는 재고 복구와 `RELEASED` 재고 이력이 중복 처리되지 않는다.

Response:

```json
{
  "paymentId": 1,
  "orderId": 1,
  "provider": "TOSS",
  "status": "CANCELED",
  "amount": 60000,
  "approvedAt": "2026-05-21T09:05:00"
}
```

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `PAYMENT_NOT_FOUND`
- `PAYMENT_PROVIDER_NOT_SUPPORTED`
- `PAYMENT_CANCEL_FAILED`
- `MEMBER_NOT_FOUND`
- `INVALID_REQUEST`
- `401 Unauthorized`

## 8. 관리자 대시보드 API

### 관리자 대시보드 조회

- Method: `GET`
- URL: `/api/admin/dashboard`
- 인증: 관리자 필요

Request: 없음

Response:

```json
{
  "todayOrderCount": 3,
  "todaySalesAmount": 90000,
  "paymentPendingOrderCount": 1,
  "paidOrderCount": 2,
  "preparingOrderCount": 1,
  "shippedOrderCount": 1,
  "lowStockProductCount": 2,
  "recentOrders": [
    {
      "id": 1,
      "orderUid": "550e8400-e29b-41d4-a716-446655440000",
      "memberEmail": "member@example.com",
      "memberName": "홍길동",
      "status": "PAID",
      "totalPrice": 60000,
      "createdAt": "2026-05-21T09:00:00"
    }
  ],
  "lowStockProducts": [
    {
      "id": 1,
      "name": "포켓몬 카드 박스",
      "price": 30000,
      "category": "부스터 박스",
      "series": "스칼렛&바이올렛",
      "stockQuantity": 3,
      "status": "ON_SALE"
    }
  ]
}
```

응답 필드:

- `todayOrderCount`: 오늘 생성된 주문 수
- `todaySalesAmount`: 오늘 생성된 `PAID` 주문의 `totalPrice` 합계
- `paymentPendingOrderCount`: `PAYMENT_PENDING` 주문 수
- `paidOrderCount`: `PAID` 주문 수
- `preparingOrderCount`: `PREPARING` 주문 수
- `shippedOrderCount`: `SHIPPED` 주문 수
- `lowStockProductCount`: `stockQuantity <= 5`이고 `HIDDEN`이 아닌 상품 수
- `recentOrders`: 최신 주문 5개
- `lowStockProducts`: `stockQuantity <= 5`이고 `HIDDEN`이 아닌 상품 목록

`recentOrders` 항목 필드:

- `id`
- `orderUid`
- `memberEmail`
- `memberName`
- `status`
- `totalPrice`
- `createdAt`

`lowStockProducts` 항목 필드:

- `id`
- `name`
- `price`
- `category`
- `series`
- `stockQuantity`
- `status`

주요 예외:

- `401 Unauthorized`
- `403 Forbidden`

## 9. 관리자 감사 로그 API

### 관리자 감사 로그 조회

- Method: `GET`
- URL: `/api/admin/audit-logs`
- 인증: 관리자 필요
- 정렬/개수: 최신순 최근 100개 반환

Request: 없음

Response:

```json
[
  {
    "id": 1,
    "adminId": 10,
    "adminEmail": "admin@example.com",
    "actionType": "PRODUCT_CREATED",
    "targetType": "PRODUCT",
    "targetId": 1,
    "description": "상품 등록: 포켓몬 카드 박스",
    "createdAt": "2026-05-22T09:00:00"
  }
]
```

응답 필드:

- `id`: 감사 로그 ID
- `adminId`: 작업한 관리자 회원 ID
- `adminEmail`: 작업한 관리자 이메일
- `actionType`: 작업 유형
- `targetType`: 대상 유형
- `targetId`: 대상 ID
- `description`: 운영자가 이해할 수 있는 짧은 설명
- `createdAt`: 로그 생성 시각

`actionType` 값:

- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_HIDDEN`
- `ORDER_PREPARED`
- `ORDER_SHIPPED`
- `ORDER_DELIVERED`
- `PAYMENT_CANCELED`

`targetType` 값:

- `PRODUCT`
- `ORDER`
- `PAYMENT`

주요 예외:

- `401 Unauthorized`
- `403 Forbidden`

## 10. 관리자 주문 API

### 전체 주문 목록 조회

- Method: `GET`
- URL: `/api/admin/orders`
- 인증: 관리자 필요

Request: 없음

Response:

```json
[
  {
    "id": 1,
    "orderUid": "550e8400-e29b-41d4-a716-446655440000",
    "memberId": 1,
    "memberEmail": "member@example.com",
    "memberName": "홍길동",
    "status": "PAID",
    "totalPrice": 60000,
    "receiverName": "홍길동",
    "receiverPhone": "010-1234-5678",
    "address": "06123 서울시 강남구 테헤란로 1 101동 1001호",
    "zipCode": "06123",
    "address1": "서울시 강남구 테헤란로 1",
    "address2": "101동 1001호",
    "courierCompany": null,
    "trackingNumber": null,
    "shippedAt": null,
    "deliveredAt": null,
    "expiresAt": "2026-05-21T09:30:00",
    "items": [],
    "createdAt": "2026-05-21T09:00:00",
    "updatedAt": "2026-05-21T09:05:00"
  }
]
```

주요 예외:

- `401 Unauthorized`
- `403 Forbidden`

### 주문 상세 조회

- Method: `GET`
- URL: `/api/admin/orders/{orderId}`
- 인증: 관리자 필요

Request: 없음

Response: 전체 주문 목록 조회의 항목과 동일한 객체 구조

주요 예외:

- `ORDER_NOT_FOUND`
- `401 Unauthorized`
- `403 Forbidden`

### 주문 상태 변경

- Method: `PATCH`
- URL: `/api/admin/orders/{orderId}/status`
- 인증: 관리자 필요

Request:

```json
{
  "status": "SHIPPED",
  "courierCompany": "CJ대한통운",
  "trackingNumber": "1234567890"
}
```

`courierCompany`, `trackingNumber`는 선택 필드이다. 단, `PREPARING -> SHIPPED` 변경 시에는 두 값이 모두 필요하다.

Response:

```json
{
  "id": 1,
  "orderUid": "550e8400-e29b-41d4-a716-446655440000",
  "memberId": 1,
  "memberEmail": "member@example.com",
  "memberName": "홍길동",
  "status": "SHIPPED",
  "totalPrice": 60000,
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "06123 서울시 강남구 테헤란로 1 101동 1001호",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 1",
  "address2": "101동 1001호",
  "courierCompany": "CJ대한통운",
  "trackingNumber": "1234567890",
  "shippedAt": "2026-05-21T09:10:00",
  "deliveredAt": null,
  "expiresAt": "2026-05-21T09:30:00",
  "items": [],
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:10:00"
}
```

허용되는 상태 변경:

- `PAID -> PREPARING`
- `PREPARING -> SHIPPED`
- `SHIPPED -> DELIVERED`

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

## 11. 관리자 결제 API

### 관리자 결제 취소/환불

- Method: `POST`
- URL: `/api/admin/payments/cancel`
- 인증: 관리자 필요

Request:

```json
{
  "orderId": 1,
  "cancelReason": "관리자 환불 처리"
}
```

`orderId`는 PKM Box Store 내부 주문 ID이다. 관리자는 주문 소유자와 무관하게 해당 주문의 승인된 결제를 찾아 결제사 취소 API를 호출한다.

멱등성 정책:

- 이미 `CANCELED`인 주문에 취소 요청이 다시 들어오면 기존 취소 결제 응답을 반환한다.
- 중복 취소 요청에서는 재고 복구와 `RELEASED` 재고 이력이 중복 처리되지 않는다.
- 최초 관리자 취소/환불 성공 시 `PAYMENT_CANCELED` 감사 로그가 저장된다.

처리 결과:

- 주문 상태는 `CANCELED`가 된다.
- 결제 상태는 `CANCELED`가 된다.
- 주문으로 차감되었던 재고는 복구된다.
- 재고 이력에는 `RELEASED` 기록이 남는다.

Response:

```json
{
  "paymentId": 1,
  "orderId": 1,
  "provider": "TOSS",
  "status": "CANCELED",
  "amount": 60000,
  "approvedAt": "2026-05-21T09:05:00"
}
```

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `PAYMENT_NOT_FOUND`
- `PAYMENT_PROVIDER_NOT_SUPPORTED`
- `PAYMENT_CANCEL_FAILED`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`
