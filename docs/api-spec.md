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
  "name": "홍길동",
  "emailVerificationToken": "verification-token-from-email-verification"
}
```

Response:

```json
{
  "id": 1,
  "email": "member@example.com",
  "name": "홍길동",
  "profileImageUrl": null,
  "bio": null,
  "role": "ROLE_MEMBER",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `EMAIL_ALREADY_EXISTS`
- `EMAIL_VERIFICATION_REQUIRED`
- `EMAIL_VERIFICATION_TOKEN_INVALID`
- `EMAIL_VERIFICATION_TOKEN_EXPIRED`
- `EMAIL_VERIFICATION_TOKEN_USED`
- `INVALID_REQUEST`

### 이메일 인증번호 발송

- Method: `POST`
- URL: `/api/members/email-verifications/send`
- 인증: 불필요

Request:

```json
{
  "email": "member@example.com",
  "purpose": "SIGNUP"
}
```

`purpose` 값:

- `SIGNUP`: 회원가입 이메일 인증
- `PASSWORD_RESET`: 비밀번호 재설정 이메일 인증

Response:

```json
{
  "expiresAt": "2026-05-21T09:05:00",
  "resendAvailableAt": "2026-05-21T09:01:00"
}
```

주요 예외:

- `EMAIL_ALREADY_EXISTS`
- `EMAIL_VERIFICATION_RESEND_TOO_SOON`
- `EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS`
- `EMAIL_SEND_FAILED`
- `INVALID_REQUEST`

### 이메일 인증번호 확인

- Method: `POST`
- URL: `/api/members/email-verifications/verify`
- 인증: 불필요

Request:

```json
{
  "email": "member@example.com",
  "purpose": "SIGNUP",
  "code": "123456"
}
```

Response:

```json
{
  "verificationToken": "one-time-verification-token",
  "expiresAt": "2026-05-21T09:15:00"
}
```

`verificationToken`은 원문으로 한 번만 응답되고 DB에는 해시로 저장된다. 회원가입에는 `SIGNUP` 토큰만, 비밀번호 재설정에는 `PASSWORD_RESET` 토큰만 사용할 수 있다.

주요 예외:

- `EMAIL_VERIFICATION_REQUIRED`
- `EMAIL_VERIFICATION_CODE_EXPIRED`
- `EMAIL_VERIFICATION_CODE_INVALID`
- `EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS`
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

### 비밀번호 재설정

- Method: `POST`
- URL: `/api/members/password-reset`
- 인증: 불필요

Request:

```json
{
  "email": "member@example.com",
  "verificationToken": "verification-token-from-password-reset",
  "newPassword": "newPassword123"
}
```

Response: `204 No Content`

주요 예외:

- `MEMBER_NOT_FOUND`
- `EMAIL_VERIFICATION_TOKEN_INVALID`
- `EMAIL_VERIFICATION_TOKEN_EXPIRED`
- `EMAIL_VERIFICATION_TOKEN_USED`
- `INVALID_REQUEST`

### 내 회원 정보 조회

- Method: `GET`
- URL: `/api/members/me`
- 인증: 회원 필요

Request: 없음

Response:

```json
{
  "id": 1,
  "email": "member@example.com",
  "name": "홍길동",
  "profileImageUrl": "https://example.com/profile.jpg",
  "bio": "포켓몬 카드 박스 수집가",
  "role": "ROLE_MEMBER",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 내 프로필 수정

- Method: `PATCH`
- URL: `/api/members/me/profile`
- 인증: 회원 필요

Request:

```json
{
  "name": "홍길동",
  "profileImageUrl": "https://example.com/profile.jpg",
  "bio": "포켓몬 카드 박스 수집가"
}
```

Response: 내 회원 정보 조회 응답과 동일한 객체 구조

주요 예외:

- `MEMBER_NOT_FOUND`
- `INVALID_REQUEST`
- `401 Unauthorized`

### 로그인 상태 비밀번호 변경

- Method: `PATCH`
- URL: `/api/members/me/password`
- 인증: 회원 필요

Request:

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

Response: `204 No Content`

주요 예외:

- `MEMBER_NOT_FOUND`
- `INVALID_PASSWORD`
- `INVALID_REQUEST`
- `401 Unauthorized`

## 2. 상품 API

### 카테고리 목록 조회

- Method: `GET`
- URL: `/api/categories`
- 인증: 불필요

`active=true`인 카테고리를 `displayOrder`, `id` 순으로 조회한다.

Response:

```json
[
  {
    "id": 1,
    "name": "미개봉 상품",
    "slug": "sealed-product",
    "description": "미개봉 포켓몬 카드 박스와 세트 상품",
    "displayOrder": 10,
    "active": true
  }
]
```

### 상품 유형 목록 조회

- Method: `GET`
- URL: `/api/product-types`
- 인증: 불필요

Query Parameters:

- `categoryId`: 특정 카테고리에 속한 상품 유형만 조회

Response:

```json
[
  {
    "id": 1,
    "categoryId": 1,
    "categoryName": "미개봉 상품",
    "name": "확장팩 박스",
    "slug": "expansion-box",
    "description": "확장팩 sealed box 상품",
    "displayOrder": 10,
    "active": true
  }
]
```

### 시리즈 목록 조회

- Method: `GET`
- URL: `/api/series`
- 인증: 불필요

`active=true`인 시리즈를 `displayOrder`, `id` 순으로 조회한다.

Response:

```json
[
  {
    "id": 1,
    "name": "스칼렛&바이올렛",
    "slug": "scarlet-violet",
    "description": "스칼렛&바이올렛 시리즈",
    "displayOrder": 10,
    "active": true
  }
]
```

### 관리자 카탈로그 API

관리자 Catalog API는 모두 관리자 인증이 필요하다. 삭제 API는 제공하지 않고, 숨김 처리는 `PATCH` 요청에서 `active=false`로 처리한다.
관리자 목록 조회는 `active` 여부와 관계없이 전체 항목을 반환한다. 기존 상품이 참조 중인 Category, ProductType, Series를 `active=false`로 바꿔도 상품 참조는 자동 제거되지 않는다.

#### 관리자 카테고리 목록 조회

- Method: `GET`
- URL: `/api/admin/categories`
- 인증: 관리자 필요

Response:

```json
[
  {
    "id": 1,
    "name": "미개봉 상품",
    "slug": "sealed-product",
    "description": "미개봉 포켓몬 카드 박스와 세트 상품",
    "displayOrder": 10,
    "active": true
  }
]
```

#### 관리자 카테고리 생성/수정

- Method: `POST`
- URL: `/api/admin/categories`
- 인증: 관리자 필요

- Method: `PATCH`
- URL: `/api/admin/categories/{id}`
- 인증: 관리자 필요

Request:

```json
{
  "name": "미개봉 상품",
  "slug": "sealed-product",
  "description": "미개봉 포켓몬 카드 박스와 세트 상품",
  "displayOrder": 10,
  "active": true
}
```

`displayOrder`가 `null`이면 `0`, `active`가 `null`이면 `true`로 처리한다. `slug`는 영문 소문자, 숫자, 하이픈만 허용한다.

주요 예외:

- `CATEGORY_NOT_FOUND`
- `DUPLICATE_CATEGORY_SLUG`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

#### 관리자 상품 유형 목록 조회

- Method: `GET`
- URL: `/api/admin/product-types`
- 인증: 관리자 필요

Response:

```json
[
  {
    "id": 1,
    "categoryId": 1,
    "categoryName": "미개봉 상품",
    "name": "확장팩 박스",
    "slug": "expansion-box",
    "description": "확장팩 sealed box 상품",
    "displayOrder": 10,
    "active": true
  }
]
```

#### 관리자 상품 유형 생성/수정

- Method: `POST`
- URL: `/api/admin/product-types`
- 인증: 관리자 필요

- Method: `PATCH`
- URL: `/api/admin/product-types/{id}`
- 인증: 관리자 필요

Request:

```json
{
  "categoryId": 1,
  "name": "확장팩 박스",
  "slug": "expansion-box",
  "description": "확장팩 sealed box 상품",
  "displayOrder": 10,
  "active": true
}
```

같은 카테고리 안에서 `slug`는 중복될 수 없다. `categoryId`는 존재하고 active 상태인 카테고리여야 한다.

주요 예외:

- `CATEGORY_NOT_FOUND`
- `PRODUCT_TYPE_NOT_FOUND`
- `DUPLICATE_PRODUCT_TYPE_SLUG`
- `INVALID_CATALOG_REQUEST`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

#### 관리자 시리즈 목록 조회

- Method: `GET`
- URL: `/api/admin/series`
- 인증: 관리자 필요

Response:

```json
[
  {
    "id": 1,
    "name": "스칼렛&바이올렛",
    "slug": "scarlet-violet",
    "description": "스칼렛&바이올렛 시리즈",
    "displayOrder": 10,
    "active": true
  }
]
```

#### 관리자 시리즈 생성/수정

- Method: `POST`
- URL: `/api/admin/series`
- 인증: 관리자 필요

- Method: `PATCH`
- URL: `/api/admin/series/{id}`
- 인증: 관리자 필요

Request:

```json
{
  "name": "스칼렛&바이올렛",
  "slug": "scarlet-violet",
  "description": "스칼렛&바이올렛 시리즈",
  "displayOrder": 10,
  "active": true
}
```

주요 예외:

- `SERIES_NOT_FOUND`
- `DUPLICATE_SERIES_SLUG`
- `INVALID_REQUEST`
- `401 Unauthorized`
- `403 Forbidden`

### 상품 목록 조회

- Method: `GET`
- URL: `/api/products`
- 인증: 불필요

Query Parameters:

- `keyword`: 상품명 또는 설명 검색어
- `category`: 카테고리 필터
- `series`: 시리즈 필터
- `categoryId`: DB master 카테고리 ID 필터
- `productTypeId`: DB master 상품 유형 ID 필터
- `seriesId`: DB master 시리즈 ID 필터
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
    "retailPrice": null,
    "category": "부스터 박스",
    "series": "스칼렛&바이올렛",
    "categoryId": 1,
    "categoryName": "미개봉 상품",
    "productTypeId": 1,
    "productTypeName": "확장팩 박스",
    "seriesId": 1,
    "seriesName": "스칼렛&바이올렛",
    "language": "KOREAN",
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
  "retailPrice": null,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "categoryId": 1,
  "categoryName": "미개봉 상품",
  "productTypeId": 1,
  "productTypeName": "확장팩 박스",
  "seriesId": 1,
  "seriesName": "스칼렛&바이올렛",
  "language": "KOREAN",
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

Query Parameters:

- `keyword`: 상품명 또는 설명 검색어
- `category`: 카테고리 필터
- `series`: 시리즈 필터
- `categoryId`: DB master 카테고리 ID 필터
- `productTypeId`: DB master 상품 유형 ID 필터
- `seriesId`: DB master 시리즈 ID 필터
- `status`: 상품 상태 필터. `HIDDEN` 포함 가능
- `lowStockOnly`: `true`이면 재고 부족 상품만 조회

Request: 없음

`HIDDEN` 상품을 포함해 조회한다. 관리자 상품 관리 화면에서 숨김 상품을 다시 확인하고 수정할 때 사용한다.

Response:

```json
[
  {
    "id": 1,
    "name": "포켓몬 카드 박스",
    "description": "한국어판 포켓몬 카드 박스",
    "price": 30000,
    "retailPrice": null,
    "category": "부스터 박스",
    "series": "스칼렛&바이올렛",
    "categoryId": 1,
    "categoryName": "미개봉 상품",
    "productTypeId": 1,
    "productTypeName": "확장팩 박스",
    "seriesId": 1,
    "seriesName": "스칼렛&바이올렛",
    "language": "KOREAN",
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
  "retailPrice": null,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "categoryId": 1,
  "productTypeId": 1,
  "seriesId": 1,
  "language": "KOREAN",
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
  "retailPrice": null,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "categoryId": 1,
  "categoryName": "미개봉 상품",
  "productTypeId": 1,
  "productTypeName": "확장팩 박스",
  "seriesId": 1,
  "seriesName": "스칼렛&바이올렛",
  "language": "KOREAN",
  "releaseDate": "2026-01-01",
  "stockQuantity": 20,
  "imageUrl": "https://example.com/product.jpg",
  "status": "ON_SALE",
  "createdAt": "2026-05-21T09:00:00",
  "updatedAt": "2026-05-21T09:00:00"
}
```

주요 예외:

- `CATEGORY_NOT_FOUND`
- `PRODUCT_TYPE_NOT_FOUND`
- `SERIES_NOT_FOUND`
- `PRODUCT_TYPE_CATEGORY_MISMATCH`
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
  "retailPrice": 36000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "categoryId": 1,
  "productTypeId": 1,
  "seriesId": 1,
  "language": "KOREAN",
  "releaseDate": "2026-01-01",
  "stockQuantity": 10,
  "imageUrl": "https://example.com/product-updated.jpg",
  "status": "ON_SALE"
}
```

`releaseDate`, `imageUrl`, `retailPrice`는 `null`을 보내면 기존 값을 제거한다. 그 외 필드는 값이 있는 경우 해당 값으로 수정한다.
`categoryId`, `productTypeId`, `seriesId`는 nullable이다. 기존 `category`, `series` 문자열 필드는 레거시 호환용으로 유지한다.

Response:

```json
{
  "id": 1,
  "name": "포켓몬 카드 박스 수정",
  "description": "한국어판 포켓몬 카드 박스",
  "price": 32000,
  "retailPrice": 36000,
  "category": "부스터 박스",
  "series": "스칼렛&바이올렛",
  "categoryId": 1,
  "categoryName": "미개봉 상품",
  "productTypeId": 1,
  "productTypeName": "확장팩 박스",
  "seriesId": 1,
  "seriesName": "스칼렛&바이올렛",
  "language": "KOREAN",
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
- `CATEGORY_NOT_FOUND`
- `PRODUCT_TYPE_NOT_FOUND`
- `SERIES_NOT_FOUND`
- `PRODUCT_TYPE_CATEGORY_MISMATCH`
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
- `PRODUCT_NOT_PURCHASABLE`
- `OUT_OF_STOCK`
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
- `PRODUCT_NOT_PURCHASABLE`
- `OUT_OF_STOCK`
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
  "deliveryAddressId": null,
  "deferDeliveryAddress": false
}
```

`deliveryAddressId`는 선택 필드이다. 값이 있으면 저장된 배송지를 사용하고, 없으면 `receiverName`, `receiverPhone`, `address`를 직접 입력 배송지로 사용한다.
장바구니에서 바로 배송/결제 단계로 이동할 때는 `deferDeliveryAddress: true`를 보내 배송지 입력을 배송/결제 화면으로 미룰 수 있다.

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
  "courierCompany": null,
  "trackingNumber": null,
  "shippedAt": null,
  "deliveredAt": null,
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
- `PRODUCT_NOT_PURCHASABLE`
- `OUT_OF_STOCK`
- `MEMBER_NOT_FOUND`
- `401 Unauthorized`

### 주문 배송지 변경

- Method: `PATCH`
- URL: `/api/orders/{orderId}/delivery-address`
- 인증: 회원 필요

Request: 저장된 배송지로 변경하는 경우

```json
{
  "deliveryAddressId": 10
}
```

Request: 직접 입력 배송지로 변경하는 경우

```json
{
  "receiverName": "홍길동",
  "receiverPhone": "010-1234-5678",
  "zipCode": "06123",
  "address1": "서울시 강남구 테헤란로 1",
  "address2": "101동 1001호"
}
```

`deliveryAddressId`가 있으면 로그인한 사용자의 저장된 배송지를 주문 배송지 스냅샷으로 반영한다. `deliveryAddressId`가 없으면 직접 입력한 `receiverName`, `receiverPhone`, `zipCode`, `address1`, `address2`를 사용한다.

처리 조건:

- 로그인한 사용자의 본인 주문만 변경할 수 있다.
- 주문 상태가 `PAYMENT_PENDING`일 때만 변경할 수 있다.
- `PAID`, `FAILED`, `CANCELED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `EXPIRED` 상태에서는 변경할 수 없다.

Response: 주문 생성 응답과 동일한 객체 구조이며 변경된 배송 정보가 반영된다.

주요 예외:

- `ORDER_NOT_FOUND`
- `ADDRESS_NOT_FOUND`
- `INVALID_ADDRESS_REQUEST`
- `INVALID_ORDER_STATUS`
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
- `provider`: 현재 실제 결제 클라이언트는 `TOSS`만 구현되어 있다. 다른 provider 값은 `PAYMENT_PROVIDER_NOT_SUPPORTED`로 거부된다.
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

Query Parameters:

- `status`: 주문 상태 필터
- `memberEmail`: 회원 이메일 부분 검색
- `startDate`: 주문 생성일 시작일, `yyyy-MM-dd`
- `endDate`: 주문 생성일 종료일, `yyyy-MM-dd`

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
