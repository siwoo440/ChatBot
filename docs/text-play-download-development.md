---
# MATE Text-Play Windows 다운로드 페이지 개발 문서

이 문서는 `codex/text-play-download` 브랜치에 구현된 MATE Text-Play 소개 화면과 Windows 다운로드 확인 화면을 처음 접하는 개발자가 구조, 데이터 흐름, 수정 지점, 테스트 방법, 배포 전 준비 사항까지 한 번에 이해할 수 있도록 정리한 개발 문서다.

확인되지 않은 실제 배포 정보는 추측하지 않는다. 설치 파일, 버전, 용량, 게시일, 코드 서명, 해시, 지원 Windows 버전, 최소 시스템 요구사항은 현재 `확인 필요` 상태다.

---
## 1. 문서 기준

| 항목 | 값 |
| --- | --- |
| 저장소 | `siwoo440/ChatBot` |
| 작업 브랜치 | `codex/text-play-download` |
| 기준 | 이 문서가 포함된 현재 브랜치의 `HEAD` |
| 구현 프레임워크 | Next.js App Router |
| 기본 언어 | TypeScript, React, CSS Modules |
| 현재 배포 상태 | 다운로드 준비 중 |
| 실제 설치 파일 | 없음 또는 확인되지 않음 |
| 다운로드 API | 없음 |
| Tauri 실행 프로그램 | 이번 구현 범위에서 제외 |

---
## 2. 구현 목적

이번 개발의 목적은 기존 Mate Verse Character Chat 웹 앱 안에 Text-Play 제품 소개와 Windows 프로그램 다운로드 확인 흐름을 추가하는 것이다.

사용자는 다음 작업을 할 수 있다.

- 상단 공통 메뉴에서 Text-Play 홈으로 이동
- Text-Play 홈에서 Windows 다운로드 확인 화면으로 이동
- 현재 배포 상태 확인
- 버전, 채널, 파일 형식, 용량, 게시일, 파일명 확인
- 지원 Windows와 최소 시스템 요구사항 확인
- SHA-256과 코드 서명 상태 확인
- 설치 순서와 주요 기능 확인
- FAQ 확인
- 실제 다운로드 URL이 있을 때 설치 파일 다운로드

현재 실제 배포 파일이 없으므로 다운로드 버튼은 의도적으로 비활성화되어 있다.

---
## 3. 구현 범위와 제외 범위

---
### 구현 범위

- `/text-play` 제품 소개 페이지
- `/text-play/download` Windows 다운로드 확인 페이지
- 공통 데스크톱 헤더 메뉴 연결
- 모바일 하단 메뉴 연결
- 정적 배포 설정 모듈
- 다운로드 URL 안전성 검사
- URL 유무에 따른 활성·비활성 동작
- 준비 중, 베타, 정식 배포 상태 표시
- 반응형 레이아웃
- 키보드 포커스와 기본 접근성 처리
- 단위·통합·공통 메뉴 테스트

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

---
## 4. 기술 환경

| 구분 | 패키지 또는 설정 |
| --- | --- |
| 웹 프레임워크 | Next.js `^16.3.5` |
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

기본 개발 서버 주소는 `http://localhost:3000`이다. 포트가 사용 중이면 `npm run dev -- --webpack -p 3010`처럼 다른 포트를 지정할 수 있다.

확인 경로는 다음과 같다.

| 화면 | 기본 주소 |
| --- | --- |
| Text-Play 홈 | `http://localhost:3000/text-play` |
| Windows 다운로드 | `http://localhost:3000/text-play/download` |

---
## 6. 전체 구조

페이지와 데이터의 연결 관계는 다음 순서다.

1. `src/app/layout.tsx`가 모든 화면을 `AppProvider`와 `AppShell`로 감싼다.
2. `AppShell`이 공통 헤더, 대화방 패널, 사용자 패널, 모바일 하단 메뉴를 제공한다.
3. `/text-play`는 `TextPlayHomeScreen`을 렌더링한다.
4. `/text-play/download`는 `TextPlayDownloadScreen`을 렌더링한다.
5. `TextPlayDownloadScreen`은 `release-config.ts`의 단일 설정 객체를 읽는다.
6. `DownloadAction`이 다운로드 URL의 유효성을 검사해 버튼 또는 링크를 출력한다.
7. `TextPlayScreen.module.css`가 Text-Play 두 화면의 공통 디자인과 반응형 동작을 담당한다.

이 구조에서 화면과 배포 데이터가 분리되어 있으므로, 향후 정적 객체를 API 응답으로 교체할 때 화면 전체를 다시 작성하지 않아도 된다.

---
## 7. 라우팅 구조

| URL | 페이지 파일 | 화면 컴포넌트 | 역할 |
| --- | --- | --- | --- |
| `/text-play` | `src/app/text-play/page.tsx` | `TextPlayHomeScreen` | 제품 개요와 핵심 흐름 소개 |
| `/text-play/download` | `src/app/text-play/download/page.tsx` | `TextPlayDownloadScreen` | 배포 정보, 다운로드, 설치, 안전 정보 제공 |
| `/` | 기존 홈 | 기존 Character Chat | 하단 메뉴에서 돌아갈 수 있는 기존 서비스 |

두 App Router 페이지는 각각 `Metadata`를 제공한다.

- Text-Play 홈 제목: `MATE Text-Play | Mate Verse`
- 다운로드 화면 제목: `Text-Play Windows 다운로드 | Mate Verse`
- 각 화면에는 검색 결과와 브라우저 탭에 사용되는 설명이 포함된다.

---
## 8. 이번 커밋의 파일 목록

이번 기능 커밋은 13개 코드·테스트 파일을 추가 또는 수정한다. 이 문서가 추가되면 총 변경 파일 수는 14개가 된다.

---
### 새로 추가된 파일

| 파일 | 역할 |
| --- | --- |
| `src/app/text-play/page.tsx` | Text-Play 홈 라우트와 메타데이터 정의 |
| `src/app/text-play/download/page.tsx` | Windows 다운로드 라우트와 메타데이터 정의 |
| `src/features/text-play/TextPlayHomeScreen.tsx` | 제품 소개와 핵심 사용 흐름 표시 |
| `src/features/text-play/TextPlayDownloadScreen.tsx` | 다운로드 페이지 전체 섹션 구성 |
| `src/features/text-play/DownloadAction.tsx` | URL 상태에 따른 다운로드 버튼·링크 처리 |
| `src/features/text-play/release-config.ts` | 배포 정보 타입, 현재 설정, 검사 및 표시 함수 |
| `src/features/text-play/TextPlayScreen.module.css` | Text-Play 홈·다운로드 화면 스타일과 반응형 규칙 |
| `tests/unit/text-play-release.test.ts` | URL 검사와 다운로드 가능 조건 단위 테스트 |
| `tests/integration/text-play-download.test.tsx` | 두 페이지와 다운로드 상태 통합 테스트 |

---
### 수정된 파일

| 파일 | 변경 내용 |
| --- | --- |
| `src/components/app-shell/AppHeader.tsx` | 데스크톱 헤더에 `Text-Play`, `Windows 다운로드` 링크 추가 |
| `src/components/app-shell/MobileBottomNavigation.tsx` | 모바일 하단 메뉴에 Text-Play 다운로드 링크 추가 |
| `src/components/app-shell/AppShell.module.css` | 추가된 헤더 링크가 태블릿에서 맞도록 761~980px 스타일 보정 |
| `tests/components/app-shell.test.tsx` | 공통 메뉴의 다운로드 경로 연결 검증 추가 |

---
## 9. 파일별 상세 설명

---
### `src/app/text-play/page.tsx`

- Next.js App Router의 서버 페이지
- Text-Play 홈 전용 메타데이터 제공
- 실제 화면 구성은 `TextPlayHomeScreen`에 위임
- 페이지 파일을 얇게 유지해 라우팅과 UI 책임을 분리

---
### `src/app/text-play/download/page.tsx`

- Windows 다운로드 전용 서버 페이지
- 다운로드 화면 제목과 설명 메타데이터 제공
- 실제 화면 구성은 `TextPlayDownloadScreen`에 위임

---
### `src/features/text-play/TextPlayHomeScreen.tsx`

- Text-Play가 어떤 제품인지 설명
- Windows 다운로드 화면으로 이동하는 기본 CTA 제공
- 기존 Character Chat으로 돌아가는 보조 링크 제공
- 작품 다운로드, 선택과 자유 입력, 세이브와 기억의 세 가지 핵심 흐름 제공
- `next/link`와 타입이 지정된 `Route`를 사용

---
### `src/features/text-play/TextPlayDownloadScreen.tsx`

다운로드 페이지의 조립 컴포넌트다. 네트워크 요청이나 배포 판정 로직은 직접 처리하지 않고 설정과 하위 컴포넌트를 조합한다.

화면 섹션은 다음 순서다.

1. 제품 소개와 플랫폼·배포 상태
2. 릴리스 준비 상태 표시
3. 다운로드 메타데이터
4. 지원 Windows와 최소 요구사항
5. 다운로드 동작
6. SHA-256과 코드 서명 상태
7. 설치 순서
8. 주요 기능
9. FAQ
10. 관련 화면 이동과 준비 중 링크

화면 내부의 설치 단계, 기능, FAQ는 읽기 전용 배열로 선언되어 있다. 배포 정보만 `release-config.ts`에서 가져온다.

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

---
### `src/features/text-play/TextPlayScreen.module.css`

Text-Play 홈과 다운로드 페이지가 공유하는 CSS Module이다.

주요 스타일 영역은 다음과 같다.

- 공통 페이지 배경과 최대 너비
- 제품 히어로 영역
- 릴리스 상태 배지
- 런처 형태의 준비 상태 패널
- 배포 메타데이터 카드
- 다운로드 버튼
- 안전 정보 카드
- 설치 순서와 기능 카드
- FAQ `details` 요소
- 하단 이동 메뉴
- Text-Play 홈 전용 CTA와 카드
- 키보드 포커스 표시
- 모션 축소 환경 처리

반응형 기준은 다음과 같다.

| 구간 | 처리 |
| --- | --- |
| 기본 데스크톱 | 히어로 2열, 정보와 기능 다열 배치 |
| 최대 980px | 히어로와 주요 그리드 단순화 |
| 최대 680px | 단일 열 중심 모바일 배치 |
| `prefers-reduced-motion: reduce` | 버튼과 링크 전환 효과 제거 |

---
### `src/components/app-shell/AppHeader.tsx`

기존 공통 헤더에 다음 링크를 추가한다.

- `Text-Play` → `/text-play`
- `Windows 다운로드` → `/text-play/download`

기존 탐색, 내 작품, 로고, 좌우 패널 버튼 동작은 변경하지 않는다.

---
### `src/components/app-shell/MobileBottomNavigation.tsx`

모바일 하단 메뉴에 `Text-Play` 항목을 추가한다. 현재 경로가 `/text-play/download`이면 `aria-current="page"`를 설정한다.

현재 모바일 메뉴의 Text-Play 항목은 제품 홈이 아니라 다운로드 화면으로 직접 연결된다.

---
### `src/components/app-shell/AppShell.module.css`

헤더 메뉴가 네 개로 늘어나면서 태블릿 너비에서 넘치지 않도록 761~980px 구간에 다음 보정이 추가됐다.

- 헤더 간격 축소
- 좌우 여백 축소
- 브랜드 너비 축소
- 메뉴 링크 간격 축소
- 메뉴 버튼 내부 여백과 글자 크기 축소

---
## 10. 배포 설정 데이터

`TextPlayRelease`가 관리하는 필드는 다음과 같다.

| 필드 | 타입 | 의미 | 현재 값 |
| --- | --- | --- | --- |
| `status` | `preparing \| beta \| stable` | 현재 배포 단계 | `preparing` |
| `version` | `string \| null` | 프로그램 버전 | `null` |
| `channel` | `string \| null` | stable, beta 같은 배포 채널 | `null` |
| `downloadUrl` | `string \| null` | 실제 설치 파일 주소 | `null` |
| `fileName` | `string \| null` | 설치 파일명 | `null` |
| `fileType` | `string \| null` | EXE, MSI 등의 파일 형식 | `null` |
| `fileSize` | `string \| null` | 사용자에게 표시할 파일 크기 | `null` |
| `sha256` | `string \| null` | 파일 무결성 검증 해시 | `null` |
| `signatureStatus` | `string \| null` | 코드 서명 상태 | `null` |
| `publishedAt` | `string \| null` | 릴리스 게시일 | `null` |
| `supportedWindows` | `readonly string[]` | 지원 Windows 버전 목록 | `확인 필요` |
| `minimumRequirements` | `readonly string[]` | 최소 시스템 요구사항 목록 | `확인 필요` |

`null` 또는 빈 문자열은 화면에서 `확인 필요`로 표시된다.

---
## 11. 배포 상태 규칙

| 설정 값 | 화면 문구 | 사용 시점 |
| --- | --- | --- |
| `preparing` | 다운로드 준비 중 | 설치 파일 또는 배포 정보가 준비되지 않은 상태 |
| `beta` | 베타 배포 | 제한된 사용자에게 시험 버전을 제공하는 상태 |
| `stable` | 정식 배포 | 정식 설치 파일을 제공하는 상태 |

`beta` 상태에서는 별도의 베타 경고 문구가 표시된다. 단, 버튼 활성화는 상태 문자열이 아니라 유효한 `downloadUrl` 존재 여부로 결정된다.

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

입력 후에는 화면 확인만 하지 말고 단위 테스트, 통합 테스트, 타입 검사, 빌드를 모두 실행해야 한다.

---
## 14. 다운로드 데이터 흐름

다운로드 상태는 다음 흐름으로 결정된다.

1. 개발자가 `textPlayRelease`에 배포 정보를 입력한다.
2. `TextPlayDownloadScreen`이 설정을 읽어 메타데이터와 안전 정보를 출력한다.
3. `DownloadAction`이 `isTextPlayDownloadAvailable`을 호출한다.
4. `isTextPlayDownloadAvailable`이 `isValidDownloadUrl` 결과를 반환한다.
5. URL이 유효하지 않으면 비활성 버튼을 출력한다.
6. URL이 유효하면 직접 다운로드 링크를 출력한다.
7. 사용자가 링크를 선택하면 브라우저가 해당 URL로 다운로드를 요청한다.

현재 별도의 서버 API, DB, 릴리스 서비스 호출은 없다.

---
## 15. 화면 구성 상세

---
### Text-Play 홈

Text-Play 홈은 제품을 처음 접하는 사용자를 위한 짧은 소개 화면이다.

- 브랜드 표제
- 제품 메시지
- Windows 다운로드 확인 링크
- Character Chat 이동 링크
- 작품 다운로드 설명
- 선택지와 자유 입력 설명
- 세이브와 기억 설명

---
### Windows 다운로드 화면

다운로드 화면은 제품 소개보다 배포 상태와 설치 준비 정보에 초점을 맞춘다.

- Windows 전용 프로그램 표시
- 배포 상태 배지
- 릴리스 준비 진행표
- 다운로드 정보 카드
- 지원 환경
- 다운로드 동작
- 파일 안전 정보
- 설치 순서
- 주요 기능
- FAQ
- 관련 메뉴

---
### 준비 중 상태

현재 화면은 실제 URL이 없으므로 다음 요소가 표시된다.

- `다운로드 준비 중` 상태 배지
- 버전 등 미확정 항목의 `확인 필요` 문구
- 비활성 다운로드 버튼
- 실제 URL 등록 후 활성화된다는 설명

색상만으로 상태를 구분하지 않고 텍스트를 함께 제공한다.

---
## 16. 공통 앱과의 연결

Text-Play 화면도 기존 페이지와 동일하게 루트 레이아웃을 사용한다.

`src/app/layout.tsx`의 구조는 다음과 같다.

1. `AppProvider`가 앱 전역 상태와 로컬 저장소를 제공
2. `AppShell`이 공통 헤더와 좌우 패널을 제공
3. 각 Text-Play 페이지가 중앙 콘텐츠로 렌더링

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

- 페이지마다 하나의 주요 `h1`
- 섹션 제목과 `aria-labelledby` 연결
- 배포 정보에 `dl`, `dt`, `dd` 사용
- 설치 순서에 `ol` 사용
- FAQ에 기본 `details`, `summary` 사용
- 비활성 다운로드에 실제 `disabled` 속성 사용
- 준비 중 하단 항목에 `aria-disabled="true"` 사용
- 모바일 현재 메뉴에 `aria-current="page"` 사용
- 키보드 포커스에 명확한 외곽선 표시
- `prefers-reduced-motion` 환경에서 전환 효과 제거

아직 실제 다운로드 링크가 없으므로 활성 링크의 실파일 접근성과 서버 응답은 검증할 수 없다.

---
## 18. 반응형 동작

Text-Play 화면은 CSS만으로 주요 레이아웃을 재배치한다.

---
### 데스크톱

- 상단 히어로 2열 구성
- 배포 정보 3열 카드
- 설치·기능 다열 배치
- 공통 헤더 메뉴 전체 표시

---
### 태블릿

- Text-Play 화면은 최대 980px에서 열 수와 간격 축소
- 앱 셸 헤더는 761~980px에서 브랜드와 메뉴 간격 축소

---
### 모바일

- 최대 680px에서 Text-Play 주요 콘텐츠 단일 열 전환
- 최대 760px에서 공통 데스크톱 메뉴 숨김
- 모바일 하단 메뉴 표시
- 하단 메뉴 높이만큼 콘텐츠 아래 여백 확보

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
### `tests/integration/text-play-download.test.tsx`

다음 사용자 화면 동작을 검증한다.

- 페이지 제목과 Windows 플랫폼 표시
- 미확정 배포 정보 표시
- 다운로드 준비 중 버튼 비활성화
- Text-Play 홈과 Character Chat 링크
- 개인정보처리방침, 이용약관, 고객지원의 준비 중 상태
- Text-Play 홈에서 다운로드 화면 연결
- 사이트 내부 다운로드 링크 활성화
- HTTPS 외부 다운로드 링크 활성화
- 다운로드 실패 대응 안내 문구

---
### `tests/components/app-shell.test.tsx`

기존 앱 셸 테스트에 다음 검증이 추가됐다.

- 공통 헤더에 `Windows 다운로드` 링크 존재
- 링크 경로가 `/text-play/download`인지 확인

---
## 20. 검증 명령

| 검증 | 명령 | 기대 결과 |
| --- | --- | --- |
| 전체 테스트 | `npm run test:run` | 실패 테스트 없음 |
| Text-Play 단위 테스트 | `npx vitest run tests/unit/text-play-release.test.ts` | URL 검사 테스트 통과 |
| Text-Play 통합 테스트 | `npx vitest run tests/integration/text-play-download.test.tsx` | 화면 상태 테스트 통과 |
| 앱 셸 테스트 | `npx vitest run tests/components/app-shell.test.tsx` | 공통 메뉴 테스트 통과 |
| 타입 검사 | `npm run typecheck` | TypeScript 오류 없음 |
| 린트 | `npm run lint` | ESLint 오류 없음 |
| 프로덕션 빌드 | `npm run build` | `/text-play`, `/text-play/download` 경로 생성 |

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
- 페이지 해시와 실제 파일 해시 비교
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
- 준비 중 상태를 beta 또는 stable로 변경
- 베타 경고 확인
- 활성 다운로드 링크 확인
- 모바일·태블릿·데스크톱 확인
- 키보드만으로 전체 조작 확인
- 실제 설치 파일 기준 FAQ 수정
- 프로덕션 빌드 확인

---
## 22. 현재 알려진 제한 사항

1. 실제 다운로드 URL이 없어 버튼이 비활성화되어 있다.
2. 버전, 용량, 게시일, 해시, 서명, 시스템 요구사항이 확정되지 않았다.
3. 개인정보처리방침, 이용약관, 고객지원 링크가 준비 중이다.
4. 실제 Text-Play 프로그램 스크린샷이나 실행 영상이 없다.
5. 별도의 릴리스 노트와 알려진 문제 목록이 없다.
6. 이전 버전 다운로드와 롤백 정책이 없다.
7. 다운로드 실패를 서버 수준에서 감지하지 않는다.
8. 해시는 표시만 하며 브라우저에서 자동 검증하지 않는다.
9. 모바일에서 실제 다운로드 버튼까지 스크롤 거리가 길다.
10. 화면 너비 전환 시 열린 앱 셸 패널을 자동으로 닫지 않는다.

---
## 23. 향후 개선 우선순위

---
### 1순위: 실제 배포 연결

- 설치 파일 등록
- 정확한 배포 메타데이터 입력
- 코드 서명과 SHA-256 확정
- 실제 다운로드 검증

---
### 2순위: 사용자 지원 연결

- 개인정보처리방침
- 이용약관
- 고객지원
- 장애 또는 배포 상태 페이지

---
### 3순위: 제품 이해 개선

- 프로그램 실제 화면 이미지
- 작품 실행 흐름
- 세이브와 장기 기억 화면
- 릴리스 노트
- 알려진 문제

---
### 4순위: 모바일 사용성 개선

- 상단 다운로드 CTA 또는 다운로드 카드 앵커
- 콘텐츠 길이 축소
- 화면 전환 시 패널 자동 닫기
- 주요 배포 정보 우선 배치

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
### `Link` 경로 타입 오류

프로젝트는 `typedRoutes: true`를 사용한다. 정적 분석이 경로를 추론하지 못하는 경우 기존 코드처럼 `Route` 타입을 명시하되, 실제 경로가 App Router에 존재하는지 먼저 확인한다.

---
### `next-env.d.ts`가 개발 서버 실행 후 변경됨

Next.js가 개발·빌드 타입 경로를 자동 생성하면서 파일 내용이 달라질 수 있다. 제품 변경과 관계없는 생성 파일 차이는 커밋 전에 확인한다.

---
## 26. 신규 개발자 작업 순서

1. 이 문서와 `release-config.ts`를 먼저 읽는다.
2. `/text-play`와 `/text-play/download`를 브라우저에서 확인한다.
3. 현재 배포 정보가 실제 값인지 담당자에게 확인한다.
4. 변경하려는 책임이 설정, 화면, 다운로드 동작, 스타일 중 어디에 있는지 구분한다.
5. 기존 테스트를 먼저 실행한다.
6. 동작 변경은 테스트를 먼저 추가하거나 수정한다.
7. 필요한 최소 파일만 변경한다.
8. 타입 검사와 린트를 실행한다.
9. 전체 테스트를 실행한다.
10. 프로덕션 빌드를 실행한다.
11. 모바일·태블릿·데스크톱 화면을 직접 확인한다.
12. 실제 배포 정보 변경이면 해시와 URL을 다시 검증한다.
13. 이 문서의 현재 상태와 제한 사항을 함께 갱신한다.

---
## 27. 완료 기준

개발 단계의 완료 기준은 다음과 같다.

- 두 라우트가 정상 렌더링됨
- 공통 헤더와 모바일 메뉴에서 접근 가능
- URL이 없으면 다운로드 버튼 비활성화
- 유효한 내부 경로나 HTTPS URL이면 다운로드 링크 활성화
- 미확정 정보는 `확인 필요`로 표시
- 베타 상태는 별도 경고 표시
- 키보드 초점 확인 가능
- 반응형 화면에서 가로 넘침 없음
- Text-Play 테스트 통과
- 기존 앱 테스트 회귀 없음
- 타입 검사 통과
- 린트 통과
- 프로덕션 빌드 통과

실제 서비스 배포의 완료 기준은 위 조건에 더해 설치 파일, 코드 서명, SHA-256, 정책 문서, 고객지원, 시스템 요구사항이 모두 확정되어야 한다.

---
## 28. 관련 경로 요약

| 목적 | 경로 |
| --- | --- |
| 제품 홈 | `/text-play` |
| 다운로드 화면 | `/text-play/download` |
| 배포 설정 | `src/features/text-play/release-config.ts` |
| 다운로드 동작 | `src/features/text-play/DownloadAction.tsx` |
| 다운로드 화면 | `src/features/text-play/TextPlayDownloadScreen.tsx` |
| 제품 홈 화면 | `src/features/text-play/TextPlayHomeScreen.tsx` |
| 공통 스타일 | `src/features/text-play/TextPlayScreen.module.css` |
| 단위 테스트 | `tests/unit/text-play-release.test.ts` |
| 통합 테스트 | `tests/integration/text-play-download.test.tsx` |
| 공통 메뉴 테스트 | `tests/components/app-shell.test.tsx` |

이 문서는 Text-Play 다운로드 기능의 구조나 배포 절차가 변경될 때 코드와 함께 갱신해야 한다.
