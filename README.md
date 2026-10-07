# Mate Verse ChatBot

캐릭터와 일대일로 대화하고, 여러 인물과 스토리를 이어 가는 AI 캐릭터 채팅 웹 서비스입니다. 지금은 외부 서비스 없이 브라우저만으로 돌아가는 개발 단계입니다.

- 대화 응답과 이미지는 기본이 **연습용(Mock)** 입니다. 실제 AI 대화는 내 컴퓨터에서 혼자 시험할 때만 켤 수 있습니다(아래 「실제 AI로 대화하기」).
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
- 환경 변수는 `.env.example`을 복사해 `.env.local`로 씁니다. 비밀 값은 저장소에 올리지 않습니다.
- `NEXT_PUBLIC_SERVICE_REGION`을 정하지 않으면 한국(`kr`) 기준으로 동작합니다. 쓸 수 있는 환경 변수는 모두 `.env.example`에 설명과 함께 있습니다.

## 실제 AI로 대화하기 (내 컴퓨터에서 혼자 시험)

채팅 등급은 일곱 개이고 등급마다 연결하는 모델이 정해져 있습니다. 열쇠를 넣은 회사의 등급과 내 컴퓨터에 모델을 설치한 오픈챗만 실제 AI로 답하고, 나머지는 연습용 AI가 답합니다.

| 등급 | 모델 | 필요한 열쇠 |
| --- | --- | --- |
| 베이직챗 | Gemini Flash | `GEMINI_API_KEY` |
| 스마트챗 | Gemini Pro | `GEMINI_API_KEY` |
| 밸런스챗 | GPT | `OPENAI_API_KEY` |
| 플러스챗 | Claude Sonnet | `ANTHROPIC_API_KEY` |
| 프리미엄챗 | Claude Opus | `ANTHROPIC_API_KEY` |
| 마스터챗 | Claude Fable | `ANTHROPIC_API_KEY` |
| 오픈챗 | 내 컴퓨터에 설치한 공개 모델 | 없음(`CHAT_MODEL_OPEN`에 모델 이름) |

1. 쓰려는 회사에 가입해 열쇠(API 키)를 발급받고, 그 회사 화면에서 월 사용 한도를 걸어 둡니다.
2. `.env.local`에서 `ENABLE_REAL_PROVIDERS=true`로 바꾸고 열쇠를 `=` 뒤에 붙여 넣습니다.
3. 개발 서버를 다시 켭니다. 채팅 화면의 등급 목록에 `실제 AI`라고 표시된 등급이 실제 AI로 답합니다.

- 열쇠는 서버(`src/app/api/chat/route.ts`)만 읽습니다. 브라우저에는 보내지 않습니다.
- 로그인이 없는 동안은 `localhost`로 온 요청만 받고 1분에 20번까지만 받습니다. 배포한 주소에서는 실제 AI가 꺼집니다.
- 19세 작품은 외부 AI 회사의 약관 때문에 오픈챗(내 컴퓨터 모델)만 실제 AI로 답하고, 다른 등급은 연습용 AI가 답합니다.
- 모델 이름이 바뀌면 `.env.local`의 `CHAT_MODEL_등급`으로 바꿉니다(예: `CHAT_MODEL_BASIC=...`).
- 테스트는 실제 AI를 끈 서버에서 돌립니다: `ENABLE_REAL_PROVIDERS=false`.

### 19세 작품을 내 컴퓨터 모델로 (오픈챗)

Claude·Gemini·GPT는 약관으로 성인 대화를 금지합니다. 그래서 19세 작품은 누구나 내려받을 수 있는 공개 모델을 내 컴퓨터에서 직접 돌려 답합니다. 돈이 들지 않고 대화가 컴퓨터 밖으로 나가지 않습니다.

1. [Ollama](https://ollama.com/download)를 설치합니다(관리자 권한 없이 설치되고 뒤에서 계속 켜져 있습니다).
2. 모델을 내려받습니다. 그래픽카드 메모리가 16GB면 `ollama pull qwen3:14b`(9.3GB)로 시작합니다.
3. 한 번에 읽는 분량을 16k로 올립니다. 기본값 4k로는 캐릭터 설정과 대화가 다 들어가지 않아 앞부분이 잘립니다. Ollama 설정의 `Context length`를 올리거나, 아래처럼 16k로 맞춘 모델 사본을 만듭니다(새로 내려받지 않습니다).
4. `.env.local`에서 `ENABLE_REAL_PROVIDERS=true`, `CHAT_MODEL_OPEN=qwen3-14b-16k`(사본을 만들지 않았으면 `qwen3:14b`)로 적고 개발 서버를 다시 켭니다.
5. 채팅 화면의 등급 목록에서 `오픈챗`을 고릅니다. 19세 작품에서는 오픈챗이 맨 위에 나옵니다.

```powershell
Set-Content Modelfile "FROM qwen3:14b`nPARAMETER num_ctx 16384"
ollama create qwen3-14b-16k -f Modelfile
```

- 모델을 처음 부를 때는 그래픽카드에 올리느라 40~50초쯤 걸리고, 그 뒤로는 답 하나에 1~2초입니다(RTX 5070 Ti 16GB 기준). 5분쯤 쓰지 않으면 다시 내려갑니다.
- 상업 서비스에 쓸 수 있는 조건(MIT·Apache 2.0)의 모델만 씁니다. Gemma는 성인 챗봇을 금지하고, 커뮤니티 롤플레이 모델은 비상업 조건이 많습니다.
- 미성년자나 미성년자로 보이는 인물, 실존 인물은 오픈챗에서도 지시문으로 금지합니다.
- 프로그램이 꺼져 있거나 모델 이름이 다르면 채팅 화면이 이유를 알려 줍니다.

## 아직 없는 것

실제 이미지 생성, 로그인과 서버 저장, 결제, 실제 성인 인증은 외부 서비스가 필요해 만들지 않았습니다. 성인 인증과 멤버십, 토큰 충전은 화면만 있는 모의 기능입니다. 실제 AI 대화는 내 컴퓨터에서 혼자 시험하는 용도까지만 열려 있습니다.

## 문서

- `NEXT-SESSION.md`: 다른 컴퓨터나 새 대화에서 이어갈 때 그대로 붙여 넣을 말과 지금 상태, 다음에 할 일. 커밋할 때마다 고칩니다.
- `HANDOFF.md`: 지금까지 한 일의 전체 기록, 작업 규칙, 단계별 로드맵(13절).
- `docs/text-play-download-development.md`: 기능별 설계와 검증 기록.
- `docs/ACCOUNT-SETUP.md`: 실제 로그인과 서버 저장(Supabase, Google 로그인)을 연결하는 순서.
- `docs/SERVICES.md`: 외부 서비스마다의 역할, 연결 상태, 비용(조사한 날과 출처 포함).
- `docs/policy/`: 개인정보처리방침과 이용약관 초안(시행 전), 정해 줄 것과 법률 검토 때 볼 것.
- `docs/image-requests.md`: 그림 요청 기록.
