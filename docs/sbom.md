# SBOM-lite

이 문서는 정식 CycloneDX/SPDX 산출물이 아니라, 현재 PKM Box Store의 dependency inventory와 취약점 점검 방법을 정리한 SBOM-lite 문서다. 이번 단계에서는 build plugin, package, lockfile을 변경하지 않는다.

## 왜 필요한가

- 쇼핑몰은 회원, 주문, 결제, 배송지, 관리자 권한, 이미지 업로드를 다루므로 취약한 라이브러리 영향도가 크다.
- 장애나 취약점 공지가 있을 때 어떤 라이브러리를 쓰는지 빠르게 확인해야 한다.
- 포트폴리오/실제 운영 설명에서 dependency 관리와 취약점 점검 절차를 보여줄 수 있다.

## 현재 의존성 위치

- Backend Gradle dependencies: `backend/build.gradle`
- Frontend npm dependencies: `frontend/package.json`
- Frontend lockfile: `frontend/package-lock.json`

## 주요 라이브러리 요약

| Area | Library / Framework | Evidence | Note |
| --- | --- | --- | --- |
| Backend framework | Spring Boot 3.3.5 | `backend/build.gradle` | Web, validation, mail, security, JPA starter 사용 |
| Security | Spring Security | `backend/build.gradle`, `backend/src/main/java/com/pkm/store/global/security/SecurityConfig.java` | stateless JWT 인증, 관리자 API role 제한 |
| JWT | JJWT 0.12.6 | `backend/build.gradle`, `backend/src/main/java/com/pkm/store/global/jwt/JwtTokenProvider.java` | HMAC secret 기반 access token |
| Persistence | Spring Data JPA / Hibernate | `backend/build.gradle`, `backend/src/main/resources/application.yml` | `ddl-auto=validate`, open-in-view false |
| DB Driver | MySQL Connector/J | `backend/build.gradle` | MySQL/TiDB 연결 |
| Migration | Flyway core/mysql | `backend/build.gradle`, `backend/src/main/resources/db/migration` | SQL migration 관리 |
| API docs | springdoc-openapi 2.6.0 | `backend/build.gradle` | prod에서는 비활성화 설정 |
| S3 | AWS SDK for Java S3 2.29.6 | `backend/build.gradle`, `backend/src/main/java/com/pkm/store/global/s3` | 관리자 이미지 업로드 |
| Test | Spring Boot Test, Spring Security Test, H2 | `backend/build.gradle` | 보안/서비스 테스트 |
| Frontend framework | Next.js 16.2.6 | `frontend/package.json` | App Router |
| UI | React 19.2.6 / React DOM 19.2.6 | `frontend/package.json` | Client components |
| Language | TypeScript 6.0.3 | `frontend/package.json` | 타입 정의 |
| Lint | ESLint / eslint-config-next | `frontend/package.json` | 프론트 정적 검사 |
| Payment SDK | `@tosspayments/tosspayments-sdk` 2.7.x | `frontend/package.json`, `frontend/app/orders/[id]/payment/page.tsx` | Toss 결제창 호출 |

## 취약점 확인 방법

Frontend:

```powershell
cd frontend
npm audit
```

필요 시 심각도 기준:

```powershell
cd frontend
npm audit --audit-level=moderate
```

주의: `npm audit fix`는 의존성/lockfile을 변경할 수 있으므로 별도 작업으로 실행한다.

Backend:

```powershell
cd backend
.\gradlew.bat dependencies
```

특정 dependency tree가 필요할 때:

```powershell
cd backend
.\gradlew.bat dependencyInsight --dependency <dependency-name>
```

## Dependabot 검토

GitHub 저장소를 사용한다면 Dependabot을 나중에 도입할 수 있다.

- npm ecosystem: `frontend/package.json`, `frontend/package-lock.json`
- gradle ecosystem: `backend/build.gradle`
- 알림만 먼저 켜고, 자동 PR은 개인 프로젝트 속도에 맞춰 검토한다.

## 정식 SBOM 선택지

나중에 운영/감사 수준의 산출물이 필요하면 아래 중 하나를 선택한다.

- CycloneDX: Gradle/npm 모두 생태계 지원이 좋고 보안 도구 연동이 쉽다.
- SPDX: 라이선스/공급망 문서 표준으로 널리 쓰인다.

현재 단계에서는 build plugin을 추가하지 않고, dependency inventory와 취약점 점검 체크리스트만 유지한다.

## Dependency 변경 체크리스트

- [ ] 새 dependency가 꼭 필요한지 확인한다.
- [ ] backend 변경이면 `backend/build.gradle` 변경 이유를 PR/커밋에 적는다.
- [ ] frontend 변경이면 `frontend/package.json`과 `frontend/package-lock.json` 변경을 함께 검토한다.
- [ ] 결제, 인증, 업로드, DB 관련 dependency 변경은 `docs/security-requirements.md`와 `docs/threat-model.md` 영향도를 확인한다.
- [ ] 취약점 점검 결과와 예외 판단을 기록한다.
- [ ] dependency 변경 후 `docs/sbom.md`를 업데이트한다.
