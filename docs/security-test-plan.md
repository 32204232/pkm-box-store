# Security Test Plan

## Overview

이 문서는 PKM Box Store의 P0 보안 항목을 자동화 테스트로 고정하기 위한 테스트 설계 문서다. 실제 테스트 코드를 작성하기 전에 보안 요구사항, API 경로, 테스트 데이터, 외부 서비스 mock 방식을 정리한다.

테스트 코드는 이 문서를 기준으로 별도 단계에서 작성한다. 이 문서는 체크리스트가 아니라 “어떤 테스트를 어디에 어떤 방식으로 둘지”를 정하는 실행 설계서다.

관련 문서 역할:

- `docs/security-test-checklist.md`: 보안 테스트 항목 체크리스트
- `docs/security-test-plan.md`: 자동화 방식과 대상 설계
- `docs/security-gap-backlog.md`: 부족한 보안 작업과 우선순위 백로그

## Test Scope

이번 계획은 운영 전 반드시 고정해야 하는 P0 보안 자동화 테스트를 중심으로 한다.

포함 범위:

- Admin authorization
- Order ownership
- Address ownership
- Payment integrity
- Product visibility
- Stock validation
- Catalog validation
- Secret scan
- CORS configuration

제외 범위:

- 프론트 UI 테스트
- 실제 Toss 외부 API 호출
- 실제 S3 업로드 호출
- 실제 SMTP 발송
- 부하 테스트
- penetration testing
- 정식 DAST/SAST 도구 도입

## Test Environment

- Backend 테스트는 기존 프로젝트 테스트 설정을 우선 사용한다.
- 권한/Controller 경로 테스트는 기존처럼 `@WebMvcTest` + `MockMvc` + `SecurityConfig` + `JwtAuthenticationFilter` import 방식을 우선한다.
- 도메인 보안 규칙은 기존처럼 Mockito 기반 Service test를 우선한다.
- 전체 Spring context 테스트는 현재 `PkmStoreApplicationTests`에서 H2 in-memory 설정과 `spring.flyway.enabled=false`, `ddl-auto=create-drop`를 사용한다.
- H2/Flyway 문제가 생겨도 production migration 또는 production security 설정을 테스트 편의로 약화하지 않는다.
- Toss, S3, SMTP는 실제 호출하지 않는다. `PaymentClient`, `S3ImageService`, `VerificationEmailSender` 또는 관련 service mock을 사용한다.
- 실제 secret 값은 테스트나 문서에 넣지 않는다. `.env` 내용은 읽거나 복사하지 않는다.
- 테스트 데이터는 각 테스트에서 독립적으로 만들고, 반복이 많으면 private helper method 또는 test fixture를 둔다.

## Priority Rules

- P0: 운영 전 반드시 자동화하거나 최소한 검증해야 하는 항목
- P1: 배포 전 권장하는 보안 회귀 테스트
- P2: 개선 사항 또는 운영 성숙도 향상 항목

이번 문서는 P0 중심으로 작성한다. 단, 현재 코드 구조에서 API 통합 테스트가 바로 어렵거나 운영 환경 확인이 필요한 항목은 `Needs Verification`으로 둔다.

## SEC-TEST-001 Admin API authorization

### Related Requirements

- SR-ADMIN-001

### Related Threats

- TM-ADMIN-001
- TM-ADMIN-002

### Target Code

- Controller: `AdminCatalogController`, `ProductController`
- Service: `CategoryService`, `ProductTypeService`, `SeriesService`, `ProductService`
- Security: `SecurityConfig`
- Existing test candidates: `ProductSecurityTest`, `AdminCatalogControllerSecurityTest`, `AdminDashboardSecurityTest`, `AdminAuditLogControllerSecurityTest`, `ImageControllerSecurityTest`

### Target APIs

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/product-types`
- `POST /api/admin/product-types`
- `GET /api/admin/series`
- `POST /api/admin/series`
- `GET /api/admin/products`
- `POST /api/admin/products`

### Scenario

1. 비로그인 상태로 관리자 API를 호출한다.
2. `ROLE_MEMBER` 사용자로 같은 API를 호출한다.
3. `ROLE_ADMIN` 사용자로 같은 API를 호출한다.

### Expected Result

- Anonymous: 401 또는 현재 Spring Security 정책상 403
- `ROLE_MEMBER`: 403
- `ROLE_ADMIN`: 정상 응답. 조회는 200, 생성은 201

### Suggested Test Type

- MockMvc integration test
- 이유: 실제 URL mapping과 `SecurityConfig`의 `/api/admin/**` 권한 규칙을 함께 검증해야 한다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/catalog/controller/AdminCatalogControllerSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/product/controller/ProductSecurityTest.java`

### Test Data Needed

- `ROLE_MEMBER` mock user
- `ROLE_ADMIN` mock user
- Category/ProductType/Series/Product 응답 DTO mock

### External Dependency Handling

- None

### Status

- Ready

### Notes

- 기존 테스트는 anonymous 응답을 401 또는 403으로 허용한다. 프로젝트 정책 변경 전에는 같은 방식으로 유지한다.
- 관리자 결제/주문 API까지 확대할 경우 별도 SEC case 또는 후속 P1로 분리한다.

## SEC-TEST-002 Order ownership access control

### Related Requirements

- SR-ORDER-001
- SR-ADDRESS-001

### Related Threats

- TM-ORDER-001
- TM-TOSS-001

### Target Code

- Controller: `OrderController`, `PaymentController`
- Service: `OrderService`, `PaymentService`
- Repository: `OrderRepository`, `MemberRepository`, `DeliveryAddressRepository`
- Existing test candidates: `OrderServiceTest`, `PaymentServiceTest`

### Target APIs

- `GET /api/orders/{orderId}`
- `PATCH /api/orders/{orderId}/delivery-address`
- `POST /api/payments/confirm`
- `POST /api/payments/fail`
- `POST /api/payments/cancel`

### Scenario

1. User A와 User B를 준비한다.
2. User A의 주문을 만든다.
3. User B 인증 컨텍스트로 User A의 주문 조회를 시도한다.
4. 배송지 변경, 결제 승인/실패/취소처럼 `orderId`를 받는 API도 같은 방식으로 시도한다.

### Expected Result

- 다른 사용자의 주문은 `ORDER_NOT_FOUND` 또는 정책상 동일한 비노출 거부 응답이어야 한다.
- 응답에 User A 주문 상세나 개인정보가 포함되지 않아야 한다.
- 결제/취소 외부 client는 호출되지 않아야 한다.

### Suggested Test Type

- Service test 우선
- MockMvc integration test 후속
- 이유: 현재 핵심 소유자 검증은 `findByIdAndMember`를 사용하는 Service layer에 있고, 기존 프로젝트 테스트도 이 스타일을 사용한다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/order/service/OrderServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/payment/service/PaymentServiceTest.java`
- 후속 통합 후보: `backend/src/test/java/com/pkm/store/domain/order/controller/OrderSecurityTest.java`

### Test Data Needed

- User A / User B
- User A의 Order
- 필요 시 DeliveryAddress
- Payment confirm/fail/cancel request

### External Dependency Handling

- Toss mock 필요: `PaymentClient` 또는 `PaymentClientResolver`
- S3 mock: None
- SMTP mock: None

### Status

- Ready

### Notes

- API 통합 테스트로 확장하려면 인증 helper 또는 JWT test utility가 필요하다. 현재는 `SecurityContextHolder` 기반 service test가 가장 가볍다.

## SEC-TEST-003 Address ownership access control

### Related Requirements

- SR-ADDRESS-001

### Related Threats

- TM-ORDER-001

### Target Code

- Controller: `DeliveryAddressController`
- Service: `DeliveryAddressService`, `OrderService`
- Repository: `DeliveryAddressRepository`, `MemberRepository`
- Existing test candidates: `DeliveryAddressServiceTest`, `OrderServiceTest`

### Target APIs

- `GET /api/me/addresses`
- `PATCH /api/me/addresses/{addressId}`
- `DELETE /api/me/addresses/{addressId}`
- `PATCH /api/me/addresses/{addressId}/default`
- `POST /api/orders` with `deliveryAddressId`
- `PATCH /api/orders/{orderId}/delivery-address` with `deliveryAddressId`

### Scenario

1. User A와 User B를 준비한다.
2. User A의 배송지를 만든다.
3. User B 인증 컨텍스트로 User A의 `addressId` 수정/삭제/기본 배송지 설정을 시도한다.
4. User B가 User A의 `addressId`를 주문 생성 또는 주문 배송지 변경에 사용한다.

### Expected Result

- `ADDRESS_NOT_FOUND` 또는 정책상 동일한 비노출 거부 응답이어야 한다.
- 다른 사용자의 배송지가 수정, 삭제, 기본 배송지로 설정, 주문 배송지로 사용되지 않아야 한다.

### Suggested Test Type

- Service test 우선
- 이유: 소유자 검증이 `DeliveryAddressRepository.findByIdAndMember`와 `OrderService`의 배송지 조회에 있다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/deliveryaddress/service/DeliveryAddressServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/order/service/OrderServiceTest.java`

### Test Data Needed

- User A / User B
- User A의 DeliveryAddress
- User B의 Order 또는 CartItem

### External Dependency Handling

- None

### Status

- Ready

### Notes

- 실제 패키지명은 `domain/address`가 아니라 `domain/deliveryaddress`다.

## SEC-TEST-004 Payment amount tampering prevention

### Related Requirements

- SR-PAY-001

### Related Threats

- TM-PAY-001
- TM-TOSS-001

### Target Code

- Controller: `PaymentController`
- Service: `PaymentService`
- Repository: `OrderRepository`, `PaymentRepository`
- Client: `PaymentClient`, `PaymentClientResolver`, `TossPaymentClient`
- Existing test candidates: `PaymentServiceTest`

### Target APIs

- `POST /api/payments/confirm`

### Scenario

1. 서버 기준 totalPrice가 있는 `PAYMENT_PENDING` 주문을 준비한다.
2. `PaymentConfirmRequest.amount`를 주문 금액보다 낮거나 높은 값으로 조작한다.
3. 결제 승인을 요청한다.

### Expected Result

- `PAYMENT_AMOUNT_MISMATCH`가 발생해야 한다.
- `PaymentClient.approve`는 호출되지 않아야 한다.
- 주문 상태는 `PAYMENT_PENDING`으로 유지되어야 한다.
- 결제와 재고 확정 이력은 생성되지 않아야 한다.

### Suggested Test Type

- Service test
- 이유: 외부 Toss 호출 전에 서버 금액 검증이 이루어지는지 확인하는 테스트이므로 mock 기반 service test가 가장 직접적이다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/payment/service/PaymentServiceTest.java`

### Test Data Needed

- Member
- Product
- Order with totalPrice
- PaymentConfirmRequest with tampered amount

### External Dependency Handling

- Toss mock 필요. amount mismatch에서는 mock이 호출되지 않는지도 검증한다.

### Status

- Ready

### Notes

- API spec 기준 `orderId`는 내부 주문 ID, `providerOrderId`는 Toss redirect의 `orderId`이며 내부 `orderUid`와 같아야 한다.

## SEC-TEST-005 Toss payment identifier tampering prevention

### Related Requirements

- SR-PAY-002
- SR-ORDER-001

### Related Threats

- TM-TOSS-001
- TM-PAY-001
- TM-ORDER-001

### Target Code

- Controller: `PaymentController`
- Service: `PaymentService`
- Entity: `Payment`, `Order`
- Repository: `PaymentRepository`, `OrderRepository`
- Existing test candidates: `PaymentServiceTest`

### Target APIs

- `POST /api/payments/confirm`
- `POST /api/payments/cancel`
- `POST /api/admin/payments/cancel`는 관리자 권한 테스트와 결합 가능

### Scenario

1. Order A와 Order B를 준비한다.
2. Order A의 내부 `orderId`에 Order B의 `providerOrderId`를 섞어 결제 승인을 요청한다.
3. 이미 승인된 주문에 다른 `paymentKey` 또는 다른 `providerOrderId`를 넣어 재승인을 시도한다.
4. 다른 사용자의 `orderId`로 결제 승인/실패/취소를 시도한다.

### Expected Result

- provider order id 불일치는 `PAYMENT_ORDER_MISMATCH`여야 한다.
- 이미 승인된 주문에 다른 식별자가 들어오면 `PAYMENT_ALREADY_APPROVED` 또는 기존 정책상 거부 응답이어야 한다.
- 다른 사용자의 주문은 `ORDER_NOT_FOUND`로 비노출 처리되어야 한다.
- 외부 Toss client는 부정 요청에서 호출되지 않아야 한다.

### Suggested Test Type

- Service test
- 이유: identifier 검증과 멱등성 처리가 `PaymentService`에 집중되어 있고, Toss client를 mock해야 한다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/payment/service/PaymentServiceTest.java`

### Test Data Needed

- Member
- Order A / Order B
- Approved Payment
- PaymentConfirmRequest

### External Dependency Handling

- Toss mock 필요
- S3/SMTP mock: None

### Status

- Ready

### Notes

- `paymentKey`는 실제 provider 값이 아니어도 된다. 테스트용 placeholder 문자열만 사용한다.

## SEC-TEST-006 Hidden product purchase prevention

### Related Requirements

- SR-PRODUCT-001

### Related Threats

- TM-PRODUCT-001

### Target Code

- Controller: `CartController`, `OrderController`, `ProductController`
- Service: `CartService`, `OrderService`, `ProductService`
- Entity: `Product`
- Repository: `ProductRepository`, `CartItemRepository`
- Existing test candidates: `CartServiceTest`, `OrderServiceTest`, `ProductServiceTest`

### Target APIs

- `POST /api/cart/items`
- `POST /api/orders`
- `GET /api/products`
- `GET /api/products/{id}`

### Scenario

1. `status=HIDDEN` 상품을 준비한다.
2. 일반 상품 목록/상세 직접 조회에서 숨김 상품이 노출되지 않는지 확인한다.
3. 숨김 상품을 장바구니에 담으려 한다.
4. 숨김 상품이 장바구니에 들어간 상태 또는 주문 직전 상태 변경 상황에서 주문 생성을 시도한다.

### Expected Result

- 일반 상품 조회는 HIDDEN을 제외하거나 `PRODUCT_NOT_FOUND`로 처리해야 한다.
- 장바구니/주문 생성은 `PRODUCT_NOT_PURCHASABLE`이어야 한다.
- CartItem, Order, InventoryHistory가 새로 생성되지 않아야 한다.

### Suggested Test Type

- Service test 우선
- Product 조회는 Service 또는 Repository test
- 이유: 구매 가능 여부는 `Product.validatePurchasable`과 Cart/Order service에서 결정된다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/cart/service/CartServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/order/service/OrderServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/product/service/ProductServiceTest.java`

### Test Data Needed

- Member
- HIDDEN Product
- CartItem
- OrderCreateRequest

### External Dependency Handling

- None

### Status

- Ready

### Notes

- API 통합 테스트보다 service test가 먼저 적합하다. 추후 MockMvc로 `POST /api/cart/items`도 고정할 수 있다.

## SEC-TEST-007 Stock shortage prevention

### Related Requirements

- SR-STOCK-001
- SR-STOCK-002

### Related Threats

- TM-STOCK-001

### Target Code

- Controller: `CartController`, `OrderController`
- Service: `CartService`, `OrderService`, `InventoryService`
- Repository: `ProductRepository`, `CartItemRepository`, `InventoryHistoryRepository`
- Entity: `Product`, `Order`, `InventoryHistory`
- Existing test candidates: `CartServiceTest`, `OrderServiceTest`

### Target APIs

- `POST /api/cart/items`
- `PATCH /api/cart/items/{cartItemId}`
- `POST /api/orders`

### Scenario

1. `stockQuantity=0` 상품을 준비하고 장바구니 담기를 시도한다.
2. 재고 1개 상품에 수량 2개를 장바구니 담기 또는 주문 생성으로 시도한다.
3. 주문 생성 직전 locked product 재고가 부족한 상황을 만든다.
4. 가능한 경우 동시 주문 시나리오로 재고 음수 여부를 확인한다.

### Expected Result

- `OUT_OF_STOCK`이 발생해야 한다.
- CartItem, Order, InventoryHistory가 부정 생성되지 않아야 한다.
- Product stockQuantity가 음수가 되면 안 된다.

### Suggested Test Type

- Service test 우선
- 동시성은 Repository 또는 Spring integration test
- 이유: 일반 재고 검증은 service test로 충분하지만 pessimistic lock과 동시성은 DB 동작 확인이 필요하다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/cart/service/CartServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/order/service/OrderServiceTest.java`
- 후속 후보: `backend/src/test/java/com/pkm/store/domain/order/repository/OrderStockConcurrencyTest.java`

### Test Data Needed

- Member
- Product with stock 0
- Product with stock 1
- CartItem quantity 2
- OrderCreateRequest

### External Dependency Handling

- None

### Status

- Needs Verification

### Notes

- 단일 요청 재고 부족 테스트는 Ready다.
- 동시 주문 초과 판매 방지는 H2/MySQL/TiDB lock 차이를 고려해야 하므로 별도 통합 테스트 설계가 필요하다.

## SEC-TEST-008 Catalog consistency validation

### Related Requirements

- SR-CATALOG-002

### Related Threats

- TM-CATALOG-001

### Target Code

- Controller: `ProductController`
- Service: `ProductService`, `CatalogValidationService`
- Repository: `CategoryRepository`, `ProductTypeRepository`, `ProductRepository`
- Existing test candidates: `ProductServiceTest`, `CatalogMasterSecurityTest`

### Target APIs

- `POST /api/admin/products`
- `PATCH /api/admin/products/{id}`

### Scenario

1. Category A와 Category B를 준비한다.
2. ProductType은 Category A에 속하도록 준비한다.
3. 상품 생성 또는 수정 요청에서 Category B + Category A의 ProductType 조합을 보낸다.

### Expected Result

- `PRODUCT_TYPE_CATEGORY_MISMATCH`가 발생해야 한다.
- 상품 저장 또는 수정이 반영되지 않아야 한다.
- audit log가 부정 저장되지 않아야 한다.

### Suggested Test Type

- Service test
- 이유: 실제 검증 로직은 `CatalogValidationService.resolveCategoryForProduct`와 `ProductService`에 있다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/product/service/ProductServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/catalog/service/CatalogMasterSecurityTest.java`

### Test Data Needed

- Category A
- Category B
- ProductType in Category A
- ProductCreateRequest/ProductUpdateRequest

### External Dependency Handling

- None

### Status

- Ready

### Notes

- TiDB/MySQL FK 강제보다 애플리케이션 검증이 1차 제어다.

## SEC-TEST-009 Catalog slug duplication validation

### Related Requirements

- SR-CATALOG-001

### Related Threats

- TM-CATALOG-002

### Target Code

- Controller: `AdminCatalogController`
- Service: `CategoryService`, `ProductTypeService`, `SeriesService`
- Repository: `CategoryRepository`, `ProductTypeRepository`, `SeriesRepository`
- Existing test candidates: `CatalogMasterSecurityTest`

### Target APIs

- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{id}`
- `POST /api/admin/product-types`
- `PATCH /api/admin/product-types/{id}`
- `POST /api/admin/series`
- `PATCH /api/admin/series/{id}`

### Scenario

1. 이미 존재하는 Category slug로 새 Category 생성을 시도한다.
2. 같은 Category 안에서 이미 존재하는 ProductType slug로 새 ProductType 생성을 시도한다.
3. 이미 존재하는 Series slug로 새 Series 생성을 시도한다.
4. 대소문자/공백 normalize가 적용되는지 확인한다.

### Expected Result

- Category: `DUPLICATE_CATEGORY_SLUG`
- ProductType: `DUPLICATE_PRODUCT_TYPE_SLUG`
- Series: `DUPLICATE_SERIES_SLUG`
- 중복 데이터가 저장되지 않아야 한다.

### Suggested Test Type

- Service test 우선
- MockMvc validation test 후속
- 이유: 중복 검증은 service/repository exists query 기반이다. slug pattern 검증은 DTO validation이라 MockMvc가 적합하다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/catalog/service/CatalogMasterSecurityTest.java`
- 후속 후보: `backend/src/test/java/com/pkm/store/domain/catalog/controller/AdminCatalogControllerValidationTest.java`

### Test Data Needed

- Category
- ProductType
- Series
- 중복 slug request

### External Dependency Handling

- None

### Status

- Ready

### Notes

- 잘못된 slug 형식 validation은 `@Pattern` 기반이므로 별도 MockMvc test로 분리하는 편이 좋다.

## SEC-TEST-010 Inactive category product type creation prevention

### Related Requirements

- SR-CATALOG-001
- SR-CATALOG-002

### Related Threats

- TM-CATALOG-001
- TM-CATALOG-002

### Target Code

- Controller: `AdminCatalogController`
- Service: `ProductTypeService`
- Repository: `CategoryRepository`, `ProductTypeRepository`
- Existing test candidates: `CatalogMasterSecurityTest`

### Target APIs

- `POST /api/admin/product-types`
- `PATCH /api/admin/product-types/{id}`

### Scenario

1. `active=false` Category를 준비한다.
2. 해당 Category ID로 ProductType 생성을 시도한다.
3. 기존 ProductType을 inactive Category로 이동하는 수정 요청을 시도한다.

### Expected Result

- `INVALID_CATALOG_REQUEST`가 발생해야 한다.
- ProductType이 생성되거나 수정되지 않아야 한다.

### Suggested Test Type

- Service test
- 이유: inactive Category 정책은 `ProductTypeService.resolveActiveCategory`에 있다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/catalog/service/CatalogMasterSecurityTest.java`

### Test Data Needed

- inactive Category
- existing ProductType for update case
- ProductTypeCreateRequest/ProductTypeUpdateRequest

### External Dependency Handling

- None

### Status

- Ready

### Notes

- 상품이 이미 참조 중인 master data를 inactive로 바꾸는 정책은 별도 운영 정책으로 다룬다.

## SEC-TEST-011 Secret exposure basic scan

### Related Requirements

- SR-SECRET-001

### Related Threats

- TM-SECRET-001

### Target Code

- `.gitignore`
- `backend/src/main/resources/application*.yml`
- documentation files
- Git tracked files

### Target APIs

- None

### Scenario

1. `git status`로 커밋 대상 파일을 확인한다.
2. `git ls-files`로 tracked `.env` 계열 파일 여부를 확인한다.
3. `git grep`으로 secret 관련 key name과 private key marker를 찾는다.
4. 매칭된 파일은 placeholder인지 확인하되 실제 secret 값은 출력하거나 문서화하지 않는다.

### Expected Result

- 실제 `.env`, `.env.local`, `.env.*.local` 파일은 Git tracked 대상이 아니어야 한다.
- 실제 DB password, JWT secret, Toss secret key, AWS secret, SMTP password, private key가 코드/문서에 없어야 한다.
- `.env.example`, 설정 파일의 환경변수 placeholder는 허용한다.

### Suggested Test Type

- Command-based check
- 필요하면 script test
- 이유: repo 파일 상태 검증은 애플리케이션 단위 테스트보다 Git 명령 기반 점검이 적합하다.

### Suggested Test File

- Needs Verification: Gradle test로 묶을지, 수동 command checklist로 둘지 결정 필요
- 후보: `backend/src/test/java/com/pkm/store/security/SecretExposureScanTest.java`
- 후보: repo script `scripts/security-secret-scan.ps1`

### Test Data Needed

- None

### External Dependency Handling

- None

### Status

- Needs Verification

### Notes

- `.env` 내용은 읽지 않는다.
- grep 결과를 보고할 때 실제 값은 복사하지 않는다.
- 자동화 시 false positive를 줄이기 위해 placeholder allowlist가 필요하다.

## SEC-TEST-012 CORS allowed origin verification

### Related Requirements

- SR-CORS-001

### Related Threats

- TM-CORS-001

### Target Code

- Security: `SecurityConfig`
- Config: `application.yml`, `application-local.yml`, `application-prod.yml`
- Existing test candidates: `SecurityConfigCorsTest`

### Target APIs

- `OPTIONS /api/products`
- 필요 시 보호 API preflight: `OPTIONS /api/cart`

### Scenario

1. 허용 origin으로 preflight 요청을 보낸다.
2. 미허용 origin으로 preflight 요청을 보낸다.
3. 쉼표로 구분된 여러 origin 값이 trim되어 적용되는지 확인한다.
4. staging/prod 배포 환경의 `CORS_ALLOWED_ORIGINS` 값을 별도 운영 점검으로 확인한다.

### Expected Result

- 허용 origin은 `Access-Control-Allow-Origin` 응답 헤더가 내려온다.
- 미허용 origin은 CORS 허용 헤더가 없어야 한다.
- prod 기본값은 실제 frontend origin만 가리켜야 한다.

### Suggested Test Type

- MockMvc integration test
- 이유: `SecurityConfig.corsConfigurationSource`와 Spring Security CORS 처리 결과를 함께 확인할 수 있다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/global/security/SecurityConfigCorsTest.java`

### Test Data Needed

- 허용 origin 문자열
- 미허용 origin 문자열

### External Dependency Handling

- None

### Status

- Needs Verification

### Notes

- 로컬 설정 테스트는 Ready다.
- staging/prod 실제 환경변수 값은 코드 테스트로 확인할 수 없으므로 운영 점검이 필요하다.

## SEC-TEST-013 Password hash storage verification

### Related Requirements

- SR-AUTH-001

### Related Threats

- 비밀번호 평문 저장
- TM-SECRET-001과 간접 관련

### Target Code

- Controller: `MemberController`
- Service: `MemberService`
- Entity: `Member`
- Repository: `MemberRepository`
- Security: `SecurityConfig.passwordEncoder`
- Existing test candidates: `MemberServiceTest`

### Target APIs

- `POST /api/members/signup`
- `PATCH /api/members/me/password`
- `POST /api/members/password-reset`

### Scenario

1. 회원가입 요청을 준비한다.
2. `EmailVerificationService.consumeVerificationToken`은 성공하도록 mock 처리한다.
3. 저장되는 Member password가 원문 비밀번호와 다른지 확인한다.
4. 가능하면 BCrypt prefix 또는 `PasswordEncoder.matches`로 원문과 해시 매칭을 확인한다.

### Expected Result

- DB 또는 saved entity의 password는 원문 비밀번호와 달라야 한다.
- BCrypt 등 password encoder로 검증 가능한 hash여야 한다.

### Suggested Test Type

- Service test 우선
- Spring integration test 후속
- 이유: 현재 `MemberServiceTest`는 `PasswordEncoder.encode` 호출을 검증하지만 실제 BCrypt 저장값 검증은 integration에 가깝다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/member/service/MemberServiceTest.java`
- 후속 후보: `backend/src/test/java/com/pkm/store/domain/member/MemberSignupSecurityTest.java`

### Test Data Needed

- MemberSignupRequest
- Signup verification token placeholder
- PasswordEncoder
- MemberRepository save answer

### External Dependency Handling

- SMTP mock 필요 없음. 회원가입 service test에서는 verification token consume만 mock한다.

### Status

- Needs Verification

### Notes

- 실제 BCrypt encoder를 사용하는 통합 테스트를 만들지, service mock 검증으로 충분히 볼지 결정이 필요하다.

## SEC-TEST-014 Email verification and password reset token safety

### Related Requirements

- SR-EMAIL-001

### Related Threats

- TM-EMAIL-001
- TM-PWRESET-001

### Target Code

- Controller: `MemberController`
- Service: `EmailVerificationService`, `MemberService`
- Entity: `EmailVerification`
- Repository: `EmailVerificationRepository`, `MemberRepository`
- Mail: `VerificationEmailSender`
- Existing test candidates: `EmailVerificationServiceTest`, `MemberServiceTest`

### Target APIs

- `POST /api/members/email-verifications/send`
- `POST /api/members/email-verifications/verify`
- `POST /api/members/signup`
- `POST /api/members/password-reset`

### Scenario

1. 인증 코드 만료 상태에서 verify를 시도한다.
2. verification token을 한 번 사용한 뒤 재사용을 시도한다.
3. `SIGNUP` token을 password reset에 사용하거나 `PASSWORD_RESET` token을 signup에 사용한다.
4. 실패 횟수 초과와 resend cooldown도 유지되는지 확인한다.

### Expected Result

- 만료 code/token은 각각 만료 오류로 거부된다.
- 사용된 token은 재사용 불가여야 한다.
- purpose mismatch는 invalid token으로 거부되어야 한다.
- 실제 SMTP 발송은 mock 처리되어야 한다.

### Suggested Test Type

- Service test
- 이유: TTL, usedAt, purpose 검증은 `EmailVerificationService` 도메인 로직에 있고, 외부 SMTP는 mock해야 한다.

### Suggested Test File

- `backend/src/test/java/com/pkm/store/domain/member/service/EmailVerificationServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/member/service/MemberServiceTest.java`

### Test Data Needed

- EmailVerification for SIGNUP
- EmailVerification for PASSWORD_RESET
- expired code/token
- used token
- Member

### External Dependency Handling

- SMTP mock 필요: `VerificationEmailSender`
- Toss/S3 mock: None

### Status

- Ready

### Notes

- IP 기반 rate limit은 현재 구현 범위 밖이므로 이 테스트 계획에서는 다루지 않는다.

## Test Data Strategy

테스트 데이터는 테스트마다 독립적으로 생성한다. 공통 helper를 만들 때도 데이터 공유로 테스트 순서 의존성이 생기지 않게 한다.

필요 데이터:

- 테스트용 `ROLE_MEMBER`: 일반 보호 API와 사용자 소유 리소스 테스트
- 테스트용 `ROLE_ADMIN`: `/api/admin/**` 접근 허용 테스트
- User A / User B: 주문, 배송지, 결제 소유자 검증
- Product: 일반 판매 상품
- Hidden Product: `ProductStatus.HIDDEN`
- Stock shortage Product: `stockQuantity=0`, 또는 stock 1 + quantity 2
- Category/ProductType/Series: catalog 관계와 slug 중복 검증
- Order: `PAYMENT_PENDING`, `PAID`, `CANCELED` 상태별 테스트
- Address: User A 소유와 User B 소유를 구분
- Payment: approved/canceled 상태와 paymentKey/providerOrderId 조합
- EmailVerification: SIGNUP/PASSWORD_RESET purpose, expired/used 상태

작성 원칙:

- MockMvc 권한 테스트는 service를 `@MockBean`으로 둔다.
- Service test는 entity factory method와 `ReflectionTestUtils`를 필요한 범위에서 사용한다.
- 외부 API 호출이 필요한 데이터는 mock 응답으로 대체한다.
- 실제 Toss/S3/SMTP credential 또는 실제 secret 값은 사용하지 않는다.
- 기존 테스트 helper 패턴이 있으면 해당 파일 안의 private helper method를 재사용하거나 확장한다.

## Mocking Strategy

Toss Payments:

- `PaymentClientResolver`와 `PaymentClient`를 mock한다.
- amount/providerOrderId 검증 실패 케이스에서는 `PaymentClient.approve`가 호출되지 않는지 확인한다.
- 승인 성공/취소 성공 케이스는 `PaymentApproveResponse`, `PaymentCancelResponse` test object를 반환한다.

AWS S3:

- Controller 권한 테스트는 `S3ImageService`를 mock한다.
- S3 service 단위 테스트는 실제 AWS 호출이 없는 fake/mock client를 사용한다.
- 실제 bucket, access key, secret key는 사용하지 않는다.

SMTP/Mail:

- `VerificationEmailSender`를 mock한다.
- `MAIL_MODE=LOG`도 실제 이메일 발송은 하지 않지만, 자동화 테스트에서는 sender mock이 더 명확하다.

JWT/Auth:

- Controller 권한 테스트는 `SecurityMockMvcRequestPostProcessors.user()`를 우선 사용한다.
- JWT filter 의존성은 기존처럼 `JwtTokenProvider`, `CustomUserDetailsService`를 `@MockBean`으로 둔다.
- 실제 JWT 발급/검증 통합 테스트는 별도 후속 항목으로 분리한다.

## Suggested Test File Structure

기존 구조에 맞춘 권장 위치:

- `backend/src/test/java/com/pkm/store/domain/product/controller/ProductSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/catalog/controller/AdminCatalogControllerSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/catalog/service/CatalogMasterSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/cart/service/CartServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/order/service/OrderServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/deliveryaddress/service/DeliveryAddressServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/payment/service/PaymentServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/member/service/MemberServiceTest.java`
- `backend/src/test/java/com/pkm/store/domain/member/service/EmailVerificationServiceTest.java`
- `backend/src/test/java/com/pkm/store/global/security/SecurityConfigCorsTest.java`

후속 통합 테스트 후보:

- `backend/src/test/java/com/pkm/store/domain/order/controller/OrderSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/deliveryaddress/controller/DeliveryAddressControllerSecurityTest.java`
- `backend/src/test/java/com/pkm/store/domain/payment/controller/PaymentControllerSecurityTest.java`
- `backend/src/test/java/com/pkm/store/security/SecretExposureScanTest.java`

## Execution Plan

1. Admin API authorization: 외부 의존성이 없고 SecurityConfig 회귀를 빠르게 고정할 수 있다.
2. Catalog validation: 데이터 오염 방지이며 service/repository mock으로 안정적으로 작성 가능하다.
3. Product hidden/stock validation: 구매 차단과 재고 보호가 결제 전 단계의 핵심 방어선이다.
4. Order ownership: 개인정보와 주문 데이터 노출 방지를 먼저 고정한다.
5. Address ownership: 주문 배송지 악용과 개인정보 변경을 함께 막는다.
6. Payment tampering: Toss mock이 필요하므로 주문/상품 fixture가 준비된 뒤 작성한다.
7. Secret scan: 코드 테스트와 별개로 커밋 전 점검 루틴을 고정한다.
8. CORS: 로컬/설정 기반 테스트를 먼저 자동화하고, staging/prod는 운영 점검으로 남긴다.
9. Email/password reset: 계정 보안 회귀로 중요하지만 P0 결제/소유자 테스트 이후에 보강한다.

## Commands

Backend 전체 테스트:

```powershell
cd backend
.\gradlew.bat test --no-daemon
```

특정 테스트만 실행하는 예시:

```powershell
cd backend
.\gradlew.bat test --tests "*AdminAuthorizationTest" --no-daemon
```

현재 구조에 맞춘 특정 테스트 예시:

```powershell
cd backend
.\gradlew.bat test --tests "*ProductSecurityTest" --no-daemon
.\gradlew.bat test --tests "*PaymentServiceTest" --no-daemon
```

Secret scan 참고 명령:

```powershell
git status
git ls-files
git grep -n "DB_PASSWORD\|JWT_SECRET\|TOSS_PAYMENTS_SECRET_KEY\|AWS_SECRET\|SMTP_PASSWORD" -- .
```

주의:

- 실제 `.env` 내용 출력 금지
- `npm audit fix` 금지
- 의존성 버전 변경 금지
- secret 의심 값은 문서에 복사하지 말고 `secret exposure risk`로만 기록

## Documentation Update Rules

테스트 작성 후 다음 문서를 업데이트한다.

- `docs/security-test-checklist.md`
- `docs/security-gap-backlog.md`
- `docs/security-requirements.md`
- `docs/project-status.md`

업데이트 규칙:

- 테스트가 자동화되면 checklist에 `Automated`와 테스트 파일명을 표시한다.
- 실패하거나 보류된 항목은 `Needs Verification`으로 유지한다.
- 실제 취약점이 발견되면 gap backlog에 P0로 유지하고 발견 내용을 값 없이 요약한다.
- service test만 추가한 항목을 full integration까지 완료된 것처럼 과장하지 않는다.
- 운영 환경 확인이 필요한 secret/CORS 항목은 코드 테스트와 운영 점검을 분리해 기록한다.

## Out of Scope

이번 테스트 계획에서 제외한다.

- 실제 침투 테스트
- 부하 테스트
- 정식 SAST/DAST 도구 도입
- 정식 CycloneDX/SPDX SBOM 생성
- 프론트 E2E 테스트
- 실제 Toss/S3/SMTP 연동 테스트
- 운영 secret 값 확인 또는 문서화
- `.env` 파일 내용 읽기 또는 복사
