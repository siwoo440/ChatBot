# Mate Verse ChatBot

캐릭터와 일대일로 대화하고, 여러 인물과 스토리를 이어 가는 AI 캐릭터 채팅 웹 서비스입니다. 지금은 외부 서비스 없이 브라우저만으로 돌아가는 개발 단계입니다.

- 대화 응답과 이미지는 **연습용(Mock)** 입니다. 실제 AI 모델은 아직 연결하지 않았습니다.
- 캐릭터·대화·토큰 같은 모든 데이터는 **지금 쓰는 브라우저에만** 저장됩니다(`localStorage`). 서버와 로그인은 없습니다.
- 화면 언어는 한국어와 영어를 지원합니다.

## 빠른 시작

Node.js `20.9.0` 이상과 Git이 필요합니다.

```powershell
git clone https://github.com/siwoo440/ChatBot.git
cd ChatBot
npm ci
Copy-Item .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000/`을 엽니다. 3000번을 다른 프로젝트가 쓰고 있으면 `npx next dev -p 3001`처럼 포트를 바꿉니다.

## 명령

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | 문법·규칙 검사 |
| `npm run test:run` | 단위·통합 테스트(Vitest) |
| `npm run build -- --webpack` | 배포용 빌드 |
| `npm run test:e2e -- --project=chromium --workers=1` | 실제 브라우저 테스트(Playwright) |
| `node scripts/i18n-keys.ts` | 영어 사전에 빠진 화면 글자 찾기 |

실제 브라우저 테스트는 처음 한 번 `npx playwright install chromium`으로 브라우저를 설치해야 합니다. 다른 프로젝트가 3000번을 쓰고 있으면 비어 있는 포트를 지정합니다.

```powershell
$env:PLAYWRIGHT_PORT = '3005'; npm run test:e2e -- --project=chromium --workers=1
```

테스트를 돌릴 때의 주의 사항은 `HANDOFF.md` 4절에 있습니다.

## 폴더 구조

```text
src/app          페이지 주소(Next.js App Router)
src/components   여러 화면이 함께 쓰는 틀(머리말, 옆 패널, 대화상자, 검색창)
src/features     기능별 화면과 규칙(캐릭터, 채팅, 스토리, 보관함, 설정, 보상 등)
src/lib          저장소, 연습용 AI, 번역(i18n), 토큰 규칙, 날짜 도구
src/mocks        기본으로 들어 있는 예시 캐릭터와 스토리
tests/unit       규칙 단위 테스트
tests/components tests/integration   화면 테스트(jsdom)
tests/e2e        실제 브라우저 테스트
docs             개발 문서, 그림 요청 기록
```

## 주요 화면

| 주소 | 화면 |
| --- | --- |
| `/` | 메인(캐릭터 찾기, 정렬·필터, `#태그` 검색) |
| `/explore` | 탐색(태그 여러 개로 좁히기, 제작자, 인기 태그) |
| `/stories` | 스토리 모드 |
| `/chat/[캐릭터]` | 캐릭터 대화 |
| `/library` | 보관함(내 작품, 대화, 책갈피) |
| `/characters/new`, `/stories/new` | 캐릭터·스토리 만들기 |
| `/images` | 이미지 스튜디오 |
| `/rewards` | 출석과 미션, 친구 초대 |
| `/settings/*`, `/support` | 설정과 고객 지원 |
| `/text-play` | Windows용 Text-Play 소개 |

## 데이터와 설정

- 저장 위치: 브라우저 `localStorage`의 `mateverse:v1:state`. 다른 기기로 옮기려면 `개인정보 및 보안 → 데이터 관리`에서 JSON으로 내보낸 뒤 가져옵니다.
- 저장 구조가 바뀌면 예전 데이터를 자동으로 새 구조로 바꿉니다(`src/lib/repositories/state-migrations.ts`).
- 환경 변수는 `.env.example`을 복사해 `.env.local`로 씁니다. 지금은 연습용 모드만 있습니다(`NEXT_PUBLIC_PROVIDER_MODE=mock`). 비밀 값은 저장소에 올리지 않습니다.
- `NEXT_PUBLIC_SERVICE_REGION`을 정하지 않으면 한국(`kr`) 기준으로 동작합니다.

## 아직 없는 것

실제 대화 AI, 실제 이미지 생성, 로그인과 서버 저장, 결제, 실제 성인 인증은 외부 서비스가 필요해 만들지 않았습니다. 성인 인증과 멤버십, 토큰 충전은 화면만 있는 모의 기능입니다.

## 문서

- `HANDOFF.md`: 지금 상태, 작업 규칙, 단계별 로드맵(13절). 작업을 이어받을 때 먼저 읽습니다.
- `docs/text-play-download-development.md`: 기능별 설계와 검증 기록.
- `docs/image-requests.md`: 그림 요청 기록.
