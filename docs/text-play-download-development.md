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
- 남은 단계(기능 확장, 앱 상태 버전 10의 토큰 사용 내역)는 `HANDOFF.md` 7절을 따른다. 버전 8은 40장의 성인 인증, 버전 9는 41장의 왼쪽 대화방 창이 사용했다.
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

## 41. 왼쪽 대화방 창 편의 기능

왼쪽 창은 사용자가 진행하던 대화방을 모아 두는 곳이다. 이전에는 대화방 이름과 최근 메시지만 만든 순서대로 보여 주었고, 보관한 대화도 섞여 보였다. 기획한 편의 기능 7개(①~⑦)를 모두 적용하고, 사용자 요청으로 카드 오른쪽에 **진행한 턴 수**를 추가했다.

### 화면 구성(위에서 아래로)

| 영역 | 내용 |
| --- | --- |
| 제목 줄 | `MY CHATS`, `대화방`과 진행 중인 대화 수, 정렬 선택(최근 대화순·관계 높은 순·턴 많은 순·이름순) |
| 만들기 | `＋ 새 캐릭터 만들기`(기존 유지) |
| 검색 | 대화방 이름·캐릭터 이름·최근 메시지. 띄어쓰기·대소문자 무시, 초성 검색(`ㄹㅇ` → 리안), 초성 섞어 쓰기(`ㄷ서ㄱ` → 도서관). Esc로 검색어 지우기 |
| 안내 | 보관 후 `되돌리기`, 고정 한도 안내, 삭제 완료 안내(`role="status"`) |
| 묶음 | `고정됨`(최근에 고정한 순서) → 최근 대화순이면 `오늘`·`어제`·`최근 7일`·`이전`, 다른 정렬이면 `전체 대화` 한 묶음 |
| 카드 | 왼쪽 캐릭터 얼굴, 제목(고정 표시), 최근 메시지, 관계 단계·감정과 관계 막대(0~100) / 오른쪽 마지막 활동 시간, 진행한 턴 수, 더보기(⋯) |
| 더보기 메뉴 | 고정·고정 해제, 이름 변경(1~60자, Enter 저장·Esc 취소), 캐릭터 보기, 보관, 삭제 |
| 보관함 링크 | 맨 아래, 보관한 대화가 있으면 `보관한 대화 N` 표시 |
| 빈 목록 | `진행 중인 대화가 없습니다.`와 `캐릭터 탐색하기` 링크(검색·정렬은 숨김) |

지금 보고 있는 대화(`/chat/[id]?conversation=`)의 카드는 장르색 테두리·배경으로 강조하고 링크에 `aria-current="page"`를 붙인다. 카드 색은 기존처럼 캐릭터 대표 장르색(`data-genre`)을 쓰고, 19+ 잠금 카드는 얼굴을 흐리게 하고 메시지를 가린다.

### 계산 규칙 (`src/features/conversation/conversation-list-model.ts`)

- 목록 대상: 보관하지 않았고 캐릭터와 현재 버전이 있는 대화(`buildConversationListItems`)
- 진행한 턴: 현재 버전의 사용자 메시지 수. 수정 분기를 고르면 그 분기의 턴 수로 바뀐다. 응답이 실패하거나 중단돼도 보낸 사용자 메시지는 1턴으로 센다(왼쪽 창 숫자는 응답이 끝난 뒤 갱신된다).
- 마지막 활동 시각: 대화방 `updatedAt`과 현재 버전 `updatedAt` 중 더 최근 값
- 상대 시간(`formatConversationTime`): 1분 미만 `방금 전`, 1시간 미만 `n분 전`, 같은 날 `n시간 전`, `어제`, 7일 미만 `n일 전`, 올해 `9월 22일`, 지난해 `2025. 12. 30.`. 날짜는 서울 시간 기준이며 창이 열려 있는 동안 1분마다 다시 계산한다.
- 정렬(`sortConversationItems`): 같은 값이면 최근 대화를 앞에 둔다. 이름순은 한국어 가나다순이다.
- 검색(`matchesConversationQuery`): 19+로 잠긴 대화는 최근 메시지로 검색하지 않는다. 가린 내용이 검색 결과로 드러나지 않게 하기 위해서다.
- 고정 한도: `CONVERSATION_PIN_LIMIT = 5`

### 저장 구조 (앱 상태 버전 9)

- `AppState.pinnedConversationIds: string[]`: 최근에 고정한 대화가 앞에 온다.
- `AppSettings.conversationSort: "recent" | "relationship" | "turns" | "title"`
- 버전 8 데이터는 `migrateVersionEight`가 빈 고정 목록과 최근 대화순을 추가한다. 0~7 버전도 이 단계를 거쳐 9가 되고, 전체 JSON 가져오기도 같은 변환을 쓴다. 대화 파일 내보내기 형식은 바뀌지 않는다(고정 여부는 넣지 않는다).
- 리듀서 `toggle-conversation-pin`: 없는 대화·보관한 대화·한도 초과는 무시한다. 보관·삭제·캐릭터 삭제 때 고정 목록에서도 뺀다.
- 왼쪽 창 삭제는 `createBackup("conversation-delete")` 성공 뒤에만 실행한다. 데이터 관리의 백업 목록에는 `대화 삭제 전`으로 보인다.
- 버전 10은 스토리 모드(42장)가 썼다. 오른쪽 메뉴 3단계(토큰 사용 내역)는 버전 11로 미뤘다(`HANDOFF.md` 7절).

### 채팅 화면과의 상태 병합

채팅 화면(`ChatScreen`)은 앱 상태 전체의 복사본을 제어기에 두고 응답이 끝나면 전역 상태를 통째로 바꿨다. 그래서 채팅 중 왼쪽 창이나 헤더에서 바꾼 값(대화 이름, 보관, 고정, 정렬, 패널 열림, 19+ 스위치)이 다음 메시지를 보낼 때 되돌아갔다.

- 이제 `merge-chat-state` 동작으로 채팅이 바꾸는 부분만 반영한다: 현재 대화의 버전·메시지·현재 버전, 토큰 지갑, 선택 대화. 대화 이름과 보관 상태, 그 밖의 설정은 전역 값을 유지한다.
- 이 화면에서 새로 만든 대화만 처음 저장할 때 추가한다(`allowCreate`). 다른 곳에서 지운 대화는 되살리지 않는다.
- 메시지 수정의 원자적 저장(`commitState`)도 최신 전역 상태에 병합한 결과를 저장한다.
- 지금 보고 있는 대화를 왼쪽 창에서 삭제하면 캐릭터 상세(`/characters/[id]`)로 이동한다.

### 키보드와 접근성

- 더보기 버튼 `aria-haspopup="menu"`·`aria-expanded`, 메뉴 `role="menu"`, 항목 `role="menuitem"`. 열면 첫 항목에 초점, ↑↓·Home·End로 이동, Esc로 닫고 더보기 버튼으로 초점 복귀, 메뉴 바깥을 누르면 닫힌다.
- Esc는 메뉴·이름 입력·검색어가 먼저 처리하고 `preventDefault()`로 표시한다. `AppShell`은 처리되지 않은 Esc(`!event.defaultPrevented`)만 패널 닫기에 쓴다. Next.js는 React 이벤트를 문서(`document`)에서 받으므로 `stopPropagation()`으로는 같은 문서의 패널 닫기 리스너를 막을 수 없다.
- 아래 공간이 부족하면(모바일 하단 메뉴 포함) 메뉴를 위로 펼친다(`data-placement="top"`).
- 삭제 확인은 카드 안에 펼치고 `취소`에 먼저 초점을 둔다. 이름 변경 입력은 열리면 기존 이름을 선택한다.
- 관계 막대는 `role="meter"`(이름 `관계 수치`), 현재 대화 링크는 `aria-current="page"`
- 모바일: 더보기 버튼 40×36px, 입력 글자 16px(확대 방지), 서랍 아래에 하단 메뉴 높이만큼 여백을 둬 보관함 링크가 가리지 않는다.
- 왼쪽 패널 너비는 `min(88vw, 328px)`이다.

### 파일

- `src/features/conversation/conversation-list-model.ts`: 목록 항목, 턴 수, 정렬, 날짜 묶음, 상대 시간, 초성 검색, 고정 한도
- `src/components/app-shell/ConversationPanel.tsx`: 왼쪽 창 화면. 현재 주소는 `useSearchParams`를 `Suspense` 안에서 읽는다.
- `src/components/app-shell/AppShell.module.css`: `conversation-*` 규칙과 모바일 여백
- `src/features/core/app-reducer.ts`: `toggle-conversation-pin`, `merge-chat-state`, 고정 정리
- `src/lib/repositories/local-storage-gateway.ts`: 버전 9 판정, `migrateVersionEight`, 백업 사유 `conversation-delete`
- `src/features/chat/ChatScreen.tsx`: 저장할 때 `merge-chat-state` 사용

### 검증

- `tests/unit/conversation-list-model.test.ts` 10개(보관 제외, 턴 수, 활동 시각, 잠금·고정 표시, 정렬 4종, 날짜 묶음, 상대 시간, 초성 검색, 잠금 검색, 고정 한도)
- `tests/unit/app-reducer.test.ts`의 고정·병합 5개, `tests/unit/local-storage-gateway.test.ts`의 스키마 9 4개
- `tests/components/conversation-panel.test.tsx` 14개(보관 제외, 카드 정보, 현재 대화, 검색·초성, 정렬 저장, 고정·한도, 이름 변경, 보관·되돌리기, 백업 후 삭제, 백업 실패, 현재 대화 삭제 이동, 19+ 잠금, 빈 목록)
- `tests/integration/chat-flow.test.tsx`의 채팅 중 외부 변경 유지 1개
- `tests/e2e/conversation-panel.spec.ts` 3개(실제 브라우저 Esc 처리, 새로고침 뒤 고정·정렬 유지, 채팅 중 이름·패널 상태 유지와 턴 증가)
- 390px·820px·1440px에서 메뉴·검색·삭제 확인·보관 안내 상태의 가로 넘침 없음

## 42. 스토리 모드와 안전·편의 보강

경쟁 서비스 비교 뒤 우선순위가 높은 안전·편의 항목 4개를 먼저 넣고, 사용자 요청으로 스토리 모드를 추가했다. 캐릭터가 먼저 말을 거는 기능(선제 메시지)은 사용자 요청으로 보류했다.

### 42.1 안전·편의 보강

| 항목 | 내용 |
| --- | --- |
| 삭제 전 백업 | 보관함의 캐릭터 삭제(`character-delete`)·대화 삭제(`conversation-delete`)·스토리 삭제(`story-delete`)도 백업 성공 뒤에만 지운다. 데이터 관리 백업 목록에 `캐릭터 삭제 전`·`스토리 삭제 전`이 보인다. |
| AI 표시 | 채팅 머리말에 `AI` 표시, 입력창 위에 `AI가 만든 허구의 대화입니다.` 안내(`role="note"`) |
| 60분 이용 알림 | 화면이 보이는 동안의 이용 시간을 30초마다 더해(한 번에 최대 2분) 60분마다 초록 안내 띠를 띄운다. `계속 이용하기`를 누르면 다음 60분 뒤에 다시 알린다. 탭마다 `sessionStorage`(`mateverse:v1:usage-time`)에 따로 센다. |
| 하루 토큰 초기화 | `getDailyUsage(wallet, now)`: 지갑을 마지막으로 바꾼 날짜(서울)가 오늘이 아니면 하루 사용량을 0으로 본다. 저장 구조 변경 없음. 날짜 계산은 `src/lib/time/date-key.ts`로 모았다. |

### 42.2 스토리 모드 개념

- 캐릭터 모드는 캐릭터 한 명과 1:1 대화, 스토리 모드는 캐릭터 1~4명(한 명도 가능)과 하나의 상황극이다.
- 스토리는 기존 캐릭터를 불러와 이야기 속 이름(`displayName`, 기본값은 캐릭터 이름의 마지막 낱말), 역할, 첫 대사를 붙인다. 첫 번째 인물이 대표 인물(`Conversation.characterId`)이다.
- 스토리 이용 등급은 등장인물 중 가장 높은 등급 이상이어야 한다(`getRequiredStoryRating`). 19세 스토리는 19+ 규칙(40장)을 그대로 따른다.

### 42.3 응답 형식과 화면

- 한 번의 응답(assistant 메시지 1개)에 여러 줄: `[내레이션] 장면 묘사`, `[리안] 대사`. `parseStoryMessage`가 조각으로 나누고, 형식이 없는 줄은 앞 조각에 이어 붙인다(첫 줄이면 내레이션). 모르는 이름은 `unknown` 조각으로 그대로 보여 준다.
- 화면: 내레이션은 기울임 상자, 인물 대사는 얼굴·이름·대사 줄(`data-speaker`). 스트리밍 커서는 마지막 조각 끝(`data-stream-tail`)에 붙는다.
- 사용자 입력: `말 걸 상대`를 고르면 `@이름 내용`으로 보낸다(직접 `@`로 시작하면 그대로). `이야기 진행`은 `(다음 장면으로)`를 보내고 말풍선은 `▶ 다음 장면으로`로 보인다.
- 시작 장면: 스토리를 시작하면 `opening` 내레이션 + 첫 대사가 있는 인물의 대사로 첫 응답을 만든다. 캐릭터 대화와 같이 첫 메시지를 보내야 저장된다.
- Mock 응답(`composeStoryReply`): 내레이션 1줄 → 지목한 인물(없으면 해시로 고른 인물) → 조건에 따라 다른 인물 1명이 더 말한다. 같은 입력이면 같은 답을 낸다.
- 토큰·다시 생성·수정 분기·중단은 캐릭터 대화와 같은 `ChatController` 흐름을 쓴다. 관계 수치는 스토리에서는 보여 주지 않는다.

### 42.4 화면과 주소

| 주소 | 화면 |
| --- | --- |
| `/stories` | 스토리 홈: 모드 전환, 공개 스토리(인기순), 내가 만든 스토리, `＋ 새 스토리 만들기` |
| `/stories/[id]` | 상세: 표지·등급·제작자·등장인물, `스토리 시작` 또는 `이어하기`·`새로 시작`, 내 스토리면 `스토리 수정`, 줄거리·시작 장면·내 역할·등장인물 카드 |
| `/stories/[id]/chat?conversation=&version=` | 스토리 대화. 오른쪽에 `등장인물`·`내 역할` 패널 |
| `/stories/new`, `/stories/[id]/edit` | 만들기·수정. 남의 스토리는 권한 안내, 없는 스토리는 찾을 수 없음 안내 |

- 만들기 화면 검증(`validateStoryDraft`): 제목 1~40자, 한 줄 소개 1~80자, 시작 장면 1~1000자, 줄거리 2000자·내 역할 200자 이하, 등장인물 1~4명(같은 캐릭터 중복·사라진 캐릭터 불가), 이야기 속 이름 1~12자·서로 다름·`[`·`]`·`@`·`내레이션` 불가, 역할 120자·첫 대사 300자 이하, 태그 8개·12자 이하, 표지는 장면 이미지 3종, 등급은 등장인물 기준 이상.
- 등장인물 후보(`getStoryCandidates`): 공개·발행된 캐릭터와 내 캐릭터. 19+를 볼 수 없으면 19세 캐릭터는 뺀다. 후보가 많아 검색창(이름·태그, 초성 가능)과 높이 300px 스크롤 목록을 둔다. 고른 인물은 검색 중에도 남는다.
- 저장하지 않은 변경이 있으면 이동 전에 확인한다(`useUnsavedChangesGuard`, 캐릭터 편집기와 공용).

### 42.5 저장 구조 (앱 상태 버전 10)

- `AppState.stories: Story[]`, `Conversation.mode: "character" | "story"`, `storyId`, `storyCast`(시작할 때 복사해 두므로 나중에 스토리를 고쳐도 진행 중인 대화의 등장인물은 바뀌지 않는다)
- 검증: 스토리 대화는 있는 스토리와 비어 있지 않은 `storyCast`가, 캐릭터 대화는 `storyId: null`과 빈 `storyCast`가 있어야 한다.
- `migrateVersionNine`: 기존 대화를 캐릭터 모드로 바꾸고, 등장인물 캐릭터가 모두 있는 예시 스토리 3개를 넣는다. 0~8 버전도 이 단계를 거친다.
- 리듀서: `upsert-story`, `delete-story`(연결 대화·버전·메시지·기억·고정·선택까지 정리). `delete-character`는 등장인물에서 빼고, 빈 스토리는 지우고, 대표 인물이 지워진 스토리 대화는 남은 첫 인물로 대표를 바꾼다.
- 대화 파일: 예전 파일은 캐릭터 모드로 채워 읽고, 스토리 대화 파일은 같은 스토리가 있어야 가져온다.
- 캐릭터 대화 조회(`resolveConversationRoute`, `getLatestActiveConversation`)는 캐릭터 모드만 본다. 스토리 대화가 캐릭터 대화로 열리지 않게 하기 위해서다.

### 42.6 파일

- `src/features/story/story-model.ts`: 응답 형식, 등급, 주소(`createSessionHref`), 스토리 대화 생성·조회
- `src/features/story/story-validation.ts`: 초안·검증·후보
- `src/features/story/StoryHome.tsx`, `StoryDetail.tsx`, `StoryCard.tsx`, `StoryEditor.tsx`, `ModeSwitch.tsx`, `Story.module.css`, `StoryEditor.module.css`
- `src/lib/story/mock-story-writer.ts`, `src/lib/adapters/mock-llm-adapter.ts`(스토리 분기), `src/features/chat/chat-controller.ts`(`createLLMInput`)
- `src/features/chat/ChatScreen.tsx`·`ChatComposer.tsx`·`MessageItem.tsx`: 스토리 분기
- `src/components/app-shell/ConversationPanel.tsx`, `src/features/library/LibraryScreen.tsx`: 스토리 카드와 `내 스토리` 탭
- `src/features/safety/`(이용 시간), `src/lib/time/date-key.ts`, `src/features/core/useUnsavedChangesGuard.ts`

### 42.7 검증

- 단위: `story-model`(12), `story-validation`(10), `mock-story-writer`(5), `usage-time`, `token-policy`(날짜 초기화), `app-reducer`·`local-storage-gateway`의 스토리·스키마 10 항목
- 통합: `story-mode`(7), `story-screens`(5), `story-editor`(6), `library`(스토리 대화·내 스토리·백업), `conversation-panel`(스토리 카드), `app-shell`(이용 알림), `chat-flow`(AI 안내)
- E2E: `tests/e2e/story-mode.spec.ts` 2개(시작 → 상대 지목 → 이야기 진행 → 새로고침 유지, 만들기 → 공개 저장 → 상세 → 시작)
- 390px·820px·1440px 스토리 홈·상세·대화·만들기·보관함·왼쪽 창 가로 넘침 없음, 콘솔 오류 없음

## 43. 디자인 전환 마무리, 메뉴 추천·관심 목록, 예시 스토리 추가

### 43.1 남은 페이지 밝은 디자인 전환 (38장 3~6단계)

| 화면 | 대표색 | 주요 변경 |
| --- | --- | --- |
| 채팅·스토리 대화 | 캐릭터(스토리) 장르색 | 은은한 장르색 바탕, 흰 대화 카드(위쪽 장르색 띠), 캐릭터 말풍선 `#f7f5fb`, 사용자 말풍선 장르색 채움+흰 글자, 전송 버튼 장르색, 중단 버튼 빨강 테두리, 관계 수치 막대, AI 안내 연한 노랑. `main[data-genre]`는 스토리면 스토리 태그, 아니면 캐릭터 태그로 정한다. |
| 보관함 | 청록 `--page-library` | 탭 선택 채움, 카드 위 장르색 띠와 공개 상태 칩, 대화 카드 왼쪽 장르색 띠, 삭제 버튼 빨강, 흰 대화상자 |
| 캐릭터 만들기·편집 | 초록 `--page-create` | 흰 입력 카드(위쪽 띠), 밝은 입력칸, 실시간 미리보기 흰 카드 |
| 스토리 만들기·편집 | 자홍 `#a21caf` | 캐릭터 편집기 스타일에 `data-tone="story"`로 색만 바꿈 |
| 404·오류 | 상태별(보라·빨강·주황) | 흰 카드와 위쪽 상태 색 띠, 주요 버튼 채움 |

- 전역: `:root`의 `color-scheme`·배경·글자색, `html/body` 배경, `.shell` 배경을 밝은 색으로 바꿨다.
- 채팅 오른쪽 패널의 `화면 배치` 제목과 선택 상자 글자가 겹쳐 보여 선택 상자 글자는 화면에서만 숨겼다(이름 `채팅 레이아웃`은 그대로).
- 헤더: 사용자 요청으로 배경을 연한 회색 `rgb(236 235 240 / 97%)`, 아래 선 `#dcdae3`로 바꿨다. 헤더 안의 흰 알약 버튼이 더 잘 보인다.

### 43.2 캐릭터 모드·스토리 모드 머리말 위치 통일

두 모드를 오갈 때 글자가 움직여 보였다. 스토리 홈(`StoryHome`)을 메인(`DiscoveryHome`)과 같게 맞췄다.

- 화면 여백 `clamp(28px, 4vw, 52px) clamp(16px, 4vw, 64px)`, 구역 최대 너비 1400px(`.homePage`, 스토리 상세는 1280px 유지)
- 제목 `clamp(2rem, 4.6vw, 4rem)`·줄 높이 1.1, 설명 최대 너비 560px, 표제 글자 크기 .82rem
- 머리말 오른쪽 `＋ 새 스토리 만들기`를 메인 검색창과 같은 너비(`flex: 0 1 420px`)의 칸에 넣어 제목 줄바꿈 폭을 맞춤. 모바일은 두 화면 모두 세로 배치.
- 측정: 390·820·1440px에서 모드 전환·표제·제목·설명의 시작 위치와 제목 글자 크기가 같다. 표제와 설명 문구 길이 차이만 남는다.

### 43.3 메뉴 `유저 추천 캐릭터`·`관심 목록`

`캐릭터 탐색 결과` 아래에 두 영역을 차례로 둔다. 검색어나 카테고리를 고르면 숨긴다(검색 결과와 같은 카드가 겹치지 않게).

- 계산(`src/features/discovery/recommendation-model.ts`)
  - 취향 신호: 좋아요 3점, 보관 2점, 보관하지 않은 대화의 캐릭터 2점(스토리 대화는 등장인물 전원)
  - 신호 캐릭터의 태그에 점수를 더해 태그 취향을 만들고, 아직 모르는 공개 캐릭터를 태그 점수 합으로 정렬(같으면 인기순)해 8명
  - 신호가 없으면 인기순. 안내 문구는 취향 태그 상위 2개(`#판타지 #여행 취향을 바탕으로 골랐어요.`) 또는 인기순 안내
  - 관심 목록: 좋아요 → 보관 순서로 합치고 중복 제거, 사라진 캐릭터 제외, 19+를 끄면 19세 캐릭터 제외. 안내 `좋아요 N · 보관 N`
  - 비었으면 `아직 관심 캐릭터가 없어요.`와 `캐릭터 탐색하기`(`/explore`)
- 화면: 기존 `CharacterRail`에 `description`·`empty`를 더해 재사용했다.

### 43.4 예시 스토리 3개 → 11개

| 스토리 | 등장인물 | 등급 |
| --- | --- | --- |
| 괴물 호텔의 열세 번째 손님 | 오스카·미나·로제·벨라 | 전체 |
| 새벽 열차는 별 사이를 달린다 | 유리·아샤·은하 | 전체 |
| 옥상 라디오, 마지막 사연 | 도윤·유나·현서 | 전체 |
| 멈춘 시계 박물관의 도난 사건 | 세린·에드윈·루카·세라 | 15세 |
| 자정의 재봉실, 찢어진 꿈 수선 | 나린·아델 | 전체 |
| 숲의 진료소에서 하룻밤 | 미엘 | 전체 |
| 자정 승강장, 사라진 막차 | 준호·다온 | 19세 |
| 네온 골목 실종 사건 | 태오·린·니코 | 19세 |

- 공통 값(제작자 `메이트버스 스토리 연구소`, 전체 공개, 발행)은 `createStudioStory`가 채운다.
- 표지에 캐릭터 이미지를 쓸 수 있게 했다(`isStoryCoverImage`: 장면 3종 또는 `/images/characters/*.webp`). 편집기 표지 선택지는 장면 3종 뒤에 고른 등장인물 이미지를 붙이고(`getStoryCoverChoices`), 그 인물을 빼면 기본 표지로 돌아간다. 카드·상세 표지는 얼굴이 보이도록 `object-position: center 22%`.
- 기존 데이터 보충: `LocalStorageGateway.load`가 변환 뒤 `addMissingBuiltInStories`를 실행한다. 없는 기본 스토리 중 등장인물 캐릭터가 모두 있는 것만 뒤에 붙이고 저장한다(안내 문구 없음). 모두 있으면 다시 저장하지 않는다.

### 43.5 검증

- 단위: `recommendation-model`(5), `story-validation`(표지 2), `fixtures`(예시 스토리 전부 편집기 검증 통과·이름 일치·1~4명·19세 2개), `local-storage-gateway`(기본 스토리 보충 2)
- 컴포넌트: `discovery-home`(영역 순서·추천 안내·관심 목록·빈 안내·검색 중 숨김 2)
- 기존 테스트의 예시 스토리 개수·목록 기대값을 11개 기준으로 수정
- 390px·820px·1440px 캡처에서 가로 넘침 없음, 콘솔 오류 없음

## 44. 이미지 스튜디오 A단계 (Mock)

사용자 요청: 크랙처럼 이미지를 생성해 저장하고 자기 작품 제작에 활용한다. 금지 항목은 미성년자와 실존 인물 합성 두 가지만 두고, 중요 부위 가림 처리는 하지 않기를 원했다. 국내법상 위험을 안내한 뒤 "지역별 노출 정책"(한국 서버 가림 처리, 해외 서버 가림 없음)으로 합의했다.

### 44.1 화면

| 영역 | 내용 |
| --- | --- |
| 생성 양식 | 장면 설명(1~400자, 글자 수 표시), 그림체 칩 4종, 비율 칩 3종(세로 600×800·정사각 700×700·가로 800×500), 참고 캐릭터(공개·내 캐릭터, 19+ 규칙 적용), 이용 등급, 생성 규칙 안내(`role="note"`, 지역 정책 문구와 금지 2종), `이미지 만들기 · 20 토큰` |
| 방금 만든 이미지 | 결과 카드(등급·가림 처리 칩, 그림체·비율·날짜, 즐겨찾기, 캐릭터로 쓰기, 스토리로 쓰기, 삭제) |
| 내 이미지 | 개수, `전체`·`즐겨찾기` 탭, 카드 격자(모바일 2열), 빈 안내 |
| 삭제 대화상자 | 표지·장면에 쓴 이미지는 남는다는 안내, 백업 뒤 삭제 |

- 대표색은 남보라(`#4338ca`). 헤더 메뉴에 `이미지`(강조색 `images`)를 추가했다. 태블릿(761~980px)에서 메뉴가 줄바꿈되지 않게 메뉴 이름을 한 줄로 고정하고, `Text-Play 다운로드`의 `다운로드`는 화면에서만 숨긴다(링크 이름은 그대로).
- 모바일 하단 메뉴는 6칸을 유지하고, 모바일에서는 보관함 머리말의 `이미지 스튜디오` 링크로 들어간다.

### 44.2 생성 흐름 (`src/features/images/image-model.ts`)

1. `checkImageRequest`: 길이 → 실존 인물 표현(모든 등급) → 19세 요청의 미성년자 표현 순으로 검사
   - 실존 인물: 연예인·유명인·셀럽·정치인·대통령·실존·실제 인물/사람·딥페이크·얼굴/사진 합성·닮은꼴
   - 미성년자: 미성년·초중고생 표현·초딩/중딩/고딩·아동·어린이·유아·아기·로리·쇼타·교복·18세 이하 숫자/한글 나이
   - Mock 단계의 낱말 검사라 놓치거나 지나치게 막을 수 있다. 실제 서비스는 분류 모델로 바꾼다.
2. 19세는 `canViewMatureContent`(성인 인증+19+)일 때만
3. `trySpend(wallet, "studio-image")` 20토큰
4. `createGeneratedImage`: Mock SVG(`createMockImageSource`, 같은 입력이면 같은 그림, 비·밤·바다·숲·별 낱말에 맞춘 장식과 인물 실루엣, `MOCK` 표시) + 지역 정책의 `exposure`
5. 리듀서 `add-image`(이미지와 지갑을 한 번에 반영, 같은 식별자 무시)

### 44.3 작품 활용

- 캐릭터 편집기: `initialImageId`(주소 `?image=`)로 시작하면 대표 이미지로 선택. 선택지 끝에 내 이미지(19+ 규칙 적용)를 붙이고, 갤러리에서 지운 이미지를 쓰고 있으면 `현재 대표 이미지`로 남긴다. 저장할 때 이미지 등급이 캐릭터 등급보다 높으면 `15세 이용가 이미지를 쓰려면 이용 등급을 15세 이용가 이상으로 정해 주세요.`
- 스토리 편집기: 같은 방식(`getStoryCoverChoices`의 세 번째 인자로 내 이미지 전달)
- 검증 함수: 캐릭터 대표 이미지·스토리 표지에 생성 이미지 형식(`isGeneratedImageSource`)을 허용
- 채팅: 오른쪽 패널 `내 이미지`(작품 등급 이하·19+ 규칙, 최근 6장). 누르면 `ChatController.applySceneImage`로 현재 버전 장면만 바꾸고 토큰은 쓰지 않는다. 응답 중에는 막는다.
- 페이지 `/characters/new`, `/stories/new`는 `searchParams`를 읽어 동적 페이지가 됐다.

### 44.4 저장 구조 (앱 상태 버전 11)

- `GeneratedImage { id, prompt, style, aspect, referenceCharacterId, contentRating, exposure, src, favorite, createdAt }`
- 검증: 그림체·비율·등급·가림 처리 값, 19세만 `covered`/`uncovered`·나머지는 `none`, `src`는 인코딩된 SVG 데이터(6만 자 이하, `<script`·`on…=`·외부 `href` 거부), 식별자 중복 금지
- `migrateVersionTen`: 버전 10 → 11(빈 갤러리). 9 이하는 연쇄 변환. 미래 버전은 12 이상.
- 백업 사유 `image-delete`(데이터 관리 표시 `이미지 삭제 전`), 토큰 비용표에 `이미지 스튜디오 20 토큰`

### 44.5 다음 단계(B·C)

- B: API 키를 숨기는 서버 통로(Next.js 서버 경로), 이미지 파일 저장소(브라우저 저장소는 수 MB 한도), 생성 대기열·취소, 비용 기록
- C: 실제 생성 모델(전체 이용가는 상용 API, 19세는 자체 운영 공개 모델), 생성 전 문장 분류·생성 후 이미지 분류(등급·미성년자처럼 보이는 인물·실존 인물 얼굴), 신고·삭제·기록, 법률 검토 후 공개

### 44.6 검증

- 단위: `image-model`(8: Mock 결정성·크기, 형식 거부, 실존 인물, 미성년자, 길이, 지역별 가림, 지역 결정, 등급 사용), `app-reducer`(이미지 1), `local-storage-gateway`(버전 10 변환·이미지 검증 2)
- 통합: `image-studio`(5: 생성·저장·활용 링크, 실존 인물 거부, 토큰 부족, 19세 권한·미성년자·가림 기록, 잠금·즐겨찾기·백업 삭제), 캐릭터 편집기·스토리 편집기·채팅 각 1
- E2E: `image-studio.spec.ts`(생성 → 새로고침 유지 → 캐릭터 대표 이미지로 사용)
- 390·820·1440px 가로 넘침 없음, 콘솔 오류 없음

## 45. 크랙 참고 채팅방 기능 (Mock)

사용자 요청: 크랙 채팅 화면(설정 창 7장 포함)에서 우리 서비스에 없는 요소를 찾아 모두 넣는다. 추가 요청으로 INFO는 고정된 창으로 턴마다 갱신되고, 대화 버전을 통해 턴별 INFO를 다시 볼 수 있어야 한다.

### 45.1 구현 요소 18가지

| 번호 | 요소 | 위치 |
| --- | --- | --- |
| 1 | 플레이 가이드 | 작품 편집기 입력, 채팅 위 카드(`더 보기`·`창으로 보기`), 설정 메뉴 |
| 2 | 상태창 형식 | 작품 편집기(켜기, 장소·시간·팁·호감도·속마음, 직접 항목 2개) |
| 3 | 업데이트 정보 | 작품 편집기 기록, 설정 메뉴의 최신 버전·날짜와 목록 창 |
| 4 | 대화 프로필 | 설정 메뉴 창(선택·추가·수정·삭제, 기본 프로필 보호) |
| 5 | 유저 노트 | 500자, 2,000자 확장(메시지당 +1토큰), 초과 경고 |
| 6 | 요약 메모리 | 장기·단기·관계도·목표 탭, 총 개수, 최신순, 편집, 직접 추가, 자동 생성 |
| 7 | 문체 변경 | 5종과 미리보기 |
| 8 | 답변 길이 및 생각 조절 | 등급별 펼침 목록, 최대 비용 표시, 길이·생각 슬라이더 |
| 9 | 유저 사칭 방지 | 켜고 끄기(기본 켬) |
| 10 | 추천 답변 | 행동·질문·감정 3개 |
| 11 | `*` 지문·`/` 명령어 | 입력 보조 줄, 명령어 메뉴(위아래 화살표·Esc) |
| 12 | 키보드 단축키 | 안내 창(Ctrl+/), 9가지 |
| 13 | 대화 속 상황 이미지 | 응답 아래 그림 |
| 14 | 이미지 모음·상황 이미지 보기 | 오른쪽 위 모음, 켜고 끄기 |
| 15 | 채팅 모델 등급 | 제목 옆 선택 메뉴(`menuitemradio`) |
| 16 | 대화 폴더·자동 정리·종류 탭·상태 줄 | 왼쪽 창 |
| 17 | 알림함 | 헤더 종 버튼 |
| 18 | 글꼴·채팅 다크 모드 | 전체 설정 |

### 45.2 고정 INFO 상태창 (`status-model.ts`, `StatusPanel.tsx`)

- `composeStatus`는 대화·버전·턴·작품의 상태창 형식으로 값을 정해서 만든다(같은 입력이면 같은 결과). 장소는 장르별 목록에서 4턴마다 바뀌고, 시간은 서울 요일과 20:00부터 턴마다 6분씩, 호감도 변화는 바로 앞 상태창과 비교한다.
- 응답이 끝나면 `ChatController.generateReply`가 응답 메시지에 `status`를 붙인다. 메시지를 고쳐 새 버전을 만들면 앞 메시지는 복사되므로 이전 턴 상태창도 그대로 남는다. 다시 생성하면 같은 턴의 상태창이 새로 만들어진다.
- 화면은 현재 버전의 상태창 목록을 턴 순서로 보여 준다. `N턴 · i/M`, 이전·다음(Alt+←/→), `최신`, `복사`(글자 형식), 접기(Alt+I, 설정 `statusPanelOpen`에 저장). 상태창 형식을 끈 작품은 표시하지 않는다.
- 왼쪽 창 카드는 현재 버전의 마지막 상태창 장소·시간을 한 줄로 보여 준다(19+ 잠금 대화는 숨김).

### 45.3 비용 (`chat-tiers.ts`)

| 등급 | 기본 비용 | 기본 길이 초과 500토큰마다 | 최대(5x·더 깊게) |
| --- | --- | --- | --- |
| 베이직챗 | 1 | +1 | 11 |
| 플러스챗 | 3 | +1 | 17 |
| 프리미엄챗 | 8 | +2 | 40 |

- 생각 비용 = 기본 비용 × (끄기 0, 기본 0.5, 깊게 1, 더 깊게 2), 1.5x 미만이면 생각은 꺼진다.
- 유저 노트 확장 +1. 메시지 비용은 `getMessageCost`, 차감은 `trySpendAmount`(기록 종류 `chat`).
- 기본 설정(베이직·기본 길이·생각 끔)은 1토큰이라 기존 대화 비용과 같다.

### 45.4 대화방 설정 흐름

- 설정은 대화방마다 `Conversation.settings`에 저장한다(`update-conversation-settings`). 저장 전 새 대화에서 설정·기억을 바꾸면 `ensureSaved`로 먼저 저장한다.
- 요청 직전에 `buildChatContext`(설정·대화 프로필·요약 메모리·플레이 가이드)를 `ChatController.setContext`로 넘기고, 제어기는 `LLMInput.options`로 전달한다.
- 채팅 저장(`merge-chat-state`)은 제어기 사본이 아니라 앱 상태의 `settings`·`folderId`를 유지한다(왼쪽 창·설정 창 변경 보호).
- 요약 메모리: 성공한 응답 뒤 현재 버전 사용자 턴이 5의 배수면 `summarizeConversation`으로 단기 기억, 인물별 관계도(대화별 1개, 사용자가 고친 것은 유지), 15의 배수면 장기 기억을 만든다. 같은 사용자 메시지에서 두 번 만들지 않는다. 대화를 지우면 그 대화의 기억도 지운다.

### 45.5 왼쪽 창·알림함

- 묶음 순서: 고정됨 → 폴더(만든 순) → 날짜 묶음. 검색 중이거나 탭이 `전체`가 아니면 빈 폴더는 숨긴다. 폴더 이름 30자.
- 자동 정리(`autoOrganizeConversations`): 보관하지 않았고 폴더가 없는 대화 중 같은 캐릭터·같은 스토리가 2개 이상이면 작품 이름 폴더로 옮긴다. 같은 이름 폴더가 있으면 다시 쓴다.
- 알림(`AppNotification`): 최대 30개, 같은 식별자는 한 번만. 종 버튼 목록은 Esc·바깥 누름으로 닫히고 닫을 때 읽음 처리한다. Esc는 캡처 단계에서 처리해 열린 패널을 닫지 않는다.
- 태블릿(761~980px) 헤더에 종 버튼 자리를 만들려고 로고 108px, 메뉴 간격 4px, 메뉴 여백 7px로 줄였다.

### 45.6 저장 구조 (앱 상태 버전 12)

- 새 필드: 45.4·HANDOFF 17절 목록과 같다. 검사는 `hasSchemaTwelveFields`(프로필 1개 이상, 폴더 참조, 새 기억 분류)
- `migrateVersionEleven`: 기본 대화방 설정, 내장 작품은 기본 플레이 가이드·상태창, 사용자 작품은 빈 가이드·상태창 켬, 기억 분류 변환(요약 → 장기, 사건 → 단기, 취향 → 목표), 기본 프로필, 빈 폴더, 새 화면 설정. 10 이하는 연쇄 변환, 미래 버전은 13 이상.
- 대화 파일 가져오기(`normalizeConversationMode`)는 설정을 채우고 폴더를 비우며, 없는 대화 프로필은 기본으로 바꾼다.

### 45.7 검증

- 단위: `chat-features-model`(9), `chat-settings-reducer`(5), `conversation-list-model`(탭·폴더·상태 줄 3), `local-storage-gateway`(버전 11 → 12 2), `mock-adapters`(응답 꾸밈 1)
- 통합: `chat-room-features`(8: 상태창 턴 이동, 등급 비용, 명령어·추천·지문, 설정 전달, 5턴 자동 기억·목표 추가, 다크 모드·글자 크기, 단축키 안내, 새 대화 선저장), `conversation-folders`(5), `notification-bell`(2)
- E2E: `chat-room-features.spec.ts`(상태창 새로고침 유지·턴 이동, 등급·다크 모드 유지, 390·820·1440px 가로 넘침과 외부 요청 없음). 전체 단위 419개·E2E 38개 통과
- 화면 확인에서 고친 것: 채팅 제목 옆 칩 스타일이 등급 메뉴 안까지 번지던 문제(`.meta > span`), 좁은 오른쪽 패널 메뉴의 값 줄바꿈(값을 이름 아래 줄로), 다크 모드의 흰 메시지 버튼·선택 상자, 800px 헤더 12px 넘침

## 46. 제작자 스탯, 채팅방 설정 열고 닫기, 사이트 다크 모드

사용자 요청: INFO와 캐릭터·스토리마다 제작자가 스탯을 정하고(예: 호감도 초기값 0), 정한 설정에 따라 값이 정해지거나 AI 채팅의 판단으로 바뀌게 한다. 채팅방 설정은 오른쪽 패널처럼 열고 닫고, 다크 모드는 헤더 19+ 스위치 왼쪽에 두며, 오른쪽 패널과 겹치는 채팅방 설정 항목은 뺀다. 다크 모드 적용 범위는 사용자 선택으로 사이트 전체로 정했다.

### 46.1 스탯 모델 (`src/features/chat/stat-model.ts`)

| 항목 | 규칙 |
| --- | --- |
| 개수 | 작품당 6개, 낱말 규칙은 스탯당 5개 |
| 이름·아이콘 | 이름 1~10자(겹치면 안 됨), 아이콘은 이모지 한두 개(8자 이하) |
| 값 | 초기값·최솟값·최댓값은 ±99,999 정수, 최솟값 < 최댓값, 초기값은 범위 안 |
| 정하는 방법 | `rule` 규칙대로, `ai` AI가 판단, `both` 규칙 + AI |
| 규칙 변화 | 매 턴 변화(±100) + 사용자 메시지에 들어 있는 낱말 규칙의 변화 합(대소문자 무시) |
| AI 변화 | `judgeStats` 결과를 `±aiMaxChange`(1~100)로 자름 |
| 적용 대상 | `each` 인물마다(스토리는 등장인물마다, 캐릭터 대화는 한 명), `shared` 하나만 |
| 계산 | 직전 턴 값(없으면 초기값) + 규칙 + AI → 최솟값~최댓값, 변화량은 실제로 바뀐 만큼 |
| 표시 | 범위가 100 이하면 `값/최댓값`, 넓으면 값만(예: 골드 1,250) |

- Mock AI 판단(`judgeStatsMock`): 긍정 표현 2점·부정 표현 −3점·감정 보정 ±1로 분위기를 정하고, 이름이 호감·신뢰·애정 같은 스탯은 분위기대로, 경계·의심·분노 같은 스탯은 반대로, 그 밖의 스탯은 −1~+1로 조금 흔든다. 같은 입력이면 같은 결과.
- 실제 모델 연결: `LLMAdapter.judgeStats(input)`에 스탯 목록(현재 값·범위·한도)과 이번 메시지·응답·감정을 넘기고 `{ statId, target, delta }[]`을 받는다(구조화 출력 권장). 응답 생성 입력 `options.stats`에도 지금 값이 들어가 역할극에 반영할 수 있다.
- `ChatController`는 응답이 끝난 뒤(중단 확인 포함) 판단 → 상태창 계산 순으로 처리하고, 메시지 수정 분기에서도 같은 순서를 따른다. 판단이 실패하면 규칙 변화만 적용한다.
- INFO(`StatusPanel`)는 인물 줄마다 `아이콘 이름 값(변화)` 칩과 속마음을, 공통 스탯은 `공통` 줄에 보여 준다. 첫 응답 전에는 `시작 스탯`(초기값)을 보여 준다. 복사 문구는 `[리안 ❤️호감도 15/100(+10)] "속마음"` 형식.
- 요약 메모리의 관계도는 호감도 스탯 값(없으면 관계 수치)을 쓴다.

### 46.2 스탯 편집기 (`StatEditor.tsx`)

- 위치: 캐릭터·스토리 편집기 `상태창` 안 `스탯` 묶음. 상태창을 끄면 입력이 잠긴다.
- 카드마다 이름·아이콘, 초기값·최솟값·최댓값, 정하는 방법(라디오 카드 3개), 규칙일 때 매 턴 변화·낱말 규칙(추가·삭제), AI일 때 한 턴 최대 변화, 적용 대상, `○○ 스탯 삭제`. `＋ 스탯 추가 (n/6)`.
- 숫자 입력은 글자 칸에서 정수만 받으며 빈 칸·빼기 기호를 입력하는 중에도 지워지지 않는다(빈 칸은 저장할 때 “정수로 적어 주세요” 오류).
- 저장할 때 `normalizeStats`(공백 정리·빈 낱말 규칙 제거) 후 `validateStats` 오류를 상태창 아래에 보여 주고 저장을 막는다.

### 46.3 채팅방 설정 열고 닫기

- 버튼: 채팅 제목 옆 `설정`(`aria-controls="chat-settings-panel"`, `aria-expanded`). 패널 머리말에 `채팅방 설정` 제목과 `×`.
- 넓은 화면(서랍이 아닌 배치): 접으면 `data-panel="closed"`로 장면·대화 두 열(D1·D2·T1) 또는 위아래(D3·T2·T3)가 되고, 펼침 상태는 `settings.chatPanelOpen`에 저장한다.
- 모바일(760px 이하 또는 M 배치, `data-overlay="true"`): 처음엔 닫힌 오른쪽 서랍. 열면 왼쪽·오른쪽 패널을 닫고, 배경·Esc(대화상자·메뉴가 처리한 Esc 제외)·× 로 닫으며 열기 버튼으로 초점을 돌린다. 왼쪽·오른쪽 패널을 열면 서랍은 닫힌다.
- 고정 위치 서랍에는 열 배치의 `align-self: start`를 풀어야 높이·위치가 맞는다(최신 크롬은 고정 위치에도 정렬을 적용한다). 열 때는 `visibility`를 바로 보이게 해야 닫기 버튼에 초점이 간다.
- 설정 대화상자(`ChatDialog`)는 `createPortal`로 문서 끝에 그린다(접힌 열·움직이는 서랍 안에서도 보이게).
- 뺀 항목: `나의 토큰`(오른쪽 패널 보유 토큰), `화면 배치`(오른쪽 패널 화면 레이아웃), `채팅 다크 모드`(헤더 스위치로 이동). 안쪽 첫 묶음 이름은 `대화 설정`.

### 46.4 사이트 다크 모드

- 상태: `settings.theme`(`light`·`dark`), 헤더 `ThemeToggle`(19+ 왼쪽, 해·달 아이콘). `AppShell`이 `document.documentElement.dataset.theme`과 `localStorage("mateverse:theme")`을 맞추고, `layout.tsx`의 인라인 스크립트가 저장 값을 그리기 전에 적용한다(`<html suppressHydrationWarning>`).
- 색 체계: 모든 CSS 색을 `light-dark(밝은, 어두운)`으로 바꿨다. 변환 규칙(스크래치 스크립트로 일괄 적용 후 화면 점검):
  - 배경: 흰색 → `var(--mv-surface)`, 거의 흰 색 → 아주 어두운 같은 색조, 연한 색 → 어두운 같은 색조(채도 낮춤), 중간·진한 채움은 그대로
  - 글자: 진한 글자 → 밝은 같은 색조(무채색은 밝은 회색), 중간 글자 → 밝기 70%, 흰 글자는 그대로
  - 테두리: 연한 선 → 어두운 같은 색조 선, 흰 선 → `var(--mv-surface)`
  - 그림자: 보라·검정 그림자 → 검정, 진하게
  - 강조 변수를 글자색으로 쓴 곳(`color: var(--accent)` 등) → `light-dark(var(--x), color-mix(in srgb, var(--x) 55%, white))`
  - `color-mix(..., white)` → `color-mix(..., var(--mv-surface))`
  - 예외(고정 색 유지): 스위치 손잡이 흰색, 금·은·동 순위 배지, Text-Play 밝은 버튼·번호·마무리 안내 띠의 진한 글자
- 각 화면의 `color-scheme: light` 고정과 예전 `data-chat-theme` 규칙은 지웠다.
- 로고: 다크 화면에서 `Verse`(검은 글자·흰 테두리)를 반전한 `mate-verse-logo-v3-dark.webp`(47KB, 보일 때만 불러옴)로 바꾼다.
- 헤더 자리: 7열(왼쪽 버튼·로고·메뉴·다크 모드·19+·알림함·메뉴). 태블릿은 메뉴 색 점을 숨기고, 모바일은 간격 6px·여백 10px.
- `global-error.tsx`(앱 전체 오류 화면)는 공통 스타일을 못 쓰므로 47장에서 저장된 테마를 직접 읽어 색을 고르게 했다.

### 46.5 저장 구조 (앱 상태 버전 13)

- `StatDefinition { id, name, icon, initial, min, max, mode, perTurn, rules[{ keyword, delta }], aiMaxChange, scope }`, `StatValue { statId, name, icon, target, value, delta, min, max }`
- `StatusTemplate`: `affection: boolean` → `stats: StatDefinition[]`(6개 이하·식별자 중복 금지·최솟값 < 최댓값)
- `StatusSnapshot`: `affection[]` → `stats: StatValue[]`
- 설정: `chatTheme` → `theme`, `chatPanelOpen` 추가
- `migrateVersionTwelve`: 호감도 켠 형식 → 기본 호감도 스탯, 끈 형식 → 빈 스탯, 턴별 호감도 → `affection` 스탯 값(0~100), `chatTheme` → `theme`. 버전 11 변환은 버전 12 형식(`toVersionTwelveTemplate`)을 거쳐 13으로 잇는다. 미래 버전은 14 이상.
- 대화 파일 가져오기: 예전 상태창 값을 `upgradeStatusSnapshot`으로 바꾼다.

### 46.6 검증

- 단위: `chat-features-model`(12: 스탯 규칙·AI·공통·범위·초기값, Mock 판단, 검증), `local-storage-gateway`(45: 버전 12 → 13, 잘못된 스탯·예전 상태창 거부), `conversation-list-model`·`mock-adapters` 형식 갱신
- 통합·컴포넌트: `stat-editor`(3), `chat-room-features`(9: 시작 스탯과 턴별 변화·이전 턴 값), `chat-layout-panel`(4: 배치 적용, 넓은 화면 접기 저장, 모바일 서랍 Esc·초점, 중복 항목 없음), `theme-toggle`(2), 전체 단위 431개 통과
- E2E: `chat-room-features.spec.ts`(설정 접기·등급·다크 모드 새로고침 유지와 다른 페이지 적용, 390px 서랍 위치·초점), 전체 39개 통과
- 화면 점검: 18개 화면 × 390·820·1440px × 밝게·어둡게에서 가로 넘침 0, 콘솔 오류 없음(일부러 연 404 제외). 글자 대비 자동 점검(3 미만 찾기)으로 탐색 태그 개수·캐릭터 상세 소제목·토큰 칸 이름·Text-Play 보조 글자 등을 고쳤고, 남은 표시는 그라데이션 위 흰 글자(점검 도구가 그라데이션을 읽지 못함)뿐이다.

## 47. 로드맵 0단계: 정리와 기반 다지기

사용자와 합의한 단계별 로드맵(인수인계 문서 13절)의 첫 단계다. 화면 동작은 바꾸지 않고 뒤 단계(저장 형식을 계속 올리는 작업)가 안전하도록 바닥을 정리했다.

### 47.1 저장소 파일 분리

`local-storage-gateway.ts`(1,283줄)를 역할별 세 파일로 나눴다. 동작 변화는 없다.

| 파일 | 줄 수 | 역할 |
| --- | --- | --- |
| `src/lib/repositories/state-validation.ts` | 620 | 허용 값 목록, 항목별 검사, `isAppState`, 이전 버전 상태 검사(`isVersionTwoState`~`isVersionTwelveState`) |
| `src/lib/repositories/state-migrations.ts` | 313 | `migrateVersionZero`~`migrateVersionTwelve`, `migrateParsedState`(버전별 진입점), `addMissingBuiltInStories` |
| `src/lib/repositories/local-storage-gateway.ts` | 363 | 저장 키, 읽기·쓰기, 가져오기·내보내기, 백업·복구, `LocalStorageGateway` |

- 의존 방향: 저장 → 변환 → 검사(한 방향). 저장 파일은 `isAppState`와 `migrateVersion…`, `addMissingBuiltInStories`를 다시 내보내 기존 불러오기 이름을 유지한다. 대화 파일 가져오기(`conversation-export.ts`)는 검사 파일을 직접 쓴다.
- 새 저장 버전을 추가할 때: ① `types.ts`의 `schemaVersion` ② `state-validation.ts`에 새 필드 검사와 이전 버전 검사 ③ `state-migrations.ts`에 `migrateVersion…`과 `migrateParsedState` 분기 ④ `local-storage-gateway.ts`의 미래 버전 판정 숫자 ⑤ 초기 상태와 테스트.

### 47.2 비상 오류 화면 다크 모드

- `src/lib/theme/stored-theme.ts`: `THEME_STORAGE_KEY`(`mateverse:theme`), `readStoredTheme()`(다크만 다크, 없거나 읽지 못하면 밝게), `getErrorScreenPalette(theme)`.
- `global-error.tsx`는 `useSyncExternalStore`로 저장된 테마를 읽어(서버에서는 밝게) 인라인 색을 고른다. 헤더 스위치(`ThemeToggle`), `AppShell`, `layout.tsx`의 그리기 전 스크립트도 같은 키 상수를 쓴다.

### 47.3 검증

- 단위: `state-modules`(2: 나눈 모듈 단독 사용과 기존 이름 유지, 변환 진입점), `stored-theme`(2: 저장 테마 읽기, 밝게·어둡게 글자 대비 7·4.5 이상), 기존 `local-storage-gateway` 45개 그대로 통과
- 통합: `error-states`(비상 화면이 서버에서는 밝게, 다크 저장 시 어두운 카드)
- 전체 단위 테스트·타입 검사·린트·프로덕션 빌드·E2E 통과(숫자는 인수인계 문서 4절 명령으로 확인)

## 48. 로드맵 1단계: 관계 스탯과 장면 그림

사용자 결정(2026-10-03): 스토리 모드는 대표 인물 한 명의 관계를 보여 주고, 시작값은 시작 설정에 값이 있으면 그 값·없으면 스탯 초기값, 관계 단계 기준은 고정으로 둔다. 같은 날 사용자가 GPT로 만든 장면 그림 4장을 가져왔다.

### 48.1 관계 스탯 모델 (`src/features/chat/relation-model.ts`)

| 함수 | 역할 |
| --- | --- |
| `getRelationStat(template)` | 상태창이 켜져 있고 `relationStatId`가 인물마다 따로인 스탯을 가리키면 그 스탯, 아니면 `null`(예전 방식) |
| `toRelationLevel(stat, value)` / `fromRelationLevel(stat, level)` | 스탯 값 ↔ 관계 수치(0~100) 환산(범위 비율, 반올림, 범위 밖은 자름) |
| `readRelationLevel(status, stat, lead)` | 상태창에서 대표 인물의 관계 수치 읽기 |
| `resolveStartRelation(template, start)` | 시작 관계: 자동 시작 설정(`default`·`story-opening`)이고 관계 스탯이 있으면 스탯 초기값, 아니면 시작 설정 값 |
| `normalizeRelationStatId(template)` | 지운 스탯·공통 스탯을 가리키면 지정 해제 |

- 관계 단계는 `resolveRelationshipStage(level)`(`story-engine.ts`): 0~14 첫 만남, 15~49 아는 사이, 50~79 가까운 사이, 80~100 특별한 사이.
- 대표 인물: `getStatusPeople(conversation, 캐릭터 짧은 이름)[0]`(캐릭터 대화는 그 캐릭터, 스토리는 첫 등장인물).

### 48.2 턴 계산 (`chat-controller.ts`)

1. 예전 엔진(`evaluateStory`)으로 감정·중요 사건을 구한다(관계 스탯이 없으면 관계 수치도 여기서).
2. 관계 기준선(`relationBaselines`): 직전 상태창에 대표 인물의 관계 스탯 값이 없으면 `이번 턴 전 관계 수치`를 스탯 값으로 바꿔 시작 값으로 넘긴다.
   - 새 메시지·실패 뒤 재시도: 대화 버전의 `relationshipLevel`
   - 완료된 응답 다시 생성: 그 응답 상태창의 `값 − 변화`, 상태창이 없으면 그 시점까지 다시 계산(`replayForkState`)
   - 메시지 수정 분기: 분기 시점 상태(`replayForkState`가 그 시점 상태창의 관계 스탯 값을 우선 사용)
3. AI 판단과 상태창 계산에 같은 기준선을 쓴다(`buildStatJudgeInput`, `composeStatus`, 응답 입력의 `options.stats`).
4. 상태창의 대표 인물 관계 스탯 값을 환산해 버전의 `relationshipLevel`·`relationshipStage`에 넣는다.

- 스탯 계산의 직전 값 순서: 직전 상태창 값 → 기준선 → 스탯 초기값(`stat-model.ts`의 `StatBaseline`).
- 메시지를 지워 마지막 상태창이 앞 턴으로 돌아가면 다음 턴은 그 값에서 이어 간다(지운 턴의 변화는 사라짐).

### 48.3 화면

- 편집기: 스탯 카드마다 `관계 스탯으로 쓰기`(인물마다 따로일 때만 보임, 하나만 지정, 공통으로 바꾸거나 지우면 해제).
- 채팅 오른쪽: `관계 · 단계` 줄, 그 아래 `대표 인물(스토리만) 아이콘 스탯 이름 값`, 막대. 관계 스탯이 없으면 예전 `관계 N/100`(캐릭터 대화만).
- INFO: 첫 응답 전 `시작 스탯`이 대화의 관계 수치를 반영한다.
- 왼쪽 카드: 스토리는 `등장인물 N명 · 대표 인물 단계`와 `대표 인물 관계 수치` 막대(관계 스탯이 없는 스토리는 예전 표시).

### 48.4 장면 그림

- 파일: `public/images/scenes/dawn-letter.webp`·`rainy-classroom.webp`·`moon-library.webp`·`fallback-scene.webp`(1536×1024 원본을 1200×800 WebP 품질 84로 변환, 105~160KB).
- `src/lib/assets/scene-paths.ts`: `scenePaths`와 `upgradeScenePath`(예전 `.svg` → `.webp`). Mock 이미지 어댑터, 스토리 표지 선택지(기본 장면 `노을 지는 방` 추가로 4장), 예시 데이터가 이 경로를 쓴다.
- 채팅 장면 영역은 높이 고정·가운데 맞춤으로 잘라 보여 주므로 그림의 핵심은 가운데 3분의 1에 둔다(요청문 공통 조건). → 49장에서 장면 영역을 없앴다. 이제 잘려 보이는 곳은 스토리 표지뿐이고, 대화에서는 응답 아래에 원래 비율로 보인다.

### 48.5 저장 구조 (앱 상태 버전 14)

- `StatusTemplate.relationStatId: string | null`(검사: `null`이거나 인물마다 따로인 스탯의 식별자)
- `migrateVersionThirteen`: ① 호감도(`affection`, 인물마다)가 있는 작품은 관계 스탯으로 지정, 없으면 `null` ② 캐릭터·스토리 표지, 시작 장면, 버전 현재 장면, 메시지 장면·상황 이미지의 예전 경로 변환 ③ 버전마다 마지막 상태창의 대표 인물 관계 스탯 값이 버전의 관계 수치와 다르면 관계 수치를 스탯 값으로 이어받음(변화량은 그대로)
- 버전 12 → 13 → 14, 11 이하도 연쇄 변환. 미래 버전은 15 이상. 대화 파일 가져오기도 장면 경로를 바꾼다.

### 48.6 검증

- 단위: `relation-model`(5: 지정, 환산, 읽기, 시작값, 장면 경로), `relation-flow`(8: 따라가기·내려가기, 단계 변화, 범위 환산, 다시 생성, 수정 분기, 예전 방식, 시작값, 스토리 대표 인물), `local-storage-gateway`(46: 버전 13 → 14, 없는 관계 스탯 거부)
- 통합: `stat-editor`(4: 관계 스탯 지정·해제), `chat-room-features`(시작 스탯과 오른쪽 관계 표시가 같은 값), `conversation-panel`(스토리 카드 대표 인물 막대), `chat-flow`(재시도·분기 테스트를 규칙 스탯 기준으로)
- E2E: `chat-room-features.spec.ts`(INFO·오른쪽 관계·왼쪽 카드가 같은 값, 새 장면 그림). 전체 단위 451개·E2E 40개 통과
- 화면: 채팅·스토리 목록·스토리 대화·편집기를 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 49. 채팅 화면 왼쪽 장면 영역 제거

사용자 요청으로 캐릭터 모드·스토리 모드 대화 화면의 왼쪽 장면 그림 영역을 없애고 대화 영역이 그 자리를 차지하게 했다. 저장 형식은 바뀌지 않는다(앱 상태 버전 14 그대로).

### 49.1 화면 구성

| 화면 | 이전 | 지금 |
| --- | --- | --- |
| 넓은 화면(T·D 배치) | 장면 · 대화 · 채팅방 설정 3칸(배치마다 위치가 달랐음) | 대화 · 채팅방 설정 2칸 |
| 채팅방 설정을 접었을 때 | 장면 · 대화 2칸 | 대화 1칸(화면 전체 폭) |
| 모바일(760px 이하·M 배치) | 장면 위, 대화 아래 | 대화 1칸, 설정은 오른쪽 서랍 |

- `ChatScreen.tsx`: `<main>` 안에 대화 영역(`section`)과 채팅방 설정(`aside`)만 둔다. 장면 영역과 `SceneViewer`를 지웠다.
- `ChatScreen.module.css`: `.chat`은 `grid-template-areas: "story controls"`, `grid-template-columns: minmax(0, 1fr) var(--chat-controls, 220px)`. 배치별 규칙은 설정 열 너비만 정한다(T1·D3 280px, D2 320px, 나머지 220px). `data-panel="closed"`와 `data-overlay="true"`는 `"story"` 한 칸. 760px 이하 안전망은 `"story" "controls"` 세로 배치(화면이 준비된 뒤에는 서랍으로 바뀜).
- 측정(양쪽 패널 닫음): 1440px에서 대화 1162px·설정 220px, 설정을 접으면 1400px. 1920px에서 1542px·320px. 820px에서 542px·220px, 접으면 780px. 390px에서 366px.

### 49.2 장면 이미지 만들기

- 버튼 위치: 입력창 아래 입력 보조(`role="group"`, 이름 `입력 보조`)의 `장면 이미지 · 20`(접근성 이름 `장면 이미지 생성 · 20토큰`). 응답 중에는 눌리지 않는다. `ChatComposer`의 `onGenerateScene`이 없으면 버튼을 그리지 않는다.
- 동작은 그대로다: `ChatController.generateManualScene()`이 20토큰을 쓰고 `currentScene`을 바꾸며 마지막 응답의 `sceneImage`에 그림을 붙인다. `/장면` 명령어도 같다.
- 안내: `상황 이미지 보기`가 꺼져 있으면 `새 장면을 만들었습니다. ‘상황 이미지 보기’를 켜면 대화에서 볼 수 있어요.`를 보여 준다(그림이 화면 어디에도 안 보이는 상황 방지).
- `내 이미지`와 오른쪽 이미지 모음에서 그림을 고르면 그 그림이 마지막 응답 아래로 붙고 `지금 장면` 테두리가 옮겨 간다.

### 49.3 달라진 점과 남은 일

- 대화 시작 때 왼쪽에 보이던 시작 장면 그림(프롤로그 그림·표지 그림)은 대화 화면에서 보이지 않는다. 첫 응답 아래에 붙이려면 대화를 만들 때 첫 메시지의 `sceneImage`를 채우면 된다(지금은 하지 않음).
- `currentScene`은 계속 저장한다. 스탯 조건 이벤트(로드맵 4단계)의 특별 장면은 응답 아래 상황 이미지로 보여 준다.
- 배치 9종(`layoutId`)은 서랍형인지와 설정 열 너비만 다르다. 선택지를 줄이는 일은 설정 페이지 2단계에서 한다.
- Text-Play exe 화면도 같은 구성으로 맞춘다.

### 49.4 검증

- 컴포넌트: `chat-layout-panel`(캐릭터·스토리 모두 `main` 안이 `SECTION`·`ASIDE`뿐이고 `현재 장면` 그림이 없음)
- 통합: `chat-room-features`(입력 보조의 장면 버튼 → 마지막 응답 아래 그림·20토큰 차감, 숨김 안내), `chat-flow`(내 이미지가 마지막 응답 아래에 붙고 `지금 장면` 표시)
- E2E: `chat-room-features.spec.ts`(1440px에서 대화 영역이 왼쪽 끝부터 1100px 이상, 설정을 접으면 1360px 이상, 장면 버튼), `character-detail.spec.ts`(장면 그림 없음). 전체 단위 455개·E2E 41개 통과
- 화면: 캐릭터·스토리 대화를 1920·1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 50. 로드맵 2단계: 일일 출석과 미션

사용자 요청으로 로드맵에 넣은 단계다. 매일 들어올 이유를 만들기 위해 출석과 미션으로 토큰을 조금씩 준다(Mock, 브라우저 저장).

### 50.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 출석이 하루 끊기면 | 1일차부터 다시 시작(누적 출석일은 유지) |
| 보상 크기 | 출석 1~6일차 5토큰·7일차 20토큰, 미션 3·3·2토큰, 모두 완료 보너스 5토큰(하루 최대 18토큰) |
| 받는 방식 | 보상 페이지에서 직접 `받기` |
| 주간 미션 | 이번에는 넣지 않음(반응을 보고 추가) |

### 50.2 규칙 (`src/features/rewards/reward-model.ts`)

- 순수 함수만 둔다. 시각은 모두 인자로 받는다(리듀서 동작의 `now`, 화면의 `new Date()`).
- 날짜: `getDateKey`(한국 시간 연-월-일). 날짜 차이는 날짜 키를 UTC 날짜 번호로 바꿔 계산한다.
- `getAttendanceView(attendance, now)`: 마지막 출석과의 차이가 0 이하이면 `오늘 출석 완료`(시계를 뒤로 돌린 경우 포함), 1이고 도장판이 남았으면 이어 찍기, 그 밖에는 새 도장판 1일차.
- `checkAttendance(state, now)`: 도장 → 지급. 기록 식별자 `attendance-날짜`.
- 미션 정의 `dailyMissions`: `send-messages`(5회, 3토큰), `start-conversation`(1회, 3토큰), `favorite-work`(1회, 2토큰). `MISSION_BONUS` 5.
- `getMissionState(missions, now)`: 기록 날짜가 오늘보다 앞이면 빈 상태(자정 초기화). 기록 날짜가 오늘 이후이면(시계를 뒤로 돌림) 그대로 둔다.
- `recordMissionProgress(rewards, 미션, 양, now)`: 목표까지만 쌓고, 목표에 닿는 순간만 `completedNow: true`.
- `claimMission`·`claimMissionBonus`: 받을 수 있을 때만 지급(기록 식별자 `mission-날짜-미션`, `mission-bonus-날짜`). 보너스는 세 미션을 모두 채우면 받을 수 있다(각 미션 보상을 받았는지와 무관).
- 지급(`grantTokens`): 잔액 증가, 오늘 사용량은 날짜에 맞게 유지(`getDailyUsage`), `updatedAt` 갱신, `tokenRecords` 맨 앞에 기록(최대 `TOKEN_RECORD_LIMIT` 100), `rewards.totalEarned` 증가.
- `getClaimableCount`·`getClaimableTokens`: 출석을 포함해 지금 받을 수 있는 보상 수와 토큰(헤더 점, 카드 문구).

### 50.3 진행 추적 (`reward-tracker.ts`, `AppProvider.tsx`)

- `AppProvider`의 리듀서는 `{ action, now }`를 받는다. 바깥에 주는 `dispatch(action)`는 그대로이고 안에서 시각을 붙인다. `storeReducer = trackRewardProgress(이전, appReducer(이전, action), action, now)`.
- `appReducer` 자체는 그대로 순수하고 추적을 하지 않는다(단위 테스트와 `commitState`에서 직접 쓰는 호출에 영향 없음).
- 세는 동작: `merge-chat-state`(그 대화에서 새로 생긴 `role: "user"` 메시지 수 → 메시지 미션, 전역에 없던 대화가 생김 → 새 대화 미션), `toggle-character-like`·`toggle-bookmark`(목록이 늘어난 경우만 → 좋아요·보관 미션).
- 세지 않는 동작: `replace-state`(복원·가져오기·메시지 수정 분기 확정), 그 밖의 모든 동작.
- 완료 알림: `reward-mission-날짜-미션`(종류 `reward`, `/rewards`로 이동). 같은 식별자는 한 번만.

### 50.4 지갑 병합

- 이전: `merge-chat-state`가 채팅 화면의 지갑으로 전역 지갑을 통째로 바꿨다. 채팅 화면이 떠 있는 동안 다른 곳에서 토큰을 받으면 다음 저장 때 사라질 수 있었다.
- 지금: `spent = 채팅 지갑 totalUsed − 전역 totalUsed`. `spent > 0`이면 `전역 잔액 − spent`(나머지 값은 채팅 지갑), 아니면 전역 지갑 그대로.
- `ChatController.syncWallet(wallet)`: 응답 중이 아니면 지갑 교체. `ChatScreen.syncContext()`가 요청 직전에 전역 지갑을 넘긴다(저장된 대화만).
- 테스트 준비에서 채팅 지갑을 바꿀 때는 `balance`와 `totalUsed`를 함께 바꿔야 한다.

### 50.5 화면

- `/rewards`(`RewardsScreen`, 설정 공통 틀 `SettingsShell`, 계정 묶음): 요약 3칸(보유 토큰·이번 도장판·오늘의 미션), 안내(`role="status"`), 출석 도장판(`ol`, 칸 이름 `N일차, N토큰, 상태`), 오늘의 미션(진행 막대 `role="progressbar"`, `받기`·하러 가기 링크·`받음`), `미션 보상 모두 받기`, 받은 기록(최근 10개).
- `RewardsBanner`: 메인(검색·분류를 쓰지 않을 때)과 스토리 홈의 머리말 아래 카드.
- `UserPanel`: `rewards`를 넘기면 토큰 아래에 카드(`오늘 출석 전/완료`, `도장 N/7 · 미션 N/3 · 받을 보상 N개`)를 보여 주고 메뉴 목록에서는 `출석과 미션`을 뺀다.
- `AppHeader`: `rewardCount > 0`이면 메뉴 버튼에 `title`과 빨간 점(`.app-header-dot`).
- `NotificationBell`: 종류 `reward` → `보상`(분홍).
- `TokenSettings`: 받은 토큰 합계와 `/rewards` 링크.
- 그림 없이 만들었다(도장은 CSS, 카드 아이콘은 이모지).

### 50.6 저장 구조 (앱 상태 버전 15)

- `AppState.rewards: { attendance: { lastDate, cycleDay, totalDays }, missions: { dateKey, progress, claimed, bonusClaimed }, totalEarned }`
- `AppState.tokenRecords: TokenRecord[]`(`id`, `direction: "earn" | "spend"`, `source: "attendance" | "mission" | "mission-bonus"`, `label`, `amount`, `balance`, `createdAt`)
- `missions.progress`와 `claimed`는 미션 식별자를 글자 그대로 받는다(미션을 늘려도 저장 형식을 올리지 않음).
- 검사: `isRewardState`(날짜 키 형식, 도장판 0~7, 0 이상 정수), `isTokenRecord`, 기록 식별자 중복 금지.
- `migrateVersionFourteen`: 빈 출석·미션과 빈 기록 추가(잔액 그대로). 13 이하도 연쇄 변환. 미래 버전은 16 이상.

### 50.7 한계와 다음 일

- 브라우저 저장이라 기기 시계를 앞으로 돌리거나 데이터를 지우면 다시 받을 수 있다. 서버가 생기면 `reward-model.ts` 규칙을 서버에서 실행하고 화면은 결과만 받는다.
- 좋아요 미션은 캐릭터만 센다(스토리에는 좋아요가 없음).
- 주간 미션, 미션 교체(날마다 다른 미션), 멤버십별 보상 배수는 넣지 않았다.
- 다음 단계(3단계 친구 초대)도 같은 지급 방식과 토큰 기록을 쓴다.

### 50.8 검증

- 단위: `reward-model`(13: 첫 출석, 중복, 7일 연속, 끊김, 자정 기준, 시계 되돌리기, 사용량 정합, 미션 목록·진행·받기·보너스·자정 초기화·기록 한도), `reward-tracker`(6: 메시지·새 대화·좋아요·제외 동작·날짜 변경, 지갑 병합), `local-storage-gateway`(버전 14 → 15, 잘못된 출석·미션·기록 거부)
- 통합: `rewards`(7: 출석, 미션 받기, 모두 받기, 오른쪽 패널 카드, 헤더 점, 메인 카드, 채팅 연동과 채팅 중 받은 토큰 유지)
- E2E: `rewards.spec.ts`(5: 메인 카드 → 출석 → 새로고침 유지, 채팅 → 미션 진행, 390·820·1440px 넘침·외부 요청 없음). 전체 단위 483개·E2E 46개 통과
- 화면: 메인·보상 페이지·오른쪽 패널·스토리 홈·토큰 페이지를 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 51. 로드맵 3단계: 친구 초대

사용자 요청으로 로드맵에 넣은 단계다. 초대 링크로 서비스를 추천하고 토큰을 보상으로 준다(Mock, 브라우저 저장).

### 51.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 지금 만들 범위 | 초대 링크·코드, 공유, 초대받은 사람 보너스까지. 초대한 사람 보상은 규칙과 화면만 준비하고 로그인 연결 뒤 지급 |
| 보상 크기 | 초대받은 사람 30토큰, 초대한 사람은 친구 1명당 30토큰(한 달 최대 10명) |
| 초대한 사람 보상 조건 | 친구가 들어와 메시지를 5번 보냈을 때(가짜 초대 방지) |
| 위치 | 출석과 미션 페이지 안 `친구 초대` 칸, 오른쪽 패널 링크 |

### 51.2 규칙 (`src/features/rewards/referral-model.ts`)

- 코드: `generateInviteCode(random)`은 `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` 32자에서 여덟 글자를 뽑는다(가능하면 `crypto.getRandomValues`). `normalizeInviteCode`(대문자, 글자·숫자만), `isInviteCode`, `formatInviteCode`(`ABCD-2345`), `buildInviteLink(origin, code)`.
- `createInviteCode(state, code, now)`: 코드가 없을 때 한 번만. 실제 서비스에서는 서버가 겹치지 않는 코드를 준다.
- `checkInviteRedeem(referral, 입력)`: `invalid`(형식) → `used`(이미 받음) → `own`(내 코드) → `ok`.
- `redeemInviteCode`: `ok`일 때 받은 코드·시각을 기록하고 30토큰 지급(기록 식별자 `invite-welcome`, 출처 `invite-welcome`).
- `recordInviteeMessages(referral, 양)`: 초대받은 사람만 0~5로 센다. `reward-tracker`가 메시지 미션과 같은 자리에서 부른다.
- `applyInviteConfirmations(state, 친구 목록, now)`: 내 코드가 없으면 무시, 이미 반영한 친구는 건너뜀, 이번 달(한국 시간) 보상이 10명 미만이면 30토큰 지급(기록 식별자 `invite-friend-친구식별자`), 넘으면 `rewardedAt: null`로 기록만. 친구 기록은 최근 200명.
- `getInviteSummary`: 초대한 친구 수, 이번 달 보상 수, 한도, 남은 수.
- 지급은 2단계의 `grantTokens`(지갑·토큰 기록·받은 합계)를 그대로 쓴다.

### 51.3 화면

- `InviteSection`(`/rewards`의 `#invite`, `scroll-margin-top`으로 헤더에 가리지 않음): 설명, 준비 안내(초대한 사람 보상은 로그인 뒤), `내 초대 링크 만들기` → 코드·링크(읽기 전용 입력)·`링크 복사`·`코드 복사`·`공유하기`(`navigator.share`가 있을 때), 초대 현황(친구 수·이번 달 보상), 친구 목록(있을 때), `초대받았나요?`(코드 입력 또는 받은 뒤 조건 진행 막대).
- `InviteLanding`(`/invite/[code]`, `StatusScreen` 종류 `invite`): 올바른 코드 → `초대 받고 30토큰 받기`, 받은 뒤 → 잔액과 다음 할 일, 잘못된 코드·내 코드·이미 받음은 각각 안내. 페이지 메타데이터는 검색 제외(`robots.index: false`).
- `UserPanel`: 출석·미션 카드 아래 `친구 초대`(`/rewards#invite`).
- `StatusScreen`: 종류 `invite`(분홍, 기호 🎁). 주요 버튼 올림 색을 `color-mix(강조색 82%, black)`으로 바꿔 다크 모드에서도 흰 글자가 보이게 했다.

### 51.4 저장 구조 (앱 상태 버전 16)

- `AppState.referral: { code, createdAt, redeemedCode, redeemedAt, qualifyingMessages, friends: [{ id, nickname, qualifiedAt, rewardedAt }] }`
- 검사 `isReferralState`: 코드 형식, 받은 코드가 내 코드와 다름, 조건 0~5, 친구 식별자 비어 있지 않고 중복 없음.
- 토큰 기록 출처에 `invite-welcome`·`invite-friend` 추가.
- `migrateVersionFifteen`: 빈 친구 초대 추가. 14 이하도 연쇄 변환. 미래 버전은 17 이상.

### 51.5 한계와 로그인 단계에서 할 일

- 지금은 초대한 사람의 브라우저가 친구의 가입을 알 수 없다. `apply-invite-confirmations`를 부르는 곳이 없어 초대한 사람 보상은 지급되지 않는다.
- 초대받은 사람이 데이터를 지우면 환영 보너스를 다시 받을 수 있다.
- 서버가 생기면: 초대 코드를 계정에 묶어 발급, 초대받은 계정의 가입·메시지 5번 확인, 한 기기·한 사람 중복 차단, 조건을 채운 친구 목록을 내려 `apply-invite-confirmations` 호출.
- 링크 미리보기 그림(`openGraph.images`)과 초대 화면 그림은 그림을 받은 뒤 넣는다(`docs/image-requests.md` 5번).

### 51.6 검증

- 단위: `referral-model`(9: 코드 만들기·다듬기·한 번만, 환영 보너스, 거절, 조건 세기, 친구 보상, 코드 없음, 월 한도), `local-storage-gateway`(버전 15 → 16, 잘못된 친구 초대 거부)
- 통합: `referral`(6: 링크 만들기와 복사, 코드 입력과 오류, 친구 목록, 위치, 초대 링크 화면 받기, 예외 안내)
- E2E: `referral.spec.ts`(3: 초대 링크 → 받기 → 기록 → 다시 받기 불가, 오른쪽 패널 → 링크 만들기 → 새로고침 유지 → 내 링크 안내, 390px 넘침). 전체 단위 500개·E2E 49개 통과
- 화면: 초대 링크 화면·친구 초대 칸·오른쪽 패널을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 52. 로드맵 4단계: 스탯 조건 이벤트

스탯·턴 조건으로 내레이션·특별 장면·칭호·엔딩이 나오게 하고, 3턴마다 자동으로 생기던 장면 그림(15토큰)을 없앴다.

### 52.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 3턴마다 자동 장면 그림(15토큰) | 없애고 이벤트 방식으로 바꿈. 직접 누르는 `장면 이미지` 버튼(20토큰)은 유지 |
| 스토리의 스탯 조건 | 인물마다 따로 판정, 조건을 넘은 인물 이름으로 한 번씩 |
| 엔딩 이벤트 | 표시만 하고 대화는 계속 |

### 52.2 규칙 (`src/features/chat/event-model.ts`)

- `StoryEvent`: `id`, `name`, `condition`(`stat-min`·`stat-max`·`turn`), `statId`, `value`, `narration`, `scene`, `title`, `ending`, `notify`. 한도: 작품당 8개, 이름 20자, 내레이션 200자, 칭호 12자, 턴 1~999.
- `evaluateEvents({ events, stats, values, turn, fired, lead })`: 이벤트를 정한 순서대로 본다. 턴 조건은 `turn >= value`이면 인물 없이 한 번. 스탯 조건은 그 스탯의 값(인물별 또는 공통)마다 조건이 맞으면 그 인물로 한 번. `fired`(이벤트·인물 키)에 있으면 건너뛴다. 없는 스탯을 가리키면 건너뛴다. 내레이션의 `{이름}`은 인물(없으면 대표 인물) 이름으로 바꾼다.
- 조건은 "넘는 순간"이 아니라 "지금 맞고 아직 안 일어남"으로 본다. 그래서 이미 조건이 맞는 대화(예: 호감도 34에서 시작한 리안 대화의 `20 이상`)는 다음 턴에 일어난다.
- `getFiredKeys(상태창 목록)`, `collectTitles`, `findEnding`, `getStatHistory`(그래프용 턴별 값).
- `createDefaultEvents(template)`: 상태창이 켜져 있고 호감도 스탯이 있을 때 예시 4개. `withWorkDefaults`가 기본 작품에 넣는다.
- 편집 규칙: `createEvent`(첫 스탯의 중간 값 이상, 스탯이 없으면 5턴), `normalizeEvents`(공백 정리, 턴 조건의 스탯 비움), `pruneEvents`(지운 스탯의 이벤트 제거), `validateEvents`(이름, 조건 스탯, 범위, 길이, 결과 하나 이상, 개수, 식별자 중복).

### 52.3 대화 처리 (`chat-controller.ts`)

- `withTurnEvents(conversation, character, 이전 메시지, 상태창)`: 이전 응답들의 상태창에서 일어난 이벤트를 모아 `evaluateEvents`를 부르고, 일어난 것이 있으면 상태창에 `events`로 붙인다. 응답 생성과 메시지 수정 분기 두 곳에서 쓴다.
- 특별 장면: 일어난 이벤트 가운데 첫 그림을 응답의 `sceneImage`와 버전의 `currentScene`으로 쓴다(토큰 없음). 다시 생성으로 이벤트가 사라지면 그 그림도 뗀다. `Message.sceneEvent`에는 그 턴의 첫 이벤트 식별자를 남긴다.
- 자동 장면 그림 제거: `evaluateStory`는 관계 수치·단계·감정만 정한다. `TokenAction`에서 `auto-image`를 뺐다.
- 알림: `ChatScreen.notifyEvents()`가 응답 완료·수정 분기 확정 뒤 마지막 응답의 이벤트 가운데 `notify`인 것을 알림함에 넣는다(식별자 `event-대화-버전-이벤트-인물`, 같은 이벤트는 한 번).

### 52.4 화면

- `EventEditor`(편집기 `상태창 > 이벤트`): 이름, 조건·조건 스탯·기준 값(턴 조건이면 스탯 선택 없음), 내레이션, 특별 장면 그림(없음 + 장면 4장), 칭호, 엔딩·알림 체크, 삭제, `＋ 이벤트 추가 (n/8)`.
- `MessageItem`: 응답 아래 이벤트 카드(`role="note"`, 이름 `이벤트: 이름`).
- `StatusPanel`: 칭호 줄(`aria-label="칭호"`), `엔딩 도달` 줄, `그래프` 버튼(`aria-expanded`).
- `StatTrend`: 스탯·인물마다 한 줄(이름 · 꺾은선 · 지금 값과 `처음 턴 값 → 지금 턴 값`). 꺾은선은 `role="img"`에 `N턴 값` 목록을 이름으로 주고, 점마다 넓은 영역에 `title`로 턴과 값을 보여 준다. 선은 2px, 지금 값 점은 지름 8px에 바탕색 테, 최댓값·최솟값은 흐린 점선. 선 색은 `--genre-strong`(밝게·어둡게 모두 대비 확보), 글자는 글자색 그대로. `표로 보기`에 같은 값을 표로 둔다. 스탯마다 범위가 달라 한 그래프에 겹치지 않고 줄을 나눴다.

### 52.5 저장 구조 (앱 상태 버전 17)

- 캐릭터·스토리·초안에 `events: StoryEvent[]`, `StatusSnapshot.events?: TriggeredEvent[]`(선택 필드라 예전 상태창은 그대로 유효), 알림 종류 `event`.
- 검사: `isStoryEvent`, `isTriggeredEvent`, `hasWorkEvents`(8개 이하, 식별자 중복 없음, 스탯 조건의 스탯이 그 작품에 있음).
- `migrateVersionSixteen`: 기본 작품(식별자가 기본 캐릭터·예시 스토리와 같음)은 예시 이벤트, 나머지는 빈 목록. 15 이하도 연쇄 변환. 미래 버전은 18 이상.

### 52.6 남은 일

- 특별 장면 그림 선택지는 준비된 장면 4장뿐이다. 이미지 스튜디오에서 만든 그림을 고르는 기능은 제작 도구 단계에서 넣는다.
- 예시 이벤트용 그림 3장을 요청해 두었다(`docs/image-requests.md` 6~8번).
- 엔딩 뒤 "처음부터 다시 하기", 이벤트로 스탯을 바꾸는 결과, 여러 조건을 묶는 이벤트는 넣지 않았다.

### 52.7 검증

- 단위: `event-model`(11: 이상·이하·턴 조건, 인물별, 여러 이벤트, 기록 읽기, 그래프 자료, 검증, 정리, 새 이벤트, 예시 이벤트), `event-flow`(7: 기본 이벤트, 자동 장면 제거, 특별 장면, 다시 생성, 수정 분기, 스토리 인물별, 상태창 끔), `local-storage-gateway`(버전 16 → 17, 잘못된 이벤트·기록 거부), `story-engine`(자동 장면 사건 없음)
- 통합: `story-events`(5: 이벤트 카드·칭호·알림·비용, 엔딩과 특별 장면, 그래프와 표, 편집기 저장, 조건 전환·스탯 삭제 정리), `settings-pages`(비용표 5줄)
- E2E: `story-events.spec.ts`(4: 카드·칭호·그래프·새로고침·알림함, 390·820·1440px 넘침). 전체 단위 525개·E2E 53개 통과
- 화면: 대화(이벤트 카드·INFO·그래프)와 편집기를 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 53. 로드맵 5단계: 토큰 사용 내역

쓴 토큰을 기록하고 토큰 이용 내역 페이지에서 그래프와 목록으로 보여 준다. 대화 입력창에는 보내기 전 비용을 보여 준다.

### 53.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 기록 보관 수 | 받음·사용을 합쳐 최근 300건 |
| 보내기 전 예상 비용 위치 | 전송 버튼 위 작은 글씨 |
| 목록 묶음 | 한 건씩 기록, 화면에서 날짜별로 묶음 |

### 53.2 기록 규칙 (`src/lib/story/token-ledger.ts`, `app-reducer.ts`)

- `addTokenRecord(records, record)`: 맨 앞에 넣고 같은 식별자는 바꾸며 `TOKEN_RECORD_LIMIT`(300)까지만 남긴다. 받은 기록(`grantTokens`)도 같은 함수를 쓴다.
- `merge-chat-state`: `spent = 채팅 지갑 totalUsed − 전역 totalUsed`가 0보다 크면 `recordChatSpend`를 부른다. `splitChatSpend(전역 지갑, 채팅 지갑, spent)`가 쓴 날 기준으로 늘어난 이미지 횟수(`getDailyUsage`로 날짜가 바뀐 경우를 보정) × 20토큰을 장면 이미지로, 나머지를 대화로 나눈다. 기록 식별자는 `spend-종류-대화-쓴 시각`, 작품 이름은 스토리 제목 → 캐릭터 이름 → 대화 제목 순.
- 잔액: 전역 잔액에서 차례로 빼서 적는다. 채팅 중 다른 곳에서 받은 토큰이 있어도 맞는다.
- `add-image`: `전역 잔액 − 새 지갑 잔액`이 0보다 크면 `spend-studio-image-이미지식별자` 기록.
- 화면용: `filterTokenRecords`(전체·받음·사용), `groupTokenRecords`(한국 시간 날짜별, 그날 받은·쓴 합계), `summarizeTokenDays(records, now, 7)`(오래된 날부터, 기록 없는 날은 0), `tokenSourceLabels`.

### 53.3 화면

- `TokenHistory`: `최근 7일` 카드와 `이용 기록` 카드.
- 그래프(`TokenWeekChart`, SVG): 날마다 받음·사용 막대 둘(굵기 14px, 사이 2px, 위쪽만 4px 둥글림, 기준선에 붙음), 눈금선 3줄, 날짜·요일, 오늘 값만 숫자, 날짜 칸에 올리면 `날짜 · 받음 N · 사용 N`(`title`), 범례, `표로 보기`. 그림에는 7일 값을 모두 읽는 이름(`role="img"`)을 준다. 두 값의 단위가 같아 한 축을 쓴다.
- 이용 기록: 필터(`aria-pressed`, 이름에 건수), 날짜 묶음(`section` + 날짜 제목과 `받음 +N · 사용 −N`), 기록 줄(이름, `쓴 곳 또는 출처 · 시각 · 잔액`, `+N`/`−N`), 50건씩 더 보기.
- `ChatComposer`: `messageCost`·`affordable`을 받아 전송 버튼 위에 `N토큰 사용` 또는 `토큰 부족`. 입력 양식은 입력 칸이 두 줄, 전송 열이 비용·버튼 두 줄인 격자다.
- `ChatScreen.generateScene`도 실행 전에 전역 지갑을 받아 온다(`syncContext`).

### 53.4 저장 구조

- 앱 상태 버전은 17 그대로다. `TokenRecord.work?: string`은 선택 항목이고 출처에 `chat`·`scene-image`·`studio-image`를 더했다. 예전 기록은 그대로 통과한다.

### 53.5 남은 일

- 기간을 직접 고르는 필터, 작품별 합계, 기록 내보내기는 넣지 않았다.
- 실제 결제가 붙으면 충전 기록(출처 추가)과 서버 기록으로 바꾼다.

### 53.6 검증

- 단위: `token-ledger`(8: 추가·한도, 필터·날짜 묶음, 7일 합계, 출처 이름, 대화 기록, 장면 이미지 구분과 날짜 변경, 스토리 이름과 잔액, 이미지 스튜디오), `reward-tracker`(지갑 병합 기대값 수정)
- 통합: `token-history`(6: 그래프·목록·필터, 더 보기, 빈 상태, 받은 기록 분리, 예상 비용과 대화·장면 기록, 등급·토큰 부족), `settings-pages`(비용표를 이름으로 조회)
- E2E: `token-history.spec.ts`(4: 대화 → 출석 → 이용 내역 → 새로고침, 390·820·1440px 넘침). 전체 단위 539개·E2E 57개 통과
- 그래프 색: 밝은 바탕(`#ffffff`)과 어두운 바탕(`#1b1825`)에서 색 구분·대비 검사 통과
- 화면: 토큰 이용 내역과 대화 입력창을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 54. 로드맵 6단계 첫 묶음: 단계별 편집·자동 저장·시험 대화

### 54.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 진행 방식 | 두 묶음으로 나눔(이번: 단계별 편집·자동 저장·시험 대화, 다음: 키워드 설정집·예시 대화) |
| 시험 대화 토큰 | 받지 않음, 기록 없음, 10턴까지 |
| 한도(다음 묶음) | 설정집 20개(항목당 500자), 예시 대화 5쌍 |

### 54.2 단계별 편집 (`EditorSteps.tsx`)

- `EditorStepDefinition { id, label, hint, fields }`. `fields`는 그 단계에 있는 초안 항목 이름으로, 검증 오류가 어느 단계에 있는지 찾는 데 쓴다.
- `useEditorSteps(steps, startExpanded)`: `mode`(`steps`·`all`), `current`, `isVisible`, `select`, `toggleMode`, `next`, `previous`, `showErrors(errors)`. 기존 작품을 고칠 때는 `startExpanded`가 참이다.
- `EditorStepNav`: 단계 버튼(`aria-current="step"`, 오류가 있으면 `확인할 입력 있음`을 이름에 덧붙임)과 보기 방식 버튼(`aria-pressed`).
- `EditorStepSection`: `section[hidden]`으로 숨긴다(입력은 그대로 남아 값이 유지됨). 단계별 보기에서만 이전·다음 버튼을 보여 준다.
- 편집기 양식은 입력 순서를 단계에 맞게 다시 묶었다(캐릭터: 태그·대표 이미지가 기본 정보로, 스토리: 태그·표지가 기본 정보로 이동). 저장 버튼·저장 안내는 단계 밖에 둔다.
- 저장·시험 대화에서 검증이 실패하면 `showErrors`로 첫 오류 단계로 옮긴다.

### 54.3 작성 중 자동 저장 (`draft-storage.ts`, `useDraftAutosave.ts`)

- 저장 키 `mateverse:draft:종류:식별자`(새로 만들기는 `new`), 값 `{ savedAt, draft }`.
- `coerceDraft(base, raw)`: 기준 초안의 항목만, 같은 종류(글자·숫자·목록·묶음)일 때만 가져온다. 상태창 형식·이벤트·업데이트 기록은 저장 검사 함수로 한 번 더 확인하고 맞지 않으면 기준 값.
- `useDraftAutosave(key, draft, dirty, base)`: 처음에 보관분을 읽어 `stored`로 주고, 사용자가 `이어서 쓰기`(`restore`)나 `지우기`(`discard`)를 고를 때까지 자동 저장을 멈춘다. 그 뒤로는 `dirty`일 때 입력이 0.7초 멈추면 보관하고 `savedAt`을 알려 준다. 저장을 마치면 `clear`.
- 저장 공간이 없어 보관에 실패해도 편집은 계속된다(표시만 안 뜸).

### 54.4 시험 대화 (`TestChat.tsx`)

- 편집기가 `start()`로 임시 상태를 만든다: 전역 상태를 복사해 잔액을 `TEST_CHAT_BALANCE`로 올리고, 지금 초안을 임시 작품(`test-chat-character`·`test-chat-story`)으로 넣은 뒤 대화를 시작한다.
- `ChatController`를 그 임시 상태로 만들어 `MessageList`·`StatusPanel`을 그대로 쓴다. 전역 상태에는 병합하지 않으므로 지갑·기록·대화가 바뀌지 않고 미션도 오르지 않는다.
- 10턴(`TEST_CHAT_TURN_LIMIT`)이 되면 입력을 막고 `처음부터 다시`를 안내한다.
- 대화상자는 `ChatDialog`(문서 끝에 그림)를 쓰고 버튼은 `ChatPanels.module.css`의 것을 쓴다(편집기 색 변수가 닿지 않는 자리).
- 입력창(`.testForm`)은 대화상자 내용 아래에 붙여 둔다(`position: sticky`). 메시지와 상태창이 길어져도 입력창이 아래 버튼 줄에 가려지지 않는다. 아래 여백 18px은 `ChatDialog` 내용 여백과 맞춘 값이라 그쪽을 바꾸면 함께 고친다. 좁은 화면에서는 메시지 목록 높이를 30vh로 낮춘다.

### 54.5 검증

- 단위: `draft-storage`(4: 키, 보관·읽기·지우기, 모양 맞추기, 깨진 값)
- 통합: `editor-tools`(8: 단계 이동, 오류 단계, 수정은 전체 보기, 자동 저장 흐름, 지우기, 캐릭터 시험 대화, 필수 입력, 스토리 시험 대화). 기존 편집기 테스트 7곳에 `전체 펼쳐 보기` 추가
- E2E: `editor-tools.spec.ts`(4: 단계별 작성 → 새로고침 → 이어 쓰기 → 시험 대화 → 공개 저장 → 토큰 미사용, 390·820·1440px 넘침), `story-mode.spec.ts`(단계 이동 반영). 전체 단위 551개·E2E 61개 통과
- 화면: 새 캐릭터·새 스토리 편집기와 시험 대화 창을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 55. 로드맵 6단계 둘째 묶음: 키워드 설정집·예시 대화

### 55.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 설정집 | 작품마다 20개, 항목당 내용 500자 |
| 예시 대화 | 작품마다 5쌍 |

구현하면서 정한 값: 설정 이름 20자, 키워드 항목당 5개(각 20자), 최근 메시지 4개에서 찾기, 한 번에 5개까지 넘기기, 예시의 사용자 말 200자·답 500자.

### 55.2 규칙 (`src/features/chat/lore-model.ts`)

- 한도 상수: `LORE_LIMIT`·`LORE_TITLE_LIMIT`·`LORE_CONTENT_LIMIT`·`LORE_KEYWORD_LIMIT`·`LORE_KEYWORD_LENGTH`·`LORE_SCAN_MESSAGES`·`LORE_ACTIVE_LIMIT`·`EXAMPLE_LIMIT`·`EXAMPLE_USER_LIMIT`·`EXAMPLE_REPLY_LIMIT`.
- `cleanKeywords`: 앞뒤 공백·빈 값·같은 말(대소문자 무시) 제거. 편집 중에는 쉼표로 나눈 그대로 두고(입력하던 쉼표·띄어쓰기가 사라지지 않게) 저장·검증·찾기 때 정리한다.
- `normalizeLorebook`·`normalizeExamples`: 공백 정리, 아무것도 적지 않은 항목은 버린다.
- `validateLorebook`·`validateExamples`: 첫 오류 문구를 몇 번째 항목인지와 함께 돌려준다.
- `matchLore(lorebook, messages)`: 안내(system) 메시지를 뺀 최근 4개에서 키워드를 찾는다(대소문자 무시, 부분 일치). 가장 최근에 나온 설정이 앞, 같으면 적은 순서. 내용이 빈 설정은 제외, 5개까지.
- `toLorePrompt`·`toExamplePrompt`: AI 입력 모양(`{ title, keywords, content }`, `{ user, reply }`).
- `findExampleReply`: 예시와 같은 말(공백 차이 무시)이면 예시 답. 연습용 모델만 쓴다.

### 55.3 대화 연결

- `ChatContext`에 `lorebook`·`examples`(대화의 작품에서 복사). 스토리 모드는 스토리의 것만 쓴다(등장 캐릭터의 설정집은 쓰지 않음).
- `ChatController.createLLMInput`: `options.lore = toLorePrompt(matchLore(context.lorebook, 이번 입력 메시지))`, `options.examples = toExamplePrompt(context.examples)`.
- `ChatReplyOptions`에 `lore`·`examples` 추가(필수 항목). 실제 AI 어댑터는 이 둘을 프롬프트에 넣는다.
- `MockLLMAdapter`: `decorateReply(base, options, key, story, lastMessage)`. **방금 한 말**에 키워드가 있는 설정 하나만 답에 드러낸다. AI 답에 설정 이름이 들어가면 그 답이 다시 키워드로 잡히므로, 넘어온 설정을 매번 드러내면 같은 문장이 매 턴 되풀이된다. 설정 자체는 최근 4개 안에 있는 동안 계속 넘어간다(보통 3턴).

### 55.4 편집 화면 (`LoreEditor.tsx`)

- `WorkLoreFields`(두 묶음 `키워드 설정집`·`예시 대화`와 오류 문구), `LoreEditor`, `ExampleEditor`.
- 설정 카드(`LoreCard`)는 이름이나 내용이 빈 설정만 펼쳐서 시작한다. 접으면 `키워드: …`와 글자 수만 보인다. 버튼 글자는 `펼치기`·`접기`·`삭제`로 짧게 두고, 읽어 주는 이름(`aria-label`)에 설정 이름을 붙인다(`금서 구역 펼치기`, `금서 구역 설정 삭제`).
- 예시 답 칸 이름은 캐릭터 `캐릭터 답`, 스토리 `이야기 답`.
- 단계 정의의 `fields`에 `lorebook`·`examples`를 넣어, 오류가 나면 그 단계로 옮긴다.
- 시험 대화: `usedLore = matchLore(작품 설정집, 마지막으로 보낸 말까지의 메시지)`. 안내 문구는 입력 폼 안 첫 줄에 두어 입력창과 함께 늘 보인다. 폼은 `bottom: -18px`로 붙인다(대화상자 내용의 아래 여백 띠로 뒤 내용이 비치던 것을 덮음).

### 55.5 저장 구조 (앱 상태 버전 18)

- `LoreEntry { id, title, keywords: string[], content }`, `ExampleDialogue { id, user, reply }`. `Character`·`Story`·초안에 `lorebook`·`examples`.
- `WorkExtras`에 두 항목 추가, `withWorkDefaults`는 빈 목록.
- 검사: `isLoreEntry`·`isExampleDialogue`·`hasWorkLore`(개수 한도, 식별자 중복), `isVersionSeventeenState`.
- 변환: `migrateVersionSixteen` → `migrateVersionSeventeen`(모든 작품에 빈 목록) → 버전 18. 기본 작품에도 예시 설정을 넣지 않았다(기존 대화의 연습용 답이 달라지지 않게).
- `coerceDraft`: 자동 저장 보관분의 설정집·예시 대화가 다른 모양이면 기준 값.

### 55.6 검증

- 단위: `lore-model`(9), `lore-flow`(5: 맥락, 키워드가 나온 설정만 넘김, 범위를 벗어나면 넘기지 않음·되풀이 없음, 예시 답, 스토리), `local-storage-gateway`(버전 17 변환, 잘못된 설정집 거부), `mock-adapters`, `chat-features-model`, `draft-storage`
- 통합: `editor-lore`(7: 저장·빈 항목 버림, 오류 단계, 접기·펼치기·삭제, 한도, 스토리, 시험 대화의 참고한 설정·예시 답, 설정집 없는 작품)
- E2E: `editor-lore.spec.ts`(5: 새 캐릭터에 적고 시험 대화 뒤 저장·고치기 화면, 실제 대화, 390·820·1440px 넘침). 전체 단위 576개·E2E 66개 통과(E2E 연속 6회)
- 화면: 설정집·예시 대화 편집과 시험 대화 창을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)
- **E2E 주의**: 대화 화면은 버전까지 적은 주소로 연다(HANDOFF `E2E 실행 주의사항`). `rewards`·`story-events`·`token-history`·`editor-lore`의 주소를 바꿨다.

## 56. 로드맵 7단계 첫 묶음: 설정 페이지 채우기

### 56.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 7단계 진행 방식 | 세 묶음(설정 페이지 채우기 → 대화 다시 보기 → 메인 정렬·필터), 묶음마다 커밋 |
| 레이아웃 선택지 | 서랍형·옆 열 좁게·옆 열 넓게 3개(+ 자동) |
| 책갈피(다음 묶음) | 답변 하나하나에 붙이고 모아 보기 |
| 명장면 카드(다음 묶음) | 장면 그림 위에 대사를 얹은 이미지로 저장 |

### 56.2 요약 계산 (`src/features/settings/settings-insights.ts`)

화면은 계산을 하지 않고 이 파일의 순수 함수 결과만 그린다.

- `getActivitySummary(state)`: 내가 만든 캐릭터·스토리(`creatorId === profile.id`), 대화방, 좋아요, 보관, 팔로우 수.
- `getFollowedCreators(state)`: 최근 팔로우가 앞. 이름은 그 제작자의 첫 작품에서 가져오고, 작품이 모두 사라졌으면 `알 수 없는 제작자`.
- `getMemoryGroups(state)`: 요약 메모리를 대화방별로 묶는다. 대화방과 메모리 모두 최근 수정이 앞. 지워진 대화의 메모리는 `지워진 대화`(주소 없음).
- `getReportEntries(state)`: 신고를 최근 순으로, 캐릭터 이름과 사유 이름을 붙여서.
- `getNotificationWindow(start, end)`: 하루(1440분) 가운데 시작 위치와 길이(%), 길이 문구(`13시간`, `1시간 30분`). 형식이 틀리거나 종료가 시작보다 이르면 `null`.
- `buildDiagnostics(...)`·`formatBytes`: 진단 정보 글. 개인 정보(이름, 대화 내용)는 넣지 않는다.

### 56.3 화면 레이아웃 (`layout-resolver.ts`, `DisplaySettings.tsx`)

- `LayoutChoice = "drawer" | "narrow" | "wide"`, `layoutChoices`(대표 레이아웃 `M1`·`D1`·`D2`), `toLayoutChoice(layoutId)`(M 계열은 서랍, `T1`·`D2`·`D3`는 넓게, 나머지는 좁게).
- 저장 값(`settings.layoutId`)과 채팅 화면 CSS는 그대로다. 화면에 보여 주는 선택지만 줄였다.
- 그림 카드는 라디오 묶음(`fieldset` + 숨긴 `input[type=radio]`)이고, 배치 그림은 CSS로 그린다(`aria-hidden`).
- 추천은 `recommendLayout({ width, height, platformMode, layoutId: null })` 결과를 묶은 것.

### 56.4 그 밖의 화면

- `ProfileSettings`: `내 활동`(`ul.statGrid`), `팔로우한 제작자`(`ul.rowList`). 색 칸은 세 칸마다 되풀이(`.stat:nth-child(3n + 2)`·`(3n + 3)`).
- `NotificationSettings`: 하루 막대(`role="img"`, 이름에 시각과 길이). 눈금 글자는 장식이라 `aria-hidden`.
- `PrivacySettings`: 메모리 묶음은 `details`(접힌 채 시작). 삭제는 `delete-memory`, 신고 취소는 `remove-character-report`.
- `SupportScreen`: `faq.ts`(`faqTopics`, `faqs`, `filterFaqs`). 찾은 수는 `role="status"`(이름 `찾은 질문`). 저장 용량은 `mateverse:`로 시작하는 저장 항목의 이름과 값 크기 합.
- 공통 목록 스타일 `.rowList`(내용 + 버튼 한 줄, 480px 이하에서는 버튼이 아래로).

### 56.5 검증

- 단위: `settings-insights`(9: 활동, 팔로우, 메모리 묶음, 신고와 취소, 하루 막대, 진단 정보, 배치 묶기 2, 질문 찾기)
- 통합: `settings-pages`(15: 배치 선택·예전 값과 추천·활동과 팔로우·하루 막대·메모리와 신고·빈 상태·질문 찾기·진단 정보 복사 추가)
- E2E: `settings-tools.spec.ts`(6: 고른 배치가 채팅 화면에 적용되고 유지, 팔로우 해제·메모리 삭제·신고 취소 유지, 초성 검색과 진단 정보, 390·820·1440px 넘침). 전체 단위 592개·E2E 72개 통과
- 화면: 설정 다섯 페이지와 고객 지원을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)
- `editor-lore` 통합 테스트는 글자 입력이 많아 컴퓨터가 바쁠 때 제한 시간(5초)을 넘긴 적이 있어 파일 제한 시간을 20초로, 턴 대기를 5초로 늘렸다.

## 57. 로드맵 7단계 둘째 묶음: 대화 다시 보기

### 57.1 사용자 결정

| 항목 | 결정 |
| --- | --- |
| 책갈피 | 답변 하나하나에 붙이고 모아 보기 |
| 명장면 카드 | 장면 그림 위에 대사를 얹은 이미지로 저장 |

### 57.2 규칙 (`src/features/chat/review-model.ts`)

- `searchMessages(messages, query)`: 안내 메시지를 뺀 메시지에서 `matchesKoreanText`(초성 포함)로 찾아 대화 순서대로 식별자를 돌려준다. `moveMatch(count, current, step)`은 끝에서 처음으로 돈다.
- `messageAnchor(id)`: 메시지 항목의 `id` 속성(`message-식별자`). 이동할 때 `scrollIntoView`의 대상이다.
- `getBookmarkedMessages`·`getBookmarkEntries(state)`: 대화방마다 **지금 보는 버전**의 책갈피만 모은다(분기한 버전마다 같은 답변이 겹쳐 나오지 않게). 최근 답변이 앞.
- `toPlainText`·`createExcerpt`·`toCardText`: 지문 별표와 줄바꿈을 정리하고 길면 `…`로 줄인다.
- `wrapCardLines(text, maxWidth, measure, maxLines)`: 띄어쓰기에서 먼저 나누고, 한 줄보다 긴 낱말은 글자 단위로 나눈다. 줄 수를 넘으면 마지막 줄에 `…`. 측정 함수를 받아서 캔버스 없이 테스트한다.
- `sceneCardFileName(title, date)`: `mateverse-scene-작품이름-연월일.png`(서울 날짜, 파일 이름에 못 쓰는 글자는 `-`).

### 57.3 책갈피 저장

- `Message.bookmarked?: boolean`. 검사는 `value.bookmarked === undefined || isBoolean(...)`라 예전 데이터는 그대로 읽는다(버전 올림 없음).
- 동작 `toggle-message-bookmark { messageId }`: 답변에만 적용. 뺄 때는 항목 자체를 지운다.
- 채팅 화면에서는 다른 메시지 조작과 같은 길을 쓴다: `applyControllerState(appReducer(controller.snapshot(), 동작))`. 보관함에서는 전역 `dispatch`.

### 57.4 화면

- `ReviewBar`: 검색어·찾은 수(`role="status"`, 이름 `찾은 말`)·이전·다음·`책갈피 N`·닫기. 찾은 메시지는 `onFound`로, 이동은 `onJump`로 채팅 화면에 알린다. 메시지가 새로 오면 찾은 수가 바로 바뀐다. 대화를 내려도 보이게 위쪽에 붙는다(`position: sticky`).
- `MessageItem`: `li`에 `id`(표식)와 `data-bookmarked`·`data-found`·`data-focus`. 답변에만 `책갈피`(`aria-pressed`)·`명장면 카드` 버튼. 처리 함수가 없으면 버튼을 그리지 않는다(시험 대화에는 나오지 않음).
- `ChatScreen`: `focus { id, seq }` 상태가 바뀌면 그 메시지로 `scrollIntoView`. 같은 메시지로 다시 가도 `seq`가 달라 이동한다.
- **바로 가기 주소**: `…&message=식별자`. 페이지가 `initialMessageId`로 넘겨 첫 그리기부터 안다. 처음에는 주소 끝 `#표식`을 읽게 했는데, 다른 화면에서 넘어올 때는 화면을 그리는 시점에 주소가 아직 바뀌지 않아 읽지 못했다(브라우저 테스트에서 발견).
- `SceneCardDialog`: 미리보기는 CSS, 저장은 `canvas`(배경 그림을 가득 채움 → 아래로 갈수록 어두워지는 막 → 인물·대사·구분선·작품 이름·`Mate Verse`) → `toBlob` → 내려받기. 그림을 못 불러오면 기본 배경만 쓴다.
- 보관함 `ReplyList`: 링크(대화방 이름·글·시각)와 `책갈피 빼기`.

### 57.5 검증

- 단위: `review-model`(9: 찾기, 이동, 표식, 글 다듬기, 줄 나누기, 파일 이름, 책갈피 전환, 모아 보기, 저장 검사)
- 통합: `chat-review`(6: 책갈피와 모아 보기, 검색과 이동, 새 답변 반영, 명장면 카드 글 고치기·복사, 바로 가기, 보관함 탭)
- E2E: `chat-review.spec.ts`(5: 책갈피 유지와 보관함에서 바로 가기, 검색·카드 이미지 내려받기, 390·820·1440px 넘침). 전체 단위 607개·E2E 77개 통과
- 화면: 다시 보기 막대, 명장면 카드 창, 보관함 책갈피 탭을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음). 저장한 카드 이미지를 열어 확인.

## 58. 로드맵 7단계 셋째 묶음: 메인 정렬과 필터

### 58.1 규칙 (`src/features/discovery/discovery-filter.ts`)

- `DiscoveryFilter { query, genres, rating, onlyNew, onlyInterest, sort }`, `createDiscoveryFilter()`(아무 조건 없는 추천순).
- `applyDiscoveryFilter(characters, filter, { talkedIds, interestIds })`: 검색어(이름·소개·세계관·태그) → 장르(하나라도) → 이용 등급 → 처음 만나는 캐릭터 → 관심 목록 순으로 걸고 정렬한다. `filter`가 새 배열을 만들므로 원래 목록은 바뀌지 않는다.
- 정렬: `recommended`는 들어온 순서 그대로(기본 화면의 추천·랭킹이 이 순서를 쓴다), `popular`는 `popularity` 내림차순, `latest`는 `updatedAt` 내림차순, `name`은 한국어 가나다순. 같으면 이름순.
- `countActiveFilters`: 검색어 1 + 장르 수 + 등급 1 + 선택 조건 수. 정렬은 세지 않는다.
- `isDefaultFilter`: 조건이 없고 추천순일 때만 기본 화면.
- `getTalkedCharacterIds(state)`: 대화방의 캐릭터와 스토리 대화의 등장인물. `getInterestCharacterIds(state)`: 좋아요와 보관을 합친 것.

### 58.2 화면

- `CategoryFilter`: `selected`가 배열. 첫 항목(`전체`)은 고른 장르가 없을 때 켜진다.
- `DiscoveryHome`: 조건을 `chosen` 한 상태로 모았다. 19+를 끄면 19세 등급 조건은 풀어서 쓴다(`filter`). 조건을 바꾸면 `더 보기`로 늘린 표시 수를 처음으로 돌린다.
- 정렬과 필터 막대는 `section`(이름 `정렬과 필터`)이다. `.home [role="group"]`에 장르 버튼 스타일이 걸려 있어 `role="group"`을 쓰지 않았다.
- 찾은 수는 `role="status"`(이름 `찾은 캐릭터`).

### 58.3 검증

- 단위: `discovery-filter`(6: 기본 조건과 조건 수, 장르 전환, 정렬 네 가지, 여러 조건, 대화·관심 정보, 기본 데이터)
- 컴포넌트: `discovery-home`(8: 여러 장르와 전체, 정렬·조건·지우기 추가)
- E2E: `discovery-filter.spec.ts`(4: 장르 여러 개 → 이름순 → 관심 목록·처음 만나는 캐릭터 → 지우기, 390·820·1440px 넘침). 전체 단위 615개·E2E 81개 통과
- 화면: 메인의 기본 화면과 조건을 건 화면을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 59. 메인 #태그 검색과 제목·작가 검색

### 59.1 사용자 요청

- 메인에서 `#태그`로 작품의 태그를 찾고, 여러 `#태그`로 작품을 좁혀 가며 찾기.
- `#`이 없는 검색은 제목이나 작가로 찾기.

### 59.2 규칙 (`src/features/discovery/discovery-filter.ts`)

- `DiscoveryFilter.tags: string[]`(고른 태그, 모두 가져야 통과), `TAG_FILTER_LIMIT = 5`, `TAG_SUGGESTION_LIMIT = 8`.
- `parseSearchQuery(query)`: 낱말로 나눠 `text`(`#` 없는 낱말), `partials`(`#` 뺀 토막), `pending`(띄어쓰기로 끝나지 않았을 때의 마지막 `#토막`, `#`만 쳤으면 빈 글자).
- `applyDiscoveryFilter`: `text`의 낱말마다 `matchesKoreanText(제목)` 또는 `matchesKoreanText(작가 이름)`(58.1의 "이름·소개·세계관·태그" 검색을 대신함), 고른 태그는 `every`, `partials`는 토막마다 그 토막이 든 태그가 하나라도 있어야 한다.
- `absorbTags(query, tags, known)`: 뒤에 띄어쓰기가 있는 `#토막`을 칩으로 옮긴다. 정확히 같은 태그가 있거나 맞는 태그가 하나뿐일 때만 옮기고, 아니면 검색창에 남겨 토막으로 계속 좁힌다. 한도를 넘어도 남긴다.
- `suggestTags(characters, chosen, pending)`: 넘겨받은 작품의 태그 통계(`buildTagStats`)에서 고른 태그를 빼고, 입력 중이면 맞는 것만(앞부분 일치 먼저, 초성 포함) 돌려준다. 화면은 **입력 중인 토막을 뺀 지금 결과**를 넘겨서, 제안의 작품 수가 "이 태그를 더하면 남는 수"가 되게 한다.
- `removePendingTag`·`addTag`: 후보를 고르면 입력 중이던 토막을 지우고 칩을 더한다.

### 59.3 화면 (`DiscoveryHome.tsx`)

- 검색창 이름은 `제목과 작가 검색`, 안내 글은 `제목·작가 검색, #태그로 좁히기`. 읽어 주는 설명(`aria-describedby`)으로 사용법을 알려 준다.
- `태그로 좁히기` 영역은 태그를 골랐거나 `#`을 치는 동안에만 나온다: `고른 태그`(칩, `#태그 태그 빼기`) → 안내 → `태그 제안`(`#태그 태그 더하기, 작품 N개`).
- Enter는 입력 중일 때 첫 후보를 고르고(한글 조합 중에는 무시), Backspace는 검색창이 비어 있을 때 마지막 태그를 뺀다.

### 59.4 검증

- 단위: `tag-search`(7: 나누기, 여러 태그로 좁히기, 입력 중 좁히기와 초성, 칩으로 옮기기와 한도, 제안 순서, 제목·작가 검색, 조건 수). `discovery-filter`·`adult-content`의 검색어를 제목 기준으로 고침
- 컴포넌트: `discovery-home`(10: 태그 고르기·이어서 좁히기·빼기, 띄어쓰기로 칩·초성 제안·없는 태그·조건 지우기 추가)
- E2E: `discovery-filter.spec.ts`(5: 태그 두 개로 좁히기 → 칩 추가·빼기 → 지우기 → 작가 이름·제목 초성·`#` 없는 태그 이름·제목과 태그 함께). 전체 단위 624개·E2E 82개 통과
- 화면: 태그 입력 중·태그 두 개로 좁힌 화면을 1440·820·390px, 밝게·어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음)

## 60. 로드맵 8단계: 한국어/영어

### 60.1 결정 (2026-10-04, 사용자 "권장대로")

- 영어 문구는 AI가 번역해 넣고 나중에 사람이 다듬는다.
- 처음 언어는 브라우저 언어를 따르고(한국어가 아니면 영어) 설정에서 바꾼다.
- 캐릭터 이름·소개·대사 같은 작품 내용과 이미 나눈 대화는 바꾸지 않고 화면 글자만 바꾼다.
- 네 묶음으로 나눠 커밋: 틀(`bcf18a6`) → 자주 쓰는 화면(`c0de1a1`) → 나머지 화면(`bc7cae7`) → 날짜·숫자 형식과 AI 답변 언어.

### 60.2 틀 (`src/lib/i18n/`)

- `index.ts`: `Locale = "ko" | "en"`, `LanguageSetting = "auto" | Locale`, `resolveLocale(setting, browserLanguage)`, `setActiveLocale`·`getActiveLocale`, `localeTag()`(`ko-KR`·`en-US`), `t(value, params?)`, `translateTo(locale, text)`.
- 한국어 글자가 그대로 열쇠다. `t("저장")`은 한국어면 그대로, 영어면 사전에서 찾고, 없으면 한국어를 돌려준다. 값은 `t("{0}개", [count])`처럼 넣고, 글자인 값은 사전에서 한 번 더 찾는다.
- 사전은 화면 묶음별 파일: `en/shell.ts`(공통 메뉴·기본 화면), `discovery.ts`, `character.ts`, `chat.ts`, `settings.ts`, `more.ts`(보상·초대·이벤트·보관함·스토리·이미지·Text-Play), `data.ts`(저장 값의 표시 이름), `ai.ts`(연습용 AI 내용). `en/index.ts`가 합친다. 줄마다 글자 자체가 설명이라 사전 파일에는 줄 주석을 달지 않는다.
- `AppProvider`가 저장된 상태를 읽은 뒤 `resolveLocale(settings.language, navigator.language)`로 언어를 정하고 `setActiveLocale`을 부른다. 화면은 `<Fragment key={locale}>`로 감싸 언어가 바뀌면 통째로 새로 그린다. 저장 상태를 읽기 전(서버에서 그릴 때 포함)에는 한국어다.
- `settings.language`는 선택 항목이라 앱 상태 버전을 올리지 않았다(없으면 `auto`). `state-validation.ts`가 값을 확인한다.
- 설정 화면: `화면 레이아웃`의 `언어 · Language`(`자동`·`한국어`·`English`).

### 60.3 화면 글자 감싸기

- TypeScript 구문 분석으로 화면에 보이는 글자(JSX 글자, 속성 글자, 함수 안 글자, 틀 글자)를 `t()`로 감쌌다(96개 파일, 약 2,200곳). 비교·`case`·`includes`에 쓰는 글자와 저장되는 값은 감싸지 않았다.
- 목록 자료의 이름(`label`·`title`·`description`)은 그리는 자리에서 `t(item.label)`로 바꾼다.
- 저장되는 값(관계 단계, 감정, 기본 스탯 이름 `호감도`)은 한국어로 저장하고 그릴 때만 `t(값)`으로 바꾼다. 제작자가 지은 스탯 이름은 사전에 없어 그대로 나온다.
- 조사 처리(`은/는`)가 든 검증 문구는 영어일 때 따로 만든다(`story-validation.ts`의 `checkLength`).
- 언어는 브라우저 저장소에 있어 서버는 모른다. 글자가 있는 화면은 `"use client"` 컴포넌트여야 하고 `src/app`의 페이지 파일에는 `t()`를 쓰지 않는다(없는 주소 안내는 `NotFoundScreen`으로 분리).
- `scripts/i18n-keys.ts`: `t("…")`에 든 글자를 모아 사전에 없는 것을 알려 준다(`node scripts/i18n-keys.ts [--all] [--dir=a,b]`).

### 60.4 날짜·숫자 형식

- `"ko-KR"`로 고정했던 16개 파일의 `toLocaleString`·`toLocaleDateString`·`Intl` 호출을 `localeTag()`로 바꿨다. 줄임 숫자는 한국어 `16.2만`, 영어 `162K`.
- `token-ledger.ts`의 `describeDate`: 한국어는 전과 같이 `10월 3일 (토)`, 영어는 `Intl`로 `Sat, Oct 3`.
- `status-model.ts`의 작품 속 시간: 요일 이름을 화면 언어로(`금요일 20:06` / `Friday 20:06`).

### 60.5 AI 답변 언어

- `ChatReplyOptions.language?: Locale`(없으면 한국어). `chat-controller.ts`의 `createLLMInput`이 `getActiveLocale()`을 넣는다.
- `mock-llm-adapter.ts`: 고른 답변, 문체 장식, 추가 문장, 사칭 문장, 설정집 문장을 `translateTo(options.language, …)`로 바꾼다. 예시 대화에서 찾은 답(`findExampleReply`)은 제작자가 쓴 글이라 그대로 쓴다.
- `mock-story-writer.ts`: `StoryReplyInput.language`를 받아 내레이션과 대사를 바꾼다. `[내레이션]` 표시와 인물 이름은 그대로 둔다(나누는 규칙이 이 표시를 본다).
- `status-model.ts`·`suggestion-model.ts`: 장소·팁·속마음·직접 항목 값·추천 답변을 고른 뒤 `t()`로 바꾼다. 영어 팁에는 인물 이름을 앞에 붙이지 않는다. 문체 미리보기(`getStyleSample`)는 이름이 문장 속에 들어가 영어 문장을 따로 둔다.
- 답변과 상태창은 만들어질 때의 언어로 메시지에 저장된다. 언어를 바꿔도 지난 대화는 그대로다.

### 60.6 탭 제목 (`src/features/core/use-document-language.ts`)

- `translateTitle(title, locale)`: `제목 | Mate Verse`의 앞부분만 사전에서 찾아 바꾼다(작품 이름은 사전에 없어 그대로).
- `useDocumentLanguage(locale)`: `<html lang>`을 맞추고, `document.head` 변화를 지켜보다 제목이 바뀌면 다시 맞춘다. 한국어로 돌아가면 원래 제목으로 되돌린다.
- 서버가 보내는 제목·설명(검색엔진용)은 한국어 그대로다.

### 60.7 영어 화면에 한글이 남는 곳(의도한 것)

- 작품 내용: 캐릭터·스토리의 이름, 소개, 태그, 첫 대사, 상세 페이지의 소개 글, 작품에 저장된 플레이 가이드, 제작자가 지은 스탯 이름·이벤트 글.
- 이미 나눈 대화와 그때 만들어진 상태창.
- 태그 입력 예시(`힐링, 판타지, 여행`): 태그가 한국어라 예시도 한국어.

### 60.8 검증

- 단위: `i18n`(언어 정하기, `t()`와 값 넣기, 영어 문구의 `{0}` 짝, 모든 폴더에서 빠진 번역 0), `i18n-content`(6: 영어 답변·스토리·상태창·추천 답변·문체 미리보기, 한국어 유지, 날짜·줄임 숫자, 탭 제목). 테스트는 `src/test/setup.ts`에서 한국어로 고정하고 영어를 볼 때만 `setActiveLocale("en")`.
- E2E: `language.spec.ts`(13: 언어 바꾸기와 새로고침 뒤 유지, 영어 브라우저의 자동 영어, 없는 주소·Text-Play·질문 검색, 영어 답변과 상태창, 탭 제목과 날짜, 390px 다섯 화면과 메인 세 너비의 넘침). `playwright.config.ts`의 `locale: "ko-KR"`로 나머지는 한국어 고정. 전체 단위 634개·E2E 95개 통과.
- 화면: 영어로 16개 화면을 390px 어둡게·820px 밝게·1440px 어둡게와 밝게에서 확인(가로 넘침 0, 콘솔 오류 없음). 화면 글자 가운데 한글로 남은 것은 60.7뿐.

### 60.9 남은 일

- 영어 문구 사람이 다듬기(특히 게임 용어와 말투).
- Text-Play 언어 설정과 연결(Text-Play 쪽 작업).
- 해외 공개 전: 언어별 주소와 검색엔진용 제목·설명, 작품 내용 번역 여부.
- 10단계에서 실제 AI에 `options.language`를 "이 언어로 답하라"는 지시로 전달.

## 61. 빈틈 메우기 (외부 서비스 없이 되는 것)

### 61.1 사용자 요청과 범위

- 8단계 뒤에 외부 서비스 없이 할 수 있는 일 17가지를 정리했고, 사용자가 `캐릭터가 먼저 말 걸기`를 뺀 16가지를 진행하라고 했다.
- 묶음: (가) 설정·고객 지원과 탭 제목 → (나) 검색 통일 → (다) 다듬기 → (라) 새 기능(주간 미션, 이용 시간 하루 누적). 묶음마다 따로 커밋한다.

### 61.2 첫 묶음: 탭 제목

- 원인: `src/app/layout.tsx`에 `metadata`가 없어 제목을 정하지 않은 페이지(메인, 보관함, 캐릭터 상세·만들기·수정, 스토리 상세, 채팅)는 탭에 주소가 보였다.
- 기본 제목 `Mate Verse`와 설명을 레이아웃에 두고, 페이지마다 `제목 | Mate Verse`를 넣었다.
- 작품 이름은 브라우저 저장소에 있어 서버가 모른다. `PageTitle`이 화면이 뜬 뒤 `document.title`을 바꾼다. 화면을 다 그린 뒤 서버 제목이 다시 들어오는 경우가 있어 `document.head`를 지켜보다 서버 제목으로 돌아가면 다시 바꾼다(다른 제목으로 바뀐 것은 건드리지 않아 `use-document-language`의 번역과 서로 되풀이하지 않는다). 화면을 떠날 때 제목이 그대로면 원래 제목으로 돌린다.

### 61.3 첫 묶음: 로그아웃

- 전에는 확인 창만 뜨고 아무 일도 하지 않았다.
- `end-local-session`(리듀서): `matureContentEnabled`를 끄고 두 패널을 닫는다. 다른 것은 바꾸지 않는다.
- `AppShell`의 `logout`이 확인 창(무엇이 바뀌는지 적음) → 동작 → 위쪽 안내(`로그아웃했습니다…`, `닫기`). `UserPanel`은 `onLogout`을 받을 때만 버튼을 그린다.
- 19+ 작품 화면에 있었다면 19+ 보기가 꺼지면서 잠금 화면으로 바뀐다.

### 61.4 첫 묶음: 고객 지원

- `release-notes.ts`: `{ date, title, items }` 최근 순. `RELEASE_NOTE_PREVIEW = 2`. 날짜는 화면 언어 형식으로 보인다.
- `inquiry.ts`: `InquiryDraft { kind, title, body, includeDiagnostics }`, `validateInquiry`, `buildInquiryText`(머리말은 화면 언어). 화면에는 `복사될 글 미리보기`가 있어 복사가 막힌 브라우저에서도 직접 복사할 수 있다.
- 진단 정보 영역은 `앱 정보` 작은 제목 아래로 옮겼다(내용은 그대로).

### 61.5 첫 묶음: 멤버십 비교표와 토큰 기간

- `membership.ts`: 열은 `FREE·PLUS·CREATOR`, 줄은 대화·작품 만들기·출석과 미션 토큰·상위 대화 모델·이미지 만들기·제작자 통계·가격. 정해지지 않은 것은 `예정`·`정해지지 않음`으로 적고 숫자를 지어내지 않았다. 좁은 화면에서는 표만 옆으로 민다(`.tableScroll`).
- `token-ledger.ts`: `TokenPeriod { id, from, to }`, `getTokenPeriodRange`(직접 고른 날짜가 거꾸로면 바꿈, 한쪽만 적어도 됨), `filterTokenRecordsByPeriod`. 종류 버튼의 숫자도 고른 기간 기준이다.

### 61.6 첫 묶음 검증

- 단위 `support-extras`(7), 통합 `support-extras`(6), E2E `polish.spec.ts`(7: 탭 제목, 로그아웃, 소식과 문의 복사, 기간과 비교표, 세 너비 넘침). 전체 단위 647개·E2E 102개 통과.
- 화면: 고객 지원·프로필 관리·토큰 이용 내역을 390px 어둡게·820px 밝게·1440px 밝게와 어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음). 영어 화면에 남은 한글 없음.

### 61.7 둘째 묶음: 검색 통일

- 탐색(`ExploreScreen.tsx`): `selectedTag`(하나) → `selectedTags`(여러 개). `initialTag`는 글자 하나나 목록을 받는다(`src/app/explore/page.tsx`가 `?tag=`를 모두 넘김). `createExploreHref`는 글자·목록·null을 받고, `getCharactersByTags`가 모두 가진 작품을 인기순으로 돌려준다. 제안은 `suggestTags(남은 작품, 고른 태그, 입력 글자, 12)`로 바꿔 초성과 남은 작품 수를 쓴다. 한도(5개)를 넘기려 하면 안내를 보여 준다.
- 대화 목록(`conversation-list-model.ts`): `findConversationMatch(item, query, messages)` → `{ message: Message | null } | null`. 같은 낱말이 여러 번 나오면 가장 최근 말을 고른다. `ConversationPanel`은 검색 결과를 `Map`으로 한 번 만들고 카드 링크와 미리보기(80자)를 바꾼다.
- 목록 검색: `splitSearchWords`·`matchesFields`·`searchBy`. 검색어가 비면 목록을 그대로 돌려준다. `ListSearch`는 검색어가 있을 때만 `role="status"`로 찾은 수를 읽어 준다.
- 보관함: 검색어는 탭을 바꿔도 남는다. 찾은 것이 없으면 탭 내용 대신 `‘낱말’에 맞는 항목이 없어요.`를 보여 준다. 대화 탭은 `visibleIds`로 찾은 대화만 넘긴다.
- 메인 조건 기억(`discovery-filter.ts`의 `parseStoredFilter`): 모양이 맞지 않으면 버리고, 검색어 80자·태그 5개로 자른다. 19+를 끈 상태에서 19세 등급 조건이 되살아나면 기존 규칙대로 `모든 등급`으로 본다.
- 검증: 단위 `list-search`(6), 통합 `search-extras`(7), E2E `search-extras.spec.ts`(7: 탐색 여러 태그와 새로고침, 지난 말로 대화 찾기, 보관함·스토리 검색, 메인 조건 기억, 세 너비 넘침). 전체 단위 660개·E2E 109개 통과. 탐색(태그 둘)·보관함·스토리 목록을 390px 어둡게·820px 밝게·1440px 밝게와 어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음).
- 고친 문제: 보관함·스토리 검색 줄에 `margin` 줄임 표기를 써서 가운데 정렬이 풀려 왼쪽으로 삐져나옴 → `margin-top`만 쓰도록 수정.

### 61.8 셋째 묶음: 다듬기

- 대화상자: 초점 처리가 없던 곳은 `LibraryScreen`의 삭제 창 3개와 `ImageStudio`의 삭제 창 1개였다. `DialogFrame`은 열 때 `document.activeElement`를 기억했다가 닫을 때 되돌리고, Esc에서 `preventDefault`를 불러 `AppShell`의 패널 닫기와 겹치지 않게 한다. 삭제해서 연 버튼이 사라진 경우에는 초점 복귀가 아무 일도 하지 않는다.
- 제작자: 랭킹 콘셉트의 첫 태그 분포(판타지 14, 스팀펑크·SF·힐링·동양풍 13, 현대 9, 고딕 7, 미스터리 4, 모험 3, 예술·시간·여행·연금술 1)를 8명에게 묶었다. `RANKING_LAB_CREATOR_ID`는 예전 데이터를 알아보는 데만 쓴다. 가져오기(JSON)로 예전 데이터를 넣으면 다음에 읽을 때 고쳐진다.
- 영어 문구: `scratchpad`의 점검 도구로 `{값}{t("…")}`와 `</strong>{t("…")}` 모양을 찾아 영어 조각이 빈칸·문장 부호로 시작하는지 확인했고, 같은 검사를 `tests/unit/i18n-spacing.test.ts`로 남겼다(번호 칸 뒤의 Text-Play 선택지 3개는 예외). 영어 화면 18곳의 글을 통째로 읽어 고친 것: 보관함 탭(`Save draft`→`Drafts`, `Bookmark`→`Bookmarks`), 이미지 스튜디오 제목(`Images Studio`→`Image Studio`), 카드의 대화 수(`184,000 Chat`→`184,000 chats`), 캐릭터 상세 지표(`Chats`·`Saves`·`Ratings`), 내 활동 칸(`Likes`·`Saved`), 토큰 받기 제목(`tokens`→`Get tokens`), 언어 영역 제목(영어 화면에서는 `Language · 언어`), 멤버십 표 머리(`구분`/`Feature`), 알림 시간 문장, 삭제 안내 문장, 자주 묻는 질문 한 줄의 문법.
- 탐색의 제작자 카드: 태그 줄 수가 달라도 팔로우 버튼이 같은 높이에 오도록 카드 행을 `auto auto 1fr auto`로 정했다.
- 검증: 통합 `dialog-focus`(2), 단위 `builtin-creators`(2)·`i18n-spacing`(2), E2E `polish-extras.spec.ts`(3: 키보드만으로 삭제 창 다루기, 예전 저장 데이터의 제작자 나누기와 팔로우 옮기기, 영어 자리별 문구). 전체 단위 666개·E2E 112개 통과. 제작자 줄과 영어 보관함·멤버십 표를 390px 어둡게·820px 밝게·1440px 밝게와 어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음).

### 61.9 넷째 묶음: 주간 미션

- 2단계에서 "주간 미션은 넣지 않음"으로 미뤘던 것을 사용자 요청(빈틈 메우기)으로 넣었다.
- `WeeklyMissionState { weekKey, progress, claimed }`. `getWeekKey(now)`는 한국 날짜의 요일로 그 주 월요일의 날짜 키를 만든다(세계 표준시로 일요일 오후 3시 이후는 한국 월요일). `getWeeklyState`는 저장된 주가 지났으면 빈 상태를 돌려준다(시계를 뒤로 돌려도 기록은 그대로).
- 추적: 출석은 `check-attendance` 동작에서 누적 출석일이 늘었을 때만 1을 더한다(같은 날 다시 눌러도 그대로). 메시지와 새 대화는 오늘의 미션이 세는 값을 그대로 쓴다.
- 화면: 오늘의 미션과 같은 줄 모양(`missionList`). `5일 출석하기`는 같은 화면에서 하는 일이라 `하러 가기` 링크 대신 보상(`+10`)만 보여 준다. 설명에 이번 주 남은 날 수를 적는다.
- `reward-model.ts`와 `weekly-model.ts`는 서로 함수를 불러 쓰지만(받을 보상 합계 ↔ 토큰 지급) 불러오는 시점에 실행하는 코드가 없어 순서 문제가 없다.
- 업데이트 소식의 2026-10-04 묶음에 두 줄을 더했다(탐색 태그·목록 검색, 주간 미션).

### 61.10 넷째 묶음: 오늘 이용 시간

- `UsageRecord`에 `dateKey`를 더하고 `rollUsageDay`·`getTodayUsageMs`를 넣었다. `startUsageSegment`와 `tickUsage`가 먼저 날짜를 확인한다. 날짜가 없는 예전 기록(탭마다 세던 것)은 새 날로 본다.
- `useUsageReminder`: 저장할 때 `lastTickAt`은 빼고(탭마다 따로 가짐) 합계만 쓴다. 측정할 때마다 `setDue(isReminderDue(record))`로 맞춰 다른 탭에서 확인했거나 날짜가 바뀌면 알림이 닫힌다. `readTodayUsageMs()`는 화면 표시용이다.
- 단위 테스트 준비(`src/test/setup.ts`)가 테스트마다 이 값을 지운다.

### 61.11 넷째 묶음 검증과 전체 마무리

- 단위 `weekly-usage`(5), 통합 `weekly-usage`(4), E2E `weekly-usage.spec.ts`(5: 주간 미션 진행과 받기·새로고침 뒤 유지, 이용 시간 합계와 알림·다른 탭, 세 너비 넘침). 전체 단위 675개·E2E 117개 통과.
- 화면: 주간 미션과 내 활동 칸을 390px 어둡게·820px 밝게·1440px 밝게와 어둡게에서 확인(가로 넘침 0, 콘솔 오류 없음). 영어 화면에 남은 한글 없음.
- 빈틈 메우기 16가지 커밋: 첫 묶음 `655d8cf`, 둘째 `367e480`, 셋째 `734ce0f`, 넷째(이 커밋).

## 62. 로드맵 10단계 첫 묶음: 실제 대화 AI를 혼자 시험

### 62.1 결정 (2026-10-04)

- 사용자: "기존의 챗 형식에서 크랙과 같이 각 모델로 이름짓고 싶어. 현재로는 테스트로 혼자 즐기고 싶어." 이어서 Claude·Gemini 둘 다, 이름은 `별명 + 모델 이름`을 골랐고, "GPT를 쓰지 않는 이유가 있느냐"고 물어 GPT 등급도 넣었다.
- 그래서 범위는 "내 컴퓨터에서 혼자 실제 AI와 대화하기"까지다. 공개 배포, 로그인, 사람별 사용량 제한, 실제 요금에 맞춘 토큰 가격은 범위 밖이다.

### 62.2 등급 개편

- `ChatTierId`에 `smart`·`balance`·`master`를 더했다. 예전 식별자를 바꾸지 않아 저장 데이터 변환이 필요 없다(베이직챗=가장 싼 등급, 플러스챗·프리미엄챗은 이름과 비용 그대로).
- `ChatTier`에 `model`(화면에 보이는 모델 이름)과 `provider`(회사)를 더했다. 실제로 보내는 모델 이름은 서버의 `model-catalog.ts`에만 있다.
- `ConversationSettings.tierOptions`를 `Partial`로 바꾸고 검사(`isConversationSettings`)는 "있는 값이 모두 올바른가"만 본다. 화면은 `getTierOption`·`fillTierOptions`로 읽는다.
- 등급 목록(`TierSelector`): 별명, `모델 이름 · 설명`, `실제 AI`/`연습용 AI` 표시, 비용. 목록 너비를 340px로 넓혔고, 휴대폰에서는 등급 버튼이 왼쪽에 있어 오른쪽 맞춤이면 화면 밖으로 나가던 문제를 왼쪽 맞춤으로 고쳤다(전부터 있던 문제).

### 62.3 서버 통로와 회사별 형식

- Anthropic: `POST {주소}/messages`, 머리말 `x-api-key`·`anthropic-version: 2023-06-01`, 내용 `{ model, max_tokens, system, messages, stream: true }`, 답은 `content_block_delta`의 `text_delta`만 쓴다.
- Google: `POST {주소}/models/{모델}:streamGenerateContent?alt=sse`, 머리말 `x-goog-api-key`, 내용 `{ systemInstruction, contents(role: user·model), generationConfig.maxOutputTokens }`, 답은 `candidates[0].content.parts[].text`(생각 과정 `thought: true`는 뺌).
- OpenAI: `POST {주소}/chat/completions`, 머리말 `authorization: Bearer`, 내용 `{ model, messages(system 먼저), stream: true, max_completion_tokens }`, 답은 `choices[0].delta.content`, `[DONE]`에서 끝.
- 생각하는 모델은 답변 길이 한도에 생각 분량이 함께 잡혀 답이 잘릴 수 있어 Google과 OpenAI에는 2,048토큰의 여유를 더해 보내고, 길이는 지시문의 "약 N자 안팎"으로 맞춘다.
- 첫 조각을 받은 뒤에 `200`으로 흘려보내기 시작한다. 그 전에 실패하면 이유 코드를 JSON으로 돌려준다(열쇠 오류 `bad-key`, 회사 한도 `provider-busy`). 도중에 끊기면 흐름을 오류로 끝내고 브라우저는 `다시 시도`를 보여 준다. 브라우저가 중단하면 회사 쪽 흐름도 닫는다.

### 62.4 지시문

- 단락: 역할 → 캐릭터 → 성격과 말투 → 세계관 → (스토리면 등장인물·사용자의 역할) → 제작자 지시 → 대화 상대 → 사용자가 적어 둔 메모 → 지금까지의 기억 → 지금 떠올릴 설정 → 현재 수치 → 말투 예시 → 규칙. 내용이 없는 단락은 넣지 않는다.
- 규칙: 형식(행동은 `*별표*`, 스토리는 `[이름] 내용`과 `[내레이션] 내용`), 사칭 방지, 길이(350자 × 길이 배수), 언어, 문체, 안전(성적으로 노골적인 묘사·미성년자·실존 인물), 일관성.
- 브라우저가 보낸 재료는 서버에서 길이와 개수를 자르고 모르는 값은 기본값으로 바꾼다(`parseChatRequest`). 표지 이미지 주소 같은 필요 없는 값은 보내지 않는다.
- 실제 모델의 답을 보며 다듬어야 한다. 특히 캐릭터 이름이 작품 제목(`새벽 도서관의 리안`)이라 짧은 이름을 따로 알려 주는 것, 스토리 등장인물의 성격을 더 알려 주는 것이 다음 개선 후보다.

### 62.5 검증

- 단위 `llm-server`(16: 등급, 예전 설정 읽기, 모델 연결, 문지기, 지시문 4, 줄 읽기, 회사별 형식 3, 회사 오류, 서버 통로 3), 통합 `remote-llm`(5: 어댑터 3, 등급 목록, 실패 안내), E2E `chat-models.spec.ts`(5: 꺼진 서버 통로, 등급 고르고 대화·새로고침, 세 너비). 전체 단위 696개·E2E 122개 통과.
- 가짜 AI 회사 서버(세 형식)를 붙여 실제 브라우저에서 플러스챗·베이직챗·밸런스챗·마스터챗으로 대화: 답이 흘러나오고 토큰이 3·1·2·12 차감됐다. Claude 열쇠만 넣은 경우 Claude 등급만 `실제 AI`로 표시됐다.
- 실제 열쇠로는 확인하지 못했다.

## 63. 로드맵 10단계 둘째 묶음: 19세 작품을 내 컴퓨터의 공개 모델로

### 63.1 결정 (2026-10-04)

- 사용자: "크랙이나 다른 서비스는 검열이 없는 버전을 사용하던데 그건 어떻게 한 거야?" 답: Claude·Gemini에는 검열 없는 버전이 없다. 크랙의 `언세이프티`는 자기 필터를 끄는 것이고 모델 회사의 금지는 남는다. 성인 대화를 본격적으로 여는 서비스는 공개 모델을 직접 돌린다. 필터를 속이는 지시문은 만들지 않는다고 알렸다.
- 사용자: "직접 돌리는 방식으로 진행하고 싶어." 혼자 시험하는 단계이므로 빌린 서버가 아니라 사용자 컴퓨터(RTX 5070 Ti 16GB)에서 Ollama로 돌린다.

### 63.2 설계

- 회사 자리에 `local`을 더하고 등급 `open`(오픈챗)을 하나 추가했다. 등급에 `mature`(19세 작품에 답할 수 있는지)를 두어 서버 통로·브라우저 어댑터·등급 목록·지시문이 모두 이 값 하나를 본다.
- 연결 조건은 "스위치 켬 + `CHAT_MODEL_OPEN`에 모델 이름". 열쇠가 필요 없으므로 `providerSettings.keyRequired`로 구분했다. 기본 모델 이름을 두지 않은 이유는 설치하지 않은 모델로 연결됐다고 표시하지 않기 위해서다.
- 형식은 Ollama 전용이 아니라 OpenAI 형식을 쓴다. Ollama·LM Studio·vLLM이 모두 받으므로 나중에 빌린 GPU 서버로 옮길 때 주소(`LOCAL_BASE_URL`)와 열쇠(`LOCAL_API_KEY`)만 바꾸면 된다.
- Ollama의 OpenAI 형식은 `max_tokens`·`reasoning_effort`를 받고 `max_completion_tokens`는 받지 않는다(2026-10 공식 문서 확인). 생각하는 모델(Qwen3)은 생각을 끄지 않으면 답이 늦고 답변 길이를 생각에 써 버리므로 기본으로 `reasoning_effort: "none"`을 보낸다. 생각을 켠 채로 쓰면 길이에 2,048토큰 여유를 더한다.
- `stripThinking`: 답에 섞여 오는 `<think>…</think>`를 뺀다. 꼬리표가 조각 사이에서 끊겨도 처리하도록, 꼬리표의 앞부분으로 끝나는 글자는 다음 조각까지 내보내지 않고 들고 있는다. 닫히지 않은 생각은 버린다. 답의 맨 앞 줄바꿈도 지운다.
- 한 번에 읽는 분량: Ollama 기본값이 그래픽카드 메모리 24GB 미만에서 4k다(공식 문서). OpenAI 형식으로는 요청마다 바꿀 수 없어, 앱 쪽에서는 보내는 대화를 줄이고(20개·6,000자) 사용자에게 Ollama 설정에서 16k로 올리게 안내한다.

### 63.3 19세 작품 규칙

- 서버 통로: `contentRating === "mature"`이고 등급의 `mature`가 `false`면 `mature-not-supported`(브라우저가 연습용으로 넘김). 브라우저 어댑터도 같은 조건이면 서버 통로를 부르지 않는다.
- 지시문의 안전 줄은 두 가지다. "19세 작품 + 오픈챗"이면 "성인 사이의 수위 높은 장면도 피하거나 건너뛰지 않고 이야기 흐름에 맞게 묘사한다"를, 그 밖에는 기존의 "성적으로 노골적인 묘사는 쓰지 않고 장면을 넘긴다"를 넣는다. 두 경우 모두 등장인물은 성인이라는 것과 미성년자·실존 인물 금지를 넣는다.
- 지금은 브라우저가 보낸 작품 등급을 서버가 그대로 믿는다. 내 컴퓨터에서 혼자 쓰는 동안은 문제가 없지만, 공개 서비스에서는 서버가 성인 인증을 확인해야 한다.

### 63.4 화면

- 등급 목록: 모델 이름 자리에 서버가 알려 준 실제 모델 이름(`qwen3:14b` 등)을 보여 주고, 모르면 `공개 모델`을 보여 준다. 19세 작품에서는 오픈챗을 맨 위로 올리고 다른 등급은 `연습용 AI`로 표시한다.
- 등급 목록 위치: 목록을 열 때 버튼의 오른쪽 끝이 목록 너비(340px)보다 왼쪽에 있으면 왼쪽 맞춤(`data-align="left"`)으로 바꾼다. 820×1180처럼 세로로 긴 화면에서 등급 버튼이 왼쪽에 놓여 목록이 화면 밖으로 나가던 문제였다. 목록 최대 높이는 640px로 늘렸다.
- 실패 안내 두 가지를 더했다: 프로그램 꺼짐(`model-offline`), 설치되지 않은 모델(`model-missing`).

### 63.5 함께 찾은 문제

- 대화한 적 없는 캐릭터를 주소(`/chat/캐릭터`)로 바로 열면 화면이 끝없이 다시 만들어졌다. 페이지가 주소의 대화 식별자를 `key`로 쓰는데, 아직 저장하지 않은 새 대화의 식별자(만든 시각 포함)로 주소를 바꾸면 화면이 다시 만들어지고 새 식별자가 또 생기기 때문이다. 저장하지 않은 새 대화는 주소를 바꾸지 않게 고쳤다(커밋 `f2ece8e`, 따로 커밋).

### 63.6 검증

- 단위 `llm-server`(22), 통합 `remote-llm`(8), E2E `chat-models.spec.ts`(6: 820×1180 추가), `error-states.spec.ts`(새 대화 주소). 전체 단위·통합 705개, E2E 124개 통과.
- Ollama 형식을 흉내 낸 가짜 서버를 붙여 실제 브라우저에서 확인: 19세 캐릭터 + 오픈챗 → 가짜 모델의 답(생각 꼬리표 제거됨), 같은 캐릭터 + 플러스챗 → 연습용 AI, 전연령 캐릭터 + 오픈챗 → 실제 답이지만 지시문은 수위를 열지 않음. 보낸 요청에 `max_tokens: 1000`, `reasoning_effort: "none"`이 있고 열쇠 머리말과 `max_completion_tokens`는 없었다.
- 실제 모델 확인(2026-10-04, 사용자 컴퓨터 RTX 5070 Ti 16GB, Ollama 0.35.1, `qwen3:14b`): Ollama 앱의 `Context length`를 바꾸지 못해 `POST /api/create`(`from: qwen3:14b`, `parameters.num_ctx: 16384`)로 사본 `qwen3-14b-16k`를 만들어 연결했다. 시스템 설정을 건드리지 않고 새로 내려받지도 않는 방법이라 이쪽을 기본 안내로 삼아도 된다.
- 결과: 그래픽카드 메모리 11.7GB 사용(전부 그래픽카드), 첫 호출 약 48초(모델 올리기), 이후 답 하나 1.4~1.9초. `reasoning_effort: "none"`으로 생각 과정 없이 답만 왔다. `*행동*`·`[이름] 대사` 형식을 지켰고 한자가 섞이지 않았다.
- 한계: 한국어가 군데군데 어색하고(반말 캐릭터의 "제가", 맥락과 어긋난 묘사) 답이 지시한 길이보다 짧다. 수위 높은 장면을 실제로 쓰는지는 확인하지 않았다.

## 64. 대화창 메시지 동작을 그림 버튼으로

### 64.1 요청 (2026-10-05)

- 사용자: "복사, 삭제, 책갈피, 명장면 카드와 같이 대화의 요소들을 글자가 아닌 이미지로 바꾸고 크기를 줄여줘." 이어서 "대화창의"라고 범위를 덧붙였다.
- 범위는 말풍선 아래 동작 버튼 여섯 개와 버전 전환기의 「현재 버전 삭제」다. 입력창 아래 버튼(`*`, `/`, 「장면 이미지」, 「추천답변」)과 머리말 버튼은 바꾸지 않았다.

### 64.2 설계

- 그림은 `src/features/chat/MessageIcon.tsx`의 선 그림(SVG) 여섯 개다. 그림 파일을 받지 않고 코드로 그린 이유는 버튼 글자색(밝은·어두운 테마, 사용자 말풍선의 흰색, 켜진 책갈피의 장르색)을 그대로 따르게 하기 위해서다.
- 버튼의 보이는 글자를 없애는 대신 `aria-label`과 `title`에 같은 이름을 넣었다. 읽기 도구와 기존 테스트의 이름 찾기가 그대로 동작한다.
- 스타일은 글자 버튼과 그림 버튼을 나눴다. `.actions button`·`.versionDelete`는 28×28px 그림 버튼, `.editForm button`은 예전 글자 버튼 그대로다. 손가락 화면(`pointer: coarse`)은 32×32px로 조금 키운다.
- 켜진 책갈피는 `aria-pressed="true"`일 때 그림 속을 채운다(`fill: currentColor`).

### 64.3 검증

- 부품 `message-actions`(3: 답변 버튼 다섯 개의 이름·풍선 도움말·그림, 내 메시지의 수정·버전 삭제 동작, 책갈피 눌림과 응답 중 잠김), E2E `message-actions.spec.ts`(4: 복사·책갈피 동작과 새로고침 뒤 유지, 390·820·1440px에서 한 줄 배치와 32px 이하 크기). 전체 단위·통합 708개, E2E 128개 통과.
- 390·820·1440px, 밝은 테마와 어두운 테마에서 모양과 가로 넘침 0을 확인했다.

## 65. 바로 고칠 문제 여섯 가지 (다음 작업 1단계)

### 65.1 배경 (2026-10-05)

- 전체 구현 내용을 문서로 정리하려고 코드를 처음부터 끝까지 읽는 동안 문제가 여럿 나왔다. 그 가운데 혼자 써 볼 때 바로 부딪히는 여섯 가지를 1단계로 묶었다. 다섯 가지는 실제 브라우저에서 다시 일으켜 확인했고 한 가지(긴 대화)는 코드로 확인했다.
- 사용자: "1단계부터 진행해줘." 휴대폰 첫 화면은 권장안(좁은 화면에서만 닫힌 채 시작)대로 했다.
- 나머지 단계(이름과 실제 맞추기, 실제 AI 품질, 로그인, 공개 서비스, 결제)는 `Homepage/reports/Mate Verse 다음 작업 단계별 정리.txt`에 있다.

### 65.2 문제와 고친 방법

| 문제 | 원인 | 고친 방법 |
| --- | --- | --- |
| 새로 고침한 뒤 보낸 말이 저장되지 않음 | `ChatController.nextId`의 순번이 제어기를 만들 때마다 0부터 시작해 `{대화}-user-1` 같은 식별자가 앞서 저장된 것과 겹침. 저장 전 검사(식별자 중복)가 저장을 통째로 거절 | 이미 쓰는 식별자는 건너뛰고 다음 번호를 씀. 저장된 식별자는 그대로 |
| 휴대폰 첫 화면을 대화 목록이 덮음 | 처음 상태가 `leftPanelOpen: true`이고 좁은 화면에서 닫아 주는 처리가 없음 | 저장된 상태가 없는 첫 방문이고 `innerWidth`가 760 이하이면 두 패널을 닫은 상태로 시작(`closePanelsOnNarrowFirstVisit`). 저장해 둔 설정은 건드리지 않음 |
| 토큰이 모자랄 때 쓴 글이 지워짐 | `ChatComposer`가 보내기 전에 입력칸을 비움 | `onSend`가 거절(`false`)을 돌려주면 쓴 글을 되돌림. 중단(`cancelled`)은 이미 보낸 뒤라 되돌리지 않음 |
| 시작 버튼으로 연 대화가 새 대화 미션에 안 잡힘 | "직전 상태에 없던 대화"만 새 대화로 셈. 상세의 시작 버튼은 대화를 먼저 저장 | "그 대화에 내 메시지가 없다가 처음 생긴 경우"를 새 대화 시작으로 셈 |
| 태그 입력칸에 빈칸이 늘어남 | 입력할 때마다 `tags.join(", ")`로 다시 그리고 `split(",")`만 함 | 입력칸 글자를 따로 들고 있는 `TagInput` 부품으로 분리(캐릭터·스토리 편집기 공통). 바깥에서 태그가 바뀌면 그 값으로 다시 맞춤 |
| 긴 대화에서 최근 말이 AI에 안 감 | 브라우저가 대화 전체를 보내고 서버가 `slice(0, 400)`으로 앞쪽만 남김 | 브라우저는 최근 80개·100,000자까지만 보내고, 서버는 `slice(-400)`으로 뒤에서부터 남김 |

### 65.3 판단한 것

- 식별자 형식을 시각이나 난수로 바꾸지 않은 이유: 테스트와 기존 데이터가 지금 형식에 익숙하고, "겹치면 건너뛰기"만으로 겹침이 사라진다.
- 휴대폰 판정을 처음 읽을 때 한 번만 하는 이유: 그 뒤로는 사용자가 연 상태를 그대로 따라야 한다(직접 열어 둔 패널은 새로 고쳐도 열려 있다).
- `TagInput`에서 처음 구현은 빈 태그 목록(`[]`)과 빈 입력(`""`을 나누면 `[""]`)을 다른 것으로 봐 끝없이 다시 그렸다. 쉼표로 이은 글로 비교하도록 고쳤다.
- 브라우저가 보내는 개수를 80으로 둔 이유: 서버가 지시문에 쓰는 것은 최근 40개이고, 같은 쪽 말을 합치는 것까지 생각해 넉넉히 두 배로 잡았다.

### 65.4 검증

- 단위 `chat-message-ids`(3), `reward-new-conversation`(2), `llm-server`(+1), 부품 `app-provider`(+3), `tag-input`(2), 통합 `chat-composer-keep`(2), `remote-llm`(+1), E2E `chat-persistence.spec.ts`(2), `first-visit.spec.ts`(2). 전체 단위·통합 722개, E2E 132개 통과.
- 고치기 전에 새 테스트가 실패하는 것을 먼저 확인했다(식별자 2건, 토큰 부족 1건, 미션 1건, 긴 대화 2건).

## 66. 이름과 실제 맞추기, 작은 다듬기 (다음 작업 2단계)

### 66.1 배경

2026-10-05 점검에서 "화면에 적힌 말과 실제 동작이 어긋나는 곳"과 코드를 읽으며 의심한 자잘한 문제를 아홉 묶음으로 정리했다. 사용자 결정은 "권장대로"다: 생각 깊이는 답변에 반영될 때까지 숨기고, 유저 노트 확장 비용은 노트가 500자를 넘을 때만 받는다. 앱 상태 버전은 18 그대로이고, 묶음마다 따로 커밋했다. 의심 항목은 먼저 실패하는 테스트로 사실인지 확인한 뒤 고쳤다.

### 66.2 묶음별 내용

| 묶음 | 무엇이 어긋났나 | 고친 방법 |
| --- | --- | --- |
| 1 토큰만 나가던 설정 | 생각 깊이는 비용만 늘고 답변에 쓰이지 않음. 유저 노트 확장은 노트가 비어 있어도 메시지마다 1토큰 | `THINKING_DEPTH_ENABLED`(지금 `false`)로 화면·비용·요청에서 뺌. 확장 비용은 확장을 켜고 500자를 넘을 때만 |
| 2 실제와 다른 문구 | 실제 AI를 켜도 「외부 전송 없음」·「로컬 Mock」, 로그인이 없는데 「로그아웃」, 고정 순위인데 「실시간 랭킹」 | `provider-summary.ts`가 서버 통로의 상태로 글을 만듦. 「19+ 보기 끄기」로 바꾸고 켜져 있을 때만 표시. 랭킹에 「예시 순위」 표시 |
| 3 영어 화면의 한국어 | `t()`를 거치지 않는 문구(성인 인증 오류, 초대 코드 오류, 단축키 설명, 저장 오류 안내, 토큰 기록 출처, 신고 사유, 이용 등급 선택지) | 번역을 거치게 하고 사전에 추가. 한국어 글자에 기대던 판정 두 곳(오류 칸, 삭제 버튼 색)을 값으로 바꿈 |
| 4 저장 복구 | 「원본을 유지했습니다」라고 한 뒤 앱이 처음 상태를 저장. 손상 원본 백업이 다음 백업에 밀려 지워짐. 대표 백업 키가 한 번 쓰이고 고쳐지지 않음 | 안내를 실제 동작에 맞춤. 손상 원본은 보통 백업(3개)과 따로 2개 보관. 대표 백업 키는 이력으로 옮기고 지움 |
| 5 캐릭터 상세 | 「더보기」가 메뉴 없이 신고 창을 엶. 내 캐릭터에 팔로우·신고가 나오고 수정이 없음. 「대화 프로필」이 쓰이지 않음. 편집기의 업데이트 기록이 안 나옴. 시작 관계 수치가 단계 기준과 다름 | 「신고」로 이름 변경. 내 캐릭터는 표시와 「수정」 링크. 대화 프로필 목록을 보여 주고 새 대화에 적용. 업데이트 기록을 앞에 붙임. 수치를 50~52로 |
| 6 보관함과 검색 | 링크 공개가 「비공개」로 보임. 대화 수에 보관한 대화 포함. 가져오기 실패 이유를 안 알려 줌. 왼쪽 목록과 보관함의 검색 규칙이 다름 | 세 가지 공개 범위 표시. 진행 중인 대화만 셈. 이유를 붙임. 왼쪽 목록도 낱말로 나눠 찾음 |
| 7 채팅 | 갈래 삭제의 「하위 버전 N개」가 하나 많음. 상태창이 접혀 있어도 `Alt + ←/→`가 뒤로 가기를 막음. 영어 단기 기억의 머리말이 장기 기억에 남음 | 자신을 빼고 셈. 펼쳐져 있고 턴이 둘 이상일 때만 가로챔. 두 언어의 머리말을 뗌 |
| 8 보상과 초대 | 설정의 비용표가 실제 차감과 다름. 보너스를 받은 사람이 자기 초대 주소를 열면 안내가 틀림. 작품이 없는 제작자는 팔로우 해제가 안 됨 | 비용표를 채팅 등급 비용과 이미지 비용으로. 내 코드를 먼저 판정. 해제는 언제나 되게 |
| 9 문서 | `HANDOFF.md`의 옛 날짜·검증 수치, 뒤에서 끝낸 "남은 일", `.env.example`의 쓰이지 않는 항목과 빠진 항목 | 날짜와 수치를 고치고 끝낸 절을 적음. 쓰이지 않는 항목을 빼고 빠진 세 항목을 추가 |

### 66.3 판단한 것

- 생각 깊이는 지우지 않고 스위치로 껐다. 3단계(실제 AI 품질)에서 실제로 반영하면 `THINKING_DEPTH_ENABLED`만 켜면 된다. 저장해 둔 값은 그대로 두고, 꺼져 있는 동안에는 비용과 요청에 넣지 않는다.
- 로그아웃은 이름만 바꾸지 않고 "19+ 보기가 켜져 있을 때만" 보이게 했다. 꺼져 있으면 누를 이유가 없기 때문이다. 실제 로그아웃은 로그인 단계에서 만든다.
- 「더보기」는 메뉴를 만들지 않고 「신고」로 바꿨다. 넣을 항목이 하나뿐이라 메뉴가 한 번 더 누르게만 만든다.
- 잘못된 저장 데이터를 만나면 저장을 막고 원본을 제자리에 두는 방식(읽기 실패 때와 같은 차단)도 생각했지만 하지 않았다. 차단하면 앱을 다시 쓰려면 초기화 길이 따로 있어야 한다. 대신 원본 백업이 지워지지 않게 하고 안내를 사실대로 고쳤다.
- 설정의 비용표에서 「고급 대화」와 「이미지 다시 생성」은 표에서만 뺐다. `token-policy.ts`의 값과 리듀서 동작(`spend-token`)은 그대로다.
- 왼쪽 목록 검색을 낱말로 나눠도 예전에 찾던 것은 그대로 찾는다(붙여 쓴 검색어는 낱말 하나로 본다). 달라지는 것은 순서가 다르거나 낱말이 제목과 지난 말에 흩어진 경우도 찾는다는 점이다.

### 66.4 남긴 것

- 기본 캐릭터 상세의 고정 소개 글(`character-detail-data.ts`)과 작품 내용은 영어 화면에서도 한국어다(의도한 것). 저장 시점의 언어로 남는 토큰 기록 이름과 환영 알림도 그대로다.
- 스토리 모드 홈의 정렬·필터, 화면 너비를 바꿀 때 자동 배치가 바로 바뀌지 않는 점, 스토리 편집기의 표지 되돌아감, 새 캐릭터를 두 번째로 저장할 때 만든 시각이 바뀌는 점은 이번에 다루지 않았다.
- 쓰이지 않는 파일(예전 로고 두 장, 장면 SVG 네 장, `prototype/`의 테스트)과 `package.json`의 이름(`ui-foundation`)은 그대로 두었다.

### 66.5 검증

- 새 테스트: 단위 `provider-summary`(4), `follow-invite-fixes`(3), `local-storage-gateway`(+3), `character-detail-model`(+3), `list-search`(+1), `chat-features-model`(+1), 부품 `status-panel-keys`(2), `app-provider`(+1), 통합 `chat-cost-settings`(2), `provider-notice`(3), `english-leftovers`(6), `character-detail`(+2), `library`(+1).
- 전체 단위·통합 754개(파일 102개), E2E 132개 통과. 묶음마다 형식 검사, 린트, 영어 사전 검사(0개), 빌드를 함께 돌렸다.
- 화면을 바꾼 곳은 개발 서버에서 확인했다: 답변 길이 조절 창(390px), 메인 랭킹의 예시 표시(390·820·1440px, 820px는 어두운 테마), 캐릭터 상세의 신고 버튼(390px, 820px 어두운 테마). 가로 넘침은 없었다. 내 캐릭터 화면(표시와 수정 링크)은 테스트로만 확인했다.

## 67. 실제 AI 품질 올리기 (다음 작업 3단계)

### 67.1 범위와 결정

2026-10-06 사용자 결정은 "권장대로"다. 이번에 한 것: 지시문 다듬기, 대화 요약과 스탯 변화 판단을 실제 AI로. 하지 않은 것: 추천 답변과 상태창(토큰이 더 들어 결과를 보고 정함), Claude·Gemini·GPT로 하는 확인과 토큰 가격(유료 가입 미승인), 생각 깊이 반영(같은 이유). 확인은 사용자 컴퓨터의 내 컴퓨터 모델(`qwen3-14b-16k`, Ollama, RTX 5070 Ti 16GB)로만 했다. 회사 모델 쪽 코드는 같은 길을 타지만 실제 열쇠로 돌려 보지 않았다. 앱 상태 버전은 18 그대로다.

### 67.2 지시문 다듬기

| 바꾼 것 | 이유 |
| --- | --- |
| 캐릭터의 짧은 이름(`displayName`)을 알려 줌 | 이름이 「새벽 도서관의 리안」처럼 작품 이름이면 모델이 그 전체를 이름으로 씀. 스탯 줄의 이름(「리안 호감도」)과도 맞춤 |
| 「장르와 분위기」에 태그 | 분위기를 맞추는 데 쓰이고 글자 수가 적음 |
| 스토리 등장인물 줄에 성격과 말투 예 | 스토리에는 역할만 가고 인물의 성격이 가지 않았음. 말투 예(첫 대사나 첫 인사)를 넣자 반말·존댓말이 설정대로 나옴 |
| 호칭, 말투 유지, 장면 이어 가기, 되풀이 금지 규칙 | 실제 모델이 「사용자」라고 부르거나 말투가 바뀌거나 같은 표현을 되풀이함 |
| 길이를 글자 수와 문장 수로 함께, 최소 길이도 | 작은 모델은 글자 수를 잘 못 셈 |
| 내 컴퓨터 모델에는 마지막 사용자 말 뒤에 끝머리 지시 | 작은 모델은 앞의 규칙보다 직전 답의 길이와 말투를 따라감. 회사 모델에는 붙이지 않음 |

넣지 않은 것: 플레이 가이드(사용자에게 보여 주는 안내 글이고 기본 문구가 화면 사용법임), 설정집 키워드(제목과 내용만으로 충분).

같은 질문을 여섯 번씩 보내 잰 결과(기본 길이, 350자 지시):

| 경우 | 고치기 전 | 고친 뒤 |
| --- | --- | --- |
| 캐릭터 첫 답 평균 길이 | 107자 | 249자 |
| 캐릭터 둘째 답 평균 길이 | 71자 | 150자 |
| 스토리 평균 길이 | 128자 | 256자 |
| 스토리에서 인물 말투가 설정과 어긋남 | 6/6 | 2/6 |
| 스토리 내레이션이 사용자 행동을 지어냄 | 0/6 | 2/6 |

끝머리 지시가 길이에 가장 크게 들었다(지시문 본문만 고쳤을 때는 128자·95자·178자). 브라우저에서 다섯 턴을 이어 대화했을 때는 답이 298~401자였다(앞의 답이 길면 다음 답도 길어진다). 사용자 행동을 지어내는 일은 답이 길어지면서 생겼고, 끝머리 지시에 다시 넣었지만 남았다. 문장이 어색한 곳도 여전히 있다. 이것은 모델의 한계로 보고 모델 비교에서 다룬다.

### 67.3 보조 통로

답변 통로(`POST /api/chat`)는 글자 조각을 흘려보내고, 보조 통로(`POST /api/chat/assist`)는 답을 끝까지 모아 정리한 뒤 JSON으로 한 번에 돌려준다. 두 통로는 같은 문지기를 쓴다(`src/lib/llm/chat-request.ts`): 실제 AI 스위치, 내 컴퓨터에서 온 요청만, 요청 크기, 1분 20번(두 통로가 함께 셈), 19세 작품은 직접 돌리는 모델 등급만.

| 일 | 보내는 것 | 받는 것 | 실패하면 |
| --- | --- | --- | --- |
| `summary` | 대화방 이름, 이름을 붙인 대화 줄(최근 20줄, 줄마다 800자), 언어 | `{ summary }`(2~3문장, 220자 한도) | 연습용 요약(대화방 이름 + 최근 메시지) |
| `stats` | 번호를 붙일 수치 목록(이름, 인물, 지금 값, 범위, 변화 한도), 이번 사용자 말과 답변 | `{ deltas }`(번호 순서, 한도 안 정수) | 낱말 규칙(`judgeStatsMock`) |

- 모델은 그 대화의 채팅 등급을 그대로 쓴다. 싼 등급으로 따로 돌리지 않은 이유: 19세 작품은 직접 돌리는 모델로만 보내야 하고, 등급마다 열쇠가 있는지가 다르기 때문이다.
- 스탯 판단은 식별자를 보내지 않고 번호로 주고받는다. 모델이 긴 식별자를 그대로 베끼다 틀리는 일을 피하려는 것이다. 답은 `{"1": 3, "2": 0}` 한 줄이고, 울타리(```)나 덧붙인 말, `+3` 표시가 있어도 읽는다.
- 기다리는 시간: 서버 30초(`ASSIST_TIMEOUT_MS`), 브라우저의 스탯 판단 15초(`STAT_JUDGE_TIMEOUT_MS`). 스탯 판단이 끝나야 답변이 마무리되므로 짧게 잡았다.
- 요약과 스탯 판단에는 앱의 토큰을 받지 않는다. 회사 모델에서는 요청이 턴마다 한 번(스탯), 5턴마다 한 번(요약) 더 나가므로 실제 요금이 는다. 토큰 가격을 정할 때 함께 본다.

### 67.4 실제 모델에서 본 것

- 요약: 9줄 대화를 2~3문장으로 맞게 줄였다. 1~1.5초(모델을 처음 올릴 때 15초). 영어 요약은 이름을 로마자로 바꿔 썼고 사실이 조금 어긋난 문장이 하나 있었다.
- 스탯 판단(세 번씩): 다정한 말 → 호감도 +2~+3, 경계심 -1~-2. 무례한 말 → 호감도 -5, 경계심 +5. 평범한 말 → 모두 0. 0.3초.
- 처음 지시문은 무례한 말에 캐릭터가 부드럽게 답하면 호감도를 올렸다. "사용자의 말과 행동을 답한 쪽이 어떻게 받아들였는지로 정한다. 답변의 말투가 부드럽다는 이유로 올리지 않는다"를 넣어 고쳤다(같은 경우 -3).
- 브라우저에서 오픈챗으로 다섯 턴: 턴마다 스탯 판단이 왔고(+5, +3, -2, +3, +5), 5턴에 실제 요약이 요약 메모리로 저장됐다. 턴마다 5~7초.
- 이 확인에서 요약이 연습용으로 저장되는 문제를 찾았다. 화면을 연 뒤 등급을 바꾸면 제어기 복사본의 예전 등급으로 판단했다. 지금 대화방 설정을 넘기게 고쳤다.

### 67.5 오픈챗 모델 후보 (비교는 아직 하지 않음)

조건: MIT 또는 Apache 2.0, 그래픽 메모리 16GB에 올라가는 크기. 내려받기는 프로젝트 주인이 한다.

| 모델 | 조건 | 크기 | 받는 곳 | 알아 둘 점 |
| --- | --- | --- | --- | --- |
| qwen3:14b(지금) | Apache 2.0 | 9GB | Ollama 공식 목록 | 한국어가 군데군데 어색함 |
| mistral-small3.2 | Apache 2.0 | 15GB | Ollama 공식 목록 | 16GB에 빠듯해 느려질 수 있음. 한국어 지원은 문서에서 확인하지 못함 |
| mistral-nemo | Apache 2.0 | 7.1GB | Ollama 공식 목록 | 문서의 지원 언어에 한국어가 없음 |
| Mi:dm 2.0 Base(KT, 11.5B) | MIT | 확인 안 함 | Hugging Face(만든 곳은 Ollama용 파일을 따로 올리지 않음. 다른 사람이 바꿔 올린 파일만 있음) | 한국어 중심 모델. 수위 높은 장면에 답하는지는 모름 |
| Kanana 1.5 8B(카카오) | Apache 2.0 | 확인 안 함 | 위와 같음 | 한국어 중심 모델. 위와 같음 |

`CHAT_MODEL_OPEN`만 바꾸면 모델이 바뀐다. 비교할 때는 `measure-open`과 같은 방식(같은 질문 여섯 번, 길이·말투·사칭·외국어 섞임)으로 재면 된다.

### 67.6 검증

- 새 테스트: 단위 `llm-assist`(10), `stat-judge-context`(1), `llm-server`(+3), 통합 `remote-llm`(+3), `chat-room-features`(+1). 전체 단위·통합 771개(파일 104개), E2E 132개 통과. 묶음마다 형식 검사, 린트, 영어 사전 검사, 빌드를 함께 돌렸다.
- E2E와 단위 테스트는 실제 AI를 끄고 돈다. 실제 모델 확인은 개발 서버(3002)에서 따로 했고 자동 테스트에 들어 있지 않다.

이 문서는 Text-Play 다운로드 기능과 챗봇 웹 서비스의 구조, 제약, 배포 절차가 변경될 때 코드와 함께 갱신해야 한다.
