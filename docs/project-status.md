# Project Status

## 프로젝트 개요

PKM Box Store는 한국어판 포켓몬 카드 박스를 판매하는 쇼핑몰 프로젝트이다.

- Backend: Spring Boot, MySQL, JWT, AWS S3, Toss Payments
- Frontend: Next.js App Router, TypeScript
- API 기준 문서: `docs/api-spec.md`
- 로컬 테스트 기준 문서: `docs/local-test-checklist.md`

## 현재 구현 완료 기능

- 회원가입, 로그인, JWT 기반 인증
- 상품 목록/상세 조회
- 상품 검색/필터/정렬
  - `keyword`, `category`, `series`, `status`, `inStockOnly`, `sort`
  - 일반 목록에서 `HIDDEN` 상품 제외
- 관리자 상품 등록, 수정, 숨김 처리
- 관리자 S3 이미지 업로드
- 장바구니 조회, 담기, 수량 변경, 삭제, 비우기 API
- 배송지 관리
  - 배송지 목록, 추가, 수정, 삭제, 기본 배송지 설정
- 장바구니 기반 주문 생성
- 배송지 선택 주문 생성
- 일반 사용자 주문 목록/상세 조회
- 주문 생성 후 결제 대기 페이지 이동
- Toss Payments 결제창 프론트 연동
- Toss 결제 성공 리다이렉트 및 결제 승인 API 호출
- Toss 결제 실패/취소 리다이렉트 및 결제 실패 처리
- 결제 대기 페이지의 결제 취소 처리
- 결제 취소/환불 API
  - 사용자: `POST /api/payments/cancel`
  - 관리자: `POST /api/admin/payments/cancel`
- 관리자 결제 취소/환불 UI
- 관리자 주문 목록/상세 조회
- 배송/운송장 관리
  - `PAID -> PREPARING`
  - `PREPARING -> SHIPPED` 시 택배사/운송장 번호 저장
  - `SHIPPED -> DELIVERED`
- 관리자 대시보드 API
  - `GET /api/admin/dashboard`
- 관리자 대시보드 프론트
  - `/admin`
  - 오늘 주문 수, 오늘 매출, 상태별 주문 수, 최근 주문, 재고 부족 상품
- 주문 만료 스케줄러
- 재고 예약, 확정, 해제 이력 기록
- 재고 동시성 락
  - 주문 생성 시 상품 조회에 pessimistic write lock 사용

## 백엔드 구현 상태

- 도메인 구성:
  - `member`: 회원, 로그인, JWT 인증
  - `product`: 상품, 상품 검색/필터/정렬, 관리자 상품 관리
  - `cart`: 장바구니
  - `deliveryaddress`: 배송지 관리
  - `order`: 주문 생성, 조회, 관리자 주문/배송 관리, 만료 처리
  - `payment`: Toss 승인, 실패, 취소/환불 처리
  - `inventory`: 재고 증감 및 이력
  - `dashboard`: 관리자 대시보드
  - `s3`: 관리자 이미지 업로드
- 인증/인가:
  - 일반 상품 조회와 회원가입/로그인은 공개
  - `/api/admin/**`는 관리자 권한 필요
  - 그 외 API는 로그인 필요
- 결제:
  - Toss 승인 API 호출 구현
  - Toss 취소 API 호출 구현
  - 결제 금액/주문 UID 검증 구현
- 재고:
  - 주문 생성 시 재고 예약 차감
  - 결제 성공 시 예약 확정
  - 결제 실패, 결제 취소/환불, 주문 만료 시 재고 복구
  - 주문 생성 시 pessimistic write lock으로 동시성 보강

## 프론트엔드 구현 상태

- 공개 페이지:
  - `/`
  - `/products/[id]`
  - `/login`
  - `/signup`
- 로그인 사용자 페이지:
  - `/cart`
  - `/my/addresses`
  - `/orders`
  - `/orders/[id]`
  - `/orders/[id]/payment`
  - `/payments/success`
  - `/payments/fail`
- 관리자 페이지:
  - `/admin`
  - `/admin/products`
  - `/admin/orders`
  - `/admin/orders/[id]`
- 공통:
  - `RequireAuth`로 로그인/관리자 접근 제어
  - Header에서 관리자 대시보드, 관리자 상품, 관리자 주문 링크 제공
  - API 클라이언트는 `frontend/lib/api.ts`
  - 가격/날짜 포맷 유틸 사용
  - 주요 중복 클릭 버튼 disabled 처리
  - loading, empty, error 상태 일부 보강

## 결제/주문/재고 흐름 요약

1. 사용자가 상품을 장바구니에 담는다.
2. `/cart`에서 직접 배송 정보를 입력하거나 저장된 배송지를 선택해 주문을 생성한다.
3. 백엔드는 주문을 `PAYMENT_PENDING`으로 만들고 재고를 예약 차감한다.
4. 프론트는 `/orders/{orderId}/payment`로 이동한다.
5. 결제하기 클릭 시 Toss 결제창을 연다.
6. 결제 성공 후 `/payments/success`에서 `paymentKey`, `orderId`, `amount`를 읽는다.
7. success 페이지는 `api.order(orderId)`로 `orderUid`를 조회해 `providerOrderId`로 사용한다.
8. `api.confirmPayment` 성공 시 주문은 `PAID`, 결제는 `APPROVED`, 재고 이력은 `CONFIRMED`가 된다.
9. 결제창 실패/취소 리다이렉트 또는 결제 대기 페이지 취소 시 `api.failPayment(orderId)`를 호출한다.
10. 실패 처리 후 주문은 `FAILED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
11. 사용자 또는 관리자가 PAID 주문을 결제 취소/환불하면 Toss 취소 API를 호출한다.
12. 환불 성공 후 주문은 `CANCELED`, 결제는 `CANCELED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
13. 관리자는 `PAID -> PREPARING -> SHIPPED -> DELIVERED` 순서로 배송 상태를 변경한다.
14. `SHIPPED` 처리 시 택배사와 운송장 번호가 저장되고 `shippedAt`이 채워진다.
15. `DELIVERED` 처리 시 `deliveredAt`이 채워진다.

## 로컬 테스트 전 확인할 것

- MySQL이 실행 중인지 확인
- DB와 계정이 준비되어 있는지 확인
- 백엔드 환경변수 확인:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `TOSS_PAYMENTS_SECRET_KEY`
  - S3 업로드 테스트용 AWS/S3 변수
- 프론트엔드 `frontend/.env.local` 확인:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...`
- Toss 테스트 키 확인:
  - 더미 값만 있으면 완전한 결제 E2E는 불가능하다.
  - Toss 결제창 승인부터 백엔드 승인/취소까지 검증하려면 같은 Toss 테스트 상점의 유효한 Client Key와 Secret Key가 필요하다.
- 관리자 테스트 계정은 DB에서 `ROLE_ADMIN`으로 변경 후 재로그인 필요
- 상세 흐름은 `docs/local-test-checklist.md` 기준으로 확인

## 실제 운영 전 반드시 보강할 것

- Toss 테스트 키 기반 실제 결제 E2E
- 운영 Toss 키 전환
- 결제 승인/취소 멱등성 강화
- refresh token 또는 토큰 만료 UX
- 운영 CORS 도메인 분리
- S3 실제 권한 정책
- 배포 환경변수 관리
- 로그/모니터링
- 비밀번호 변경/재설정
- 운영 DB 마이그레이션 전략
- 주문/결제 실패 재처리 정책
- 관리자 작업 감사 로그
- 민감 정보와 API 응답 과노출 방지 점검

## 다음 추천 작업 순서

1. `docs/local-test-checklist.md` 기준으로 로컬 전체 흐름을 검증한다.
2. 유효한 Toss 테스트 키로 결제 승인/실패/취소/환불 E2E를 고정한다.
3. 결제 승인/취소 멱등성과 중복 요청 방어를 강화한다.
4. 토큰 만료 UX와 refresh token 도입 여부를 결정한다.
5. 운영 배포 전 CORS, S3 권한, 환경변수, 로그/모니터링을 정리한다.
