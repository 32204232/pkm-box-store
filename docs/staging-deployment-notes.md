# pkm-box-store 스테이징 배포 기록

## 1. 스테이징 구성 개요

- Frontend: Vercel
- Backend: Railway
- Database: TiDB Cloud Starter
- Frontend URL: https://pkm-box-store.vercel.app
- Backend URL: https://pkm-box-store-production.up.railway.app
- DB: pkm_box_store

목적은 로컬에서만 동작하던 쇼핑몰 프로젝트를 인터넷 환경에서도 회원가입, 로그인, 상품 조회, 주문/결제 흐름까지 검증할 수 있도록 스테이징 환경을 구성하는 것이었다.

저장소 구조는 `backend`, `frontend`, `docs`로 나뉘어 있고, 프론트엔드는 Vercel, 백엔드는 Railway, 데이터베이스는 TiDB Cloud Starter를 사용했다.

## 2. 최종 환경변수 정리

### Vercel 환경변수

```env
NEXT_PUBLIC_API_BASE_URL=https://pkm-box-store-production.up.railway.app
NEXT_PUBLIC_TOSS_CLIENT_KEY=<TOSS_CLIENT_KEY>
```

### Railway 환경변수

```env
RAILPACK_JDK_VERSION=17
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/pkm_box_store?useSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=3KNVzUm4j7bNZGT.root
DB_PASSWORD=<DB_PASSWORD>
CORS_ALLOWED_ORIGINS=https://pkm-box-store.vercel.app
JWT_SECRET=<JWT_SECRET>
TOSS_PAYMENTS_SECRET_KEY=<TOSS_PAYMENTS_SECRET_KEY>
MAIL_MODE=LOG
```

### Railway Start Command

```sh
java $JAVA_OPTS -Dserver.port=$PORT -jar $(ls -1 build/libs/*.jar | grep -v plain | head -n 1)
```

## 3. Vercel 프론트엔드 배포

저장소 루트에는 `backend`, `frontend`, `docs`가 있으므로 Vercel의 Root Directory는 `frontend`로 설정해야 했다. Framework Preset은 Next.js로 설정했다.

최초에는 `NEXT_PUBLIC_API_BASE_URL`을 `http://localhost:8080`으로 넣었지만, Railway 백엔드 배포 후에는 Railway 백엔드 주소인 `https://pkm-box-store-production.up.railway.app`로 변경했다. Vercel 환경변수 변경 후에는 기존 배포가 자동으로 새 값을 쓰지 않으므로 Redeploy가 필요했다.

최종 프론트 주소는 `https://pkm-box-store.vercel.app`이다.

## 4. Railway 백엔드 배포 중 발생한 오류와 해결

## 오류 1. Railpack이 앱 빌드 방식을 감지하지 못함

증상:
- `Railpack could not determine how to build the app`
- Railway가 저장소 루트에서 빌드하려고 했다.
- 루트에는 `backend`, `frontend`, `docs`만 있고, 실제 Spring Boot 프로젝트는 `backend` 안에 있었다.

원인:
- Railway Root Directory가 설정되지 않아 `backend` 폴더를 기준으로 빌드하지 못했다.

해결:
- Railway Settings에서 Root Directory를 `backend`로 설정했다.

## 오류 2. Java 17을 찾지 못함

증상:
- `Cannot find a Java installation matching languageVersion=17`
- Gradle build 중 Java toolchain 문제가 발생했다.

원인:
- 프로젝트는 Java 17을 요구하지만 Railway Railpack 빌드 환경에서 JDK 17을 자동으로 찾지 못했다.

해결:
- Railway Variables에 아래 값을 추가했다.

```env
RAILPACK_JDK_VERSION=17
```

## 오류 3. 실행 JAR 파일 경로를 찾지 못함

증상:
- `ls: cannot access '*/build/libs/*jar': No such file or directory`
- 빌드는 성공했지만 실행 단계에서 JAR 파일을 찾지 못했다.

원인:
- Root Directory를 `backend`로 설정했기 때문에 실제 JAR 경로는 `build/libs/*.jar`인데, Railway 실행 명령은 다른 경로를 찾고 있었다.

해결:
- Railway Start Command를 아래처럼 직접 설정했다.

```sh
java $JAVA_OPTS -Dserver.port=$PORT -jar $(ls -1 build/libs/*.jar | grep -v plain | head -n 1)
```

## 오류 4. DB_URL 환경변수 값 형식 오류

증상:
- MySQL Driver가 JDBC URL을 거부했다.
- 로그에 `DB_URL=jdbc:mysql://...` 전체가 `jdbcUrl`로 들어간 흔적이 있었다.

원인:
- Railway Variables에서 Key가 `DB_URL`인데, Value에도 `DB_URL=jdbc:mysql://...` 형태로 넣어서 Spring Boot가 전체 문자열을 URL로 읽었다.

잘못된 예:

```text
Key: DB_URL
Value: DB_URL=jdbc:mysql://...
```

올바른 예:

```text
Key: DB_URL
Value: jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/pkm_box_store?useSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
```

해결:
- Value에서 `DB_URL=` 부분을 제거하고 `jdbc:mysql://...`부터 시작하도록 수정했다.

## 오류 5. cart_items 테이블 누락으로 Hibernate validate 실패

증상:
- 백엔드가 TiDB에는 연결됐지만 실행 중 충돌했다.
- `Hibernate schema validation failed`
- `cart_items` 테이블이 없다는 오류가 발생했다.

원인:
- Flyway는 실행되고 있었지만 기존 migration은 `admin_audit_logs`, `email_verifications`, `members` 정도만 생성하고 있었다.
- Entity에는 `products`, `cart_items`, `orders`, `order_items`, `payments`, `delivery_addresses`, `inventory_histories` 등이 존재했지만, 이 테이블을 생성하는 migration이 없었다.
- 운영/prod 환경에서는 `ddl-auto=validate`가 맞지만, `validate`는 테이블을 자동 생성하지 않고 검사만 하므로 DB 스키마가 없으면 실패한다.

해결:
- `ddl-auto=update`로 우회하지 않고 Flyway migration을 추가했다.
- 새 파일을 추가했다.

```text
backend/src/main/resources/db/migration/V3__create_catalog_order_cart_payment_tables.sql
```

생성한 테이블:
- `products`
- `delivery_addresses`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `inventory_histories`

## 오류 6. CORS preflight 403

증상:
- Vercel 프론트에서 인증번호 발송 시 `Failed to fetch`가 발생했다.
- 개발자도구 Network에서 `send` 요청의 preflight가 403으로 실패했다.
- CORS error가 확인됐다.

원인:
- Railway 백엔드의 `CORS_ALLOWED_ORIGINS` 값이 실제 Vercel 프론트 주소와 다르게 설정되어 있었다.

해결:
- Railway Variables에서 아래 값으로 수정했다.

```env
CORS_ALLOWED_ORIGINS=https://pkm-box-store.vercel.app
```

주의:
- 뒤에 슬래시를 붙이지 않는다.
- Railway 백엔드 주소가 아니라 Vercel 프론트 주소를 넣는다.

## 오류 7. 백엔드 루트 경로 / 접속 시 403

증상:
- `https://pkm-box-store-production.up.railway.app/` 접속 시 `403 Forbidden`이 표시됐다.

원인:
- 백엔드 루트 `/` 경로는 별도 페이지가 아니며, Spring Security 정책상 막혀 있을 수 있다.

확인 방법:
- 루트 `/`가 아니라 실제 API 경로로 확인해야 한다.

```text
https://pkm-box-store-production.up.railway.app/api/products
```

결과:
- `[]` 응답이 반환되면 백엔드 실행, DB 연결, `products` 테이블 조회가 정상이다.

## 5. Cursor가 수정한 파일 정리

- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-local.yml`
- `backend/src/main/resources/application-prod.yml`
- `backend/.env.example`
- `backend/src/main/resources/db/migration/V3__create_catalog_order_cart_payment_tables.sql`

`application.yml`:
- 공통 설정 및 profile group을 정리했다.
- `production` profile이 `prod` 설정을 사용하도록 구성했다.

`application-local.yml`:
- 로컬 실행용 설정을 분리했다.
- 로컬 MySQL 또는 TiDB 접속 정보를 환경변수로 주입할 수 있게 했다.

`application-prod.yml`:
- Railway 배포용 `prod` 설정을 분리했다.
- DB, CORS, mail, JPA/Flyway 설정을 환경변수 기반으로 사용하도록 했다.
- 운영 환경에서는 `ddl-auto=validate`를 사용한다.

`.env.example`:
- 실제 값 없이 필요한 환경변수 예시를 제공한다.
- 비밀번호나 Secret은 예시 또는 placeholder로만 둔다.

`V3__create_catalog_order_cart_payment_tables.sql`:
- 쇼핑몰 핵심 테이블을 생성하는 Flyway migration이다.
- Hibernate validate 전에 필요한 테이블이 생성되도록 한다.

## 6. 로컬 실행과 Railway 실행 구분

### 로컬 실행

로컬에서는 `SPRING_PROFILES_ACTIVE=local`을 사용한다. 로컬 MySQL 또는 TiDB 접속 정보를 환경변수로 주입한다.

`.env.local`은 Spring Boot가 자동으로 읽지 않을 수 있으므로 IntelliJ 환경변수, 터미널 환경변수, EnvFile 플러그인 등을 사용해야 한다.

예시:

```env
SPRING_PROFILES_ACTIVE=local
DB_URL=jdbc:mysql://localhost:3306/pkm_box_store?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=pkm_user
DB_PASSWORD=<LOCAL_DB_PASSWORD>
JWT_SECRET=<LOCAL_JWT_SECRET>
```

### Railway 실행

Railway에서는 `SPRING_PROFILES_ACTIVE=prod`를 사용한다. 환경변수는 Railway Variables에서 주입한다.

`server.port`는 Railway의 `PORT` 값을 사용해야 한다. Start Command에서 `-Dserver.port=$PORT`를 지정한다.

```sh
java $JAVA_OPTS -Dserver.port=$PORT -jar $(ls -1 build/libs/*.jar | grep -v plain | head -n 1)
```

## 7. 최종 검증된 내용

확인 완료:
- Vercel 프론트 배포 성공
- Railway 백엔드 빌드 성공
- Railway 백엔드 실행 성공
- TiDB 연결 성공
- Flyway V3 migration 적용
- `/api/products` 요청 시 `[]` 응답 확인
- CORS 수정 후 회원가입 성공
- 로그인 및 기본 기능 동작 확인

## 8. 남은 점검 사항

- 관리자 계정 `role` 값 확인 필요
- docs 예시상 일반 회원 role은 `ROLE_MEMBER` 형태이므로 관리자도 `ROLE_ADMIN`일 가능성이 있음
- DB에서 role을 직접 바꿀 때 `ADMIN`이 아니라 `ROLE_ADMIN`이 맞는지 코드 enum과 확인 필요
- 실제 운영 전에는 TiDB 비밀번호 재발급 권장
- Toss Secret Key, JWT Secret, DB Password는 재발급 및 안전한 변수 관리 필요
- 백엔드를 일시적으로 내려놓은 상태라면 Vercel 프론트는 떠 있어도 API 기능은 실패할 수 있음
- TiDB는 Monthly Spending Limit이 `$0.00`인지 확인 필요
