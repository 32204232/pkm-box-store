# Security Gap Backlog

`docs/security-requirements.md`와 `docs/threat-model.md` 기준의 보안 갭 백로그다. 이번 문서화 단계에서는 기능을 고치지 않고, 다음 작업 우선순위를 정리한다.
P0 보안 자동화 테스트를 작성할 때는 `docs/security-test-plan.md`의 테스트 설계를 기준으로 범위와 상태를 업데이트한다.

| Priority | Task | Reason | Related Requirement | Suggested Test |
| --- | --- | --- | --- | --- |
| Done | 관리자 API ROLE_ADMIN 접근 테스트를 주요 endpoint 전체로 확대 | 관리자 API 오용은 상품/주문/환불 피해로 이어진다. | SR-ADMIN-001, TM-ADMIN-001 | Automated: `ProductSecurityTest`, `AdminCatalogControllerSecurityTest`; remaining admin payment/order endpoint coverage는 후속 확대 |
| Done | 다른 사용자 주문 접근 차단 통합 테스트 추가 | 단위 근거는 있으나 실제 토큰/사용자 간 접근 차단 회귀가 중요하다. | SR-ORDER-001, TM-ORDER-001 | Automated: `OrderServiceTest`, `PaymentServiceTest`; full MockMvc/JWT 통합 시나리오는 후속 확대 |
| Done | 다른 사용자 배송지 접근 차단 통합 테스트 추가 | 배송지는 개인정보이며 주문 배송지로 악용될 수 있다. | SR-ADDRESS-001, TM-ORDER-001 | Automated: `DeliveryAddressServiceTest`, `OrderServiceTest` |
| Done | 주문/결제 금액 조작 방지 테스트 고정 | 결제 금액 조작은 직접적인 금전 피해로 이어진다. | SR-PAY-001, TM-PAY-001, TM-TOSS-001 | Automated: `PaymentServiceTest`에서 조작 amount 거부와 외부 client 미호출 확인 |
| Done | Toss `paymentKey`/`providerOrderId` 조작 테스트 고정 | 다른 주문 결제 승인 또는 중복 승인 방지가 핵심이다. | SR-PAY-002, TM-TOSS-001 | Automated: `PaymentServiceTest`에서 provider order id 불일치, 다른 paymentKey, 중복 승인 요청 확인 |
| Done | secret 노출 여부 정기 점검 | DB/JWT/Toss/AWS/SMTP secret 노출은 즉시 재발급 이슈다. | SR-SECRET-001, TM-SECRET-001 | `git status`, `git diff --stat`, tracked `.env`, secret keyword grep으로 1차 점검 |
| Needs Verification | 운영/스테이징에서 로컬 개발용 secret 기본값이 사용되지 않는지 확인 | 로컬 기본 JWT secret 같은 값이 운영에 쓰이면 토큰 위조 위험이 커진다. | SR-SECRET-001, TM-SECRET-001 | 배포 플랫폼 환경변수 값 확인이 필요하며 실제 secret 값은 문서화하지 않는다 |
| P0 | S3 이미지 업로드 제한과 bucket 권한 확인 | 악성 파일/과도한 공개 권한은 운영 위험이 크다. | SR-FILE-001, TM-FILE-001, TM-S3-001 | 비이미지/초과 파일 거부, IAM/bucket public access 점검 |
| P0 | CORS allowed origin 운영 값 검증 | CORS 오설정은 브라우저 기반 API 접근 범위를 넓힌다. | SR-CORS-001, TM-CORS-001 | 허용되지 않은 origin preflight 차단 확인 |
| Done | 숨김 상품 주문 방지 회귀 테스트 유지 | 판매 중지 상품 직접 구매를 막아야 한다. | SR-PRODUCT-001, TM-PRODUCT-001 | Automated: `CartServiceTest`, `OrderServiceTest` |
| P1 | 재고 부족 주문 방지와 동시성 테스트 보강 | 초과 판매와 재고 음수 방지가 필요하다. | SR-STOCK-001, SR-STOCK-002, TM-STOCK-001 | Automated: stock 0/부족 재고 `CartServiceTest`, locked product 재검증 `OrderServiceTest`; 동시 주문 통합 테스트는 Needs Verification |
| P1 | 이메일 인증/비밀번호 재설정 토큰 만료/재사용 테스트 보강 | 계정 탈취 방지에 직접 연결된다. | SR-EMAIL-001, TM-EMAIL-001, TM-PWRESET-001 | 만료 token, used token, purpose mismatch 검증 |
| P1 | 로그인 실패/비밀번호 재설정 응답의 계정 존재 노출 점검 | 사용자 열거 가능성을 줄인다. | SR-AUTH-002, SR-ERROR-001 | 존재/미존재 이메일 요청 응답 비교 |
| P1 | 예상 외 예외 응답의 stack trace/secret 노출 확인 | Global handler 외 예외의 응답 노출 여부를 확인해야 한다. | SR-ERROR-001, TM-ERROR-001 | 일부 강제 오류 상황에서 응답 body/log 점검 |
| Done | Catalog slug normalize/중복 테스트 보강 | catalog master data 오염을 막는다. | SR-CATALOG-001, TM-CATALOG-002 | Automated: 중복 slug 및 inactive Category 거부 `CatalogMasterSecurityTest`; validation error API 테스트는 후속 |
| Done | ProductType-Category 불일치 테스트 보강 | 잘못된 상품 분류 연결을 막는다. | SR-CATALOG-002, TM-CATALOG-001 | Automated: `CatalogMasterSecurityTest`, `ProductServiceTest` |
| P1 | DB migration 배포 전 빈 DB/기존 DB 검증 루틴화 | Flyway 누락은 Railway 배포 실패로 이어진다. | SR-DB-001, TM-DB-001 | 빈 DB migration 후 `ddl-auto=validate` 확인 |
| P2 | Dependabot 설정 검토 | dependency 취약점 알림을 자동화한다. | SR-SECRET-001, SBOM-lite | npm/gradle ecosystem 알림 PR 확인 |
| P2 | 정식 CycloneDX SBOM 도입 검토 | 운영/감사 수준의 dependency 산출물이 필요할 때 사용한다. | SBOM-lite | CycloneDX Gradle/npm 생성 결과 검토 |
| P2 | 관리자 audit log 범위 확대 | 현재 상품/주문/결제 중심이며 catalog/admin 계정 이벤트는 제한적이다. | SR-LOG-001, TM-ADMIN-002 | catalog 변경, 관리자 권한 변경, 로그인 실패 기록 검토 |
| P2 | Rate limit 도입 검토 | 이메일 인증, 로그인, 비밀번호 재설정 남용을 줄인다. | SR-EMAIL-001, TM-EMAIL-001 | 같은 IP/이메일 반복 요청 제한 정책 검토 |
| P2 | JWT 저장 방식과 XSS 방어 검토 | localStorage 토큰은 XSS 시 탈취 위험이 있다. | SR-JWT-002, TM-JWT-001 | CSP, 입력 렌더링, httpOnly cookie 전환 가능성 검토 |
| P2 | S3 파일 내용 검사 또는 malware scan 검토 | 확장자/MIME 검증만으로는 모든 악성 파일을 막기 어렵다. | SR-FILE-001, TM-FILE-001 | magic byte 검사, 이미지 재인코딩, scan workflow 비교 |
