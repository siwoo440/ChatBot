---
# 계정·데이터 안정화 1단계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. 사용자는 추가 질문 없이 현재 세션의 Native 실행과 main 커밋·푸시를 승인했다.

**Goal:** 영어 검사 실패를 해결하고 실제 계정 확인 전에 사용할 읽기 전용 점검 명령과 인수인계를 제공한다.

**Architecture:** 기존 앱 동작을 유지하며 E2E의 준비 조건을 바로잡는다. 점검 로직과 CLI를 분리하고 Node 내장 테스트로 네트워크·출력 경계를 확인한다.

**Tech Stack:** Next.js 16, Playwright, Node.js ESM, node:test, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-26-account-stage-one-design.md`

---
## Global Constraints

- Allman 중괄호와 줄별 짧은 한글 주석.
- API 키, 사용자 정보, 환경 파일은 출력·커밋 금지.
- 실제 AI와 공개 AI 스위치는 켜지 않는다.
- 실제 가입·로그인·데이터 쓰기·SQL 실행은 이번 자동 작업에서 하지 않는다.

---
## Review Focus

- 표의 익명 읽기 거절을 RLS와 실제 로그인 완료로 과장하지 않는지.
- 서버가 오류에 키를 되돌려 주어도 출력되지 않는지.
- 리디렉션·평문 원격 주소로 공개 키가 전달되지 않는지.
- 환경 설정이 없거나 잘못됐을 때 외부 요청을 하지 않는지.
- 영어 검사가 복원이 끝나기 전의 임시 화면으로 통과하지 않는지.

---
### Task 1: 영어 화면 준비 조건 안정화

**Files:** `tests/e2e/english-pages.spec.ts`

**Interfaces:** 기존 seed(page), koreanLeft(page), expectFits(page)를 유지한다.

- [x] 실패하는 두 검사를 추적과 함께 실행해 대기 원인을 확인한다.
- [x] 화면의 언어·본문·복원된 앱 상태를 확인하고 네트워크 전체 대기를 제거한다.
- [x] 두 검사와 전체 영어 화면 검사를 실행한다. Expected: 모두 통과. 실제: 29/29 통과.

---
### Task 2: 읽기 전용 계정 점검 명령

**Files:** `scripts/account-check.mjs`, `scripts/account-check-cli.mjs`, `tests/scripts/account-check.test.mjs`, `package.json`, `package-lock.json`.

**Interfaces:** `checkAccountSetup(values, options)` → `{ checks, readyForManualCheck, liveAccountVerified: false }`, `formatAccountCheck(report)` → 민감 정보 없는 문자열. CLI 종료 코드는 준비 통과 0, 미준비 2다.

- [x] 설정과 네트워크 실패·권한 경계를 확인하는 Node 테스트를 먼저 작성한다.
- [x] 테스트 실행. Expected: 구현 모듈 부재로 실패. 실제: ERR_MODULE_NOT_FOUND 확인.
- [x] 점검 로직과 CLI를 구현하고 기존 Next 환경 파일 로더를 사용한다.
- [x] Node 테스트 및 설정 없는 실제 CLI 실행. Expected: 테스트 통과, CLI는 미준비 2이며 외부 요청 없음. 실제: 리뷰의 잘못된 JWT 회귀 검사 포함 15/15 통과, 연습용 미검증 안내.

---
### Task 3: 문서·전체 검증·통합

**Files:** `README.md`, `docs/ACCOUNT-SETUP.md`, `HANDOFF.md`, `NEXT-SESSION.md`.

- [x] 구현 상태, 점검 한계, 실제 두 기기 확인 순서와 남은 사용자 작업을 문서에 반영한다.
- [x] 타입·린트·전체 Vitest·Node 테스트·빌드·브라우저 회귀 실행. Expected: 실패 없음. 실제: 863개·15개·178개와 타입·린트·빌드 모두 통과.
- [x] 전체 변경에 대한 독립 코드 리뷰와 필요한 수정 수행. 실제: JWT 형식 오류 1건을 회귀 검사 RED→GREEN으로 수정.
- [ ] 한글 커밋 메시지에 영역별 변경 목록을 넣고 main 병합·푸시. Expected: HEAD와 origin/main 일치.

실제 main 반영 여부와 커밋 식별자는 Git 기록을 기준으로 확인한다. 실제 가입·두 기기 복원은 이 로컬 준비 계획의 완료 범위에 포함하지 않는다.
