---

# ChatBot 개발 인수인계

이 문서는 다른 컴퓨터에서 GitHub `main` 브랜치를 불러와 개발을 바로 이어가기 위한 기준 문서다. 마지막 갱신: 2026-10-01.

---

## 1. 저장소 기준

- 저장소: `https://github.com/siwoo440/ChatBot.git`
- 기준 브랜치: `main` (항상 `origin/main`을 최종 기준으로 사용)
- 최신 상태 확인: `git log -5 --oneline`
- 공급자 모드: 외부 API를 사용하지 않는 로컬 Mock
- 데이터 저장 위치: 브라우저 `localStorage`

### 2026-10-01 커밋 이력 정리

영어 커밋 28개를 한글 커밋 6개로 통합하면서 `main` 이력을 다시 썼다(강제 푸시). 정리 전 이력은 원격 `backup/before-korean-history` 브랜치에 보관되어 있다.

- **정리 전에 복제한 컴퓨터**는 `git pull`이 실패한다. 커밋하지 않은 작업이 없는지 확인한 뒤 아래 명령으로 맞춘다.

```powershell
git fetch origin
git reset --hard origin/main
```

- 정리 후 이력: `5ce5a5e`(초기 소스) → `e09ccb5`(스트리밍) → `01f200e`(캐릭터 상세) → `e5fdf37`(대화 버전) → `0334d56`(무결성 수정) → `c3f9cc2`(인수인계 문서) → 이후 2절의 작업 커밋

---

## 2. 2026-10-01 작업 기록

| 커밋 | 내용 |
| --- | --- |
| `eeb0c8a` | Next.js 16.3.5 → 16.3.8 보안 패치(`next/og` 원격 코드 실행 취약점 GHSA-vcvr-r3jv-pc5j), `npm audit` 0건 |
| `5a54c68` | Text-Play 소개(`/text-play`)와 Windows 다운로드(`/text-play/download`)를 한 페이지로 통합, 헤더 버튼 하나로 정리, 이전 주소는 308 영구 이동 |
| `4d18063` | 404·오류·전역 오류 화면 추가, 없는 캐릭터 대화 주소에서 앱이 멈추던 문제 수정, 저장소 복구 안내·읽기 실패 보호·저장공간 부족 안내 추가 |
| `3221d8f` | Text-Play 페이지를 주황·노랑·흰색 디자인으로 개편, SVG 일러스트 추가, 다운로드 정보 구역과 상단 바로가기 링크 삭제(사용자 요청) |
| `4fbbd3e` | 밝은 다채색 디자인 1단계: 공통 틀(헤더·좌우 패널·모바일 하단 메뉴)과 메인 화면, 색 변수와 장르색 체계 추가 |
| `5c141f5` | 탐색 페이지(`/explore`) 추가: 태그 검색, 장르별 추천 작품, 주목할 제작자, 인기 태그. 헤더 `탐색` → `메뉴` 변경 후 오른쪽에 `탐색` 추가 |

---

## 3. 다른 컴퓨터에서 시작하는 순서

Node.js `20.9.0` 이상과 Git이 필요하다.

```powershell
git clone https://github.com/siwoo440/ChatBot.git
cd ChatBot
npm ci
Copy-Item .env.example .env.local
npm run dev
```

개발 서버 기본 주소는 `http://localhost:3000/`이다. 같은 컴퓨터에서 다른 프로젝트가 3000번을 쓰면 `npx next dev -p 3001`처럼 포트를 바꾼다.

기존 복제본(이력 정리 이후 복제)에서 이어갈 때는 다음 순서를 사용한다.

```powershell
git switch main
git pull --ff-only origin main
npm ci
npm run dev
```

---

## 4. 필수 검증 명령

```powershell
npm run typecheck
npm run lint
npm run test:run
npm run build -- --webpack
```

브라우저 종단(E2E) 검증은 Chromium을 설치한 뒤 실행한다.

```powershell
npx playwright install chromium
npm run test:e2e -- --project=chromium --workers=1
```

### E2E 실행 주의사항

- `playwright.config.ts`는 `PLAYWRIGHT_PORT`(기본 3000)의 `127.0.0.1` 주소에 자체 개발 서버(webpack)를 띄우고, 이미 떠 있는 서버가 있으면 재사용한다.
- 3000번에 **다른 프로젝트 서버**가 떠 있으면 그 서버를 테스트하게 되므로, 비어 있는 포트를 지정한다.

```powershell
$env:PLAYWRIGHT_PORT = '3005'; npm run test:e2e -- --project=chromium --workers=1
```

- `localhost`로 띄운 개발 서버를 `127.0.0.1`로 재사용하면 Next.js 16이 다른 출처의 개발용 스크립트를 차단해 화면이 "로컬 대화를 불러오는 중"에서 멈춘다. E2E는 Playwright가 직접 띄운 서버로 실행한다. 같은 폴더에서 개발 서버 두 개를 동시에 띄우지 않는다.
- 데스크톱 크기에서는 왼쪽 대화 패널이 기본으로 열려 본문 클릭을 가린다. 새 E2E는 제목이 보인 뒤(상태 복원 완료) `Escape`나 `열린 패널 닫기`로 패널을 닫고 진행한다.
- 첫 실행 시 페이지 컴파일이 느려 `character-detail.spec.ts` 첫 테스트가 간헐적으로 시간 초과될 수 있다. 다시 실행하면 통과한다.

### 최근 검증 결과 (2026-10-01, `5c141f5`)

- TypeScript, ESLint: 성공
- Vitest: 테스트 파일 33개, 테스트 234개 통과
- Playwright Chromium E2E: 22개 통과
- Next.js Webpack 프로덕션 빌드: 성공
- `npm audit`: 취약점 0건
- 390px·1440px 화면 가로 넘침 없음(메인, 탐색, Text-Play)

---

## 5. 현재 구현 상태

- 메인 화면(헤더 `메뉴`): 추천, 실시간 랭킹 TOP 10, 장르 필터, 검색
- 탐색 화면(`/explore`): 태그 검색과 결과(`?tag=` 주소 유지), 장르별 추천 작품, 주목할 제작자(팔로우), 인기 태그
- 캐릭터 상세, 캐릭터 생성·편집
- 캐릭터별 대화 시작과 여러 대화 보관
- Mock 기반 스트리밍 응답, 중단, 재시도, 다시 생성
- 메시지 복사, 수정, 삭제와 수정 지점별 대화 버전, 버전 URL 복원
- 대화·전체 데이터 JSON 내보내기와 가져오기
- 토큰, 관계, 감정, 장면 상태의 로컬 진행
- 404·오류 화면, 저장소 복구 안내, 읽기 실패 시 저장 차단, 저장공간 부족 안내
- Text-Play 소개·다운로드 통합 페이지(`/text-play`, 설치 파일 미등록이라 버튼 비활성)
- 모바일·태블릿·데스크톱 반응형 화면

세부 구현 기록은 `docs/text-play-download-development.md`를 기준으로 확인한다. 디자인 전환은 38장, 오류 처리는 30.10, Text-Play는 1~28장이다.

---

## 6. 진행 중인 작업: 밝은 다채색 디자인 전환

사용자가 정한 방향은 다음과 같다.

- 바탕: 어두운 남색에서 **흰색·밝은 바탕**으로 전환
- 색 체계: **페이지별 대표색 + 캐릭터 장르색**을 함께 사용
- 진행 방식: **단계별로 만들고 스크린샷으로 확인받은 뒤 다음 단계 진행**

| 단계 | 대상 | 상태 |
| --- | --- | --- |
| 1 | 공통 틀(헤더·좌우 패널·모바일 하단 메뉴), 메인 화면, 탐색 페이지 | 완료 |
| 2 | 캐릭터 상세 (`/characters/[id]`) | **다음 작업** |
| 3 | 채팅 (`/chat/[characterId]`) | 예정 |
| 4 | 보관함 (`/library`) | 예정 |
| 5 | 캐릭터 만들기·편집 (`/characters/new`, `/characters/[id]/edit`) | 예정 |
| 6 | 설정(`/settings`), 공통 안내 화면, 전역 기본색 전환 | 예정 |

### 색 체계 요약

- 공통 변수(`src/app/globals.css`): `--mv-ink`, `--mv-muted`, `--mv-line`, `--mv-surface`, `--mv-canvas`, `--mv-focus`
- 페이지 대표색: 메뉴 `--page-home` 보라, 탐색 `--page-explore` 하늘, 랭킹 `--page-ranking` 분홍, 만들기 `--page-create` 초록, 보관함 `--page-library` 청록, 설정 `--page-settings` 파랑, Text-Play `--page-textplay` 주황
- 장르색: 요소에 `data-genre`를 붙이면 `--genre`, `--genre-soft`, `--genre-strong`, `--genre-glow`를 받는다. 장르는 `src/lib/theme/genre-theme.ts`의 `getGenreKey(tags)`가 태그 순서상 처음 나오는 장르(힐링·판타지·현대·로맨스·미스터리·SF, 없으면 기타)로 정한다.

### 전환 규칙

- 아직 바꾸지 않은 페이지(상세·채팅·보관함·편집·설정)는 공통 틀의 어두운 바탕(`AppShell.module.css`의 `.shell`)과 `:root`의 밝은 글자색에 의존한다. **6단계 전까지 `.shell` 배경과 `:root` 기본 글자색을 바꾸지 않는다.**
- 전환한 페이지는 자체 바탕색과 `color: var(--mv-ink)`, `color-scheme: light`를 지정한다.
- 흰 글자를 올리는 채움색은 명도 대비 4.5:1 이상을 유지한다. 연한 배경 위 글자는 `--genre-strong`을 쓴다.
- 한글 제목·설명에는 `word-break: keep-all`, 키보드 초점은 `outline: 3px solid var(--mv-focus)`를 쓴다.
- 장식 요소가 가로로 넘치지 않도록 페이지 루트에 `overflow-x: clip`을 둔다.
- 각 단계마다 390px·820px·1440px 화면, 가로 넘침, 키보드 조작을 확인하고 스크린샷을 사용자에게 보여 준 뒤 커밋한다.
- 기존 테스트가 확인하는 링크 이름, 영역 이름, `data-tone`, 클래스명은 유지한다.

### 2단계(캐릭터 상세) 착수 메모

- 주요 파일: `src/features/character/CharacterDetail.module.css`(약 1,470줄), `CharacterDetail.tsx`, `CharacterHero.tsx`, `CharacterStoryInfo.tsx`, `ConversationSetup.tsx`, `ProloguePreview.tsx`, `CharacterDiscoverySections.tsx`, `CharacterActionBar.tsx`, `CharacterReportDialog.tsx`
- 상세 화면은 프로필별 `--character-accent`와 흐린 배경 이미지(`.background`)를 쓴다. 장르색(`data-genre`)과 강조색을 어떻게 합칠지 정한 뒤 밝은 바탕으로 바꾼다.
- 상세 화면의 태그를 탐색 페이지(`createExploreHref(tag)`)로 연결하면 메인 화면과 동작이 맞는다.
- 관련 테스트: `tests/integration/character-detail.test.tsx`, `tests/unit/character-detail-model.test.ts`, `tests/e2e/character-detail.spec.ts`

### 6단계(마지막) 할 일

- `globals.css`의 `:root`를 `color-scheme: light`, 밝은 배경·글자색으로 변경
- `AppShell.module.css`의 `.shell` 배경을 `var(--mv-canvas)`로 변경
- `StatusScreen`(404·오류)과 `global-error.tsx` 인라인 스타일을 밝은 디자인으로 변경

---

## 7. 사용자 확인이 필요한 항목

- 모바일 하단 메뉴 첫 칸은 `홈`으로 두었다. 헤더처럼 `메뉴`로 맞출지 확인이 필요하다.
- Text-Play 페이지의 파일 해시(SHA-256)·코드 서명 표시는 사용자 요청으로 삭제했다. 실제 설치 파일을 공개하기 전에 다시 표시해야 한다(`release-config.ts`에 값은 남아 있음).
- 제작자 데이터는 `메이트버스 랭킹 연구소` 한 명이 작품 93개를 갖고 나머지 7명은 1개씩이라, 탐색 페이지 제작자 카드의 썸네일이 대부분 한 칸이다.

---

## 8. 작업 규칙

- 응답과 문서는 한국어로 작성한다.
- 커밋 메시지는 한글 제목 한 줄(접두어 없음) + 영역별 소제목 아래 `- ~추가 / ~수정 / ~변경` 목록으로, 이전 버전과 비교해 바뀐 점을 쓴다. `Co-Authored-By: Claude` 같은 공동 작성자 표기는 넣지 않는다.
- 새 기능은 현재의 `AppState` 스키마와 `LocalStorageGateway` 마이그레이션 규칙을 함께 갱신한다.
- 대화 버전 수정은 원본 보존, 토큰 원자성, 분기 그래프 무결성을 깨뜨리지 않아야 한다.
- 삭제 기능은 실행 전에 로컬 백업을 만들고 백업 실패 시 변경을 중단한다.
- 코드 변경 뒤 TypeScript, ESLint, Vitest, 프로덕션 빌드를 모두 확인한다.
- 모든 새 코드에는 저장소의 기존 Allman 스타일과 짧은 한글 주석 규칙을 적용한다.
- 개발 서버를 띄우면 `next-env.d.ts`가 자동으로 바뀐다. 이 파일은 커밋하지 않는다(프로덕션 빌드 후 원래대로 돌아간다).

---

## 9. 로컬 데이터 이전 주의사항

Git에는 소스 코드와 기본 Mock 데이터만 포함된다. 현재 컴퓨터 브라우저에 저장된 사용자 대화, 캐릭터, 토큰 상태는 Git으로 이동하지 않는다.

1. 기존 컴퓨터에서 `설정` 화면 진입
2. 데이터 관리의 `JSON 내보내기` 실행
3. 생성된 `mateverse-data.json` 파일을 새 컴퓨터로 이동
4. 새 컴퓨터의 같은 화면에서 JSON 파일 선택
5. 미리보기 확인 후 `가져오기 확인` 실행

개별 대화만 옮길 때는 `보관함`의 대화별 `내보내기`와 `대화 파일 가져오기`를 사용한다. 비공개 프롬프트와 대화 내용이 포함될 수 있으므로 JSON 파일을 공개 저장소에 커밋하지 않는다.

---

## 10. 디자인 전환 이후 개발 우선순위

1. 로컬 대화 요약과 장기 기억 관리 화면 (개발 문서 30.4)
2. 메인 화면 정렬·복수 필터 개선 (30.5)
3. 캐릭터 편집 단계화와 초안 자동 저장 (30.6)
4. 대화상자 포커스 고정·복원, 모바일 패널 접근성 보강 (30.7)
5. README 작성과 `local-storage-gateway.ts`(약 870줄) 분리 (30.9)
6. 실제 LLM·이미지 공급자 선정 후 어댑터 연결

실제 API 키, 사용자 데이터, 결제 정보는 저장소에 커밋하지 않는다. 외부 공급자가 확정되기 전까지 Mock 흐름과 자동 테스트를 유지한다.

---

## 11. 주요 진입 주소

- 메인(메뉴): `http://localhost:3000/`
- 탐색: `http://localhost:3000/explore` (태그 예: `/explore?tag=힐링`)
- 하린 상세: `http://localhost:3000/characters/harin`
- 보관함: `http://localhost:3000/library`
- 설정·데이터 관리: `http://localhost:3000/settings`
- Text-Play: `http://localhost:3000/text-play`
- GitHub 커밋: `https://github.com/siwoo440/ChatBot/commits/main/`
