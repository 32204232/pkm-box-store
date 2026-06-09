# Backend Plan

## 1. 백엔드 패키지 구조

기본 패키지는 현재 구현 기준으로 `com.pkm.store`를 사용한다. 도메인 로직은 `domain/*` 하위에 두고, 인증/예외/메일/S3 같은 횡단 관심사는 `global/*` 하위에 둔다.

```text
com.pkm.store
├── PkmStoreApplication.java
├── domain
│   ├── adminlog
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   ├── service
│   │   └── type
│   ├── cart
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   └── service
│   ├── dashboard
│   │   ├── controller
│   │   ├── dto
│   │   └── service
│   ├── deliveryaddress
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   └── service
│   ├── inventory
│   │   ├── entity
│   │   ├── repository
│   │   ├── service
│   │   └── type
│   ├── member
│   │   ├── config
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   ├── scheduler
│   │   ├── service
│   │   └── type
│   ├── notification
│   │   └── service
│   ├── order
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   ├── scheduler
│   │   ├── service
│   │   └── type
│   ├── payment
│   │   ├── client
│   │   │   └── toss
│   │   ├── controller
│   │   ├── dto
│   │   ├── entity
│   │   ├── repository
│   │   ├── service
│   │   └── type
│   └── product
│       ├── controller
│       ├── dto
│       ├── entity
│       ├── repository
│       ├── service
│       └── type
├── global
│   ├── exception
│   ├── jwt
│   ├── mail
│   ├── s3
│   └── security
```

### 패키지 원칙

- `global`: 공통 설정, 인증/인가, 예외 처리, JWT, 메일, S3 연동을 둔다.
- 각 도메인은 필요에 따라 `controller`, `service`, `repository`, `entity`, `dto`, `type`, `scheduler`를 둔다.
- Toss Payments 연동 코드는 `domain/payment/client/toss` 하위에 격리한다.
- 관리자 API는 별도 `admin` 도메인으로 몰지 않고 각 도메인의 관리자 컨트롤러 또는 관리자 전용 경로(`/api/admin/**`)에서 제공한다.

## 2. 핵심 도메인

이 프로젝트의 핵심 도메인은 다음과 같다.

- `member`
- `product`
- `cart`
- `deliveryaddress`
- `order`
- `payment`
- `inventory`
- `dashboard`
- `adminlog`
- `notification`

## 3. 각 도메인의 역할

### member

회원 가입, 로그인, 인증 정보, 권한 정보를 관리한다.

- 이메일/비밀번호 기반 회원 가입
- 이메일 인증번호 발송/확인
- 로그인 및 JWT 발급
- 회원 기본 정보 조회/수정
- 비밀번호 변경과 비밀번호 재설정
- 만료/사용 완료 이메일 인증 데이터 정리
- 회원 상태 관리
- 권한 구분: 일반 회원, 관리자

### product

한국어판 포켓몬 카드 박스 상품 정보를 관리한다.

- 상품 목록 조회
- 상품 상세 조회
- 상품명, 설명, 가격, 대표 이미지, 상세 이미지 관리
- 판매 상태 관리
- 상품 노출 여부 관리
- 관리자 상품 등록/수정/삭제
- 관리자 상품 검색/필터

상품은 한국어판 포켓몬 카드 박스만 취급한다. 확장팩, 스타터 덱, 단품 카드, 일본어판/영어판 상품은 기본 판매 대상에서 제외한다.

### cart

회원별 장바구니를 관리한다.

- 장바구니 상품 추가
- 장바구니 수량 변경
- 장바구니 상품 삭제
- 장바구니 전체 조회
- 주문 생성 전 상품 가격, 판매 상태, 재고 재검증

장바구니에 담긴 상품은 재고를 선점하지 않는다. 실제 재고 차감 또는 예약은 주문/결제 단계에서 처리한다.

### deliveryaddress

회원별 저장 배송지를 관리한다.

- 배송지 목록 조회
- 배송지 추가/수정/삭제
- 기본 배송지 설정
- 주문 생성 또는 결제 전 배송지 변경 시 저장 배송지 스냅샷 제공

### order

주문 생성과 주문 상태를 관리한다.

- 장바구니 기반 주문 생성
- 주문 금액 계산
- 주문 상품 스냅샷 저장
- 배송지 정보 저장
- 결제 대기 주문 배송지 변경
- 주문 상태 변경
- 회원 주문 내역 조회
- 관리자 주문 조회/상태 변경
- 결제 대기 주문 만료 처리

주문에는 결제 당시의 상품명, 가격, 수량을 스냅샷으로 저장한다. 이후 상품 정보가 변경되어도 기존 주문 내역은 변경되지 않아야 한다.

### payment

Toss Payments 결제 승인, 실패, 취소 흐름을 관리한다.

- 결제 요청 정보 생성
- Toss Payments 결제 승인 API 호출
- 결제 승인 결과 저장
- 결제 실패 기록
- 결제 취소 요청
- 결제 취소 결과 저장
- 주문 상태와 결제 상태 동기화
- 사용자/관리자 취소 요청 멱등성 방어

외부 결제 승인 결과는 반드시 서버에서 Toss Payments API로 검증한다. 프론트엔드에서 전달한 결제 성공 정보만으로 주문을 결제 완료 처리하지 않는다.

### inventory

상품 재고 수량과 재고 변경 이력을 관리한다.

- 상품별 재고 수량 관리
- 주문 생성 시 재고 검증 및 예약 차감
- 결제 승인 시 예약 재고 확정
- 주문 취소/결제 취소 시 재고 복구
- 재고 변경 이력 기록

재고 정책은 overselling 방지를 최우선으로 한다. 동시에 같은 상품을 주문하는 상황에서도 실제 재고보다 많은 수량이 판매되지 않아야 한다.

### dashboard

관리자 대시보드 요약 데이터를 제공한다.

- 오늘 주문 수
- 오늘 매출 합계
- 주문 상태별 개수
- 재고 부족 상품 개수와 목록
- 최근 주문 목록

### adminlog

관리자 주요 변경 작업을 감사 로그로 저장하고 조회한다.

- 상품 등록/수정/숨김
- 주문 배송 준비/발송/배송 완료
- 관리자 결제 취소/환불
- 최신 감사 로그 조회

### notification

고객 대상 주문/결제/배송 알림 발송을 담당한다.

- 주문 생성 알림
- 결제 완료 알림
- 배송 시작 알림
- 배송 완료 알림
- `MAIL_MODE=LOG` 또는 `MAIL_MODE=SMTP`에 따른 발송 경로 분리

### 관리자 운영 기능

관리자 전용 운영 기능은 각 도메인의 관리자 API로 제공한다.

- 상품 등록/수정/삭제
- 상품 판매 상태 변경
- 상품 이미지 업로드
- 관리자 대시보드 조회
- 주문 목록 조회
- 주문 상태 변경
- 결제 취소 처리
- 감사 로그 조회
- 관리자 권한이 필요한 API 보호

관리자 API는 `ROLE_ADMIN` 권한을 가진 회원만 접근할 수 있다.

## 4. 주문 상태 흐름

주문 상태는 다음 값을 기준으로 관리한다.

```text
PAYMENT_PENDING
PAID
PREPARING
SHIPPED
DELIVERED
CANCELED
FAILED
EXPIRED
```

### 기본 흐름

```text
PAYMENT_PENDING
→ PAID
→ PREPARING
→ SHIPPED
→ DELIVERED
```

### 실패 흐름

```text
PAYMENT_PENDING
→ FAILED
```

### 취소 흐름

```text
PAID → CANCELED
```

### 만료 흐름

```text
PAYMENT_PENDING → EXPIRED
```

### 주문 상태 정책

- `PAYMENT_PENDING`: 결제 진행 중 상태다.
- `PAID`: 결제가 승인된 상태다.
- `PREPARING`: 관리자가 상품 발송을 준비 중인 상태다.
- `SHIPPED`: 배송이 시작된 상태다.
- `DELIVERED`: 배송 완료 상태다.
- `CANCELED`: 주문이 최종 취소된 상태다.
- `FAILED`: 결제 실패 또는 주문 처리 실패 상태다.
- `EXPIRED`: 제한 시간 안에 결제가 완료되지 않아 만료된 상태다.

배송 시작 이후 취소는 기본적으로 제한한다. `SHIPPED`, `DELIVERED` 상태의 환불/반품은 별도 CS 정책으로 분리한다.

## 5. 결제 상태 흐름

결제 상태는 다음 값을 기준으로 관리한다.

```text
READY
IN_PROGRESS
APPROVED
FAILED
CANCELED
```

### 기본 흐름

```text
READY
→ IN_PROGRESS
→ APPROVED
```

### 실패 흐름

```text
READY
→ IN_PROGRESS
→ FAILED
```

### 취소 흐름

```text
APPROVED
→ CANCELED
```

### 결제 상태 정책

- `READY`: 결제 요청 전 초기 상태다.
- `IN_PROGRESS`: Toss Payments 결제창 또는 승인 절차가 진행 중인 상태다.
- `APPROVED`: Toss Payments 승인 API 검증이 완료된 상태다.
- `FAILED`: 결제 승인 실패 또는 사용자 결제 실패 상태다.
- `CANCELED`: 결제 취소가 완료된 상태다.

현재 구현은 Toss 전체 취소/환불만 지원한다. 부분 취소는 주문 상품 단위 환불 정책이 확정된 뒤 별도 상태와 API를 추가한다.

## 6. 재고 정책

### 기본 원칙

- 상품 재고는 `inventory` 도메인에서 단일하게 관리한다.
- 장바구니 추가 시점에는 재고를 차감하지 않는다.
- 주문 생성 시 상품 상태와 재고를 검증하고 재고를 예약 차감한다.
- 결제 승인 시 예약 재고를 확정한다.
- 결제 실패, 주문 취소, 결제 취소 시 차감된 재고는 복구한다.
- 재고 변경은 모두 이력으로 남긴다.

### 권장 차감 방식

현재 구현은 `주문 생성 시 재고 예약` 방식을 사용한다.

```text
장바구니
→ 주문 생성
→ 재고 예약
→ 결제 진행
→ 결제 승인
→ 예약 재고 확정
```

결제가 실패하거나 제한 시간 안에 결제가 완료되지 않으면 예약 재고를 복구한다.

### 동시성 정책

- 재고 차감은 트랜잭션 안에서 처리한다.
- 같은 상품에 대한 동시 주문은 상품 조회의 pessimistic write lock으로 보호한다.
- 재고가 부족하면 주문 생성 또는 결제 승인을 실패 처리한다.

### 재고 이력 유형

```text
RESERVED
CONFIRMED
RELEASED
ADJUSTED
```

- `RESERVED`: 주문 생성에 따른 재고 예약
- `CONFIRMED`: 결제 승인에 따른 재고 확정
- `RELEASED`: 결제 실패 또는 주문 취소에 따른 재고 복구
- `ADJUSTED`: 관리자 수동 조정

## 7. 관리자 권한 정책

### 권한 구분

```text
ROLE_MEMBER
ROLE_ADMIN
```

### 접근 정책

- 일반 상품 조회 API는 비회원도 접근할 수 있다.
- 장바구니, 주문, 결제 API는 로그인 회원만 접근할 수 있다.
- 관리자 API는 `ROLE_ADMIN` 권한이 있는 회원만 접근할 수 있다.
- 관리자 권한은 일반 회원 가입 과정에서 부여하지 않는다.
- 관리자 계정은 DB seed, 운영자 수동 등록, 또는 별도 내부 절차로 생성한다.

### 관리자 기능

- 상품 등록/수정/삭제
- 상품 이미지 업로드
- 상품 판매 상태 변경
- 관리자 대시보드 조회
- 주문 조회
- 주문 상태 변경
- 결제 취소
- 감사 로그 조회

### 보안 정책

- 관리자 API 경로는 `/api/admin/**`로 분리한다.
- Spring Security에서 관리자 경로에 `ROLE_ADMIN` 검사를 적용한다.
- 관리자 주요 행위는 감사 로그 대상으로 본다.
- 상품 등록/수정/숨김, 주문 상태 변경, 관리자 결제 취소는 요청자 관리자 ID와 처리 시각을 기록한다.

## 8. 남은 보강 후보

현재 핵심 커머스 흐름은 구현되어 있으며, 앞으로는 기능 추가보다 운영 안정성 검증과 정책 확정이 우선이다.

1. 운영/스테이징 환경 구성
   - 운영/스테이징 DB와 Secret 분리
   - `JPA_DDL_AUTO=validate`와 Flyway migration 검증
   - 운영 도메인 기준 CORS 설정

2. 결제/주문 안정성 검증
   - Toss 성공/실패/중복 승인/취소 반복 검증
   - 주문 만료와 재고 복구 검증
   - 결제 실패 재처리 또는 수동 보정 정책 정리

3. SMTP/S3 운영 전환
   - SMTP 발신 도메인 SPF/DKIM/DMARC 설정
   - S3 bucket 또는 CloudFront 공개 정책 결정
   - S3 IAM 권한 최소화

4. 관측성과 장애 대응
   - health check와 장애 알림 채널 구성
   - 결제 실패, 재고 불일치, 이메일 발송 실패 로그/알림 기준 정리
   - 운영자 수동 보정 절차 문서화

5. 추가 기능 후보
   - refresh token 도입 여부 검토
   - 주문 상태와 결제 상태/배송 상태 분리 검토
   - 부분 취소/반품/교환 정책 확정 후 API 확장
