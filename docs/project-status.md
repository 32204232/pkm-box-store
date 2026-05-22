# Project Status

## 프로젝트 개요

PKM Box Store는 한국어판 포켓몬 카드 박스를 판매하는 쇼핑몰 프로젝트이다.

- Backend: Spring Boot, MySQL, JWT, AWS S3, Toss Payments
- Frontend: Next.js App Router, TypeScript
- API 기준 문서: `docs/api-spec.md`
- 로컬 테스트 기준 문서: `docs/local-test-checklist.md`

## 현재 구현 완료 기능

- 회원가입, 로그인, JWT 기반 인증
- 토큰 만료 또는 유효하지 않은 토큰 감지 시 access token 삭제, 로그인 페이지 이동, 만료 안내 표시
- 상품 목록/상세 조회, 검색/필터/정렬
- 관리자 상품 등록, 수정, 숨김 처리
- 관리자 S3 이미지 업로드
  - 허용 확장자와 MIME 검증
  - 5MB 초과, 빈 파일, 확장자/MIME 불일치 거부
  - S3 key는 `products/{uuid}.{extension}` 형식으로 생성
- 장바구니 조회, 담기, 수량 변경, 삭제, 비우기 API
- 배송지 목록, 추가, 수정, 삭제, 기본 배송지 설정
- 장바구니 기반 주문 생성 및 배송지 선택 주문 생성
- 일반 사용자 주문 목록/상세 조회
- 주문 생성 후 결제 대기 페이지 이동
- Toss 결제 승인/실패/취소/환불 흐름
- 결제 승인/취소 멱등성 강화
  - 동일 승인 재요청은 같은 `paymentKey`, `providerOrderId`, `amount`일 때 기존 결제 반환
  - 같은 주문에 다른 결제 키 또는 provider 주문번호가 들어오면 예외
  - 중복 취소 요청은 재고 복구 이력이 중복 저장되지 않도록 처리
- 재고 예약, 확정, 해제 이력 기록
- 주문 생성 시 상품 조회에 pessimistic write lock 사용
- 주문 만료 처리
- 관리자 주문 목록/상세 조회
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
  - `cart`: 장바구니
  - `deliveryaddress`: 배송지 관리
  - `order`: 주문 생성, 조회, 관리자 주문/배송 관리, 만료 처리
  - `payment`: Toss 승인, 실패, 취소/환불 처리, 멱등성 방어
  - `inventory`: 재고 증감 및 이력
  - `dashboard`: 관리자 대시보드
  - `adminlog`: 관리자 감사 로그
  - `s3`: 관리자 이미지 업로드 및 업로드 파일 검증
- 인증/인가:
  - 일반 상품 조회와 회원가입/로그인은 공개
  - `/api/admin/**`는 관리자 권한 필요
  - 그 외 API는 로그인 필요
- 보안/운영 설정:
  - JWT 인증 필터 적용
  - CORS origin은 `CORS_ALLOWED_ORIGINS`로 설정
  - Secret 값은 환경변수로 주입

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
  - `/admin/audit-logs`
- 공통:
  - `RequireAuth`로 로그인/관리자 접근 제어
  - Header에서 관리자 대시보드, 상품, 주문, 감사 로그 링크 제공
  - API 클라이언트는 `frontend/lib/api.ts`
  - 401 응답 시 토큰 삭제, `/login?reason=expired` 이동, 만료 안내 표시
  - 가격/날짜 포맷 유틸 사용
  - 주요 중복 클릭 버튼 disabled 처리
  - loading, empty, error 상태 보강

## 결제/주문/재고 흐름 요약

1. 사용자가 상품을 장바구니에 담는다.
2. `/cart`에서 배송 정보를 입력하거나 저장된 배송지를 선택해 주문을 생성한다.
3. 백엔드는 주문을 `PAYMENT_PENDING`으로 만들고 재고를 예약 차감한다.
4. 프론트는 `/orders/{orderId}/payment`로 이동한다.
5. Toss 결제창 `orderId`에는 내부 DB ID가 아니라 주문 `orderUid`를 전달한다.
6. 결제 성공 후 프론트는 `paymentKey`, Toss `orderId`, `amount`, `internalOrderId`를 구분해 승인 API를 호출한다.
7. 승인 성공 시 주문은 `PAID`, 결제는 `APPROVED`, 재고 이력은 `CONFIRMED`가 된다.
8. 중복 승인 요청은 같은 `paymentKey`, `providerOrderId`, `amount`이면 기존 결제 응답을 반환하고, 다른 값이면 예외가 발생한다.
9. 결제 실패/취소 리다이렉트 또는 결제 대기 페이지 취소 시 실패 처리를 호출한다.
10. 실패 처리 후 주문은 `FAILED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
11. 사용자 또는 관리자가 `PAID` 주문을 결제 취소/환불하면 Toss 취소 API를 호출한다.
12. 환불 성공 후 주문은 `CANCELED`, 결제는 `CANCELED`, 재고는 복구되고 이력은 `RELEASED`가 된다.
13. 중복 취소 요청은 기존 취소 결과를 반환하되 재고 복구와 `RELEASED` 이력이 중복 처리되지 않는다.
14. 관리자는 `PAID -> PREPARING -> SHIPPED -> DELIVERED` 순서로 배송 상태를 변경한다.
15. 관리자 상품/주문/결제 운영 작업은 감사 로그로 저장된다.

## 로컬 테스트 전 확인할 것

- MySQL이 실행 중인지 확인
- DB와 계정이 준비되어 있는지 확인
- 백엔드 환경변수 확인:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`
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
- 관리자 테스트 계정은 DB에서 `ROLE_ADMIN`으로 변경 후 재로그인 필요
- 상세 흐름은 `docs/local-test-checklist.md` 기준으로 확인

## 운영 안정성 보강 현황

완료:

- 결제 승인/취소 멱등성 강화
- 관리자 작업 감사 로그 저장 및 조회 페이지
- 토큰 만료 UX 개선
- CORS 허용 Origin 환경변수화
- S3 이미지 업로드 검증 강화
- Secret 관리 점검 및 `.gitignore` 보강

남은 보강 후보:

- 운영 Toss 키 전환 및 키 보관 체계 확정
- 운영/스테이징 Secret Manager 또는 배포 플랫폼 Secret 설정
- S3 운영 버킷 권한 정책 최소화
- refresh token 도입 여부 검토
- 주문 상태와 결제 상태/배송 상태 분리 검토
- 운영 DB 마이그레이션 전략
- 로그/모니터링 및 장애 알림
- 주문/결제 실패 재처리 정책
- 민감 정보와 API 응답 과노출 방지 점검

## 다음 추천 작업 순서

1. `docs/local-test-checklist.md` 기준으로 로컬 전체 흐름을 반복 검증한다.
2. 운영/스테이징 환경변수와 Secret 주입 방식을 확정한다.
3. 운영 S3 권한, CORS 도메인, Toss 키 전환 절차를 점검한다.
4. 로그/모니터링과 결제 실패 재처리 정책을 정리한다.
