# Project Status

## 프로젝트 개요

PKM Box Store는 한국어판 포켓몬 카드 박스를 판매하는 쇼핑몰 프로젝트이다.

- Backend: Spring Boot 3.3.x, Java 17, MySQL, JWT, Flyway, AWS S3, Toss Payments
- Frontend: Next.js App Router, React 19, TypeScript
- API 기준 문서: `docs/api-spec.md`
- 로컬 테스트 기준 문서: `docs/local-test-checklist.md`
- 출시 전 QA 기준 문서: `docs/release-qa-checklist.md`
- 운영 준비 기준 문서: `docs/operations-readiness.md`

## Current Status

PKM Box Store는 한국어판 포켓몬 카드 박스 판매를 시작점으로 하되, Pokemon TCG commerce project로 확장할 수 있게 Catalog master data 구조로 전환 중이다.

최근 완료:

- Category, ProductType, Series master data 도메인 추가
- 공통 Catalog 조회 API와 관리자 Catalog CUD API 추가
- `/admin/catalog` 관리자 Catalog 관리 화면 추가
- `/admin/products` 상품 등록/수정 폼의 Category/ProductType/Series select, Language, retailPrice 입력 연결
- 기존 `products.category`, `products.series` 문자열 컬럼은 레거시 호환용으로 유지

다음 우선 작업:

- 사용자 상품 목록/상세 화면의 master data 기반 필터/표시 개선
- 초기 상품 데이터의 catalog 참조값 정리
- legacy category/series 문자열 컬럼 제거 여부는 별도 migration 단계에서 검토

## Catalog/Product Structure

- `Category`: 최상위 상품 분류 master data
- `ProductType`: 특정 `Category`에 속하는 상품 유형
- `Series`: 카테고리에 종속되지 않는 재사용 가능한 시리즈 master data
- `Product`: `category_id`, `product_type_id`, `series_id` nullable 참조를 가진다.
- `Product`: `ProductLanguage` enum과 `retailPrice`를 가진다.
- `products.category`, `products.series` 문자열 컬럼은 기존 데이터/화면 호환을 위해 당분간 유지한다.
- Product catalog 참조 검증은 `CatalogValidationService`에서 담당한다.

현재 catalog 패키지 구조:

```text
backend/src/main/java/com/pkm/store/domain/catalog
  ├── controller
  ├── service
  ├── category
  ├── producttype
  └── series
```

## 현재 구현 완료 기능

- 이메일 인증 기반 회원가입, 로그인, JWT 기반 인증
- 비밀번호 재설정
  - 이메일 인증번호 발송/확인 후 새 비밀번호 설정
  - 인증번호와 verification token은 해시 저장
  - 로컬 개발은 `MAIL_MODE=LOG`로 인증번호 로그 확인 가능
- 토큰 만료 또는 유효하지 않은 토큰 감지 시 access token 삭제, 로그인 페이지 이동, 만료 안내 표시
- 상품 목록/상세 조회, 검색/필터/정렬
- 상품 구매 가능 상태 검증
  - 장바구니 담기와 주문 생성 시 `ON_SALE` 상품만 허용
  - 요청 수량 기준 재고 부족 시 거부
- Catalog master data
  - Category, ProductType, Series 도메인 추가
  - ProductType은 Category에 속하고, Series는 독립 master data로 재사용
  - Product는 nullable `categoryId`, `productTypeId`, `seriesId` 참조와 `language`, `retailPrice` 보유
  - 기존 `category`, `series` 문자열은 레거시 호환용으로 유지
- 관리자 상품 등록, 수정, 숨김 처리
  - 관리자 상품 목록은 `HIDDEN` 상품까지 포함해 조회
  - 상품명, 카테고리, 상품 유형, 시리즈, 상태, 재고 부족 필터 지원
  - 상품 수정에서 `releaseDate`, `imageUrl`에 `null`을 보내면 기존 값 제거
  - 상품 등록/수정 폼에서 Category, ProductType, Series master data select와 언어/정가 입력 지원
- 관리자 카탈로그 관리 페이지
  - `/admin/catalog`에서 Category, ProductType, Series 목록 조회, 생성, 수정, 숨김/활성화 처리
  - 상품 등록/수정 폼은 master data select를 사용하되 기존 문자열 컬럼은 호환용으로 유지
- 관리자 S3 이미지 업로드
  - 허용 확장자와 MIME 검증
  - 5MB 초과, 빈 파일, 확장자/MIME 불일치 거부
  - S3 key는 `products/{uuid}.{extension}` 형식으로 생성
- 장바구니 조회, 담기, 수량 변경, 삭제, 비우기 API
- 배송지 목록, 추가, 수정, 삭제, 기본 배송지 설정
- 장바구니 기반 주문 생성 및 배송지 선택 주문 생성
- 일반 사용자 주문 목록/상세 조회
  - 사용자 주문 상세에서 택배사, 운송장 번호, 발송/배송 완료 시간 표시
- 주문 생성 후 결제 대기 페이지 이동
- Toss 결제 승인/실패/취소/환불 흐름
- 결제 승인/취소 멱등성 강화
  - 동일 승인 재요청은 같은 `paymentKey`, `providerOrderId`, `amount`일 때 기존 결제 반환
  - 같은 주문에 다른 결제 키 또는 provider 주문번호가 들어오면 예외
  - 중복 취소 요청은 재고 복구 이력이 중복 저장되지 않도록 처리
- 재고 예약, 확정, 해제 이력 기록
- 주문 생성 시 상품 조회에 pessimistic write lock 사용
- 주문 만료 처리
  - 결제 대기 주문은 만료 시 `EXPIRED`로 변경되고 예약 재고는 복구
- 관리자 주문 목록/상세 조회
  - 주문 상태, 회원 이메일, 기간 필터 지원
- 관리자 배송 상태 변경
  - `PAID -> PREPARING`
  - `PREPARING -> SHIPPED`
  - `SHIPPED -> DELIVERED`
- 관리자 결제 취소/환불
- 관리자 대시보드 API 및 프론트 페이지
- 관리자 작업 감사 로그 저장
  - 상품 등록/수정/숨김
  - 주문 배송 준비/발송/완료
  - 관리자 결제 취소/환불
- 관리자 감사 로그 조회 API와 `/admin/audit-logs` 페이지
- KREAM형 마이페이지
  - `/mypage` 홈 대시보드
  - `/mypage/orders`
  - `/mypage/login-info`
  - `/mypage/profile`
  - `/mypage/addresses`
  - 프로필/로그인/주소 변경은 정보 행과 모달 편집 방식
- 주문 생성, 결제 완료, 배송 시작/완료 고객 이메일 알림
- 만료/사용 완료 이메일 인증 데이터 정리 스케줄러
- CORS 허용 Origin 환경변수화
  - `CORS_ALLOWED_ORIGINS`
  - 쉼표 구분, trim, 빈 값 제외
- Secret 관리 점검
  - `.env`, `.env.local`, `.env.*.local` ignore 보강
  - 실제 키 값은 문서와 예시 파일에 기록하지 않음

## 백엔드 구현 상태

- 도메인 구성:
  - `member`: 회원, 로그인, JWT 인증
  - `product`: 상품, 검색/필터/정렬, 관리자 상품 관리
  - `catalog`: Category, ProductType, Series master data와 검증
  - `cart`: 장바구니
  - `deliveryaddress`: 배송지 관리
  - `order`: 주문 생성, 조회, 관리자 주문/배송 관리, 만료 처리
  - `payment`: Toss 승인, 실패, 취소/환불 처리, 멱등성 방어
  - `inventory`: 재고 증감 및 이력
  - `dashboard`: 관리자 대시보드
  - `adminlog`: 관리자 감사 로그
  - `notification`: 주문/결제/배송 고객 알림
  - `global/s3`: 관리자 이미지 업로드 및 업로드 파일 검증
- 인증/인가:
  - 일반 상품 조회와 회원가입/로그인/이메일 인증/비밀번호 재설정은 공개
  - `/api/admin/**`는 관리자 권한 필요
  - 그 외 API는 로그인 필요
- 보안/운영 설정:
  - JWT 인증 필터 적용
  - CORS origin은 `CORS_ALLOWED_ORIGINS`로 설정
  - Secret 값은 환경변수로 주입
  - SMTP 설정은 환경변수로 주입하고 실제 비밀번호는 문서/커밋에 기록하지 않음
  - 이메일 인증 목적은 `SIGNUP`, `PASSWORD_RESET`으로 분리
- DB 마이그레이션:
  - Flyway 기반 SQL migration으로 신규 테이블/컬럼 변경 관리
  - 기본 운영 흐름은 `JPA_DDL_AUTO=validate`와 Flyway migration
  - `JPA_DDL_AUTO=update`는 로컬 긴급 확인용으로만 사용
  - V4 migration은 `categories`, `product_types`, `series`와 products catalog 참조 컬럼, `language`, `retail_price`를 추가
  - TiDB/MySQL 호환성을 위해 1차 catalog 참조는 FK 강제 대신 index와 애플리케이션 검증으로 시작

## 프론트엔드 구현 상태

- 공개 페이지:
  - `/`
  - `/products/[id]`
  - `/login`
  - `/signup`
  - `/password-reset`
- 로그인 사용자 페이지:
  - `/cart`
  - `/mypage`
  - `/mypage/orders`
  - `/mypage/login-info`
  - `/mypage/profile`
  - `/mypage/addresses`
  - `/my/addresses`
  - `/orders`
  - `/orders/[id]`
  - `/orders/[id]/payment`
  - `/payments/success`
  - `/payments/fail`
- 관리자 페이지:
  - `/admin`
  - `/admin/catalog`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/orders/[id]`
  - `/admin/audit-logs`
- 공통:
  - `RequireAuth`로 로그인/관리자 접근 제어
  - Header에서 관리자 대시보드, 카탈로그, 상품, 주문, 감사 로그 링크 제공
  - API 클라이언트는 `frontend/lib/api.ts`
  - 401 응답 시 토큰 삭제, `/login?reason=expired` 이동, 만료 안내 표시
  - 가격/날짜 포맷 유틸 사용
  - 주요 중복 클릭 버튼 disabled 처리
  - loading, empty, error 상태 보강

## 결제/주문/재고 흐름 요약

1. 사용자가 상품을 장바구니에 담는다.
2. 백엔드는 장바구니 담기 시 상품 상태가 `ON_SALE`이고 요청 수량만큼 재고가 있는지 확인한다.
3. `/cart`에서 배송 정보를 입력하거나 저장된 배송지를 선택해 주문을 생성한다.
4. 백엔드는 주문 생성 시 pessimistic write lock으로 상품을 다시 조회하고 `ON_SALE`/재고를 재검증한다.
5. 검증이 통과하면 주문을 `PAYMENT_PENDING`으로 만들고 재고를 예약 차감한다.
6. 프론트는 `/orders/{orderId}/payment`로 이동한다.
7. Toss 결제창 `orderId`에는 내부 DB ID가 아니라 주문 `orderUid`를 전달한다.
8. 결제 성공 후 프론트는 `paymentKey`, Toss `orderId`, `amount`, `internalOrderId`를 구분해 승인 API를 호출한다.
9. 승인 성공 시 주문은 `PAID`, 결제는 `APPROVED`, 재고 이력은 `CONFIRMED`가 된다.
10. 중복 승인 요청은 같은 `paymentKey`, `providerOrderId`, `amount`이면 기존 결제 응답을 반환하고, 다른 값이면 예외가 발생한다.
11. 결제 실패/취소 리다이렉트 또는 결제 대기 페이지 취소 시 실패 처리를 호출한다.
12. 실패 처리 후 주문은 `FAILED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
13. 사용자 또는 관리자가 `PAID` 주문을 결제 취소/환불하면 Toss 취소 API를 호출한다.
14. 환불 성공 후 주문은 `CANCELED`, 결제는 `CANCELED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
15. 중복 취소 요청은 기존 취소 결과를 반환하되 재고 복구와 `RELEASED` 이력이 중복 처리되지 않는다.
16. 관리자는 `PAID -> PREPARING -> SHIPPED -> DELIVERED` 순서로 배송 상태를 변경한다.
17. 관리자 상품/주문/결제 운영 작업은 감사 로그로 저장된다.

## 로컬 테스트 전 확인할 것

- MySQL이 실행 중인지 확인
- DB와 계정이 준비되어 있는지 확인
- 백엔드 환경변수 확인:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `FLYWAY_ENABLED`
  - `FLYWAY_BASELINE_ON_MIGRATE`
  - `FLYWAY_BASELINE_VERSION`
  - `JWT_SECRET`
  - `MAIL_MODE`
  - `MAIL_FROM`
  - 실제 SMTP 테스트 시 `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
  - `TOSS_PAYMENTS_SECRET_KEY`
  - `CORS_ALLOWED_ORIGINS`
  - `AWS_S3_BUCKET`
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- 프론트엔드 `frontend/.env.local` 확인:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- Secret 값은 `.env`, `.env.local`, 문서, 커밋에 남기지 않는다.
- 로컬 이메일 인증은 `MAIL_MODE=LOG`로 실행하고 백엔드 로그의 `[EMAIL_VERIFICATION]` 인증번호를 사용한다.
- 관리자 테스트 계정은 DB에서 `ROLE_ADMIN`으로 변경 후 재로그인 필요
- 상세 흐름은 `docs/local-test-checklist.md` 기준으로 확인
- 스테이징, Secret, 결제 검증, 모니터링 기준은 `docs/operations-readiness.md` 기준으로 확인

## 운영 안정성 보강 현황

완료:

- 결제 승인/취소 멱등성 강화
- 상품 구매 가능 상태/재고 검증 강화
- Catalog master data와 관리자 Catalog 관리 화면
- 관리자 상품 등록/수정 폼의 Catalog select 전환
- 관리자 상품 목록의 숨김 상품 포함 조회
- 관리자 상품 수정 시 출시일/이미지 제거 정책 정리
- 관리자 작업 감사 로그 저장 및 조회 페이지
- 토큰 만료 UX 개선
- 이메일 인증 기반 회원가입 및 비밀번호 재설정
- Flyway 기반 DB 마이그레이션 도입
- 이메일 인증 데이터 정리 스케줄러
- 고객 주문/결제/배송 알림 이메일
- 관리자 주문/상품 필터 개선
- CORS 허용 Origin 환경변수화
- S3 이미지 업로드 검증 강화
- Secret 관리 점검 및 `.gitignore` 보강
- KREAM형 마이페이지와 회원 프로필/로그인 정보 관리
- 운영 준비 문서화
  - 출시 전 QA 체크리스트
  - 스테이징 환경 기준
  - Secret 관리 기준
  - Toss 결제 반복 검증 기준
  - S3/SMTP 운영 기준
  - 모니터링/장애 대응 기준

남은 보강 후보:

- 사용자 상품 목록/상세의 master data 기반 필터와 표시 개선
- 초기 상품 데이터의 `category_id`, `product_type_id`, `series_id` 정리
- 운영 Toss 키 전환 및 키 보관 체계 확정
- 운영/스테이징 Secret Manager 또는 배포 플랫폼 Secret 설정
- S3 운영 버킷 권한 정책 최소화
- refresh token 도입 여부 검토
- 주문 상태와 결제 상태/배송 상태 분리 검토
- 실제 SMTP 발신 도메인/SPF/DKIM/DMARC 설정
- 로그/모니터링 및 장애 알림
- 주문/결제 실패 재처리 정책
- 민감 정보와 API 응답 과노출 방지 점검

Deferred Features:

- Kakao login
- Apple login
- single-card-specific fields such as `rarity`, `cardNumber`, `condition`, `grade`
- CSV/JSON import
- advanced inventory adjustment modal
- user-facing home/products redesign
- removal of legacy `category`/`series` string columns

## 다음 추천 작업 순서

1. `docs/local-test-checklist.md` 기준으로 관리자 Catalog와 상품 등록/수정 흐름을 검증한다.
2. 사용자 상품 목록/상세 화면에서 master data 기반 필터와 표시를 점진적으로 적용한다.
3. 기존 상품 데이터에 `category_id`, `product_type_id`, `series_id`를 채우는 운영 절차를 정한다.
4. 출시 전에는 `docs/release-qa-checklist.md` 기준으로 회귀 QA를 수행한다.
5. `docs/operations-readiness.md` 기준으로 스테이징 환경과 Toss 결제 성공/실패/중복 승인/환불을 반복 검증한다.
6. 운영/스테이징 Secret 주입 방식, S3 권한, SMTP 발신 도메인, 모니터링을 확정한다.
