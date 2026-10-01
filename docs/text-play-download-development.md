---
# MATE Text-Play Windows 다운로드 페이지 개발 문서

이 문서는 `main` 브랜치의 MATE Text-Play 페이지를 처음 접하는 개발자가 구조, 데이터 흐름, 수정 지점, 테스트 방법, 배포 전 준비 사항까지 한 번에 이해할 수 있도록 정리한 개발 문서다. 처음에는 제품 소개(`/text-play`)와 Windows 다운로드 확인(`/text-play/download`)이 별도 화면이었지만, 현재는 소개와 다운로드를 `/text-play` 한 페이지로 통합했다.

확인되지 않은 실제 배포 정보는 추측하지 않는다. 설치 파일, 버전, 용량, 게시일, 코드 서명, 해시, 지원 Windows 버전, 최소 시스템 요구사항은 현재 `확인 필요` 상태다.

---
## 1. 문서 기준

| 항목 | 값 |
| --- | --- |
| 저장소 | `siwoo440/ChatBot` |
| 기준 브랜치 | `main` |
| 기준 | 이 문서가 포함된 현재 브랜치의 `HEAD` |
| 페이지 구성 | 소개와 다운로드를 합친 단일 페이지 `/text-play` |
| 화면 테마 | 오렌지·노랑·흰색 라이트 테마 |
| 구현 프레임워크 | Next.js App Router |
| 기본 언어 | TypeScript, React, CSS Modules |
| 현재 배포 상태 | 다운로드 준비 중 |
| 실제 설치 파일 | 없음 또는 확인되지 않음 |
| 배포 메타데이터·파일 안전 정보 화면 표시 | 없음, `release-config.ts` 설정에만 유지 |
| 다운로드 API | 없음 |
| Tauri 실행 프로그램 | 이번 구현 범위에서 제외 |

---
## 2. 구현 목적

이번 개발의 목적은 기존 Mate Verse Character Chat 웹 앱 안에 Text-Play 제품 소개와 Windows 프로그램 다운로드 흐름을 한 페이지로 제공하는 것이다.

사용자는 다음 작업을 할 수 있다.

- 상단 공통 메뉴의 `Text-Play 다운로드` 또는 모바일 하단 메뉴의 `Text-Play`로 페이지 이동
- 첫 화면에서 제품 소개, 배포 상태, 다운로드 버튼, 출시 전 화면 구성 예시를 함께 확인
- 핵심 요약 4개 항목 확인
- 한 장면이 진행되는 3단계 흐름 확인
- 주요 기능 확인
- Character Chat과 Text-Play의 차이 확인
- 설치 순서 확인
- FAQ 확인
- 하단 안내의 `다운로드 버튼으로 이동` 링크로 상단 다운로드 버튼에 복귀
- `Character Chat 체험하기` 링크로 기존 웹 서비스 이동
- 실제 다운로드 URL이 있을 때 설치 파일 다운로드

현재 실제 배포 파일이 없으므로 다운로드 버튼은 의도적으로 비활성화되어 있다.

버전, 채널, 파일 형식, 용량, 게시일, 파일명, 지원 Windows, 최소 시스템 요구사항, SHA-256, 코드 서명 상태는 사용자 요청에 따라 화면에서 제거했다. 값을 담는 필드는 `release-config.ts`에 그대로 남아 있으며, 실제 배포 파일을 공개하기 전에는 최소한 파일 해시와 코드 서명 정보를 화면에 다시 표시해야 한다.

---
## 3. 구현 범위와 제외 범위

---
### 구현 범위

- `/text-play` 제품 소개와 Windows 다운로드 버튼을 합친 단일 페이지
- 이전 주소 `/text-play/download`의 `/text-play` 영구 이동(HTTP 308)
- 공통 데스크톱 헤더 메뉴 연결
- 모바일 하단 메뉴 연결
- 정적 배포 설정 모듈
- 다운로드 URL 안전성 검사
- URL 유무에 따른 활성·비활성 동작
- 준비 중, 베타, 정식 배포 상태 표시
- 출시 전 런처 화면 구성 예시와 SVG 장면 일러스트
- 오렌지·노랑·흰색 라이트 테마
- 반응형 레이아웃
- 키보드 포커스와 기본 접근성 처리
- 단위·통합·공통 메뉴·E2E 테스트

---
### 제외 범위

- Tauri 애플리케이션 구현
- EXE 또는 MSI 설치 파일 생성
- 설치 파일 업로드
- 코드 서명 인증서 구매 및 서명
- 자동 업데이트 서버
- 배포 정보 API
- 다운로드 통계 API
- 결제 및 크레딧 차감
- LLM API 변경
- 로컬 세이브 저장 경로 확정
- 개인정보처리방침, 이용약관, 고객지원 실제 페이지
- 배포 메타데이터, 지원 Windows, 최소 시스템 요구사항, 파일 안전 정보(SHA-256, 코드 서명)의 화면 표시. 사용자 요청으로 제거했으며 실제 배포 전에 복원해야 한다.

---
## 4. 기술 환경

| 구분 | 패키지 또는 설정 |
| --- | --- |
| 웹 프레임워크 | Next.js `^16.3.8` |
| UI | React `^19.3.0` |
| 언어 | TypeScript `^5.9.3` |
| 단위·통합 테스트 | Vitest `^5.0.1` |
| 컴포넌트 테스트 | Testing Library |
| 브라우저 테스트 기반 | Playwright `^1.63.0` |
| 린트 | ESLint `^9.39.5` |
| 패키지 관리자 기준 | `package-lock.json`이 있으므로 npm 기준 |
| TypeScript 경로 별칭 | `@/*` → `src/*` |
| Next.js 경로 검사 | `typedRoutes: true` |

Node.js 버전은 저장소에서 고정하지 않았다. 개발 환경을 통일하려면 향후 `package.json`의 `engines` 또는 `.nvmrc` 추가가 필요하다.

---
## 5. 빠른 실행 방법

프로젝트 루트에서 다음 순서로 실행한다.

| 순서 | 명령 | 목적 |
| --- | --- | --- |
| 1 | `npm install` | 의존성 설치 |
| 2 | `npm run dev` | 기본 개발 서버 실행 |
| 3 | `npm run test:run` | 전체 Vitest 실행 |
| 4 | `npm run typecheck` | TypeScript 검사 |
| 5 | `npm run lint` | ESLint 검사 |
| 6 | `npm run build` | 프로덕션 빌드 |
| 7 | `npm run test:e2e` | Playwright E2E 실행 |

기본 개발 서버 주소는 `http://localhost:3000`이다. 포트가 사용 중이면 `npm run dev -- --webpack -p 3010`처럼 다른 포트를 지정할 수 있다.

확인 경로는 다음과 같다.

| 화면 | 기본 주소 |
| --- | --- |
| Text-Play 소개·다운로드 | `http://localhost:3000/text-play` |
| 다운로드 버튼 바로가기 | `http://localhost:3000/text-play#text-play-download` |
| 이전 다운로드 주소(이동 확인용) | `http://localhost:3000/text-play/download` → `/text-play`로 308 이동 |

---
## 6. 전체 구조

페이지와 데이터의 연결 관계는 다음 순서다.

1. `src/app/layout.tsx`가 모든 화면을 `AppProvider`와 `AppShell`로 감싼다.
2. `AppShell`이 공통 헤더, 대화방 패널, 사용자 패널, 모바일 하단 메뉴를 제공한다.
3. `/text-play`는 `TextPlayScreen`을 렌더링한다.
4. `next.config.ts`의 `redirects()`가 이전 주소 `/text-play/download` 요청을 `/text-play`로 영구 이동시킨다.
5. `TextPlayScreen`은 `release-config.ts`의 단일 설정 객체를 읽는다. 화면에서 직접 사용하는 값은 `status`뿐이며, 배포 상태 배지, 비교 카드 표제, 베타 경고에 쓴다.
6. `DownloadAction`이 `downloadUrl`의 유효성을 검사해 버튼 또는 링크를 출력하고, 활성 링크의 `download` 속성에 `fileName`을 사용한다. 페이지 안에서 히어로의 `#text-play-download` 영역에 한 번만 사용된다.
7. `TextPlayScreen` 내부의 `LauncherMockup`이 `public/images/text-play/twilight-post-office.svg`를 `next/image`로 불러와 출시 전 화면 구성 예시를 그린다.
8. `TextPlayScreen.module.css`가 Text-Play 페이지의 색상 토큰, 디자인, 반응형 동작을 담당한다.

이 구조에서 화면과 배포 데이터가 분리되어 있으므로, 향후 정적 객체를 API 응답으로 교체할 때 화면 전체를 다시 작성하지 않아도 된다.

---
## 7. 라우팅 구조

| URL | 페이지 파일 또는 설정 | 화면 컴포넌트 | 역할 |
| --- | --- | --- | --- |
| `/text-play` | `src/app/text-play/page.tsx` | `TextPlayScreen` | 제품 소개, 다운로드 버튼, 화면 구성 예시, 플레이 흐름, 주요 기능, Character Chat 비교, 설치 순서, FAQ를 한 페이지로 제공 |
| `/text-play/download` | `next.config.ts`의 `redirects()` | 없음 | `/text-play`로 영구 이동(`permanent: true`, HTTP 308) |
| `/` | 기존 홈 | 기존 Character Chat | 마무리 안내와 하단 메뉴에서 돌아갈 수 있는 기존 서비스 |

`/text-play/download` 페이지 파일은 삭제됐다. 이전 링크와 북마크가 계속 동작하도록 `next.config.ts`에 다음 이동 규칙을 둔다.

```ts
{ source: "/text-play/download", destination: "/text-play", permanent: true }
```

`permanent: true`이므로 Next.js는 HTTP 308 응답을 보낸다. 브라우저와 검색 엔진이 이동을 캐시할 수 있으므로, 나중에 `/text-play/download` 경로를 다시 실제 페이지로 쓰려면 이 규칙의 영향부터 검토해야 한다.

`src/app/text-play/page.tsx`는 다음 `Metadata`를 제공한다.

- 제목: `MATE Text-Play 다운로드 | Mate Verse`
- 설명: Windows용 텍스트 게임 프로그램 MATE Text-Play의 소개, 플레이 흐름, 주요 기능, 배포 상태와 설치 순서

파일 안전 정보 구역을 다시 표시하면 설명 문구에도 `안전 정보`를 함께 추가한다.

---
## 8. Text-Play 관련 파일 목록

현재 Text-Play 기능을 구성하는 코드·설정·이미지·테스트 파일은 다음과 같다.

---
### Text-Play 전용 파일

| 파일 | 역할 |
| --- | --- |
| `src/app/text-play/page.tsx` | `/text-play` 라우트와 메타데이터 정의 |
| `src/features/text-play/TextPlayScreen.tsx` | 소개와 다운로드를 합친 페이지 전체 섹션과 런처 화면 예시 구성 |
| `src/features/text-play/DownloadAction.tsx` | URL 상태에 따른 다운로드 버튼·링크 처리 |
| `src/features/text-play/release-config.ts` | 배포 정보 타입, 현재 설정, 검사 및 표시 함수 |
| `src/features/text-play/TextPlayScreen.module.css` | Text-Play 페이지 색상 토큰, 스타일, 반응형 규칙 |
| `public/images/text-play/twilight-post-office.svg` | 런처 화면 예시에 들어가는 `황혼 우체국` 장면 일러스트 |
| `tests/unit/text-play-release.test.ts` | URL 검사와 다운로드 가능 조건 단위 테스트 |
| `tests/integration/text-play.test.tsx` | 통합 페이지 구성과 다운로드 상태 통합 테스트 |
| `tests/e2e/text-play.spec.ts` | 이전 주소 이동, 단일 메뉴, 다운로드 버튼 앵커 위치, 화면 너비별 가로 넘침 E2E 테스트 |

---
### Text-Play와 연결된 공통 파일

| 파일 | 관련 내용 |
| --- | --- |
| `next.config.ts` | `/text-play/download` → `/text-play` 영구 이동 규칙 |
| `src/components/app-shell/AppHeader.tsx` | 데스크톱 헤더의 `Text-Play 다운로드` 링크 |
| `src/components/app-shell/MobileBottomNavigation.tsx` | 모바일 하단 메뉴의 `Text-Play` 링크 |
| `src/components/app-shell/AppShell.module.css` | 헤더 메뉴가 태블릿에서 맞도록 하는 761~980px 스타일 보정 |
| `tests/components/app-shell.test.tsx` | 공통 메뉴의 Text-Play 경로 연결 검증 |

---
### 페이지 통합 시 정리된 파일

| 이전 파일 | 처리 |
| --- | --- |
| `src/app/text-play/download/page.tsx` | 삭제, 경로는 `next.config.ts`의 이동 규칙으로 대체 |
| `src/features/text-play/TextPlayHomeScreen.tsx` | 삭제, 소개 내용은 `TextPlayScreen` 히어로로 흡수 |
| `src/features/text-play/TextPlayDownloadScreen.tsx` | `TextPlayScreen.tsx`로 이름 변경 |
| `tests/integration/text-play-download.test.tsx` | `tests/integration/text-play.test.tsx`로 이름 변경 |

---
## 9. 파일별 상세 설명

---
### `src/app/text-play/page.tsx`

- Next.js App Router의 서버 페이지
- 메타데이터 제목 `MATE Text-Play 다운로드 | Mate Verse`와 설명 제공
- 실제 화면 구성은 `TextPlayScreen`에 위임
- 페이지 파일을 얇게 유지해 라우팅과 UI 책임을 분리

---
### `next.config.ts`

- `typedRoutes: true` 설정 유지
- `redirects()`에서 `/text-play/download`를 `/text-play`로 영구 이동(`permanent: true`, HTTP 308)
- 페이지 통합 전에 공유된 링크와 북마크가 깨지지 않도록 하는 호환용 규칙

---
### `src/features/text-play/TextPlayScreen.tsx`

소개와 다운로드를 합친 Text-Play 페이지의 조립 컴포넌트다. 네트워크 요청이나 배포 판정 로직은 직접 처리하지 않고 설정과 하위 컴포넌트를 조합한다.

화면 섹션은 다음 순서다.

1. 히어로: 상단 표제, `h1`, 리드 문구, 플랫폼·배포 상태 배지, `#text-play-download` 다운로드 영역(다운로드 동작과 `beta` 전용 경고), 오른쪽 `figure` 런처 화면 예시
2. 핵심 요약 목록 4개
3. `한 장면은 이렇게 진행됩니다` 3단계 흐름
4. 주요 기능 6개 카드
5. `Character Chat과 무엇이 다른가요?` 비교 카드 2개
6. 설치 순서
7. 자주 묻는 질문 4개
8. 마무리 안내 띠 `이야기의 다음 장은 직접 쓰세요`
9. 하단 메뉴

파일 안의 보조 컴포넌트는 다음과 같다.

| 이름 | 역할 |
| --- | --- |
| `FeatureIcon` | `iconPaths`의 도형으로 기능 카드용 24×24 인라인 SVG 아이콘 출력, `aria-hidden="true"`, `focusable="false"` |
| `SectionHeading` | 영문 표제(`kicker`), `h2`, 선택 설명 문구를 묶는 구역 제목 |
| `LauncherMockup` | 출시 전 런처 화면 구성 예시. 최상위 요소에 `aria-hidden="true"`를 지정한 장식 요소 |

`DownloadAction`은 히어로에서 한 번만 렌더링한다. 핵심 요약(`highlights`), 플레이 흐름(`playSteps`), 기능(`features`), 설치 단계(`installationSteps`), FAQ(`faqs`)는 읽기 전용 배열로 선언되어 있다. 배포 정보만 `release-config.ts`에서 가져오며, 그중 화면이 직접 읽는 값은 `status`다.

디자인 개편 때 히어로 보조 링크 `다운로드 정보 보기`·`Character Chat 열기`, 다운로드 정보 구역(`#download-info`), `RELEASE CHECK` 런처 미리보기, FAQ `웹 버전과 Windows 버전은 무엇이 다른가요?`가 제거됐다. 자세한 내용은 15절을 참고한다.

---
### `src/features/text-play/DownloadAction.tsx`

`DownloadAction`은 전달받은 `TextPlayRelease`의 `downloadUrl`을 기준으로 두 상태를 렌더링한다.

| 상태 | 조건 | 출력 |
| --- | --- | --- |
| 준비 중 | URL이 `null`, 빈 문자열 또는 허용되지 않는 형식 | 비활성화된 `button` |
| 다운로드 가능 | 사이트 내부 절대 경로 또는 HTTPS URL | 브라우저 기본 다운로드 `a` 링크 |

활성 상태에서 브라우저 기본 링크를 사용하는 이유는 다음과 같다.

- 외부 배포 서버의 CORS 정책과 무관하게 사용자 클릭을 유지
- `HEAD` 요청을 허용하지 않는 서버와 호환
- 일회성 서명 URL처럼 `GET`만 허용하는 주소와 호환
- 비동기 검사 때문에 사용자 활성화가 사라지는 문제 방지

외부 서버는 `download` 속성의 파일명을 무시할 수 있다. 최종 파일명은 배포 서버의 `Content-Disposition` 응답 헤더에 의해 결정될 수 있다.

---
### `src/features/text-play/release-config.ts`

이 파일이 배포 정보의 단일 관리 지점이다. 화면 여러 곳에 버전과 URL을 흩어서 작성하지 않는다.

제공 기능은 다음과 같다.

- `TextPlayDistributionStatus`: 배포 상태 타입
- `TextPlayRelease`: 배포 설정 인터페이스
- `textPlayRelease`: 현재 정적 배포 설정
- `isValidDownloadUrl`: 다운로드 URL 검사
- `isTextPlayDownloadAvailable`: 다운로드 가능 여부 판정
- `displayReleaseValue`: 미확정 값의 표시 문구 처리
- `getDistributionLabel`: 상태 코드를 사용자 문구로 변환

다운로드 정보 구역을 제거한 뒤에도 이 파일은 변경되지 않았다. 다만 `displayReleaseValue`는 현재 어떤 화면에서도 호출되지 않으며, 다운로드 정보 표시를 복원할 때 다시 사용할 수 있다.

---
### `src/features/text-play/TextPlayScreen.module.css`

Text-Play 페이지와 `DownloadAction`이 사용하는 CSS Module이다.

`.page`에 오렌지·노랑·흰색 라이트 테마의 색상 토큰을 CSS 사용자 정의 속성으로 선언한다.

| 토큰 | 값 | 의미 |
| --- | --- | --- |
| `--tp-ink` | `#2b1a0e` | 기본 글자 |
| `--tp-muted` | `#6b5442` | 보조 글자 |
| `--tp-orange` | `#f97316` | 주 오렌지 |
| `--tp-orange-deep` | `#c2410c` | 진한 오렌지 |
| `--tp-amber` | `#f59e0b` | 호박색 |
| `--tp-yellow` | `#fcd34d` | 노란색 |
| `--tp-line` | `#f2dcc0` | 경계선 |
| `--tp-card` | `#ffffff` | 카드 배경 |

주요 스타일 영역은 다음과 같다.

- 페이지 배경: 노랑·오렌지 원형 그라데이션과 크림색 세로 그라데이션, `overflow-x: clip`으로 장식 요소의 가로 넘침 차단
- 히어로: 알약 모양 상단 표제(`eyebrow`), 둘째 줄 오렌지 그라데이션 글자(`highlight`), 리드 문구, 배지
- 배포 상태 배지: `data-status`별 준비 중(노랑), 베타(오렌지), 정식(초록) 색상
- 히어로 다운로드 영역(`heroDownload`)과 베타 경고(`betaWarning`)
- 다운로드 버튼(`downloadButton`): 노랑→오렌지 그라데이션(`#ffc83d` → `#ff9a1f` → `#f97316`) 배경에 대비를 위한 진한 글자색 `#2b1400`, 비활성 시 점선 테두리와 연한 줄무늬(`repeating-linear-gradient`) 배경
- 런처 화면 예시: `heroVisual`과 배경 원, `window`, `titleBar`, `windowDots`, `windowBody`, `storyColumn`, `sceneArt`, `narration`, `dialogue`, `choices`, `freeInput`(깜빡이는 커서), `sideColumn`, `sideCard`, `meter`, `floatingTag`, `tagSave`, `tagMemory`
- 핵심 요약(`highlights`)과 구역 제목(`section`, `sectionHeading`, `kicker`, `sectionLead`)
- 플레이 흐름(`flow`, `flowNumber`)과 단계 사이 화살표
- 기능 카드(`featureGrid`)와 아이콘(`icon`)
- 비교 카드(`compare`, `compareLabel`)
- 설치 순서 타임라인(`stepList`)과 가로 연결선
- FAQ `details` 요소(`faqList`)
- 마무리 안내 띠(`ctaBand`, `ctaLinks`)
- 하단 메뉴(`footer`)
- 키보드 포커스 표시
- 모션 축소 환경 처리

페이지 통합과 디자인 개편을 거치며 다음 규칙이 정리됐다.

- 페이지 통합 때 삭제: `homeHero`, `homeGrid`, `homeCard`, `safetySection`, `primaryLink`, `secondaryLink`, `heroActions`
- 디자인 개편 때 삭제: `heroLinks`, `subheading`, `safetyGrid`, `metadataGrid`, `downloadCard`와 `RELEASE CHECK` 미리보기 관련 규칙
- `.heroDownload`에 `scroll-margin-top: 96px`를 지정해 `#text-play-download` 앵커로 이동할 때 공통 헤더에 다운로드 버튼이 가려지지 않도록 처리
- 히어로 `h1`, `.lead`, `.downloadHint`를 비롯해 구역 제목, 카드 설명, 설치 단계, FAQ 답변, 마무리 안내 문구 등 한글 문장에 `word-break: keep-all`을 지정해 단어 단위로 줄바꿈되도록 처리

반응형 기준은 다음과 같다.

| 구간 | 처리 |
| --- | --- |
| 기본 데스크톱 | 히어로 2열, 핵심 요약 4열, 플레이 흐름·기능 3열, 비교 2열, 설치 순서 5열 |
| 최대 1080px | 히어로 1열과 화면 예시 최대 640px 중앙 배치, 핵심 요약·기능 2열, 설치 순서 3열 |
| 최대 720px | 단일 열 중심 모바일 배치, 히어로 다운로드 버튼 전체 너비, 런처 예시 본문 1열 |
| `prefers-reduced-motion: reduce` | 다운로드 버튼과 기능 카드의 전환 효과 제거, 자유 입력 커서 깜빡임 제거 |

---
### `public/images/text-play/twilight-post-office.svg`

런처 화면 예시의 장면 그림으로 쓰는 직접 작성한 SVG 일러스트다. 외부 이미지 파일을 참조하지 않는다.

- 크기: `viewBox="0 0 1200 760"`
- 내용: 노을 하늘과 해, 구름과 새, 세 겹의 언덕, `POST` 간판과 시계탑이 있는 우체국, 우체통, 하늘을 나는 봉인 편지와 점선 비행 궤적
- 파일 자체에 `role="img"`, `title`(`황혼 우체국 일러스트`), `desc`가 있다.
- `TextPlayScreen`은 `next/image`로 `alt=""`, `priority`, `unoptimized`를 지정해 불러온다.
- `.sceneArt`가 `aspect-ratio: 1200 / 620`과 `object-fit: cover`로 그림의 일부를 잘라 표시한다.

이 그림과 런처 화면 예시는 출시 전 구성 예시이며 실제 Text-Play 프로그램 화면이 아니다.

---
### `src/components/app-shell/AppHeader.tsx`

공통 헤더의 주요 메뉴에는 Text-Play 링크가 하나만 있다.

- `Text-Play 다운로드` → `/text-play`

페이지 통합 전에는 `Text-Play`(`/text-play`)와 `Windows 다운로드`(`/text-play/download`) 두 링크가 있었지만 하나로 합쳤다. 기존 탐색, 내 작품, 로고, 좌우 패널 버튼 동작은 변경하지 않는다.

---
### `src/components/app-shell/MobileBottomNavigation.tsx`

모바일 하단 메뉴의 `Text-Play` 항목은 `/text-play`로 연결된다. 현재 경로가 `/text-play`이면 `aria-current="page"`를 설정한다.

---
### `src/components/app-shell/AppShell.module.css`

헤더 메뉴가 태블릿 너비에서 넘치지 않도록 761~980px 구간에 다음 보정이 있다. 이 보정은 헤더 링크가 네 개였던 시점에 추가됐고, 현재 세 개(탐색, 내 작품, Text-Play 다운로드)로 줄어든 뒤에도 유지된다.

- 헤더 간격 축소
- 좌우 여백 축소
- 브랜드 너비 축소
- 메뉴 링크 간격 축소
- 메뉴 버튼 내부 여백과 글자 크기 축소

---
## 10. 배포 설정 데이터

`TextPlayRelease`가 관리하는 필드는 다음과 같다.

| 필드 | 타입 | 의미 | 현재 값 | 현재 화면 사용 |
| --- | --- | --- | --- | --- |
| `status` | `preparing \| beta \| stable` | 현재 배포 단계 | `preparing` | 배포 상태 배지, 비교 카드 표제, 베타 경고 |
| `version` | `string \| null` | 프로그램 버전 | `null` | 사용 안 함 |
| `channel` | `string \| null` | stable, beta 같은 배포 채널 | `null` | 사용 안 함 |
| `downloadUrl` | `string \| null` | 실제 설치 파일 주소 | `null` | `DownloadAction` 활성 여부와 링크 주소 |
| `fileName` | `string \| null` | 설치 파일명 | `null` | 활성 링크의 `download` 속성 |
| `fileType` | `string \| null` | EXE, MSI 등의 파일 형식 | `null` | 사용 안 함 |
| `fileSize` | `string \| null` | 사용자에게 표시할 파일 크기 | `null` | 사용 안 함 |
| `sha256` | `string \| null` | 파일 무결성 검증 해시 | `null` | 사용 안 함 |
| `signatureStatus` | `string \| null` | 코드 서명 상태 | `null` | 사용 안 함 |
| `publishedAt` | `string \| null` | 릴리스 게시일 | `null` | 사용 안 함 |
| `supportedWindows` | `readonly string[]` | 지원 Windows 버전 목록 | `확인 필요` | 사용 안 함 |
| `minimumRequirements` | `readonly string[]` | 최소 시스템 요구사항 목록 | `확인 필요` | 사용 안 함 |

`사용 안 함` 필드는 다운로드 정보 구역을 제거하면서 화면 출력이 없어졌다. 값을 입력해도 사용자에게 보이지 않는다. `null` 또는 빈 문자열을 `확인 필요`로 바꾸는 `displayReleaseValue`도 현재 호출되지 않는다.

---
## 11. 배포 상태 규칙

| 설정 값 | 화면 문구 | 사용 시점 |
| --- | --- | --- |
| `preparing` | 다운로드 준비 중 | 설치 파일 또는 배포 정보가 준비되지 않은 상태 |
| `beta` | 베타 배포 | 제한된 사용자에게 시험 버전을 제공하는 상태 |
| `stable` | 정식 배포 | 정식 설치 파일을 제공하는 상태 |

화면 문구는 `getDistributionLabel`이 반환하며, 히어로 배포 상태 배지와 비교 카드 표제(`Windows · 다운로드 준비 중` 형태)에 표시된다. 배지는 `data-status` 값에 따라 노랑(준비 중), 오렌지(베타), 초록(정식) 계열 색상을 쓰지만 같은 문구를 함께 표시한다.

`beta` 상태에서는 히어로 다운로드 버튼 아래(`#text-play-download` 영역 안)에 `role="note"` 베타 경고 문구가 표시된다. 단, 버튼 활성화는 상태 문자열이 아니라 유효한 `downloadUrl` 존재 여부로 결정된다.

따라서 `status: "stable"`만 입력하고 URL을 비워 두면 버튼은 계속 비활성화된다.

---
## 12. 다운로드 URL 검증 규칙

`isValidDownloadUrl`은 다음 기준을 적용한다.

| 입력 | 결과 | 이유 |
| --- | --- | --- |
| `null` | 거부 | 다운로드 주소 없음 |
| 빈 문자열 또는 공백 | 거부 | 유효한 주소 없음 |
| `/downloads/file.exe` | 허용 | 사이트 내부 절대 경로 |
| `https://example.com/file.exe` | 허용 | HTTPS 외부 주소 |
| `//example.com/file.exe` | 거부 | 프로토콜 상대 URL 차단 |
| `http://example.com/file.exe` | 거부 | 암호화되지 않은 외부 주소 |
| `ftp://example.com/file.exe` | 거부 | 허용되지 않은 프로토콜 |
| `javascript:...` | 거부 | 실행 가능한 위험 주소 |
| 분석할 수 없는 문자열 | 거부 | URL 형식 오류 |

이 검사는 URL 형식만 확인한다. 실제 파일 존재 여부, HTTP 상태 코드, 해시 일치, 서명 유효성은 확인하지 않는다.

---
## 13. 배포 정보 입력 예시

실제 배포 정보가 확정되면 `release-config.ts`의 `textPlayRelease`만 수정한다. 아래 값은 형식 설명용 예시이며 실제 배포 정보가 아니다.

```ts
export const textPlayRelease: TextPlayRelease = // 현재 배포 정보
{ // 설정 시작
    status: "stable", // 배포 상태
    version: "확정 버전 입력", // 프로그램 버전
    channel: "확정 채널 입력", // 배포 채널
    downloadUrl: "확정 HTTPS 주소 입력", // 다운로드 주소
    fileName: "확정 파일명 입력", // 설치 파일명
    fileType: "확정 형식 입력", // 설치 파일 형식
    fileSize: "확정 용량 입력", // 설치 파일 크기
    sha256: "확정 SHA-256 입력", // 파일 해시
    signatureStatus: "확정 서명 상태 입력", // 코드 서명 상태
    publishedAt: "확정 게시일 입력", // 게시일
    supportedWindows: ["확정 지원 버전 입력"], // 지원 Windows
    minimumRequirements: ["확정 최소 사양 입력"], // 최소 요구사항
}; // 설정 종료
```

현재 화면이 읽는 값은 `status`, `downloadUrl`, `fileName`뿐이다. 버전, 채널, 파일 형식, 용량, 해시, 서명 상태, 게시일, 지원 Windows, 최소 요구사항은 입력해도 화면에 나타나지 않는다. 공개 배포 전에는 최소한 `sha256`과 `signatureStatus`를 보여 주는 화면 구역을 다시 추가해야 한다.

입력 후에는 화면 확인만 하지 말고 단위 테스트, 통합 테스트, E2E 테스트, 타입 검사, 빌드를 모두 실행해야 한다.

---
## 14. 다운로드 데이터 흐름

다운로드 상태는 다음 흐름으로 결정된다.

1. 개발자가 `textPlayRelease`에 배포 정보를 입력한다.
2. `TextPlayScreen`이 설정의 `status`를 읽어 배포 상태 배지, 비교 카드 표제, 베타 경고를 출력한다. 버전, 해시, 서명 같은 나머지 필드는 현재 출력하지 않는다.
3. `DownloadAction`이 `isTextPlayDownloadAvailable`을 호출한다.
4. `isTextPlayDownloadAvailable`이 `isValidDownloadUrl` 결과를 반환한다.
5. URL이 유효하지 않으면 비활성 버튼을 출력한다.
6. URL이 유효하면 `fileName`을 `download` 속성으로 지정한 직접 다운로드 링크를 출력한다.
7. 사용자가 링크를 선택하면 브라우저가 해당 URL로 다운로드를 요청한다.

현재 별도의 서버 API, DB, 릴리스 서비스 호출은 없다.

---
## 15. 화면 구성 상세

---
### Text-Play 통합 페이지

`/text-play`는 제품 소개와 다운로드 버튼을 한 화면에 담는다. 위에서 아래로 다음 순서로 구성된다.

1. 히어로(`section aria-labelledby="text-play-title"`)
   - 왼쪽 소개 문구
     - 점 장식이 있는 알약 모양 상단 표제 `MATE TEXT-PLAY · FOR WINDOWS`
     - `h1` `이야기를 읽는 순간에서 / 직접 움직이는 순간으로`, 둘째 줄은 오렌지 그라데이션 강조 글자
     - 선택지와 자유 입력, 작품·세이브·장기 기억 관리를 설명하는 리드 문구
     - `Windows용 프로그램` 배지와 배포 상태 배지
     - `#text-play-download` 영역의 `DownloadAction` 다운로드 버튼(페이지 전체에서 유일한 다운로드 버튼)
     - `beta` 상태일 때만 버튼 아래에 표시되는 베타 경고
   - 오른쪽 `figure` 런처 화면 예시
     - `LauncherMockup`: 제목 표시줄(`MATE Text-Play`, `황혼 우체국 · 1장`), `황혼 우체국` SVG 장면 그림, 장면 묘사, 애린의 대사, 선택지 2개(첫 항목이 선택된 모양), 깜빡이는 커서가 있는 자유 입력, 세이브·장기 기억·관계 상태 카드, `자동 저장됨`과 `기억 +1` 떠 있는 표시
     - `figcaption` `출시 전 화면 구성 예시 · 작품 「황혼 우체국」 1장`
2. 핵심 요약(`ul aria-label="Text-Play 한눈에 보기"`)
   - 선택 + 입력, 로컬 세이브, 장기 기억, 같은 LLM의 4개 항목
3. `한 장면은 이렇게 진행됩니다`(`HOW IT PLAYS`)
   - 장면을 읽고, 고르거나 직접 쓰고, 기억으로 남깁니다의 3단계
4. 주요 기능(`PLAY SYSTEM`)
   - 텍스트 게임 실행, 선택지와 자유 입력, 로컬 세이브, 상태와 장기 기억, 동일 LLM 모델 연동, 작품 다운로드와 업데이트의 6개 카드, 카드마다 인라인 SVG 아이콘
5. `Character Chat과 무엇이 다른가요?`(`WEB & WINDOWS`)
   - `웹 · 지금 이용 가능` Character Chat 카드와 `Windows · {배포 상태}` Text-Play 강조 카드
   - 카드 안에는 링크가 없다
6. 설치 순서(`GET STARTED`)
   - 설치 파일 다운로드부터 Text-Play 작품 다운로드 및 실행까지 `01`~`05` 번호의 5단계 타임라인
7. 자주 묻는 질문(`FAQ`)
   - 설치 없는 체험, 저장 위치, 인터넷 연결, 업데이트 방식의 4개 항목
8. 마무리 안내 띠
   - `h2` `이야기의 다음 장은 직접 쓰세요`와 설치 파일이 등록되면 상단 다운로드 버튼이 활성화된다는 안내
   - `다운로드 버튼으로 이동`(`#text-play-download`)과 `Character Chat 체험하기`(`/`) 링크
9. 하단 메뉴
   - `MATE Text-Play` 브랜드 문구
   - `Character Chat`(`/`) 링크
   - 개인정보처리방침, 이용약관, 고객지원의 `준비 중` 항목

페이지 통합 때 홈 화면의 세 카드(작품 다운로드, 선택과 자유 입력, 세이브와 기억)와 별도의 안전 정보 구역이 없어졌고, 자기 자신을 가리키던 하단 `Text-Play 홈` 링크도 제거됐다.

---
### 디자인 개편 시 제거된 요소

| 제거된 요소 | 비고 |
| --- | --- |
| 히어로 보조 링크 `다운로드 정보 보기`(`#download-info`), `Character Chat 열기`(`/`) | 사용자 요청으로 제거, Character Chat 이동은 마무리 안내와 하단 메뉴 링크가 담당 |
| 다운로드 정보 구역(`section id="download-info"`) | 사용자 요청으로 제거, 릴리스 확인 목록, 버전·채널·파일 형식·용량·게시일·파일명 메타데이터, 지원 Windows, 최소 시스템 요구사항, 파일 안전 정보(SHA-256, 코드 서명) 포함 |
| 히어로 오른쪽 `RELEASE CHECK` 런처 미리보기 | 제거, 런처 화면 예시 `figure`로 교체 |
| FAQ `웹 버전과 Windows 버전은 무엇이 다른가요?` | 제거, `Character Chat과 무엇이 다른가요?` 비교 구역이 같은 내용을 설명 |

제거된 배포 정보 필드는 `release-config.ts`에 그대로 남아 있다. 실제 배포 파일을 공개하기 전에는 최소한 파일 해시와 코드 서명 정보를 화면에 다시 표시해야 한다.

---
### 준비 중 상태

현재 화면은 실제 URL이 없으므로 다음 요소가 표시된다.

- 히어로의 `다운로드 준비 중` 배포 상태 배지
- 비교 카드 표제의 `Windows · 다운로드 준비 중`
- 히어로의 비활성 `다운로드 준비 중` 버튼 하나, 점선 테두리와 연한 줄무늬 배경으로 표시
- 버튼 아래의 `실제 설치 파일과 배포 URL이 등록되면 버튼이 활성화됩니다.` 안내
- 마무리 안내의 `설치 파일이 등록되면 상단의 다운로드 버튼이 바로 활성화됩니다.` 문구

색상만으로 상태를 구분하지 않고 텍스트를 함께 제공한다. 미확정 배포 정보는 화면에 표시하지 않으므로, 이전처럼 메타데이터 칸에 `확인 필요`가 나타나지 않는다.

---
## 16. 공통 앱과의 연결

Text-Play 화면도 기존 페이지와 동일하게 루트 레이아웃을 사용한다.

`src/app/layout.tsx`의 구조는 다음과 같다.

1. `AppProvider`가 앱 전역 상태와 로컬 저장소를 제공
2. `AppShell`이 공통 헤더와 좌우 패널을 제공
3. Text-Play 페이지가 중앙 콘텐츠로 렌더링

Text-Play 기능은 기존 앱 상태를 변경하지 않는다.

- 앱 리듀서 변경 없음
- 로컬 저장소 스키마 변경 없음
- 캐릭터 데이터 변경 없음
- 대화 데이터 변경 없음
- LLM 어댑터 변경 없음
- 이미지 생성 어댑터 변경 없음

따라서 현재 기능은 기존 Character Chat 기능과 데이터 수준에서 분리되어 있다.

---
## 17. 접근성 처리

현재 적용된 접근성 요소는 다음과 같다.

- 페이지에 하나의 주요 `h1`
- 히어로, 플레이 흐름, 주요 기능, 비교, 설치 순서, FAQ, 마무리 안내 구역의 제목과 `aria-labelledby` 연결
- 런처 화면 예시는 장식 요소이므로 `LauncherMockup` 최상위 요소에 `aria-hidden="true"`를 지정하고, 장면 그림은 `alt=""`로 불러옴
- 화면 예시 `figure`를 `aria-labelledby`로 `figcaption`(`출시 전 화면 구성 예시 · 작품 「황혼 우체국」 1장`)과 연결해 예시임을 보조 기술에 전달
- 상단 표제의 점 장식과 기능 카드 아이콘에 `aria-hidden="true"` 지정, 아이콘 SVG는 `focusable="false"`
- 핵심 요약 목록에 `aria-label="Text-Play 한눈에 보기"` 지정
- 플레이 흐름과 설치 순서에 `ol` 사용
- FAQ에 기본 `details`, `summary` 사용
- 비활성 다운로드에 실제 `disabled` 속성 사용
- 베타 경고에 `role="note"` 사용
- 하단 메뉴에 `aria-label="Text-Play 관련 메뉴"`, 준비 중 항목에 `aria-disabled="true"` 사용
- 모바일 현재 메뉴에 `aria-current="page"` 사용
- 다운로드 버튼, 마무리 안내 링크, 하단 링크, FAQ `summary`의 `:focus-visible`에 `3px solid #1d4ed8` 외곽선과 `3px` 간격 표시
- 다운로드 버튼은 노랑→오렌지 그라데이션 위에 진한 글자색 `#2b1400`을 사용해 대비 확보
- 제목, 설명, 카드 문구, FAQ 답변 등 한글 문장에 `word-break: keep-all` 지정
- `#text-play-download`(`.heroDownload`)에 `scroll-margin-top: 96px`를 지정해 앵커 이동 시 다운로드 버튼이 공통 헤더에 가려지지 않도록 처리
- `prefers-reduced-motion: reduce` 환경에서 다운로드 버튼과 기능 카드의 전환 효과, 자유 입력 커서 깜빡임 제거

SVG 파일 자체에도 `role="img"`, `title`, `desc`가 있지만, 페이지에서는 `alt=""` 이미지로 불러오고 상위 요소가 `aria-hidden`이므로 보조 기술에는 노출되지 않는다.

아직 실제 다운로드 링크가 없으므로 활성 링크의 실파일 접근성과 서버 응답은 검증할 수 없다.

---
## 18. 반응형 동작

Text-Play 화면은 CSS만으로 주요 레이아웃을 재배치한다.

---
### 데스크톱

- 상단 히어로 2열 구성(소개 `1.1fr`, 화면 예시 `1fr`)
- 핵심 요약 4열
- 플레이 흐름 3열, 단계 사이 `→` 표시
- 주요 기능 3열, 비교 카드 2열
- 설치 순서 5열과 노랑→오렌지 가로 연결선
- 공통 헤더 메뉴 전체 표시

---
### 태블릿

- Text-Play 화면은 최대 1080px에서 히어로를 1열로 바꾸고 화면 예시를 최대 640px로 가운데 배치
- 같은 구간에서 핵심 요약과 주요 기능 2열, 설치 순서 3열로 줄이고 가로 연결선 숨김
- 앱 셸 헤더는 761~980px에서 브랜드와 메뉴 간격 축소

---
### 모바일

- 최대 720px에서 Text-Play 주요 콘텐츠 단일 열 전환
- 페이지 여백을 `24px 16px 96px`로 조정해 하단 메뉴 공간 확보
- 히어로 다운로드 버튼을 전체 너비로 표시해 첫 화면에서 바로 확인 가능
- 런처 화면 예시 본문 1열, 상태 카드 2열, 관계 카드 숨김, 떠 있는 표시를 창 위아래 가장자리로 이동
- 플레이 흐름, 주요 기능, 비교 카드, 설치 순서 1열, 흐름 표시는 `↓`로 변경
- 마무리 안내 띠와 하단 메뉴 세로 배치
- 최대 760px에서 공통 데스크톱 메뉴 숨김
- 모바일 하단 메뉴 표시

---
### 가로 넘침 방지

데스크톱에서 떠 있는 표시(`tagSave`, `tagMemory`)는 창 바깥 음수 위치에 놓이고, 화면 예시 뒤 배경 원(`.heroVisual::before`)도 영역 밖으로 일부 확장된다. `.page`의 `overflow-x: clip`이 이 장식을 잘라 페이지 가로 스크롤이 생기지 않도록 한다. E2E 테스트가 390px, 820px, 1440px 너비에서 가로 넘침이 없는지 검증한다.

현재 알려진 앱 셸 제한으로, 데스크톱에서 왼쪽 패널을 연 상태로 브라우저 너비를 모바일로 줄이면 패널이 본문 위에 남을 수 있다. 모바일 전환 시 패널을 자동으로 닫는 별도 처리는 아직 없다.

---
## 19. 테스트 구성

---
### `tests/unit/text-play-release.test.ts`

다음 규칙을 검증한다.

- `null` URL 거부
- 공백 URL 거부
- JavaScript URL 거부
- FTP URL 거부
- 사이트 내부 절대 경로 허용
- HTTPS 외부 URL 허용
- 현재 정적 설정의 다운로드 비활성화
- 유효 URL 입력 시 다운로드 활성화

---
### `tests/integration/text-play.test.tsx`

`src/app/text-play/page.tsx`의 페이지 컴포넌트를 렌더링해 다음 사용자 화면 동작을 검증한다. 이전 이름은 `tests/integration/text-play-download.test.tsx`다.

- `h1` 제목과 Windows 플랫폼 표시
- `다운로드 준비 중` 버튼 비활성화와 배포 상태 배지의 같은 문구 표시
- 다운로드 버튼이 페이지에 하나만 있는지 확인
- `h2` 제목이 `한 장면은 이렇게 진행됩니다`, `주요 기능`, `Character Chat과 무엇이 다른가요?`, `설치 순서`, `자주 묻는 질문`, `이야기의 다음 장은 직접 쓰세요` 순서인지 확인
- 화면 예시 `figure`의 접근 가능한 이름에 `출시 전 화면 구성 예시`가 포함되는지 확인
- 삭제한 `다운로드 정보 보기`·`Character Chat 열기` 링크, `다운로드 정보` 제목, `#download-info` 요소가 없는지 확인
- 하단 `Character Chat` 링크가 `/`로 연결되고 `Text-Play 홈` 링크가 없는지 확인
- 개인정보처리방침, 이용약관, 고객지원의 준비 중 상태
- 사이트 내부 다운로드 링크 활성화
- HTTPS 외부 다운로드 링크 활성화
- 다운로드 실패 대응 안내 문구

---
### `tests/e2e/text-play.spec.ts`

Playwright로 실제 개발 서버 화면을 열어 다음을 검증한다.

- `/text-play/download` 요청이 `308`과 `location: /text-play`를 반환하고, 브라우저 이동 후 `h1`이 표시되는지 확인
- 홈 주요 메뉴의 Text-Play 관련 링크가 하나이고, `Text-Play 다운로드` 선택 후 `/text-play`에서 다운로드 버튼이 하나인지 확인
- 마무리 안내의 `다운로드 버튼으로 이동` 선택 시 주소가 `#text-play-download`로 바뀌고, 해당 영역의 위쪽 끝이 공통 헤더(`.app-header`) 아래에 있는지 확인
- 390px, 820px, 1440px 너비(높이 900px)에서 문서의 가로 스크롤 너비가 화면 너비를 넘지 않는지 확인

---
### `tests/components/app-shell.test.tsx`

앱 셸 테스트에서 Text-Play 메뉴를 다음과 같이 검증한다.

- 데스크톱 주요 메뉴의 Text-Play 관련 링크가 정확히 하나인지 확인
- 그 링크의 이름이 `Text-Play 다운로드`이고 경로가 `/text-play`인지 확인
- 모바일 메뉴의 `Text-Play` 링크 경로가 `/text-play`인지 확인

`/text-play/download` 이동 규칙은 `next.config.ts` 설정이므로 Vitest에서 검증하지 않는다. `tests/e2e/text-play.spec.ts`가 308 응답과 `/text-play` 이동을 검증하며, 개발 서버나 프로덕션 서버에 직접 요청해 확인할 수도 있다.

---
## 20. 검증 명령

| 검증 | 명령 | 기대 결과 |
| --- | --- | --- |
| 전체 테스트 | `npm run test:run` | 실패 테스트 없음 |
| Text-Play 단위 테스트 | `npx vitest run tests/unit/text-play-release.test.ts` | URL 검사 테스트 통과 |
| Text-Play 통합 테스트 | `npx vitest run tests/integration/text-play.test.tsx` | 화면 구성과 상태 테스트 통과 |
| 앱 셸 테스트 | `npx vitest run tests/components/app-shell.test.tsx` | 공통 메뉴 테스트 통과 |
| Text-Play E2E 테스트 | `npx playwright test tests/e2e/text-play.spec.ts --project=chromium --workers=1` | 주소 이동, 단일 메뉴, 앵커 위치, 가로 넘침 시나리오 통과 |
| 타입 검사 | `npm run typecheck` | TypeScript 오류 없음 |
| 린트 | `npm run lint` | ESLint 오류 없음 |
| 프로덕션 빌드 | `npm run build` | `/text-play` 경로 생성, 별도 `/text-play/download` 페이지 없음 |
| 이전 주소 이동 | 서버 실행 후 `curl -I http://localhost:3000/text-play/download` | `308` 응답과 `location: /text-play` |

E2E 테스트는 `playwright.config.ts`의 `webServer` 설정에 따라 `127.0.0.1`의 `PLAYWRIGHT_PORT`(기본 `3000`) 포트에서 개발 서버를 실행하거나, 이미 실행 중인 서버를 재사용한다.

브라우저에서는 최소한 다음 크기를 확인한다.

- 모바일: 390×844
- 태블릿: 820×900
- 데스크톱: 1440×1000

---
## 21. 실제 배포 전 체크리스트

---
### 설치 파일

- EXE 또는 MSI 생성
- 파일명 확정
- 파일 크기 확인
- 다운로드 서버 업로드
- HTTPS URL 확인
- 브라우저에서 실제 다운로드 확인

---
### 보안

- 코드 서명 적용
- 서명 게시자 이름 확인
- 최종 파일 SHA-256 계산
- SHA-256과 코드 서명 상태를 보여 주는 화면 구역 복원(현재 화면에는 없음)
- 페이지에 표시한 해시와 실제 파일 해시 비교
- Windows SmartScreen 동작 확인
- 배포 서버의 HTTPS 인증서 확인

---
### 호환성

- 지원 Windows 버전 확정
- x64, ARM64 등 CPU 아키텍처 확정
- 최소 메모리와 저장공간 확정
- 관리자 권한 필요 여부 확인
- 설치 및 제거 절차 확인

---
### 서비스

- 로그인 요구사항 확정
- 인터넷 연결이 필요한 기능 확정
- 오프라인 동작 범위 확정
- 로컬 세이브 위치 확정
- 업데이트 방식 확정
- 고객지원 경로 연결
- 개인정보처리방침 연결
- 이용약관 연결

---
### 페이지

- `textPlayRelease` 실제 값 입력
- 버전, 파일 형식, 용량, 게시일, 파일명, 지원 Windows, 최소 요구사항을 보여 줄 화면 구역 복원 여부 결정
- 안전 정보 구역을 복원하면 `page.tsx` 메타데이터 설명에도 반영
- 준비 중 상태를 beta 또는 stable로 변경
- 베타 경고 확인
- 활성 다운로드 링크 확인
- 마무리 안내의 설치 파일 등록 전 안내 문구를 실제 배포 상태에 맞게 수정
- 런처 화면 예시와 `figcaption`을 실제 프로그램 화면 기준으로 갱신할지 결정
- 모바일·태블릿·데스크톱 확인
- 키보드만으로 전체 조작 확인
- 실제 설치 파일 기준 FAQ 수정
- 프로덕션 빌드 확인

---
## 22. 현재 알려진 제한 사항

1. 실제 다운로드 URL이 없어 버튼이 비활성화되어 있다.
2. 버전, 용량, 게시일, 해시, 서명, 시스템 요구사항이 확정되지 않았다.
3. 사용자 요청으로 다운로드 정보 구역을 제거해, `release-config.ts`의 버전·채널·파일 형식·용량·게시일·파일명·지원 Windows·최소 요구사항·SHA-256·코드 서명 상태를 화면에서 확인할 수 없다. 실제 배포 파일을 공개하기 전에 최소한 파일 해시와 코드 서명 정보는 다시 표시해야 한다.
4. 개인정보처리방침, 이용약관, 고객지원 링크가 준비 중이다.
5. 실제 Text-Play 프로그램 스크린샷이나 실행 영상이 없다. 히어로의 런처 화면은 출시 전 구성 예시다.
6. 별도의 릴리스 노트와 알려진 문제 목록이 없다.
7. 이전 버전 다운로드와 롤백 정책이 없다.
8. 다운로드 실패를 서버 수준에서 감지하지 않는다.
9. 해시를 화면에 표시하지 않으며, 브라우저에서 자동 검증하는 기능도 없다.
10. 다운로드 버튼은 히어로에만 있다. 페이지 아래쪽에서는 마무리 안내의 `다운로드 버튼으로 이동` 링크로 돌아가야 한다.
11. 화면 너비 전환 시 열린 앱 셸 패널을 자동으로 닫지 않는다.
12. `/text-play/download` 영구 이동(308)은 브라우저에 캐시될 수 있어, 같은 경로를 나중에 다른 용도로 쓰기 어렵다.

---
## 23. 향후 개선 우선순위

---
### 1순위: 실제 배포 연결

- 설치 파일 등록
- 정확한 배포 메타데이터 입력
- 코드 서명과 SHA-256 확정
- 파일 해시와 코드 서명 정보를 보여 주는 화면 구역 복원
- 실제 다운로드 검증

---
### 2순위: 사용자 지원 연결

- 개인정보처리방침
- 이용약관
- 고객지원
- 장애 또는 배포 상태 페이지

---
### 3순위: 제품 이해 개선

- 출시 전 구성 예시를 실제 프로그램 화면 이미지로 교체
- 작품 실행 흐름
- 세이브와 장기 기억 화면
- 릴리스 노트
- 알려진 문제

---
### 4순위: 모바일 사용성 개선

- 콘텐츠 길이 축소
- 화면 전환 시 패널 자동 닫기
- 배포 정보 구역을 복원할 때 주요 배포 정보 우선 배치

---
## 24. 수정 시 주의 사항

- 배포 정보를 여러 컴포넌트에 직접 작성하지 않는다.
- 실제 값은 `release-config.ts`에서만 관리한다.
- 확인되지 않은 값을 임의로 만들지 않는다.
- HTTP 외부 URL을 허용하지 않는다.
- URL이 없을 때 활성 링크를 출력하지 않는다.
- 실제 파일이 없는 가짜 다운로드 경로를 커밋하지 않는다.
- 기존 앱 상태 스키마를 Text-Play 다운로드 기능 때문에 변경하지 않는다.
- 앱 셸 수정 시 Character Chat, 라이브러리, 설정 화면 회귀를 확인한다.
- 모바일 메뉴 항목 수를 변경하면 최소 44px 조작 영역을 다시 확인한다.
- 새 상태를 추가하면 상태 라벨, CSS, 테스트를 함께 수정한다.
- 새 설정 필드를 추가하면 타입, 화면, 테스트, 이 문서를 함께 수정한다.
- 색상은 `.page`의 `--tp-*` 토큰을 우선 사용한다.
- 다운로드 버튼 배경을 바꾸면 글자색 `#2b1400`과의 대비를 다시 확인한다.
- 장식 요소를 페이지 밖으로 배치하는 경우 `.page`의 `overflow-x: clip`을 유지하고 E2E 가로 넘침 테스트를 실행한다.
- 런처 화면 예시는 `aria-hidden` 장식이므로 사용자가 알아야 할 정보를 그 안에만 두지 않는다.
- 다운로드 영역 id `text-play-download`를 바꾸면 마무리 안내 링크와 E2E 테스트를 함께 수정한다.
- `h2` 구역을 추가·삭제·이동하면 통합 테스트의 제목 순서 검증을 함께 수정한다.

---
## 25. 자주 발생할 수 있는 개발 문제

---
### 다운로드 버튼이 계속 비활성화됨

다음을 확인한다.

- `downloadUrl`이 `null`인지 확인
- 문자열이 공백만 포함하는지 확인
- 외부 주소가 HTTPS인지 확인
- 프로토콜 상대 URL을 사용했는지 확인
- `isValidDownloadUrl` 단위 테스트 실행

---
### URL은 정상인데 원하는 파일명으로 저장되지 않음

외부 서버가 HTML `download` 속성보다 `Content-Disposition` 헤더를 우선할 수 있다. 배포 서버의 응답 헤더를 확인한다.

---
### 외부 주소를 미리 검사하지 않는 이유

브라우저에서 사전 `HEAD` 요청을 보내면 CORS, 서명 URL, GET 전용 서버 때문에 정상 파일도 실패로 판단할 수 있다. 현재 구현은 사용자 클릭으로 브라우저가 직접 다운로드하도록 설계됐다.

---
### 배포 정보를 입력했는데 화면에 나타나지 않음

현재 화면은 `status`, `downloadUrl`, `fileName`만 사용한다. 버전, 해시, 서명 상태 등은 다운로드 정보 구역을 제거한 뒤 화면에 출력하지 않으므로, 표시가 필요하면 화면 구역을 다시 추가해야 한다.

---
### 앵커 이동 후 다운로드 버튼이 헤더에 가려짐

`.heroDownload`의 `scroll-margin-top: 96px`가 유지되는지, 공통 헤더 높이가 이 값보다 커지지 않았는지 확인한다. `tests/e2e/text-play.spec.ts`의 앵커 위치 테스트로 검증할 수 있다.

---
### 가로 스크롤이 생김

`.page`의 `overflow-x: clip`이 유지되는지, 새 장식 요소가 이 범위 밖에 배치되지 않았는지 확인한다. `tests/e2e/text-play.spec.ts`의 390px·820px·1440px 가로 넘침 테스트를 실행한다.

---
### `Link` 경로 타입 오류

프로젝트는 `typedRoutes: true`를 사용한다. 정적 분석이 경로를 추론하지 못하는 경우 기존 코드처럼 `Route` 타입을 명시하되, 실제 경로가 App Router에 존재하는지 먼저 확인한다.

---
### `next-env.d.ts`가 개발 서버 실행 후 변경됨

Next.js가 개발·빌드 타입 경로를 자동 생성하면서 파일 내용이 달라질 수 있다. 제품 변경과 관계없는 생성 파일 차이는 커밋 전에 확인한다.

---
## 26. 신규 개발자 작업 순서

1. 이 문서와 `release-config.ts`를 먼저 읽는다.
2. `/text-play`를 브라우저에서 확인하고, `/text-play/download`가 `/text-play`로 이동하는지 확인한다.
3. 현재 배포 정보가 실제 값인지 담당자에게 확인한다.
4. 변경하려는 책임이 설정, 화면, 다운로드 동작, 스타일 중 어디에 있는지 구분한다.
5. 기존 테스트를 먼저 실행한다.
6. 동작 변경은 테스트를 먼저 추가하거나 수정한다.
7. 필요한 최소 파일만 변경한다.
8. 타입 검사와 린트를 실행한다.
9. 전체 테스트와 Text-Play E2E 테스트를 실행한다.
10. 프로덕션 빌드를 실행한다.
11. 모바일·태블릿·데스크톱 화면을 직접 확인한다.
12. 실제 배포 정보 변경이면 해시와 URL을 다시 검증하고, 해시와 코드 서명 정보를 보여 주는 화면 구역이 있는지 확인한다.
13. 이 문서의 현재 상태와 제한 사항을 함께 갱신한다.

---
## 27. 완료 기준

개발 단계의 완료 기준은 다음과 같다.

- `/text-play`가 정상 렌더링됨
- `/text-play/download`가 `/text-play`로 308 이동함
- 다운로드 버튼이 페이지에 하나만 표시됨
- 마무리 안내의 `다운로드 버튼으로 이동` 링크가 공통 헤더에 가리지 않는 위치의 다운로드 영역으로 이동함
- 삭제한 히어로 보조 링크와 다운로드 정보 구역이 표시되지 않음
- 공통 헤더와 모바일 메뉴에서 접근 가능
- URL이 없으면 다운로드 버튼 비활성화
- 유효한 내부 경로나 HTTPS URL이면 다운로드 링크 활성화
- 미확정 배포 정보는 `release-config.ts`에서 `null` 또는 `확인 필요`로 유지
- 베타 상태는 다운로드 버튼 아래에 별도 경고 표시
- 런처 화면 예시는 보조 기술에서 숨기고 `figcaption`으로 예시임을 설명
- 키보드 초점 확인 가능
- 390px·820px·1440px 화면에서 가로 넘침 없음
- Text-Play 단위·통합·E2E 테스트 통과
- 기존 앱 테스트 회귀 없음
- 타입 검사 통과
- 린트 통과
- 프로덕션 빌드 통과

실제 서비스 배포의 완료 기준은 위 조건에 더해 설치 파일, 코드 서명, SHA-256, 정책 문서, 고객지원, 시스템 요구사항이 모두 확정되고, 최소한 파일 해시와 코드 서명 정보가 페이지에 다시 표시되어야 한다.

---
## 28. 관련 경로 요약

| 목적 | 경로 |
| --- | --- |
| Text-Play 페이지 | `/text-play` |
| 다운로드 버튼 앵커 | `/text-play#text-play-download` |
| 이전 다운로드 주소 | `/text-play/download` → `/text-play` (308) |
| 페이지 라우트 | `src/app/text-play/page.tsx` |
| 이동 규칙 | `next.config.ts` |
| 배포 설정 | `src/features/text-play/release-config.ts` |
| 다운로드 동작 | `src/features/text-play/DownloadAction.tsx` |
| 페이지 화면 | `src/features/text-play/TextPlayScreen.tsx` |
| 페이지 스타일 | `src/features/text-play/TextPlayScreen.module.css` |
| 장면 일러스트 | `public/images/text-play/twilight-post-office.svg` |
| 단위 테스트 | `tests/unit/text-play-release.test.ts` |
| 통합 테스트 | `tests/integration/text-play.test.tsx` |
| E2E 테스트 | `tests/e2e/text-play.spec.ts` |
| 공통 메뉴 테스트 | `tests/components/app-shell.test.tsx` |

---
## 29. 챗봇 웹 서비스 개발 제약 분류 기준

현재 저장소는 브라우저의 `localStorage`와 Mock 공급자를 기반으로 동작한다. 따라서 개발 항목을 다음 세 종류로 나누어 진행한다.

| 분류 | 기준 | 현재 진행 원칙 |
| --- | --- | --- |
| 로컬 구현 가능 | 외부 계정, API 키, 서버, 결제가 없어도 코드와 테스트를 완성할 수 있음 | 우선 구현 가능 |
| 외부 API·서비스 필요 | 외부 공급자 계정, API 키, 서버 주소 또는 운영 정책이 있어야 실제 동작을 확인할 수 있음 | 인터페이스와 Mock까지만 로컬 구현 |
| 금전 비용 발생 가능 | 사용량 과금, 구독, 인증서, 도메인 또는 운영 인프라 구매가 필요할 수 있음 | 예산과 공급자 확정 전 구매 금지 |

무료 요금제가 있는 서비스도 정책과 한도가 바뀔 수 있으므로 무료라고 단정하지 않는다. 구체적인 가격, 월 예상 비용, 무료 한도는 공급자를 선택한 시점에 공식 문서로 확인해야 한다.

현재 단계에서는 다음 제약을 적용한다.

- 실제 API 키를 저장소에 추가하지 않음
- 확인되지 않은 공급자와 모델을 임의로 선택하지 않음
- 외부 계정 생성과 유료 서비스 구매를 진행하지 않음
- 실제 사용자 데이터를 사용하지 않음
- 실제 결제와 토큰 구매를 연결하지 않음
- 외부 서비스 없이 검증할 수 있는 기능을 먼저 완성
- 외부 연동 지점은 인터페이스와 Mock으로 분리
- 비용이 필요한 기능은 대체 가능한 로컬 흐름을 함께 유지

---
## 30. 로컬에서 바로 구현 가능한 기능

다음 기능은 현재 저장소와 설치된 개발 도구만으로 구현하고 자동 테스트할 수 있다. 외부 API 키나 별도 구매가 필요하지 않다.

---
### 30.1 Mock 기반 실시간 스트리밍 UI

구현 상태: 완료

`MockLLMAdapter`가 반환하는 응답 조각을 받을 때마다 하나의 임시 assistant 메시지를 갱신하도록 구현했다. 사용자는 최종 답변을 기다리지 않고 생성 중인 문장을 확인할 수 있다.

- 주요 수정 위치: `ChatController`, `ChatScreen`, `MessageList`
- 구현 내용: 응답 중 임시 메시지, 조각별 화면 갱신, 응답 완료 상태, 실패 후 입력 잠금 복구
- 접근성: 메시지 목록의 `aria-busy` 상태와 모션 축소 환경 지원
- 로컬 검증: 지연 Mock과 제어형 테스트 어댑터로 부분 응답과 최종 응답 확인
- 현재 제약: 실제 네트워크 스트림의 연결 끊김과 서버 오류는 재현용 Mock이 필요

---
### 30.2 응답 중단·재시도·다시 생성

구현 상태: 완료

텍스트 응답 작업에 취소 상태를 추가하고 마지막 사용자 메시지를 기준으로 다시 요청하는 흐름을 구현했다. 실제 공급자가 없어도 지연 Mock과 실패 Mock으로 동작을 검증할 수 있다.

- 주요 수정 위치: `LLMAdapter`, `MockLLMAdapter`, `ChatController`, `ChatComposer`
- 구현 내용: 중단 버튼, `AbortSignal`, 제어기 수준 중단 보장, 실패 메시지 재시도, 마지막 답변 다시 생성, 부분 응답 유지
- 비용 정책: 중단된 요청도 1토큰 사용, 재시도와 다시 생성은 각각 새 요청 1회 사용
- 중복 방지: 재시도 시 사용자 메시지를 추가하지 않고 기존 assistant 메시지를 교체
- 로컬 검증: 신호를 무시하는 어댑터의 추가 조각 차단, 입력 잠금 해제, 재시도 중복·이중 스토리 반영 방지, 다시 생성 응답 교체 확인
- 현재 제약: 실제 공급자의 취소 방식은 공급자 API 확정 후 어댑터에서 별도 구현

---
### 30.3 메시지 복사·수정·삭제

구현 상태: 완료

메시지별 동작 메뉴와 대화 버전 모델을 추가해 원본을 보존하면서 로컬 대화를 관리할 수 있다. 사용자 메시지를 수정하면 해당 지점까지의 문맥을 복제하고 이후 assistant 응답을 다시 생성한 수정 버전을 만든다.

- 주요 수정 위치: `MessageItem`, `MessageList`, `ChatScreen`, `conversation-versioning.ts`, `conversation-export.ts`, `app-reducer`, `types.ts`
- 구현 내용: 클립보드 복사, 인라인 수정, 개별 메시지 삭제, 최대 10개 버전 생성, 이전·다음 전환, 수정 버전 삭제
- 안전 정책: 수정 실패·중단·토큰 부족 시 원본과 잔액 유지, 메시지·버전 삭제 전 로컬 백업 필수
- 주소 복원: `/chat/{characterId}?conversation={conversationId}&version={versionId}` 형식으로 현재 버전 유지
- 파일 이동: 스키마 2 JSON에 전체 버전과 메시지를 포함하고 가져오기 전 관계 무결성 검증
- 로컬 검증: 단위·통합 테스트와 Chromium 종단 테스트에서 수정·전환·새로고침·삭제·모바일 넘침·외부 요청 부재 확인
- 검증 결과: 2026-09-29 기준 단위·통합 208개, Chromium 종단 13개, Webpack 프로덕션 빌드 통과

---
### 30.4 로컬 대화 요약과 장기 기억

현재 `summarizeConversation()` 계약은 있지만 실제 채팅 흐름에서 사용하지 않는다. 규칙 기반 요약기 또는 Mock 요약기를 사용해 대화 요약과 기억 구조를 먼저 완성할 수 있다.

- 주요 수정 위치: `types.ts`, `LLMAdapter`, `ChatController`, `local-storage-gateway.ts`
- 구현 내용: 대화 요약, 중요 사건, 사용자 선호, 캐릭터별 기억 목록
- 로컬 검증: 메시지가 일정 수를 넘으면 요약이 생성되고 저장되는지 확인
- 현재 제약: 실제 의미 기반 요약 품질은 LLM 연결 전까지 확인 불가
- 주의 사항: 사용자가 기억을 조회·수정·삭제할 수 있는 화면 필요

---
### 30.5 로컬 검색과 필터 개선

현재 탐색 화면은 이름, 소개, 세계관, 태그를 문자열로 검색한다. 검색어 강조, 정렬, 복수 태그, 공개 범위, 최근 수정일 필터를 로컬 데이터만으로 확장할 수 있다.

- 주요 수정 위치: `DiscoveryHome`, `CategoryFilter`, `LibraryScreen`
- 구현 내용: 정렬 방식, 복수 조건, 검색어 초기화, 결과 수 표시
- 로컬 검증: 조건 조합별 결과와 빈 결과 안내 확인
- 현재 제약: 서버 검색, 추천 순위, 사용자 행동 기반 추천은 구현 불가

---
### 30.6 캐릭터 편집 기능 개선

외부 파일 업로드 없이도 기존 이미지 선택, 폼 단계 분리, 초안 자동 저장, 입력 길이 표시, 미리보기 개선을 구현할 수 있다.

- 주요 수정 위치: `CharacterEditor`, `CharacterPreview`, `character-validation.ts`
- 구현 내용: 단계형 편집, 자동 초안 저장, 검증 오류 이동, 변경 내용 복원
- 로컬 검증: 새 캐릭터와 기존 캐릭터의 저장·수정·이탈 경고 확인
- 현재 제약: 실제 이미지 업로드와 AI 이미지 생성은 외부 저장소 또는 API 필요

---
### 30.7 접근성과 반응형 개선

키보드 탐색, 대화상자 포커스 고정, 화면 크기 변경 시 패널 자동 닫기, 모바일 조작 영역, 명도 대비를 외부 서비스 없이 개선할 수 있다.

- 주요 수정 위치: `AppShell`, `LibraryScreen`, 각 CSS Module
- 구현 내용: 포커스 트랩, 포커스 복원, 모바일 패널 정리, 상태 문구 개선
- 로컬 검증: 키보드 전용 조작, 390px·820px·1440px 화면 확인
- 현재 제약: 실제 보조 기술별 최종 검증은 별도 환경 확인 필요

---
### 30.8 Playwright E2E 테스트

구현 상태: 캐릭터 상세 핵심 흐름 완료

- 주요 추가 위치: `tests/e2e/character-detail.spec.ts`
- 검증 시나리오: 탐색 → 하린 상세 → 프리셋 선택 → 대화 시작 → 최근 대화 이어하기 → 같은 캐릭터의 두 대화 세션 확인
- 반응형 시나리오: 390px·820px·1440px 가로 넘침, 긴 설명과 긴 태그 확인
- 접근성 시나리오: 키보드 전용 확장·프리셋·보관·공유·신고·대화 시작 확인
- 네트워크 시나리오: Mock 모드의 외부 HTTP·WebSocket 미사용 확인
- 로컬 검증: Chromium 기준 캐릭터 상세 시나리오 8개 통과
- 현재 제약: 실제 로그인, 결제, 외부 API 흐름은 테스트 대역 필요

---
### 30.9 README와 개발 문서 보강

프로젝트 루트에 `README.md`가 없다. 설치, 실행, 테스트, 폴더 구조, 데이터 저장 위치, Mock 제약, 환경변수 원칙을 정리할 수 있다.

- 주요 추가 위치: `README.md`
- 구현 내용: 빠른 시작, 명령 목록, 구조, 테스트, 데이터 주의 사항
- 로컬 검증: 새 환경에서 문서 순서만으로 실행 가능한지 확인
- 현재 제약: 실제 배포 주소와 공급자 설정은 확정 후 추가

---
### 30.10 오류 경계와 상태 안내

구현 상태: 완료

데이터가 브라우저 `localStorage`에만 있어 서버가 주소의 캐릭터 존재 여부를 미리 확인할 수 없으므로, 잘못된 주소·손상 데이터·저장공간 부족을 화면에서 직접 안내한다.

- 공통 안내 화면: `src/components/feedback/StatusScreen.tsx`에서 찾을 수 없음(`not-found`), 오류(`error`), 권한 없음(`restricted`)을 같은 디자인과 접근성 속성으로 표시
- 라우트 파일: `app/not-found.tsx`(앱 헤더를 유지한 404), `app/error.tsx`(`retry()` 다시 시도), `app/global-error.tsx`(최상위 레이아웃 실패 시 자체 문서와 전체 새로고침 링크)
- `loading.tsx`는 추가하지 않는다. 서버에서 기다릴 데이터가 없고 `AppProvider`의 "로컬 대화를 불러오는 중" 상태가 같은 역할을 한다.
- 없는 캐릭터: `ChatScreen`이 대화 준비 전에 캐릭터 존재를 확인해 오류를 던지지 않고 안내 화면을 표시한다. 상세·편집 화면도 같은 컴포넌트를 사용한다.
- 저장소 안내: `LocalStorageGateway.load()`의 복구·변환 안내를 `AppProvider.storageNotice`로 전달하고 `AppShell` 상단에 표시한다. 복구 경고에는 데이터 관리 링크와 닫기 버튼을 둔다.
- 읽기 실패: 처음 읽기에서 예외가 나면 기본 상태로 시작하고, 기존 데이터를 덮어쓰지 않도록 그 방문 동안 자동 저장·원자 저장·백업을 모두 차단한다.
- 저장공간 부족: `isStorageQuotaError()`가 `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, 코드 22·1014를 판정하고, 자동 저장·원자 저장·백업·데이터 관리 실패 문구에 정리 방법을 덧붙인다.
- 데이터 관리: JSON·복구 백업 내보내기 실패 안내와 성공 안내를 추가하고, 백업 복구 실패를 데이터 검증 실패와 백업 실패로 구분한다.
- 로컬 검증: `tests/integration/error-states.test.tsx` 13개, `tests/e2e/error-states.spec.ts` 3개
- 현재 제약: 외부 공급자별 오류 코드는 실제 연동 시 매핑 필요

---
## 31. 외부 API·서비스가 있어야 실제 구현 가능한 기능

아래 기능은 화면, 타입, 어댑터, Mock까지 로컬에서 만들 수 있지만 실제 성공 여부를 확인하려면 외부 계정이나 서버가 필요하다.

| 기능 | 필요한 외부 요소 | 로컬에서 가능한 준비 | 확정이 필요한 사항 |
| --- | --- | --- | --- |
| 실제 LLM 대화 | LLM 공급자, API 키, 서버 실행 환경 | 공급자 어댑터 계약, Mock, 스트리밍 UI | 공급자, 모델, 사용량 제한 |
| 실제 이미지 생성 | 이미지 생성 API 또는 자체 모델 서버 | 생성 상태 UI, 취소·재시도 Mock | 공급자, 해상도, 안전 정책 |
| 회원가입·로그인 | 인증 서비스 또는 자체 인증 서버 | 로그인 화면, 세션 인터페이스, Mock 사용자 | 인증 방식, 소셜 로그인 범위 |
| 서버 데이터 동기화 | 데이터베이스와 서버 API | Repository 인터페이스, 동기화 상태 UI | DB 종류, 충돌 정책, 보관 기간 |
| 사용자 이미지 업로드 | 객체 저장소와 업로드 API | 파일 검증, 미리보기, 크기 제한 | 허용 형식, 최대 용량, 삭제 정책 |
| 이메일 인증 | 이메일 발송 서비스 | 이메일 입력·인증 코드 화면 | 발신 도메인, 템플릿, 재전송 정책 |
| 푸시 알림 | Push API, 서비스 워커, 푸시 서버 | 권한 UI, 알림 설정, 로컬 예약 Mock | 지원 브라우저, 발송 기준 |
| 실제 결제 | 결제대행사 계정과 서버 검증 | 결제 화면 Mock, 상태 모델, 영수증 UI | 상품, 가격, 환불, 세금 정책 |
| 오류 모니터링 | 외부 모니터링 서비스 또는 자체 수집 서버 | 오류 분류와 로컬 로깅 | 수집 범위, 개인정보 제외 기준 |
| 운영 배포 | 호스팅 계정과 배포 환경 | 프로덕션 빌드, 환경변수 검증 | 배포 대상, 지역, 도메인 |

외부 연동 코드는 브라우저에서 API 키를 직접 사용하지 않고 Next.js 서버 경로 또는 별도 백엔드를 통해 호출해야 한다.

---
## 32. 구매 또는 사용량에 따라 금전 비용이 발생하는 요소

아래 항목은 구현 자체보다 실제 운영 과정에서 비용이 발생할 가능성이 높다. 공급자와 예상 사용량이 없으므로 현재 금액은 `확인 필요`다.

| 비용 항목 | 비용이 발생하는 기준 | 현재 필요성 | 비용 없는 대체 방법 |
| --- | --- | --- | --- |
| LLM API | 입력·출력 토큰 또는 요청량 | 실제 AI 대화에 필요 | `MockLLMAdapter` 유지 |
| 이미지 생성 API | 생성 횟수, 해상도, 모델 | 실제 장면 생성에 필요 | 고정 로컬 장면 이미지 사용 |
| 서버 호스팅 | 실행 시간, CPU, 메모리, 요청량 | 외부 공개 시 필요 | 로컬 개발 서버 사용 |
| 데이터베이스 | 저장량, 연결 수, 읽기·쓰기 | 계정 동기화 시 필요 | `localStorage` 유지 |
| 객체 저장소·CDN | 이미지 용량과 전송량 | 사용자 업로드 시 필요 | 저장소 내 기본 이미지 사용 |
| 도메인 | 연간 등록과 갱신 | 정식 주소에 필요 | 호스팅 기본 주소 사용 |
| 이메일·SMS | 발송 건수 | 인증·알림 방식에 따라 필요 | 개발용 콘솔 또는 Mock 코드 |
| 결제대행 수수료 | 결제 건수와 금액 | 유료 상품 판매 시 필요 | 결제 기능 비활성화 |
| 오류 모니터링 | 이벤트 수와 보관 기간 | 운영 안정성 향상 | 로컬 콘솔과 서버 로그 |
| Windows 코드 서명 | 인증서 구매와 갱신 | Text-Play 신뢰 배포에 중요 | 서명 상태를 `확인 필요`로 유지 |
| 설치 파일 배포 | 파일 저장량과 다운로드 트래픽 | Text-Play 배포 시 필요 | 다운로드 버튼 비활성화 |

무료 요금제를 사용할 때도 사용자 증가, 저장량 증가, 트래픽 증가로 유료 전환될 수 있다. 운영 기능은 월 예산 한도와 차단 기준을 먼저 정한 뒤 연결해야 한다.

---
## 33. 현재 제약을 반영한 단계별 개발 순서

---
### 1단계: 비용 없는 로컬 완성도 향상

1. Mock 스트리밍 화면
2. 중단·재시도·다시 생성
3. 메시지 복사·수정·삭제
4. 로컬 장기 기억 구조
5. 오류 경계와 상태 안내
6. 접근성과 반응형 개선
7. Playwright E2E 테스트
8. 루트 README 작성

이 단계는 외부 계정이나 API 키 없이 진행할 수 있다.

---
### 2단계: 외부 연동 전 인터페이스 준비

1. 서버 전용 LLM 어댑터 경계
2. 인증 세션 인터페이스
3. 서버 Repository 계약
4. 업로드 저장소 계약
5. 결제 상태와 오류 모델
6. 환경변수 검증

이 단계는 실제 요청을 보내지 않고 Mock과 테스트 대역으로 완성한다.

---
### 3단계: 개발용 외부 서비스 검증

1. 선택한 LLM의 최소 대화 요청
2. 개발용 데이터베이스 연결
3. 테스트 사용자 로그인
4. 제한된 이미지 업로드
5. 오류와 사용량 기록

이 단계부터 외부 계정, API 키, 네트워크 접근이 필요하다. 무료 한도가 있더라도 공식 정책 확인이 필요하다.

---
### 4단계: 비용과 운영 정책 확정

1. 예상 사용자 수와 대화량 계산
2. 월간 LLM·이미지 한도 설정
3. 데이터 저장량과 트래픽 추정
4. 도메인과 호스팅 결정
5. 개인정보·콘텐츠 안전 정책 확정
6. 결제와 환불 정책 확정
7. Text-Play 코드 서명과 배포 방식 확정

이 단계의 결정 전에는 실제 구매나 운영 결제를 진행하지 않는다.

---
## 34. 외부 연동 전에 확정해야 하는 정보

| 결정 항목 | 현재 상태 | 확정 후 가능한 작업 |
| --- | --- | --- |
| LLM 공급자와 모델 | 확인 필요 | 실제 대화 어댑터와 비용 제한 |
| 이미지 생성 공급자 | 확인 필요 | 실제 장면 생성과 안전 검사 |
| 회원 인증 방식 | 확인 필요 | 로그인·로그아웃·계정 복구 |
| 데이터베이스 | 확인 필요 | 서버 저장과 다중 기기 동기화 |
| 파일 저장소 | 확인 필요 | 사용자 이미지와 설치 파일 배포 |
| 배포 환경 | 확인 필요 | 운영 URL과 서버 환경변수 |
| 월간 예산 한도 | 확인 필요 | 사용량 차단과 모델 선택 |
| 예상 사용자 수 | 확인 필요 | 서버·DB·트래픽 규모 산정 |
| 데이터 보관 정책 | 확인 필요 | 삭제·백업·복구 기준 |
| 개인정보처리방침 | 확인 필요 | 실제 회원 데이터 수집 |
| 콘텐츠 안전 정책 | 확인 필요 | 신고·차단·검수 기능 |
| 결제·환불 정책 | 확인 필요 | 토큰 구매와 구독 |

확정되지 않은 외부 정보 때문에 전체 개발을 멈추지 않는다. 1단계 로컬 기능과 2단계 인터페이스를 먼저 구현하고, 실제 공급자에 종속되는 부분만 확정 이후로 미룬다.

---
## 35. 캐릭터 상세 경험 구현

캐릭터 상세 화면은 `/characters/[id]`에서 캐릭터별 이야기 정보, 시작 프리셋, 프롤로그, 로컬 상호작용과 관련 캐릭터 탐색을 제공한다. 기본 확인 주소는 `http://127.0.0.1:3000/characters/harin`이다.

| 영역 | 구현 내용 |
| --- | --- |
| 히어로 | 대표 이미지, 이용 등급, 제작자, 소개, 배지, 태그, 샘플 이용 지표 |
| 빠른 동작 | 좋아요, 보관, 링크 복사, 로컬 신고, 제작자 팔로우 |
| 스토리 | 소개, 성격, 세계관, 관계 설정, 대화 스타일, 콘텐츠 주의 사항 |
| 대화 설정 | 사용자 프로필과 캐릭터별 시작 프리셋 선택 |
| 프롤로그 | 선택 프리셋과 연결된 장면 이미지, 설명, 첫 대사 |
| 탐색 | 업데이트 이력, 샘플 랭킹, 관련 캐릭터 |
| 하단 동작 | 최근 대화 이어하기와 새 대화 세션 생성 |

캐릭터별 상세 프로필은 `src/features/character/character-detail-data.ts`에서 관리한다. 상세 프로필이 없는 캐릭터는 기존 캐릭터 필드로 기본 상세 정보를 생성한다.

프롤로그 이미지는 `public/images/characters/prologues`에 저장한다. 현재 7개 기본 캐릭터의 로컬 이미지가 포함되어 있으며 런타임 이미지 생성 API를 호출하지 않는다.

---
## 36. 캐릭터 상세 로컬 데이터 규칙

- 앱 상태 스키마 버전은 7이다.
- 시작 프리셋은 새 대화에 프로필, 관계 단계, 관계 수치, 감정, 장면, 첫 대사를 복사한다.
- 같은 캐릭터로 여러 대화 세션을 만들 수 있으며 대화 식별자는 서로 달라야 한다.
- 최근 대화 이어하기는 보관되지 않은 대화 중 `updatedAt`이 가장 최근인 세션을 선택한다.
- 좋아요, 보관, 팔로우, 신고와 대화는 브라우저 `localStorage`에 저장한다.
- 신고 내용은 현재 외부 운영 서버로 전송되지 않고 로컬 목록에만 저장한다.
- 이용 지표, 업데이트 이력과 랭킹은 실제 운영 데이터가 아니라 화면 확인용 샘플 데이터다.
- 실제 추천 순위, 운영 신고 접수와 제작자 팔로우 동기화는 서버 연동 이후 별도 구현이 필요하다.

---
## 37. 캐릭터 상세 검증 명령

| 목적 | 명령 |
| --- | --- |
| 상세 종단 테스트 | `npx playwright test tests/e2e/character-detail.spec.ts --project=chromium --workers=1` |
| 전체 단위·통합 테스트 | `npm run test:run` |
| 타입 검사 | `npm run typecheck` |
| 린트 | `npm run lint` |
| 프로덕션 빌드 | `npm run build` |

관리형 작업 폴더에서 `node_modules`를 외부 경로의 정션으로 연결한 경우 Turbopack이 경로를 거부할 수 있다. 이 개발 환경에서는 `next dev --webpack -H 127.0.0.1 -p 3000`으로 최신 작업본을 검증했다. 일반 저장소의 독립적인 `node_modules`에서는 기본 `npm run dev`를 우선 사용한다.

---
## 38. 밝은 디자인 전환과 색 체계

앱 전체를 어두운 남색 바탕에서 흰색·연보라 바탕의 밝은 디자인으로 단계별로 전환한다. 색은 페이지별 대표색과 캐릭터 장르색을 함께 쓴다.

| 단계 | 대상 | 상태 |
| --- | --- | --- |
| 1 | 공통 틀(헤더·좌우 패널·모바일 하단 메뉴), 메인 탐색 화면 | 완료 |
| 2 | 캐릭터 상세 | 완료 |
| 3 | 채팅 | 예정 |
| 4 | 보관함 | 예정 |
| 5 | 캐릭터 만들기·편집 | 예정 |
| 6 | 설정, 공통 안내 화면 | 예정 |

전환 중에는 아직 바꾸지 않은 페이지가 공통 틀의 어두운 바탕(`.shell`)과 `:root`의 밝은 글자색에 의존하므로, 마지막 단계 전까지 `.shell` 배경과 `:root` 기본 글자색을 바꾸지 않는다. 전환한 페이지는 자체 바탕색과 `color-scheme: light`를 지정한다.

### 공통 색 변수 (`src/app/globals.css`)

| 변수 | 값 | 용도 |
| --- | --- | --- |
| `--mv-ink` / `--mv-muted` | `#1f1a2e` / `#5f5873` | 밝은 화면 기본·보조 글자 |
| `--mv-line` / `--mv-surface` / `--mv-canvas` | `#e9e3f3` / `#ffffff` / `#fbf9ff` | 경계선, 카드, 바탕 |
| `--mv-focus` | `#1d4ed8` | 키보드 초점 외곽선 |
| `--page-home` | `#7c3aed` | 메인 메뉴(보라) |
| `--page-explore` | `#0369a1` | 탐색(하늘) |
| `--page-ranking` | `#be185d` | 랭킹(분홍) |
| `--page-create` | `#15803d` | 만들기(초록) |
| `--page-library` | `#0f766e` | 보관함(청록) |
| `--page-settings` | `#1d4ed8` | 설정(파랑) |
| `--page-textplay` | `#c2410c` | Text-Play(주황) |

헤더 메뉴와 모바일 하단 메뉴는 `data-accent` 속성으로 페이지 대표색을 받고, 현재 페이지(`aria-current="page"`)를 대표색으로 채운다.

### 장르색 (`data-genre`)

`src/lib/theme/genre-theme.ts`의 `getGenreKey(tags)`가 태그 순서에서 처음 나오는 장르를 대표 장르로 고르고, 요소에 `data-genre`를 붙이면 `globals.css`가 `--genre`(채움), `--genre-soft`(연한 배경), `--genre-strong`(진한 글자), `--genre-glow`(그림자)를 제공한다.

| 장르 | 키 | 채움색 |
| --- | --- | --- |
| 힐링 | `healing` | `#15803d` |
| 판타지 | `fantasy` | `#7c3aed` |
| 현대 | `modern` | `#c2410c` |
| 로맨스 | `romance` | `#be185d` |
| 미스터리 | `mystery` | `#4338ca` |
| SF | `sf` | `#0e7490` |
| 기타 | `other` | `#475569` |
| 필터 전체 | `all` | `#1f1a2e` |

채움색은 모두 흰 글자와 4.5:1 이상의 명도 대비를 갖도록 골랐다. 연한 배경 위 글자는 `--genre-strong`을 쓴다.

### 1단계 적용 내용

- 헤더: 흰 바탕, 하단 여러 색 띠, 메뉴별 대표색 점과 현재 페이지 채움
- 좌측 대화 패널: 대화 카드 왼쪽 띠와 제목을 캐릭터 장르색으로 표시, 만들기 버튼 초록·보관함 링크 청록
- 우측 사용자 패널: 보라·분홍 프로필 카드, 보라→분홍→주황 토큰 카드, 계정·설정·지원 그룹별 표제색
- 모바일 하단 메뉴: 흰 바탕, 현재 메뉴를 대표색 연한 배경과 밑줄로 표시
- 메인 탐색: 여러 색 원형 그라데이션 바탕, 그라데이션 테두리 검색창, 장르색 필터 칩, 장르색 추천 영역, 금·은·동 랭킹 배지, 장르 표시가 붙은 캐릭터 카드

### 2단계 적용 내용 (캐릭터 상세)

- 색 역할 분리: 글자·버튼·선택 상태는 대표 장르색(`main[data-genre]`), 캐릭터별 강조색(`--character-accent`, 밝은 파스텔)은 초상화 빛·배지·프리셋 영역 배경·첫 대사 카드 같은 장식에만 사용한다. 강조색에서 `--accent-soft`(16% 혼합)와 `--accent-line`(40% 혼합)을 만들어 쓴다.
- 바탕: 강조색·장르색 원형 빛이 있는 밝은 바탕, 대표 이미지는 흐리게 상단에만 깐다.
- 히어로: 흰 액자 초상화, 제작자 카드, 장르색 팔로우·주 버튼, 대화·보관·평가 지표를 보라·청록·호박색 칸으로 구분, 빠른 동작은 좋아요 분홍·보관 청록·공유 하늘색
- 태그: `#태그`를 탐색 페이지(`/explore?tag=`) 링크로 변경
- 스토리 정보: 항목마다 다른 색 윗선(보라·분홍·하늘·청록·초록·주황), 주의 사항은 주황 칩
- 대화 시작 설정: 선택 프리셋을 장르색 테두리·연한 배경·번호 채움으로 표시
- 프롤로그: 흰 카드, 이미지 가장자리를 흰색으로 흐리게, 장르색 배지
- 업데이트·랭킹·연관: 하늘·분홍·보라 윗선 카드, 랭킹 1~3위 금·은·동 원형 순위, 연관 캐릭터 카드에 장르 표시
- 하단 동작 막대는 반투명 흰 막대, 신고 창은 흰 대화상자와 빨간 접수 버튼
- 검증: 하린(힐링)·리안(판타지)·카일(SF) 1440·820·390px 가로 넘침 없음, 통합 테스트에 태그 링크·장르 연결 검증 추가

### 메뉴 구성과 탐색 페이지 (`/explore`)

헤더 메뉴는 `메뉴`(`/`, 기존 메인 화면) → `탐색`(`/explore`) → `내 작품` → `Text-Play 다운로드` 순서다. 모바일 하단 메뉴는 `홈`, `탐색`, `랭킹`, `만들기`, `Text-Play`, `보관함` 여섯 칸이다. 오류·없는 페이지 안내의 메인 링크 문구는 `메인으로 이동`이다.

탐색 페이지는 한 줄에 한 영역씩 배치한다.

| 순서 | 영역 | 내용 |
| --- | --- | --- |
| 1 | 태그 검색 | `#`를 붙여도 되는 검색창, 앞부분 일치 우선 제안, Enter로 첫 제안 선택(한글 조합 중 Enter 무시) |
| 2 | 태그 결과 | 태그를 고르면 표시, 인기순 작품 카드, `태그 선택 해제`, 선택 시 결과 영역으로 이동·초점 |
| 3 | 장르별 추천 작품 | 장르별 인기 작품을 번갈아 12개 선택한 가로 목록(보라·분홍 바탕) |
| 4 | 주목할 제작자 | 대화 합계 순 제작자 카드, 대표 작품 썸네일 3개, 자주 쓴 태그 3개, 팔로우 전환(청록 바탕) |
| 5 | 인기 태그 | 작품 수 순 태그 칩 24개와 `모든 태그 보기`(호박색 바탕) |

- 계산 함수는 `src/features/explore/explore-model.ts`에 두고 화면(`ExploreScreen.tsx`)과 분리한다.
- 선택 태그는 `/explore?tag=태그`로 주소에 남는다. 화면 안에서 고를 때는 `history.replaceState`로 주소만 바꾸고, 다른 화면에서 태그 링크로 들어오면 서버 페이지가 `initialTag`를 넘긴다.
- 장르 태그 칩은 장르색, 그 밖의 태그 칩은 태그 이름으로 정한 8가지 색(`data-hue`) 중 하나를 쓴다.
- 메인 화면 `오늘의 추천`의 태그는 탐색 페이지 태그 결과로 연결된다.
- 검증: `tests/unit/explore-model.test.ts` 5개, `tests/integration/explore.test.tsx` 4개

---
## 39. 설정·지원 페이지 (오른쪽 메뉴)

오른쪽 사용자 패널의 메뉴마다 페이지를 둔다. 이전의 `/settings` 탭 화면(`SettingsScreen.tsx`)은 페이지별 컴포넌트로 나누고 삭제했다.

| 묶음(색) | 메뉴 | 주소 | 화면 컴포넌트 | 현재 구성 |
| --- | --- | --- | --- | --- |
| 계정(보라) | 프로필 관리 | `/settings/profile` | `ProfileSettings` | 프로필 미리보기 카드(입력 즉시 반영), 닉네임·프로필 글자 수정 |
| 계정(보라) | 내 캐릭터와 작품 | `/library` | `LibraryScreen` | 기존 보관함으로 연결 |
| 계정(보라) | 토큰 이용 내역 | `/settings/tokens` | `TokenSettings` | 잔액·오늘·누적 칸, 항목별 비용표, 사용 내역·충전은 준비 중 |
| 설정(파랑) | 화면 레이아웃 | `/settings/display` | `DisplaySettings` | 플랫폼·해상도·레이아웃 선택(바꾸면 바로 저장) |
| 설정(파랑) | 알림과 선제 메시지 | `/settings/notifications` | `NotificationSettings` | 선제 메시지 허용, 허용 시간·하루 횟수, Mock 제약 안내 |
| 지원(초록) | 개인정보 및 보안 | `/settings/privacy` | `PrivacySettings` | 저장 위치·외부 전송·계정 안내, 데이터 관리(`#data`), 정책 문서 준비 중 |
| 지원(초록) | 고객 지원 | `/support` | `SupportScreen` | 자주 묻는 질문 6개, 문의 준비 중 안내, 앱·데이터 버전과 응답 방식 |

- 메뉴 정의는 `src/features/settings/settings-navigation.ts` 하나를 오른쪽 패널(`UserPanel`)과 설정 왼쪽 메뉴(`SettingsShell`)가 함께 쓴다. 메뉴를 추가·변경할 때는 이 파일만 고친다.
- `/settings`는 `next.config.ts`의 이동 규칙으로 `/settings/profile`에 307 이동한다. 페이지 안에서 `redirect()`를 쓰면 공통 레이아웃이 먼저 그려져 200 응답 뒤 화면 이동이 되므로 쓰지 않는다.
- `/settings/*`는 `src/app/settings/layout.tsx`가 `SettingsShell`을 감싸고, `/support`는 페이지에서 직접 `SettingsShell`을 감싼다.
- 저장공간 부족 안내와 복구 경고의 `데이터 관리 열기` 링크는 `/settings/privacy#data`를 가리킨다.
- 표(`<table>`) 안에는 줄 끝 JSX 주석을 두지 않는다. 주석 앞 공백이 표의 텍스트 자식이 되어 하이드레이션 오류가 난다.
- 남은 단계(기능 확장, 앱 상태 버전 9의 토큰 사용 내역)는 `HANDOFF.md` 7절을 따른다. 버전 8은 40장의 성인 인증이 사용했다.
- 검증: `tests/integration/settings-pages.test.tsx` 8개, `tests/e2e/settings.spec.ts` 3개

## 40. 성인 인증과 19+ 콘텐츠

크랙의 언세이프티처럼 성인 인증을 마친 사용자만 헤더의 `19+` 스위치로 19세 이용가 캐릭터를 켜고 끈다. 현재는 Mock 단계라 휴대폰 본인인증 대신 **모의 본인인증 창**을 쓴다.

### 사용자가 정한 방향

| 항목 | 결정 |
| --- | --- |
| 19+를 껐을 때 | 추천 목록(메인·검색·탐색·랭킹·연관 캐릭터)에서는 숨기고, 숨길 수 없는 곳(보관함, 왼쪽 대화 목록, 주소로 직접 들어온 상세·대화)은 흐리게 처리하고 잠근다 |
| 인증 방식 | 모의 본인인증 창: 생년월일 + 이용 동의. 미성년이면 거절하고, 생년월일은 저장하지 않는다 |
| 프로필 표시 | 오른쪽 패널의 `FREE 멤버십` 옆에 같은 모양의 `성인 인증 ON/OFF` 배지를 두고, 누르면 `/settings/profile#adult`로 이동 |
| 예시 데이터 | 랭킹 캐릭터 6개를 19세 이용가로 지정하고, 캐릭터 제작 화면에 이용 등급 선택 추가 |

### 규칙

- 나이 기준: 청소년 보호법 제2조(만 19세 미만, 다만 19세가 되는 해의 1월 1일을 맞이한 사람은 제외). 판정식은 `올해 - 출생 연도 >= 19`이다(`checkAdultAge`).
- 인증 유효 기간은 1년이다. 만료되면 `isAdultVerified`가 거짓이 되어 스위치가 자동으로 꺼진 것처럼 동작하고, 프로필에 `OFF · 기간 만료`와 `다시 인증하기`가 보인다.
- 19세 콘텐츠는 **인증이 유효하고 스위치가 켜져 있을 때만** 보인다(`canViewMatureContent`). 설정값만 `true`로 바꿔도 인증이 없으면 보이지 않는다.
- 리듀서는 인증 없이 `set-mature-content: true`를 요청하면 무시한다. 인증 해제(`revoke-adult-verification`)는 스위치도 함께 끈다.
- 헤더·잠금 화면에서 인증하면 바로 19+가 켜지고, 프로필 관리에서 인증하면 스위치는 그대로 둔다(`useAdultAccess({ enableOnVerify })`).
- 19세 이용가 선택은 성인 인증 사용자만 할 수 있다. 인증 없이 저장하려 하면 편집기가 막는다.

### 19세 이용가 예시 캐릭터

| 캐릭터 | 식별자 | 주의 항목 |
| --- | --- | --- |
| 비 내리는 미래 도시의 태오 | `rank-017` | 범죄 수사, 폭력 묘사 |
| 폐선된 자정 승강장의 준호 | `rank-020` | 공포 연출, 실종 사건 |
| 봉인된 지하 대서고의 카인 | `rank-030` | 어두운 판타지, 저주 소재 |
| 시간이 멈춘 저택 화랑의 비비안 | `rank-056` | 고딕 공포, 죽음 소재 |
| 손님이 사라진 오래된 호텔의 주원 | `rank-060` | 공포 연출, 고립된 공간 |
| 자정에만 열리는 서커스의 민재 | `rank-062` | 괴담 공포, 잔혹한 장면 암시 |

공포·범죄·잔혹 소재를 기준으로 골랐고 선정적인 내용은 넣지 않았다. 메인 TOP 10에는 영향을 주지 않도록 11위 이후에서 골랐다. 19+를 끄면 공개 캐릭터 수가 100명에서 94명으로 줄어든다.

### 저장 구조 (앱 상태 버전 8)

- `UserProfile.adultVerification`: `{ method: "mock", verifiedAt, expiresAt } | null`
- `AppSettings.matureContentEnabled`: 19+ 스위치
- `Character.contentRating`, `CharacterDraft.contentRating`: `"all" | "teen" | "mature"`
- 버전 7 데이터는 `migrateVersionSeven`이 변환한다. 기본 캐릭터는 기본 등급(세라 15세, 예시 6개 19세)을, 사용자 캐릭터는 `all`을 받고, 인증은 `null`, 스위치는 꺼진 상태로 시작한다. 0~6 버전도 이 단계를 거쳐 8이 된다.
- 상세 화면의 등급은 정적 프로필보다 캐릭터의 `contentRating`을 우선한다.

### 파일

- `src/features/adult/adult-access.ts`: 나이 확인, 모의 인증 생성, 인증·만료·접근 판정, 추천 가능 캐릭터 필터, 등급 문구
- `AdultVerificationDialog.tsx`: 모의 본인인증 창(문서 최상단 포털, 초점 고정, Esc 닫기)
- `useAdultAccess.tsx`: 인증 여부·켜기·끄기·해제·인증 창을 묶은 훅
- `AdultContentSwitch.tsx`: 헤더 스위치(`role="switch"`, 이름 `19+ 콘텐츠 보기`)
- `AdultContentGate.tsx`: 상세·대화 잠금 화면(흐린 대표 이미지와 19 표시). 대화 주소로 들어와도 새 대화를 만들지 않는다.
- `AdultAccess.module.css`: 스위치·인증 창·잠금 화면 스타일(19세 강조색 `#e11d48`)

### 실제 출시 전 필요한 작업

- 휴대폰 본인인증(PASS·NICE 등) 업체 연동과 계약
- 인증 결과를 서버에 저장하고 클라이언트 값(로컬 저장소, 가져온 JSON)을 신뢰하지 않기
- 연 1회 재인증, 청소년유해매체물 표시 의무 등 운영 정책 확인
- 대화 응답 생성(LLM)에도 등급별 안전 정책 적용

### 검증

- `tests/unit/adult-access.test.ts` 5개(나이 경계, 유효 기간, 접근 조건, 리듀서)
- `tests/unit/local-storage-gateway.test.ts`의 스키마 8 변환 2개
- `tests/integration/adult-content.test.tsx` 7개(스위치·인증 창·미성년 거절, 상세·대화·보관함 잠금, 프로필 배지·인증 카드, 제작 등급)
- `tests/e2e/adult-content.spec.ts` 2개(인증 후 상세 열기와 새로고침 유지, 390px·800px 헤더 넘침)

이 문서는 Text-Play 다운로드 기능과 챗봇 웹 서비스의 구조, 제약, 배포 절차가 변경될 때 코드와 함께 갱신해야 한다.
