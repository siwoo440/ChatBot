---
# Server token management implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. 사용자 승인 대기 없이 기존 Native 방식으로 실행.

**Goal:** 서버 권한 지갑·원장·보상·한도와 시각·채팅방별 이용 내역 구현.

**Architecture:** Supabase의 별도 지갑 테이블과 서비스 전용 RPC를 Next.js API에서 호출. 브라우저는 원장을 조회하고 연습 지갑과 구분.

**Tech Stack:** Next.js, TypeScript, PostgreSQL/Supabase REST, Vitest, Playwright, PGlite(개발 검증 전용 고정 버전).

**Spec:** docs/superpowers/specs/2026-10-26-token-stage-two-design.md

---
## Global Constraints

- 기존 Next.js / TypeScript / Supabase REST 구조 유지, Native 실행. 새로운 결제·호스팅 연결 없음.
- Allman 스타일, 소스 각 줄 짧은 한글 주석, 한국어·영어 기존 지원 유지.
- 비밀 키는 서버 전용, 사용자 요청의 잔액·사용자 ID·보상량을 신뢰하지 않음.
- 실제 외부 계정 설정은 현재 없어 원격 DB 적용·실계정·두 물리 PC 검증은 별도 확인 필요.

---
## Review Focus

- 같은 요청 ID에 다른 등급·채팅방을 붙여 재사용하는 요청 거부.
- 반환 요청과 늦은 응답 확정의 경쟁에서 무료 응답 또는 중복 반환 방지.
- 백업 복원·다른 탭·계정 변경 이후 서버 지갑 덮어쓰기 및 타 계정 표시 방지.
- 삭제·이름 변경·특수문자를 포함한 채팅방 기록의 안전한 링크와 당시 이름 보존.
- 인증 만료·DB 장애·비밀 키 누락에서 로컬 잔액으로 실제 호출을 우회하지 못함.

---
### Task 1: 채팅별 이용 내역

**Files:** core/types.ts, core/app-reducer.ts, repositories/state-validation.ts, settings/TokenHistory.tsx, settings/TokenSettings.tsx, lib/story/token-ledger.ts, tests/integration/token-history.test.tsx, tests/e2e/token-history.spec.ts

**Interfaces:** TokenRecord에 optional conversationId/conversationTitle/characterId/versionId 추가. TokenHistory는 conversations 목록으로 현재 존재 여부 확인.

- [x] 날짜·시간·링크·삭제·옛 기록 테스트 작성, 실패 확인.
- [x] 차감 시 채팅 메타데이터 저장, 안전한 링크와 한국 시각 표시.
- [x] 해당 단위·통합 테스트 통과 확인 후 커밋.

---
### Task 2: 영속 서버 원장과 권한

**Files:** supabase/wallet-setup.sql, src/lib/wallet/types.ts, src/lib/wallet/server.ts, tests/unit/server-wallet.test.ts, tests/database/wallet.test.mjs

**Interfaces:** WalletSnapshot { wallet, records, rewards, revision }. 서비스 전용 mv_wallet_command(user_id,command,data) → JSON. 명령 read/reserve/settle/refund/assist/reward.

- [x] 실제 SQL 실행 테스트를 먼저 작성, 권한·잔액·중복·재시작·보상·경쟁 실패 확인.
- [x] 표·RLS·권한·원자적 RPC와 REST 어댑터 구현.
- [x] SQL과 어댑터 테스트 통과 확인 후 커밋.

---
### Task 3: 실제 호출과 화면 연결

**Files:** app/api/wallet/route.ts, app/api/chat/route.ts, app/api/chat/assist/route.ts, lib/llm/chat-caller.ts, lib/adapters/remote-llm-adapter.ts, features/tokens/use-server-wallet.ts, features/core/AppProvider.tsx, features/rewards/RewardsScreen.tsx, features/rewards/InviteSection.tsx, 관련 테스트

**Interfaces:** GET /api/wallet → WalletSnapshot, POST /api/wallet { reward }. 요청 headers에 x-wallet-request-id와 채팅 메타데이터, API 비용 계산은 검증한 ChatRequest만 사용. 서버 지갑 변경 후 wallet refresh 이벤트.

- [x] 인증·비밀 키 누락·중복 요청·빈 응답·환불·스냅샷 덮어쓰기 테스트 실패 확인.
- [x] API 예약/확정/반환, 보조 한도, 실제 계정의 화면 전용 지갑과 보상 연결.
- [x] 관련 단위·통합 테스트 통과 확인 후 커밋.

---
### Task 4: 통합 검증과 전달

**Files:** .env.example, docs/WALLET-SETUP.md, README.md, HANDOFF.md, NEXT-SESSION.md, i18n 사전, E2E 테스트

**Interfaces:** 운영 설정 SERVER_WALLET_ENABLED와 SUPABASE_SECRET_KEY(서버 전용), 기존 한도 환경 변수 유지.

- [x] 실제 SQL·전체 Vitest·typecheck·lint·production build·관련 E2E 실행.
- [ ] 새 리뷰어의 전체 변경 검토, 중요한 지적 회귀 테스트와 수정.
- [ ] 남은 외부 설정 및 미검증 항목 기록, main에 통합·푸시와 원격 해시 확인.
