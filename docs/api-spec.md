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

Request: 없음

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
  "imageUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/images/uuid.png"
}
```

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

## 5. 주문 API

### 장바구니 기반 주문 생성

- Method: `POST`
- URL: `/api/orders`
- 인증: 회원 필요

Request:

```json
{
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "서울시 강남구"
}
```

Response:

```json
{
  "id": 1,
  "orderUid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PAYMENT_PENDING",
  "totalPrice": 60000,
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "서울시 강남구",
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
    "address": "서울시 강남구",
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

Response: 주문 생성 응답과 동일한 구조

주요 예외:

- `ORDER_NOT_FOUND`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

## 6. 결제 API

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

Response: `204 No Content`

주요 예외:

- `ORDER_NOT_FOUND`
- `INVALID_ORDER_STATUS`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

## 7. 관리자 주문 API

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
    "address": "서울시 강남구",
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

Response: 전체 주문 목록의 단일 객체 구조

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
  "status": "PREPARING"
}
```

Response:

```json
{
  "id": 1,
  "orderUid": "550e8400-e29b-41d4-a716-446655440000",
  "memberId": 1,
  "memberEmail": "member@example.com",
  "memberName": "홍길동",
  "status": "PREPARING",
  "totalPrice": 60000,
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "address": "서울시 강남구",
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
