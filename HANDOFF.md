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
| `2553009` | 밝은 다채색 디자인 2단계: 캐릭터 상세 화면, 태그를 탐색 페이지로 연결 |
| `ec96ae8` | 오른쪽 메뉴 페이지 1단계: `/settings/*` 하위 페이지 5개와 `/support`, 공통 설정 메뉴, 오른쪽 패널 링크 연결 |
| (최신) | 성인 인증과 헤더 `19+` 스위치: 모의 본인인증 창, 프로필 `성인 인증 ON/OFF` 배지, 19세 캐릭터 숨김·잠금, 제작 화면 이용 등급, 앱 상태 버전 7 → 8 |

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
- 개발 서버는 페이지를 처음 열 때 컴파일하므로, 컴퓨터가 바쁘면 "링크를 누른 뒤 5초 안에 주소가 바뀌지 않음" 형태의 시간 초과가 생길 수 있다. 이때는 프로덕션 빌드 서버로 실행하면 컴파일 지연 없이 정확히 검증된다.

```powershell
npm run build -- --webpack
Start-Process node -ArgumentList "node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","3005"
$env:PLAYWRIGHT_PORT = '3005'; npm run test:e2e -- --project=chromium --workers=1
```

  (Playwright는 이미 떠 있는 3005번 서버를 재사용한다. 검사가 끝나면 서버 프로세스를 종료한다.)

### 최근 검증 결과 (2026-10-01, 성인 인증 커밋)

- TypeScript, ESLint: 성공
- Vitest: 테스트 파일 35개, 테스트 255개 통과
- Playwright Chromium E2E(프로덕션 서버): 27개 통과
- Next.js Webpack 프로덕션 빌드: 성공
- 390px·800px 헤더(19+ 스위치 포함), 390px·1440px 설정·지원 페이지 가로 넘침 없음

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
- 설정·지원 페이지: 프로필 관리, 토큰 이용 내역, 화면 레이아웃, 알림과 선제 메시지, 개인정보 및 보안(데이터 관리 포함), 고객 지원(`/support`)
- 성인 인증(모의 본인인증)과 헤더 `19+` 스위치: 19세 이용가 캐릭터 숨김·잠금, 프로필 `성인 인증 ON/OFF` 배지, 제작 화면 이용 등급
- 모바일·태블릿·데스크톱 반응형 화면

세부 구현 기록은 `docs/text-play-download-development.md`를 기준으로 확인한다. 디자인 전환은 38장, 오류 처리는 30.10, Text-Play는 1~28장, 설정·지원 페이지는 39장, 성인 인증은 40장이다.

---

## 6. 진행 중인 작업: 밝은 다채색 디자인 전환

사용자가 정한 방향은 다음과 같다.

- 바탕: 어두운 남색에서 **흰색·밝은 바탕**으로 전환
- 색 체계: **페이지별 대표색 + 캐릭터 장르색**을 함께 사용
- 진행 방식: **단계별로 만들고 스크린샷으로 확인받은 뒤 다음 단계 진행**

| 단계 | 대상 | 상태 |
| --- | --- | --- |
| 1 | 공통 틀(헤더·좌우 패널·모바일 하단 메뉴), 메인 화면, 탐색 페이지 | 완료 |
| 2 | 캐릭터 상세 (`/characters/[id]`) | 완료 |
| 3 | 채팅 (`/chat/[characterId]`) | **다음 작업** |
| 4 | 보관함 (`/library`) | 예정 |
| 5 | 캐릭터 만들기·편집 (`/characters/new`, `/characters/[id]/edit`) | 예정 |
| 6 | 공통 안내 화면(404·오류), 전역 기본색 전환 | 예정 (설정 페이지는 7절 작업에서 밝은 디자인으로 완료) |

### 색 체계 요약

- 공통 변수(`src/app/globals.css`): `--mv-ink`, `--mv-muted`, `--mv-line`, `--mv-surface`, `--mv-canvas`, `--mv-focus`
- 페이지 대표색: 메뉴 `--page-home` 보라, 탐색 `--page-explore` 하늘, 랭킹 `--page-ranking` 분홍, 만들기 `--page-create` 초록, 보관함 `--page-library` 청록, 설정 `--page-settings` 파랑, Text-Play `--page-textplay` 주황
- 장르색: 요소에 `data-genre`를 붙이면 `--genre`, `--genre-soft`, `--genre-strong`, `--genre-glow`를 받는다. 장르는 `src/lib/theme/genre-theme.ts`의 `getGenreKey(tags)`가 태그 순서상 처음 나오는 장르(힐링·판타지·현대·로맨스·미스터리·SF, 없으면 기타)로 정한다.

### 전환 규칙

- 아직 바꾸지 않은 페이지(채팅·보관함·편집·설정)는 공통 틀의 어두운 바탕(`AppShell.module.css`의 `.shell`)과 `:root`의 밝은 글자색에 의존한다. **6단계 전까지 `.shell` 배경과 `:root` 기본 글자색을 바꾸지 않는다.**
- 전환한 페이지는 자체 바탕색과 `color: var(--mv-ink)`, `color-scheme: light`를 지정한다.
- 흰 글자를 올리는 채움색은 명도 대비 4.5:1 이상을 유지한다. 연한 배경 위 글자는 `--genre-strong`을 쓴다.
- 한글 제목·설명에는 `word-break: keep-all`, 키보드 초점은 `outline: 3px solid var(--mv-focus)`를 쓴다.
- 장식 요소가 가로로 넘치지 않도록 페이지 루트에 `overflow-x: clip`을 둔다.
- 각 단계마다 390px·820px·1440px 화면, 가로 넘침, 키보드 조작을 확인하고 스크린샷을 사용자에게 보여 준 뒤 커밋한다.
- 기존 테스트가 확인하는 링크 이름, 영역 이름, `data-tone`, 클래스명은 유지한다.
- 전환한 페이지의 최상위 요소에는 `data-surface="light"`를 붙인다. `AppShell.module.css`의 `.shell:has([data-surface="light"])` 규칙이 그 페이지에서만 공통 틀 바탕을 밝게 바꿔, 모바일 하단 메뉴 자리에 어두운 띠가 보이지 않는다. 현재 메인·탐색·Text-Play·캐릭터 상세·설정·지원 페이지에 붙어 있다.

### 2단계(캐릭터 상세) 완료 내용

- 글자·버튼·선택 상태는 대표 장르색(`main[data-genre]`), 캐릭터별 강조색(`--character-accent`)은 장식에만 쓴다. 강조색은 밝은 파스텔이라 흰 바탕 글자색으로 쓰면 대비가 부족하다.
- 태그는 탐색 페이지 링크, 연관 캐릭터 카드에는 장르 표시를 붙였다.
- 세부 내용은 개발 문서 38장 "2단계 적용 내용"을 따른다.

### 3단계(채팅) 착수 메모

- 주요 파일: `src/features/chat/ChatScreen.module.css`(약 220줄), `MessageList.module.css`(약 120줄), `ChatScreen.tsx`, `MessageList.tsx`, `MessageItem.tsx`, `ChatComposer.tsx`, `SceneViewer.tsx`, `LayoutSelector.tsx`
- 채팅은 긴 글을 오래 읽는 화면이므로 본문 글자 대비와 줄 간격을 우선한다. 캐릭터 장르색은 말풍선 강조·버튼에만 쓰고, 사용자·캐릭터 말풍선을 색으로 구분한다.
- 스트리밍 중(`aria-busy`), 실패·재시도, 메시지 수정·버전 전환(이전·다음), 삭제 확인 상태의 색을 모두 확인한다.
- 레이아웃 선택(장면·이야기·조작 3열)과 모바일 배치를 유지한다.
- 관련 테스트: `tests/integration/chat-flow.test.tsx`, `tests/components/layout-selector.test.tsx`, `tests/e2e/conversation-versioning.spec.ts`, `tests/e2e/character-detail.spec.ts`(대화 시작 흐름)

### 6단계(마지막) 할 일

- `globals.css`의 `:root`를 `color-scheme: light`, 밝은 배경·글자색으로 변경
- `AppShell.module.css`의 `.shell` 배경을 `var(--mv-canvas)`로 변경
- `StatusScreen`(404·오류)과 `global-error.tsx` 인라인 스타일을 밝은 디자인으로 변경

---

## 7. 진행 중인 작업: 오른쪽 메뉴 페이지

오른쪽 사용자 패널의 메뉴마다 페이지를 만든다. 사용자가 정한 방향은 다음과 같다.

- 주소: `/settings` 하위 페이지로 묶고 공통 왼쪽 메뉴를 둔다. 고객 지원만 `/support`로 분리한다. `/settings`는 `/settings/profile`로 307 이동한다(`next.config.ts`).
- 데이터 관리(내보내기·가져오기·백업·복구·초기화)는 개인정보 및 보안 페이지 안에 둔다(`/settings/privacy#data`).
- 범위: 1~3단계 전부, 단계마다 확인받으며 진행한다.

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1 | 페이지 틀과 공통 메뉴, 기존 탭 내용 이전, 오른쪽 패널 링크 연결 | 완료 |
| 2 | 저장 구조 변경 없이 되는 기능 확장 | **다음 작업** |
| 3 | 저장 구조 변경(앱 상태 버전 8 → 9): 토큰 사용 내역 등 | 예정 |

### 구조

- 메뉴 정의: `src/features/settings/settings-navigation.ts` 한 곳에서 오른쪽 패널(`UserPanel`)과 설정 왼쪽 메뉴(`SettingsShell`)가 함께 쓴다. 묶음 색은 계정 보라, 설정 파랑, 지원 초록이다.
- 공통 틀: `SettingsShell.tsx`(왼쪽 메뉴, 현재 페이지 `aria-current`, 모바일 가로 메뉴에서 현재 항목 자동 스크롤), `SettingsPageHeader`
- 페이지: `ProfileSettings`, `TokenSettings`, `DisplaySettings`, `NotificationSettings`, `PrivacySettings`(`src/features/settings/`), `SupportScreen`(`src/features/support/`)
- 공통 스타일: `SettingsScreen.module.css`(카드, 입력, 버튼, 수치 칸, 표, 안내 상자, FAQ). `DataManagement`도 이 파일을 쓴다.
- 토큰 비용표는 `src/lib/story/token-policy.ts`의 `tokenCosts`, `tokenActionLabels`를 쓴다.
- 테스트: `tests/integration/settings-pages.test.tsx`, `tests/e2e/settings.spec.ts`

### 2단계 할 일 (저장 구조 변경 없음)

- 프로필 관리: 활동 요약(만든 캐릭터·대화·좋아요·보관·팔로우 수), 팔로우한 제작자 목록과 해제, 멤버십 비교표(결제 없이 안내만)
- 화면 레이아웃: 레이아웃 9종(M1~M3·T1~T3·D1~D3)을 그림 카드로 보여 주고 현재 화면 추천 표시, 채팅 미리보기. `resolutionMode`는 지금 어디에도 적용되지 않으므로 적용하거나 제거한다.
- 알림과 선제 메시지: 허용 시간대를 하루 막대로 시각화
- 개인정보 및 보안: 장기 기억(`memories`) 보기·삭제, 내가 한 신고(`localReports`) 기록과 취소, 로그아웃을 실제 동작하는 "로컬 세션 정리"로 변경(지금은 확인 창만 뜬다)
- 고객 지원: FAQ 검색·주제 구분, 문의 초안 작성 후 복사, 진단 정보 복사(앱·데이터 버전, 저장 용량), 업데이트 소식

### 3단계 할 일 (앱 상태 버전 9)

버전 8은 성인 인증(8절)이 먼저 사용했다.


- 토큰 사용 내역: 사용할 때마다 날짜·종류·캐릭터·대화·차감량·남은 잔액을 기록. 기록 지점은 `chat-controller.ts`의 `trySpend` 호출부(자동 이미지, 메시지 보내기, 수정, 다시 생성, 직접 이미지)
- 하루 사용량 초기화: `dailyChatUsed`, `dailyImageUsed`가 날짜가 바뀌어도 0으로 돌아가지 않으므로 기준 날짜를 저장해 초기화
- 토큰 페이지: 사용 내역 목록과 기간·종류 필터, 최근 7일 사용 그래프
- 알림: 캐릭터별 선제 메시지 허용
- `LocalStorageGateway` 마이그레이션(8 → 9, `migrateVersionEight` 추가), 전체·대화 JSON 내보내기·가져오기 호환, 관련 단위 테스트

---

## 8. 성인 인증과 19+ 콘텐츠 (완료)

크랙의 언세이프티처럼 성인 인증 사용자만 헤더 `19+` 스위치로 19세 이용가 캐릭터를 켜고 끈다. 세부 규칙은 개발 문서 40장을 따른다.

- 19+를 끄면 추천 목록(메인·검색·탐색·랭킹·연관 캐릭터)에서 숨기고, 보관함·왼쪽 대화 목록·주소 직접 진입(상세·대화)은 흐리게 잠근다.
- 인증은 Mock 단계의 모의 본인인증 창(생년월일 + 동의)이다. 청소년 보호법 기준(19세가 되는 해부터)으로 판정하고, 생년월일은 저장하지 않으며, 1년 뒤 만료된다.
- 오른쪽 패널 `FREE 멤버십` 옆에 `성인 인증 ON/OFF` 배지, 프로필 관리(`/settings/profile#adult`)에 인증 카드(상태·방식·유효 기간·해제)가 있다.
- 19세 예시 캐릭터: `rank-017`, `rank-020`, `rank-030`, `rank-056`, `rank-060`, `rank-062`(공포·범죄 소재, 선정적 내용 없음)
- 캐릭터 제작의 `이용 등급`에서 19세 이용가는 성인 인증 후에만 고를 수 있다.
- 주요 파일: `src/features/adult/`(판정 로직, 인증 창, 훅, 스위치, 잠금 화면)
- 테스트: `tests/unit/adult-access.test.ts`, `tests/integration/adult-content.test.tsx`, `tests/e2e/adult-content.spec.ts`

---

## 9. 사용자 확인이 필요한 항목

- Text-Play 페이지의 파일 해시(SHA-256)·코드 서명 표시는 사용자 요청으로 삭제했다. 실제 설치 파일을 공개하기 전에 다시 표시해야 한다(`release-config.ts`에 값은 남아 있음).
- 성인 인증은 모의 인증이다. 실제 출시 전에 휴대폰 본인인증 업체(PASS·NICE 등) 연동, 서버 측 인증 기록, 연 1회 재인증 정책을 정해야 한다. 지금은 인증 여부가 브라우저 저장소와 내보낸 JSON에 그대로 들어간다.
- 제작자 데이터는 `메이트버스 랭킹 연구소` 한 명이 작품 93개를 갖고 나머지 7명은 1개씩이라, 탐색 페이지 제작자 카드의 썸네일이 대부분 한 칸이다.

---

## 10. 작업 규칙

- 응답과 문서는 한국어로 작성한다.
- 커밋 메시지는 한글 제목 한 줄(접두어 없음) + 영역별 소제목 아래 `- ~추가 / ~수정 / ~변경` 목록으로, 이전 버전과 비교해 바뀐 점을 쓴다. `Co-Authored-By: Claude` 같은 공동 작성자 표기는 넣지 않는다.
- 새 기능은 현재의 `AppState` 스키마와 `LocalStorageGateway` 마이그레이션 규칙을 함께 갱신한다.
- 대화 버전 수정은 원본 보존, 토큰 원자성, 분기 그래프 무결성을 깨뜨리지 않아야 한다.
- 삭제 기능은 실행 전에 로컬 백업을 만들고 백업 실패 시 변경을 중단한다.
- 코드 변경 뒤 TypeScript, ESLint, Vitest, 프로덕션 빌드를 모두 확인한다.
- 모든 새 코드에는 저장소의 기존 Allman 스타일과 짧은 한글 주석 규칙을 적용한다.
- 개발 서버를 띄우면 `next-env.d.ts`가 자동으로 바뀐다. 이 파일은 커밋하지 않는다(프로덕션 빌드 후 원래대로 돌아간다).

---

## 11. 로컬 데이터 이전 주의사항

Git에는 소스 코드와 기본 Mock 데이터만 포함된다. 현재 컴퓨터 브라우저에 저장된 사용자 대화, 캐릭터, 토큰 상태는 Git으로 이동하지 않는다.

1. 기존 컴퓨터에서 오른쪽 패널의 `개인정보 및 보안`(`/settings/privacy`) 진입
2. 데이터 관리의 `JSON 내보내기` 실행
3. 생성된 `mateverse-data.json` 파일을 새 컴퓨터로 이동
4. 새 컴퓨터의 같은 화면에서 JSON 파일 선택
5. 미리보기 확인 후 `가져오기 확인` 실행

앱 상태 버전 7 이하로 내보낸 JSON도 가져올 수 있다. 가져오면 버전 8로 바뀌고 성인 인증과 19+ 스위치는 꺼진 상태로 시작한다.

개별 대화만 옮길 때는 `보관함`의 대화별 `내보내기`와 `대화 파일 가져오기`를 사용한다. 비공개 프롬프트와 대화 내용이 포함될 수 있으므로 JSON 파일을 공개 저장소에 커밋하지 않는다.

---

## 12. 디자인 전환 이후 개발 우선순위

1. 로컬 대화 요약과 장기 기억 관리 화면 (개발 문서 30.4)
2. 메인 화면 정렬·복수 필터 개선 (30.5)
3. 캐릭터 편집 단계화와 초안 자동 저장 (30.6)
4. 대화상자 포커스 고정·복원, 모바일 패널 접근성 보강 (30.7)
5. README 작성과 `local-storage-gateway.ts`(약 870줄) 분리 (30.9)
6. 실제 LLM·이미지 공급자 선정 후 어댑터 연결

실제 API 키, 사용자 데이터, 결제 정보는 저장소에 커밋하지 않는다. 외부 공급자가 확정되기 전까지 Mock 흐름과 자동 테스트를 유지한다.

---

## 13. 주요 진입 주소

- 메인(메뉴): `http://localhost:3000/`
- 탐색: `http://localhost:3000/explore` (태그 예: `/explore?tag=힐링`)
- 하린 상세: `http://localhost:3000/characters/harin`
- 19세 잠금 예시: `http://localhost:3000/characters/rank-017` (19+를 켜기 전에는 잠금 화면)
- 보관함: `http://localhost:3000/library`
- 설정: `http://localhost:3000/settings` → 프로필 관리(`/settings/profile`), 토큰(`/settings/tokens`), 화면(`/settings/display`), 알림(`/settings/notifications`), 개인정보·데이터 관리(`/settings/privacy`)
- 고객 지원: `http://localhost:3000/support`
- Text-Play: `http://localhost:3000/text-play`
- GitHub 커밋: `https://github.com/siwoo440/ChatBot/commits/main/`
