# Backend Plan

## 1. 백엔드 패키지 구조

기본 패키지는 `com.pkmboxstore`를 기준으로 구성한다.

```text
com.pkmboxstore
├── PkmBoxStoreApplication.java
├── global
│   ├── config
│   ├── security
│   ├── exception
│   ├── response
│   ├── jwt
│   └── util
├── member
│   ├── controller
│   ├── service
│   ├── repository
│   ├── domain
│   └── dto
├── product
│   ├── controller
│   ├── service
│   ├── repository
│   ├── domain
│   └── dto
├── cart
│   ├── controller
│   ├── service
│   ├── repository
│   ├── domain
│   └── dto
├── order
│   ├── controller
│   ├── service
│   ├── repository
│   ├── domain
│   └── dto
├── payment
│   ├── controller
│   ├── service
│   ├── repository
│   ├── domain
│   ├── dto
│   └── toss
├── inventory
│   ├── service
│   ├── repository
│   ├── domain
│   └── dto
└── admin
    ├── controller
    ├── service
    └── dto
```

### 패키지 원칙

- `global`: 공통 설정, 인증/인가, 예외 처리, 공통 응답, JWT, 유틸리티를 둔다.
- 각 도메인은 `controller`, `service`, `repository`, `domain`, `dto`를 기본 단위로 나눈다.
- Toss Payments 연동 코드는 `payment.toss` 하위에 격리한다.
- 관리자 기능은 `admin` 패키지에서 API 진입점을 관리하되, 실제 비즈니스 로직은 각 도메인 서비스를 재사용한다.

## 2. 핵심 도메인

이 프로젝트의 핵심 도메인은 다음과 같다.

- `member`
- `product`
- `cart`
- `order`
- `payment`
- `inventory`
- `admin`

## 3. 각 도메인의 역할

### member

회원 가입, 로그인, 인증 정보, 권한 정보를 관리한다.

- 이메일/비밀번호 기반 회원 가입
- 로그인 및 JWT 발급
- 회원 기본 정보 조회/수정
- 배송지 정보 관리
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

상품은 한국어판 포켓몬 카드 박스만 취급한다. 확장팩, 스타터 덱, 단품 카드, 일본어판/영어판 상품은 기본 판매 대상에서 제외한다.

### cart

회원별 장바구니를 관리한다.

- 장바구니 상품 추가
- 장바구니 수량 변경
- 장바구니 상품 삭제
- 장바구니 전체 조회
- 주문 생성 전 상품 가격, 판매 상태, 재고 재검증

장바구니에 담긴 상품은 재고를 선점하지 않는다. 실제 재고 차감 또는 예약은 주문/결제 단계에서 처리한다.

### order

주문 생성과 주문 상태를 관리한다.

- 장바구니 기반 주문 생성
- 바로 구매 주문 생성
- 주문 금액 계산
- 주문 상품 스냅샷 저장
- 배송지 정보 저장
- 주문 상태 변경
- 회원 주문 내역 조회
- 관리자 주문 조회/상태 변경

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

외부 결제 승인 결과는 반드시 서버에서 Toss Payments API로 검증한다. 프론트엔드에서 전달한 결제 성공 정보만으로 주문을 결제 완료 처리하지 않는다.

### inventory

상품 재고 수량과 재고 변경 이력을 관리한다.

- 상품별 재고 수량 관리
- 주문 생성/결제 승인 시 재고 검증
- 재고 차감
- 주문 취소/결제 취소 시 재고 복구
- 관리자 재고 입고/조정
- 재고 변경 이력 기록

재고 정책은 overselling 방지를 최우선으로 한다. 동시에 같은 상품을 주문하는 상황에서도 실제 재고보다 많은 수량이 판매되지 않아야 한다.

### admin

관리자 전용 운영 기능을 제공한다.

- 상품 등록/수정/삭제
- 상품 판매 상태 변경
- 재고 입고/조정
- 주문 목록 조회
- 주문 상태 변경
- 결제 취소 처리
- 회원 조회
- 관리자 권한이 필요한 API 보호

관리자 API는 `ROLE_ADMIN` 권한을 가진 회원만 접근할 수 있다.

## 4. 주문 상태 흐름

주문 상태는 다음 값을 기준으로 관리한다.

```text
CREATED
PAYMENT_PENDING
PAID
PREPARING
SHIPPED
DELIVERED
CANCEL_REQUESTED
CANCELED
FAILED
```

### 기본 흐름

```text
CREATED
→ PAYMENT_PENDING
→ PAID
→ PREPARING
→ SHIPPED
→ DELIVERED
```

### 실패 흐름

```text
CREATED
→ PAYMENT_PENDING
→ FAILED
```

### 취소 흐름

```text
CREATED → CANCELED
PAYMENT_PENDING → CANCELED
PAID → CANCEL_REQUESTED → CANCELED
PREPARING → CANCEL_REQUESTED → CANCELED
```

### 주문 상태 정책

- `CREATED`: 주문 데이터가 생성된 상태다.
- `PAYMENT_PENDING`: 결제 진행 중 상태다.
- `PAID`: 결제가 승인된 상태다.
- `PREPARING`: 관리자가 상품 발송을 준비 중인 상태다.
- `SHIPPED`: 배송이 시작된 상태다.
- `DELIVERED`: 배송 완료 상태다.
- `CANCEL_REQUESTED`: 결제 완료 이후 취소 요청이 접수된 상태다.
- `CANCELED`: 주문이 최종 취소된 상태다.
- `FAILED`: 결제 실패 또는 주문 처리 실패 상태다.

배송 시작 이후 취소는 기본적으로 제한한다. `SHIPPED`, `DELIVERED` 상태의 환불/반품은 별도 CS 정책으로 분리한다.

## 5. 결제 상태 흐름

결제 상태는 다음 값을 기준으로 관리한다.

```text
READY
IN_PROGRESS
APPROVED
FAILED
CANCEL_REQUESTED
CANCELED
PARTIAL_CANCELED
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
→ CANCEL_REQUESTED
→ CANCELED
```

### 결제 상태 정책

- `READY`: 결제 요청 전 초기 상태다.
- `IN_PROGRESS`: Toss Payments 결제창 또는 승인 절차가 진행 중인 상태다.
- `APPROVED`: Toss Payments 승인 API 검증이 완료된 상태다.
- `FAILED`: 결제 승인 실패 또는 사용자 결제 실패 상태다.
- `CANCEL_REQUESTED`: 결제 취소 요청이 접수된 상태다.
- `CANCELED`: 결제 취소가 완료된 상태다.
- `PARTIAL_CANCELED`: 부분 취소가 완료된 상태다.

초기 구현에서는 전체 취소만 지원하고, 부분 취소는 상태 값만 열어 둔다. 부분 취소는 주문 상품 단위 환불 정책이 확정된 뒤 구현한다.

## 6. 재고 정책

### 기본 원칙

- 상품 재고는 `inventory` 도메인에서 단일하게 관리한다.
- 장바구니 추가 시점에는 재고를 차감하지 않는다.
- 주문 생성 또는 결제 승인 시점에 재고를 검증한다.
- 최종 결제 승인 전후의 재고 차감 시점은 구현 단계에서 하나로 고정한다.
- 결제 실패, 주문 취소, 결제 취소 시 차감된 재고는 복구한다.
- 재고 변경은 모두 이력으로 남긴다.

### 권장 차감 방식

초기 구현에서는 `주문 생성 시 재고 예약` 방식을 사용한다.

```text
장바구니/바로구매
→ 주문 생성
→ 재고 예약
→ 결제 진행
→ 결제 승인
→ 예약 재고 확정
```

결제가 실패하거나 제한 시간 안에 결제가 완료되지 않으면 예약 재고를 복구한다.

### 동시성 정책

- 재고 차감은 트랜잭션 안에서 처리한다.
- 같은 상품에 대한 동시 주문은 비관적 락 또는 낙관적 락으로 보호한다.
- 초기 구현에서는 상품별 재고 row에 비관적 락을 적용하는 방식을 우선 검토한다.
- 재고가 부족하면 주문 생성 또는 결제 승인을 실패 처리한다.

### 재고 이력 유형

```text
INBOUND
RESERVED
CONFIRMED
RELEASED
ADJUSTED
```

- `INBOUND`: 관리자 입고
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
- 상품 이미지 등록/삭제
- 상품 판매 상태 변경
- 재고 입고/조정
- 주문 조회
- 주문 상태 변경
- 결제 취소
- 회원 조회

### 보안 정책

- 관리자 API 경로는 `/api/admin/**`로 분리한다.
- Spring Security에서 관리자 경로에 `ROLE_ADMIN` 검사를 적용한다.
- 관리자 주요 행위는 감사 로그 대상으로 본다.
- 결제 취소, 재고 조정, 주문 상태 변경은 요청자 관리자 ID와 처리 시각을 기록한다.

## 8. 앞으로 구현할 순서

1. 프로젝트 기본 설정
   - Spring Boot 3.x 프로젝트 구성
   - Java 17, Gradle 설정
   - MySQL 연결 설정
   - 공통 응답/예외 구조 작성

2. 인증/인가 기반 구현
   - `member` 도메인 생성
   - 회원 가입, 로그인 구현
   - Spring Security 설정
   - JWT 발급/검증 구현
   - `ROLE_MEMBER`, `ROLE_ADMIN` 권한 적용

3. 상품 도메인 구현
   - `product` 엔티티 설계
   - 상품 목록/상세 조회 API
   - 관리자 상품 등록/수정/삭제 API
   - S3 이미지 업로드 연동 준비

4. 재고 도메인 구현
   - `inventory` 엔티티 설계
   - 상품별 재고 조회/조정
   - 재고 변경 이력 기록
   - 동시성 제어 방식 적용

5. 장바구니 구현
   - `cart` 엔티티 설계
   - 장바구니 추가/수정/삭제/조회 API
   - 주문 생성 전 상품 상태 및 재고 검증

6. 주문 구현
   - `order` 엔티티 설계
   - 주문 생성 API
   - 주문 상품 스냅샷 저장
   - 주문 상태 흐름 적용
   - 회원 주문 내역 조회

7. 결제 구현
   - `payment` 엔티티 설계
   - Toss Payments 결제 승인 연동
   - 결제 성공/실패 처리
   - 주문 상태와 결제 상태 동기화

8. 주문 취소 및 재고 복구 구현
   - 주문 취소 API
   - Toss Payments 결제 취소 연동
   - 취소 시 재고 복구
   - 취소 이력 저장

9. 관리자 운영 API 확장
   - 관리자 주문 조회
   - 관리자 주문 상태 변경
   - 관리자 재고 조정
   - 관리자 결제 취소
   - 감사 로그 기록

10. 테스트 및 운영 준비
    - 도메인 단위 테스트
    - 서비스 통합 테스트
    - 결제 승인/취소 테스트
    - 재고 동시성 테스트
    - AWS 배포 환경 설정
