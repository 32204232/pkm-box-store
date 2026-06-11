# Threat Model

이 문서는 PKM Box Store의 1차 lightweight threat model이다. 목적은 모든 공격을 완벽히 모델링하는 것이 아니라, 회원/관리자/상품/주문/결제/배송지/이미지 업로드/배포 환경에서 우선 확인할 위협을 정리하는 것이다.

## 보호해야 할 자산

- 회원 계정
- 비밀번호 해시
- JWT
- 관리자 권한
- 상품 데이터
- Category/ProductType/Series catalog master data
- 장바구니와 주문 데이터
- 배송지와 수령자 연락처
- 결제 정보와 결제 상태
- 재고와 재고 이력
- 이미지 업로드 파일과 S3 object
- DB credentials, JWT secret, Toss keys, AWS keys, SMTP password

## 신뢰 경계

- Browser ↔ Frontend
- Frontend ↔ Backend API
- Backend ↔ DB
- Backend ↔ Toss Payments
- Backend ↔ S3
- Admin user ↔ Admin API
- Railway/Vercel/TiDB/S3/Toss/SMTP 환경변수 저장소 ↔ 애플리케이션

## 주요 위협 시나리오

| ID | Threat | Target | Impact | Existing Control | Gap | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| TM-ADMIN-001 | 일반 사용자가 관리자 API 호출 | Admin API, 상품/주문/결제 운영 | 상품 변경, 환불, 개인정보 조회 | `/api/admin/**`는 `hasRole("ADMIN")`, 일부 관리자 API 보안 테스트 존재 | 모든 관리자 API endpoint별 회귀 테스트 확대 필요 | High |
| TM-AUTH-001 | 로그인하지 않은 사용자가 보호 API 호출 | Cart, Order, Address, Payment API | 개인정보/주문 데이터 노출 또는 변경 | SecurityConfig의 `anyRequest().authenticated()` | API별 401/403 테스트 범위 확인 필요 | High |
| TM-ORDER-001 | 다른 사용자의 주문/배송지 조회 또는 변경 | 주문, 배송지, 결제 | 개인정보 노출, 부정 결제/취소 | `findByIdAndMember`, `findByIdAndMember` 기반 조회 | 통합 테스트에서 실제 다른 사용자 토큰으로 확인 필요 | High |
| TM-PAY-001 | 프론트에서 상품 가격/결제 금액 조작 | 결제 승인 | 낮은 금액 결제 승인 | 서버가 주문 totalPrice와 request/approve amount 비교 | Toss 테스트 환경에서 조작 요청 확인 필요 | High |
| TM-STOCK-001 | 재고 0 또는 부족 상품 주문 | 재고, 주문 | 초과 판매, 재고 불일치 | 장바구니/주문 시 `validatePurchasable`, 주문 시 pessimistic lock | 동시 주문 통합 테스트 필요 | High |
| TM-PRODUCT-001 | 숨김 상품 직접 주문 | 숨김 상품, 주문 | 판매 중지 상품 구매 | 일반 조회에서 HIDDEN 제외, 구매 가능 상태는 `ON_SALE`만 허용 | 직접 API 회귀 테스트 유지 필요 | High |
| TM-CATALOG-001 | ProductType과 Category 불일치 조작 | 상품 catalog 참조 | 잘못된 상품 분류, 운영 데이터 오염 | `CatalogValidationService`가 category/productType 관계 검증 | FK는 1차 단계에서 강제하지 않으므로 DB 직접 수정 위험 남음 | Medium |
| TM-CATALOG-002 | Catalog slug 중복/오염 | Category/ProductType/Series | 라우팅/필터 혼선, 데이터 중복 | DTO slug pattern, repository 중복 검사, DB unique constraint | 대소문자/공백 normalize 테스트 확인 필요 | Medium |
| TM-JWT-001 | JWT 탈취 | 회원 계정, 관리자 권한 | 계정 탈취, 관리자 기능 악용 | JWT 서명/만료, 서버 검증 | 토큰이 localStorage에 있어 XSS 시 탈취 위험. CSP/XSS 방어 검토 필요 | High |
| TM-CORS-001 | CORS 오설정 | Backend API | 임의 origin에서 브라우저 API 호출 허용 | `CORS_ALLOWED_ORIGINS`, prod 기본 Vercel origin, CORS 테스트 | 스테이징/운영 실제 변수 값 확인 필요 | High |
| TM-FILE-001 | 이미지 업로드 악성 파일 | S3, 브라우저 사용자 | 악성 파일 배포, 저장소 악용 | 관리자 API 보호, 확장자/MIME/크기/빈 파일 검증, UUID key | 파일 내용 magic byte 검사, S3 public policy, malware scan은 미구현 | High |
| TM-EMAIL-001 | 이메일 인증 코드 남용 | 회원가입, 비밀번호 재설정 | 계정 생성 방해, 인증 우회 시도 | TTL, resend cooldown, send window, failed attempts | IP/user rate limit은 별도 확인/미구현 | Medium |
| TM-PWRESET-001 | 비밀번호 재설정 토큰 탈취/재사용 | 회원 계정 | 계정 탈취 | verification token 해시 저장, TTL, usedAt 처리, purpose 분리 | 이메일 계정 탈취/전송 채널 보안은 외부 의존 | High |
| TM-TOSS-001 | Toss `paymentKey`/`orderId`/`amount` 조작 | 결제 승인/취소 | 부정 결제 승인, 주문 상태 오염 | 서버가 order owner, providerOrderId, amount, Toss 승인 응답 금액 검증 | Toss 실패/취소 redirect의 provider order id 서버 검증 범위 추가 검토 | High |
| TM-DB-001 | DB migration 누락으로 배포 실패 | Railway backend, TiDB | 장애, 기능 중단 | Flyway migration, prod `ddl-auto=validate` | 새 schema 변경 시 migration 누락 테스트 필요 | Medium |
| TM-SECRET-001 | secret이 Git 또는 문서에 노출되거나 로컬 기본값이 운영에 사용됨 | DB/JWT/Toss/AWS/SMTP | 계정 탈취, 결제/DB/S3 악용 | `.gitignore`, 문서 placeholder, 환경변수 기반 설정 | 정기 secret scan, 로컬 기본 secret 운영 사용 방지, 노출 시 재발급 절차 필요 | High |
| TM-ADMIN-002 | 관리자 계정 탈취 | Admin API, 결제/상품/주문 | 대규모 운영 피해, 환불/상품 변조 | 관리자 API 서버 권한 검사 | MFA, 관리자 계정 생성/승격 절차, 로그인 알림은 미구현 | High |
| TM-ERROR-001 | 에러 메시지 또는 로그 과노출 | API 응답, 운영 로그 | 내부 정보 노출 | BusinessException 표준 응답, 일부 일반화된 에러 처리 | 예상 외 예외, SQL/debug 로그 운영 설정 확인 필요 | Medium |
| TM-S3-001 | S3 bucket 권한 오설정 | 이미지 파일 | 파일 변조/삭제/과도한 공개 | 애플리케이션은 `products/{uuid}` key로 업로드 | IAM 최소권한, bucket public access, lifecycle 정책은 운영 확인 필요 | Medium |

## 우선순위 해석

- `High`: 운영 전 반드시 확인하거나 테스트로 고정한다.
- `Medium`: 배포 전 확인을 권장한다.
- `Low`: 개선 여지가 있으나 현재 개인 프로젝트 운영에는 후순위다.
