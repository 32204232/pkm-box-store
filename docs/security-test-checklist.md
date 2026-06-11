# Security Test Checklist

보안 기능을 변경하거나 배포 전 점검할 때 사용하는 체크리스트다. 문서 작업 단계에서는 실행하지 않았으며, 새 기능 개발 시 관련 항목부터 테스트한다.
자동화 테스트를 새로 작성할 때는 `docs/security-test-plan.md`의 테스트 설계와 대상 파일 구조를 먼저 참고한다.

## Auth Tests

- [ ] Critical: 비로그인 상태로 `/api/cart`, `/api/orders`, `/api/me/addresses`, `/api/payments/confirm` 호출 시 실패하는지 확인
- [ ] Critical: 변조된 JWT로 보호 API 호출 시 실패하는지 확인
- [ ] Critical: 만료된 JWT로 보호 API 호출 시 실패하고 프론트에서 토큰 삭제 및 로그인 이동이 되는지 확인
- [ ] Important: 회원가입 후 DB에 비밀번호 평문이 저장되지 않는지 확인
- [ ] Important: 존재하지 않는 이메일과 틀린 비밀번호 로그인 실패 메시지가 민감 정보를 과도하게 노출하지 않는지 확인
- [ ] Optional: JWT 만료 시간이 운영 정책과 맞는지 확인

## Admin Authorization Tests

- [x] Critical: ROLE_MEMBER로 `GET /api/admin/categories` 호출 시 403인지 확인 - Automated: `AdminCatalogControllerSecurityTest`
- [x] Critical: ROLE_MEMBER로 `GET /api/admin/products` 호출 시 403인지 확인 - Automated: `ProductSecurityTest`
- [ ] Critical: ROLE_MEMBER로 `POST /api/admin/images` 호출 시 403인지 확인
- [ ] Critical: ROLE_MEMBER로 `POST /api/admin/payments/cancel` 호출 시 403인지 확인
- [x] Critical: 비로그인 상태로 `/api/admin/products` 접근 시 실패하는지 확인 - Automated: `ProductSecurityTest`
- [x] Critical: 비로그인/ROLE_MEMBER/ROLE_ADMIN별 `/api/admin/categories`, `/api/admin/product-types`, `/api/admin/series` 접근 결과 확인 - Automated: `AdminCatalogControllerSecurityTest`
- [ ] Important: 프론트 `/admin`, `/admin/products`, `/admin/orders`, `/admin/catalog`, `/admin/audit-logs`가 ROLE_ADMIN만 렌더링되는지 확인
- [ ] Important: 관리자 상품 생성/수정/숨김, 주문 배송 상태 변경, 관리자 환불 후 audit log가 남는지 확인

## Product/Catalog Tests

- [ ] Critical: `HIDDEN` 상품이 일반 `/api/products` 목록에 보이지 않는지 확인
- [ ] Critical: `HIDDEN` 상품 상세 `/api/products/{id}` 직접 호출이 거부되는지 확인
- [x] Critical: `HIDDEN`, `SOLD_OUT`, `COMING_SOON` 상품을 직접 장바구니/주문 요청으로 구매할 수 없는지 확인 - Automated: `CartServiceTest`, `OrderServiceTest`
- [x] Critical: 재고 0 상품 또는 요청 수량보다 재고가 부족한 상품 주문이 실패하는지 확인 - Automated: `CartServiceTest`, `OrderServiceTest`
- [x] Important: Category와 ProductType이 일치하지 않는 상품 등록/수정 요청이 거부되는지 확인 - Automated: `CatalogMasterSecurityTest`, `ProductServiceTest`
- [x] Important: Category/Series slug 중복 생성이 거부되는지 확인 - Automated: `CatalogMasterSecurityTest`
- [x] Important: ProductType slug가 같은 Category 안에서 중복되면 거부되는지 확인 - Automated: `CatalogMasterSecurityTest`
- [ ] Important: 잘못된 slug 형식이 validation error로 거부되는지 확인
- [x] Optional: 비활성 catalog master data를 상품에 연결하는 정책을 재확인 - Automated: inactive Category로 ProductType 생성 거부 `CatalogMasterSecurityTest`

## Cart/Order Tests

- [x] Critical: 다른 사용자의 `orderId`로 `GET /api/orders/{orderId}` 호출 시 거부되는지 확인 - Automated: `OrderServiceTest`
- [x] Critical: 다른 사용자의 `orderId`로 주문 배송지 변경 시 거부되는지 확인 - Automated: `OrderServiceTest`
- [x] Critical: 다른 사용자의 `addressId`로 주문 생성 또는 배송지 변경 시 거부되는지 확인 - Automated: `OrderServiceTest`
- [ ] Critical: 주문 생성 직전 상품 상태가 바뀐 경우 주문 생성이 실패하는지 확인
- [x] Critical: 주문 생성 직전 재고가 부족해진 경우 주문 생성이 실패하는지 확인 - Automated: pessimistic-lock product 재검증 `OrderServiceTest`
- [ ] Important: 결제 대기 상태가 아닌 주문은 배송지 변경이 실패하는지 확인
- [ ] Important: 빈 장바구니 주문 생성이 실패하는지 확인
- [ ] Optional: 동시에 같은 상품을 주문해도 재고가 음수가 되지 않는지 확인

## Payment Tests

- [x] Critical: 프론트에서 `amount`를 조작해도 서버 주문 금액 기준으로 `PAYMENT_AMOUNT_MISMATCH`가 발생하는지 확인 - Automated: `PaymentServiceTest`
- [x] Critical: Toss `orderId`와 내부 주문 `orderUid`가 다르면 `PAYMENT_ORDER_MISMATCH`가 발생하는지 확인 - Automated: `PaymentServiceTest`
- [x] Critical: 다른 사용자의 `orderId`로 결제 승인/실패/취소 요청 시 거부되는지 확인 - Automated: `PaymentServiceTest`
- [x] Critical: 같은 주문에 다른 `paymentKey` 또는 다른 provider order id가 들어오면 거부되는지 확인 - Automated: `PaymentServiceTest`
- [ ] Important: 같은 `paymentKey`, `providerOrderId`, `amount` 중복 승인 요청은 기존 결제 응답을 반환하는지 확인
- [x] Important: Toss 승인 응답 금액이 주문 금액과 다르면 거부되는지 확인 - Automated: `PaymentServiceTest`
- [ ] Important: 사용자 결제 취소/관리자 환불이 중복 호출되어도 재고 복구 이력이 중복 저장되지 않는지 확인
- [ ] Optional: Toss 실패 redirect의 provider order id와 internal order id 처리 정책을 재검토

## Address Tests

- [x] Critical: 다른 사용자의 `addressId`로 조회/수정/삭제/기본 배송지 설정이 실패하는지 확인 - Automated: `DeliveryAddressServiceTest`
- [x] Critical: 다른 사용자의 `addressId`를 주문 배송지로 사용할 수 없는지 확인 - Automated: `OrderServiceTest`
- [ ] Important: 필수 배송지 필드 누락 시 validation error가 반환되는지 확인
- [ ] Optional: 수령자 전화번호 형식 제한 필요 여부를 검토

## Email Verification/Password Reset Tests

- [ ] Critical: 회원가입에는 `SIGNUP` verification token만 사용할 수 있는지 확인
- [ ] Critical: 비밀번호 재설정에는 `PASSWORD_RESET` verification token만 사용할 수 있는지 확인
- [ ] Critical: verification token 재사용이 거부되는지 확인
- [ ] Critical: 만료된 code/token이 거부되는지 확인
- [ ] Important: 인증번호 오입력 횟수 초과 시 거부되는지 확인
- [ ] Important: 재발송 cooldown과 시간 창 내 최대 발송 횟수가 동작하는지 확인
- [ ] Important: 존재하지 않는 이메일로 비밀번호 재설정 발송 시 계정 존재 여부가 과도하게 노출되지 않는지 확인
- [ ] Optional: IP 기반 rate limit 필요 여부를 검토

## File Upload Tests

- [x] Critical: ROLE_MEMBER로 이미지 업로드 API 호출 시 403인지 확인 - Automated: `ImageControllerSecurityTest`
- [x] Critical: 허용되지 않은 확장자 파일이 거부되는지 확인 - Automated: `S3ImageServiceTest`
- [x] Critical: MIME 타입이 허용 목록에 없으면 거부되는지 확인 - Automated: `S3ImageServiceTest`
- [x] Critical: 확장자와 MIME 타입이 불일치하면 거부되는지 확인 - Automated: `S3ImageServiceTest`
- [x] Critical: 5MB 초과 파일이 거부되는지 확인 - Automated: `S3ImageServiceTest`
- [x] Important: 빈 파일과 확장자가 없는 파일이 거부되는지 확인 - Automated: `S3ImageServiceTest`
- [x] Important: 업로드된 S3 key가 원본 파일명을 사용하지 않고 `products/{uuid}.{extension}`인지 확인 - Automated: `S3ImageServiceTest`; actual object access는 Manual
- [ ] Important: S3 bucket public access/IAM 권한이 최소 권한인지 확인 - Manual Needed
- [ ] Important: staging/prod 업로드 설정과 실제 배포 환경 업로드 동작 확인 - Needs Verification
- [ ] Optional: 파일 내용 magic byte 검사 또는 malware scan 도입 필요 여부를 검토

## CORS/Deployment Tests

- [x] Critical: `CORS_ALLOWED_ORIGINS`가 실제 프론트 도메인만 허용하는지 확인 - Automated: `SecurityConfigCorsTest`; deployed env value는 Manual
- [x] Critical: 허용되지 않은 origin에서 API 호출이 차단되는지 확인 - Automated: `SecurityConfigCorsTest`
- [ ] Critical: Vercel `NEXT_PUBLIC_API_BASE_URL`이 배포 백엔드 URL인지 확인
- [ ] Important: Railway `SPRING_PROFILES_ACTIVE=prod`, `JPA_DDL_AUTO=validate`인지 확인
- [ ] Important: Swagger/OpenAPI가 prod에서 비활성화되어 있는지 확인
- [ ] Important: Flyway migration이 빈 DB와 기존 DB에서 적용 가능한지 확인

## Secret Management Tests

- [x] Critical: `.env`, `.env.local`, `.env.*.local` 파일이 Git에 포함되지 않는지 확인 - Automated command check in P0 security test pass 1
- [x] Critical: DB password, JWT secret, Toss secret key, AWS key, SMTP password, private key가 코드/문서에 없는지 확인 - Automated command check in P0 security test pass 1; placeholder keys allowed
- [ ] Critical: secret 노출이 의심되면 값을 문서에 복사하지 말고 `secret exposure risk`로 기록한 뒤 재발급한다
- [ ] Important: Railway/Vercel 환경변수에 필요한 값이 있고 실제 값은 문서화하지 않았는지 확인
- [ ] Important: `backend/.env.example`, `frontend/.env.example`에는 placeholder만 있는지 확인
- [ ] Optional: Dependabot 또는 secret scanning 설정 가능 여부를 검토
