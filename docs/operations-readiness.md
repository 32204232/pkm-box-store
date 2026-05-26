# Operations Readiness

PKM Box Store를 실제 운영 가능한 쇼핑몰로 가져가기 위한 스테이징, Secret, 결제 검증, 모니터링 기준이다.

이 문서는 실제 Secret 값을 기록하지 않는다. 모든 민감 값은 배포 플랫폼 Secret, 서버 환경변수, AWS Secrets Manager, GitHub Actions Secret 등 외부 Secret 저장소에만 둔다.

## 1. 운영 전 원칙

- 운영 전에는 기능 추가를 멈추고 회귀 테스트와 장애 대응 준비를 우선한다.
- 운영/스테이징/로컬 환경은 DB, Toss 키, S3 bucket 또는 prefix, SMTP 계정을 분리한다.
- 운영 DB는 `JPA_DDL_AUTO=validate`와 Flyway migration을 기본으로 한다.
- 운영에서 `JPA_DDL_AUTO=update`를 사용하지 않는다.
- 결제, 주문, 재고, 배송 상태는 DB와 관리자 화면에서 같은 상태를 보여야 한다.
- 고객에게 보이는 주문/배송 정보는 백엔드 주문 스냅샷이 실제로 변경된 뒤에만 표시한다.

## 2. 스테이징 환경

스테이징은 운영 배포 전 마지막 검증 환경이다. 운영과 최대한 같은 구성을 쓰되 외부 키와 데이터는 반드시 분리한다.

### Backend

필수 환경변수:

```env
SERVER_PORT=8080
DB_URL=jdbc:mysql://<staging-db-host>:3306/pkm_box_store_staging?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=<staging-db-user>
DB_PASSWORD=<secret>
FLYWAY_ENABLED=true
FLYWAY_BASELINE_ON_MIGRATE=true
FLYWAY_BASELINE_VERSION=0
JPA_DDL_AUTO=validate
JWT_SECRET=<secret>
JWT_ACCESS_TOKEN_EXPIRATION_MS=3600000
CORS_ALLOWED_ORIGINS=https://<staging-frontend-domain>
MAIL_MODE=LOG
MAIL_FROM=no-reply@<staging-domain>
TOSS_PAYMENTS_SECRET_KEY=<staging-toss-test-secret>
AWS_S3_BUCKET=<staging-bucket>
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
SPRINGDOC_API_DOCS_ENABLED=false
SPRINGDOC_SWAGGER_UI_ENABLED=false
```

확인 항목:

- [ ] 스테이징 DB가 운영 DB와 분리되어 있다.
- [ ] Flyway migration이 빈 DB에서 끝까지 성공한다.
- [ ] `JPA_DDL_AUTO=validate`에서 애플리케이션이 부팅된다.
- [ ] `CORS_ALLOWED_ORIGINS`에 스테이징 프론트 도메인만 등록되어 있다.
- [ ] Toss Secret Key와 프론트 Client Key가 같은 테스트 상점의 키이다.
- [ ] SMTP를 아직 운영 발송하지 않을 경우 `MAIL_MODE=LOG`를 사용한다.
- [ ] S3 bucket 또는 prefix가 운영과 분리되어 있다.
- [ ] Swagger UI는 외부 공개가 필요하지 않으면 꺼둔다.

### Frontend

필수 환경변수:

```env
NEXT_PUBLIC_API_BASE_URL=https://<staging-backend-domain>
NEXT_PUBLIC_TOSS_CLIENT_KEY=<staging-toss-test-client-key>
```

확인 항목:

- [ ] 스테이징 프론트가 스테이징 백엔드만 호출한다.
- [ ] 브라우저에서 CORS 오류 없이 API가 호출된다.
- [ ] Toss 결제창이 스테이징 Toss 테스트 상점으로 열린다.
- [ ] 로그인/마이페이지/장바구니/결제/관리자 페이지가 스테이징 데이터로만 동작한다.

## 3. 운영 Secret 관리

repo에 두면 안 되는 값:

- DB password
- JWT secret
- Toss secret key
- AWS access key
- AWS secret access key
- SMTP password
- private key
- service account file

권장 저장 위치:

- 배포 플랫폼 Secret
- AWS Secrets Manager
- GitHub Actions Secret
- 서버 환경변수

운영 전 확인:

- [ ] `.env`, `.env.local`, `.env.*.local`이 git에 추적되지 않는다.
- [ ] 문서와 예시 파일에 실제 키 값이 없다.
- [ ] 운영 Secret과 스테이징 Secret이 다르다.
- [ ] JWT secret은 32 bytes 이상 랜덤 값이다.
- [ ] Toss Secret Key는 서버에만 존재하고 프론트 번들에 노출되지 않는다.
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY`에는 공개 가능한 Client Key만 들어간다.
- [ ] AWS IAM 권한은 필요한 S3 bucket/prefix 작업으로 최소화한다.
- [ ] SMTP 비밀번호 또는 앱 비밀번호는 Secret 저장소에만 둔다.

## 4. S3 운영 기준

- 상품 이미지는 `products/{uuid}.{extension}` 형태로 저장한다.
- 원본 파일명은 S3 key에 직접 반영하지 않는다.
- 업로드 허용 확장자와 MIME 검증을 유지한다.
- 5MB 초과 파일은 거부한다.
- 운영 bucket public read 정책을 직접 열지, CloudFront를 둘지 결정한다.
- 가능하면 운영과 스테이징 bucket을 분리한다.

점검 항목:

- [ ] 운영 bucket 정책이 최소 권한이다.
- [ ] 애플리케이션 IAM principal은 필요한 작업만 수행할 수 있다.
- [ ] 잘못된 확장자, MIME 불일치, 빈 파일, 5MB 초과 파일이 거부된다.
- [ ] 이미지 URL이 상품 등록/수정 후 실제 사용자 상품 상세에 표시된다.

## 5. SMTP 운영 기준

운영 SMTP 전환 전 확인:

- [ ] 발신 도메인이 정해져 있다.
- [ ] SPF가 설정되어 있다.
- [ ] DKIM이 설정되어 있다.
- [ ] DMARC가 설정되어 있다.
- [ ] 반송 또는 실패 모니터링 방법이 정해져 있다.
- [ ] `MAIL_MODE=SMTP` 전환 후 회원가입 인증, 비밀번호 재설정, 주문/결제/배송 알림이 발송된다.
- [ ] 이메일 발송 실패가 주문/결제 트랜잭션을 깨지 않는다.

권장 운영 시작 방식:

1. 스테이징에서 `MAIL_MODE=LOG`로 전체 주문 흐름 검증
2. 스테이징에서 테스트 SMTP로 발송 검증
3. 운영 발신 도메인 인증 완료
4. 운영에서 소량 테스트 주문으로 발송 확인

## 6. Toss 결제 검증

스테이징에서 아래 시나리오를 반복 검증한다.

### 결제 성공

- [ ] 장바구니에서 주문을 생성한다.
- [ ] 주문 상태가 `PAYMENT_PENDING`인지 확인한다.
- [ ] 재고 이력 `RESERVED`가 저장되는지 확인한다.
- [ ] Toss 결제창을 열고 테스트 결제를 완료한다.
- [ ] `/payments/success`로 복귀한다.
- [ ] `POST /api/payments/confirm`이 호출된다.
- [ ] 주문 상태가 `PAID`로 변경된다.
- [ ] 결제 상태가 `APPROVED`로 저장된다.
- [ ] 재고 이력 `CONFIRMED`가 저장된다.
- [ ] 고객 결제 완료 알림이 로그 또는 이메일로 남는다.

### 중복 승인

- [ ] 결제 성공 페이지를 새로고침한다.
- [ ] 같은 `paymentKey`, `providerOrderId`, `amount`로 재승인 요청이 발생해도 기존 결제 응답이 반환된다.
- [ ] `CONFIRMED` 재고 이력이 중복 저장되지 않는다.
- [ ] 같은 주문에 다른 `paymentKey` 또는 Toss 주문번호가 들어오면 거부된다.

### 결제 실패/대기 취소

- [ ] Toss 결제 실패 흐름으로 `/payments/fail`에 복귀한다.
- [ ] 주문 상태가 `FAILED`로 변경된다.
- [ ] 재고 이력 `RELEASED`가 저장된다.
- [ ] 결제 대기 페이지에서 취소해도 같은 실패 처리 정책이 적용된다.

### 관리자 환불

- [ ] `PAID` 주문에서 관리자 환불을 실행한다.
- [ ] Toss 취소 API가 성공한다.
- [ ] 주문 상태가 `CANCELED`로 변경된다.
- [ ] 결제 상태가 `CANCELED`로 변경된다.
- [ ] 재고 이력 `RELEASED`가 저장된다.
- [ ] 관리자 감사 로그 `PAYMENT_CANCELED`가 저장된다.
- [ ] 같은 환불 요청을 반복해도 재고와 이력이 중복 처리되지 않는다.

## 7. 모니터링과 알림 기준

최소 알림 대상:

- 서버 health check 실패
- DB 연결 실패
- Toss API 승인/취소 실패
- 결제 금액 불일치
- 같은 주문에 다른 결제 키 또는 Toss 주문번호가 들어온 경우
- 주문 상태 전이 실패
- 재고 부족 또는 재고 복구 실패
- 이메일 발송 실패
- 관리자 환불 실행
- 관리자 상품 숨김/수정 실행

로그에서 반드시 확인할 정보:

- order id
- order uid
- member id 또는 member email
- payment key
- Toss provider order id
- payment amount
- order status
- payment status
- admin id 또는 admin email
- error code

민감 정보 로그 금지:

- JWT 원문
- Toss Secret Key
- AWS Secret Access Key
- SMTP password
- 고객 비밀번호
- 이메일 인증번호 원문

## 8. 운영 장애 대응 기준

### 결제 승인 실패

1. 주문 상태와 결제 상태를 DB에서 확인한다.
2. Toss 관리자 화면에서 해당 결제 키 상태를 확인한다.
3. 금액 불일치 또는 주문번호 불일치면 재시도하지 않고 원인을 기록한다.
4. Toss에는 승인됐지만 내부 DB가 실패했다면 수동 보정 절차를 정한 뒤 처리한다.

### 재고 불일치

1. `orders`, `payments`, `inventory_histories`, `products`를 함께 확인한다.
2. 중복 승인/중복 환불 여부를 확인한다.
3. 재고를 직접 수정해야 하면 수정 전후 값을 기록한다.
4. 운영자 작업은 별도 감사 로그 또는 운영 기록에 남긴다.

### 이메일 발송 실패

1. 주문/결제 트랜잭션은 성공했는지 먼저 확인한다.
2. SMTP provider 상태와 인증 정보를 확인한다.
3. 고객에게 필요한 알림은 수동 재발송 기준을 정한다.
4. 반복 실패하면 `MAIL_MODE=LOG`로 낮추는 것이 아니라 SMTP 설정을 수정한다.

### 관리자 환불 문제

1. Toss 취소 성공 여부를 먼저 확인한다.
2. 내부 결제 상태와 주문 상태를 확인한다.
3. 재고 이력 `RELEASED` 중복 여부를 확인한다.
4. 고객 안내 전 환불 상태를 Toss와 DB 양쪽에서 확인한다.

## 9. 운영 전 최종 체크

- [ ] 백엔드 테스트가 통과한다.
- [ ] 프론트 빌드가 통과한다.
- [ ] [local-test-checklist.md](local-test-checklist.md)의 핵심 흐름이 통과한다.
- [ ] [release-qa-checklist.md](release-qa-checklist.md)의 출시 전 회귀 QA가 통과한다.
- [ ] 스테이징 DB migration이 성공한다.
- [ ] 운영 Secret이 repo에 없다.
- [ ] Toss 키가 운영/스테이징/로컬별로 분리되어 있다.
- [ ] S3 권한이 최소화되어 있다.
- [ ] SMTP 도메인 인증이 끝났다.
- [ ] CORS 운영 도메인이 정확하다.
- [ ] 장애 알림을 받을 채널이 정해져 있다.
- [ ] 관리자 계정 생성/권한 변경 절차가 정해져 있다.
