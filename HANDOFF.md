---

# ChatBot 개발 인수인계

이 문서는 다른 컴퓨터에서 GitHub `main` 브랜치를 불러와 개발을 바로 이어가기 위한 기준 문서다.

---

## 1. 저장소 기준

- 저장소: `https://github.com/siwoo440/ChatBot.git`
- 기준 브랜치: `main`
- 기능 구현 기준 커밋: `50601dc014b0e251ff55f4baca2952c0b44083af`
- 최신 상태 확인: `git log -1 --oneline`
- 공급자 모드: 외부 API를 사용하지 않는 로컬 Mock
- 데이터 저장 위치: 브라우저 `localStorage`

이 문서가 추가된 이후에는 커밋 해시보다 `origin/main`을 최종 기준으로 사용한다.

---

## 2. 다른 컴퓨터에서 시작하는 순서

Node.js `20.9.0` 이상과 Git이 필요하다.

```powershell
git clone https://github.com/siwoo440/ChatBot.git
cd ChatBot
npm ci
Copy-Item .env.example .env.local
npm run dev
```

개발 서버 기본 주소는 `http://127.0.0.1:3000/`이다.

기존 복제본에서 이어갈 때는 다음 순서를 사용한다.

```powershell
git switch main
git pull --ff-only origin main
npm ci
npm run dev
```

---

## 3. 필수 검증 명령

```powershell
npm run typecheck
npm run lint
npm run test:run
npm run build -- --webpack
```

브라우저 종단 검증이 필요할 때는 Chromium을 설치한 뒤 실행한다.

```powershell
npx playwright install chromium
npm run test:e2e -- --project=chromium --workers=1
```

2026-09-30에 GitHub `main`을 별도 폴더로 새로 복제하여 다음 결과를 확인했다.

- `npm ci`: 성공, 취약점 0건
- TypeScript: 성공
- ESLint: 성공
- Vitest: 테스트 파일 29개, 테스트 208개 통과
- Next.js Webpack 프로덕션 빌드: 성공
- 홈 화면과 하린 상세 화면: HTTP 200

---

## 4. 현재 구현 상태

- 탐색 홈, 캐릭터 상세, 캐릭터 생성·편집
- 캐릭터별 대화 시작과 여러 대화 보관
- Mock 기반 스트리밍 응답, 중단, 재시도, 다시 생성
- 메시지 복사, 수정, 삭제
- 메시지 수정 지점별 대화 버전 생성과 이전·다음 전환
- 대화 버전 URL 복원과 새로고침 유지
- 대화·전체 데이터 JSON 내보내기와 가져오기
- 토큰, 관계, 감정, 장면 상태의 로컬 진행
- 왼쪽·오른쪽 패널 상태 유지와 내부 이동 처리
- 모바일·태블릿·데스크톱 반응형 화면

세부 구현 기록과 남은 작업은 `docs/text-play-download-development.md`의 29번 이후 항목을 기준으로 확인한다.

---

## 5. 로컬 데이터 이전 주의사항

Git에는 소스 코드와 기본 Mock 데이터만 포함된다. 현재 컴퓨터 브라우저에 저장된 사용자 대화, 캐릭터, 토큰 상태는 Git으로 이동하지 않는다.

전체 상태를 옮기는 순서는 다음과 같다.

1. 기존 컴퓨터에서 `설정` 화면 진입
2. 데이터 관리의 `JSON 내보내기` 실행
3. 생성된 `mateverse-data.json` 파일을 새 컴퓨터로 이동
4. 새 컴퓨터의 같은 화면에서 JSON 파일 선택
5. 미리보기 확인 후 `가져오기 확인` 실행

개별 대화만 옮길 때는 `보관함`의 대화별 `내보내기`와 `대화 파일 가져오기`를 사용한다. 비공개 프롬프트와 대화 내용이 포함될 수 있으므로 JSON 파일을 공개 저장소에 커밋하지 않는다.

---

## 6. 다음 개발 우선순위

1. 로컬 대화 요약과 장기 기억 관리 화면
2. 탐색 검색·정렬·복수 필터 개선
3. 캐릭터 편집 단계화와 초안 자동 저장
4. 키보드 포커스와 모바일 패널 접근성 보강
5. 실제 LLM·이미지 공급자 선정 후 어댑터 연결

실제 API 키, 사용자 데이터, 결제 정보는 저장소에 커밋하지 않는다. 외부 공급자가 확정되기 전까지 Mock 흐름과 자동 테스트를 유지한다.

---

## 7. 다음 작업자에게 전달할 핵심

- 새 기능은 현재의 `AppState` 스키마와 `LocalStorageGateway` 마이그레이션 규칙을 함께 갱신한다.
- 대화 버전 수정은 원본 보존, 토큰 원자성, 분기 그래프 무결성을 깨뜨리지 않아야 한다.
- 삭제 기능은 실행 전에 로컬 백업을 만들고 백업 실패 시 변경을 중단한다.
- 코드 변경 뒤 TypeScript, ESLint, Vitest, 프로덕션 빌드를 모두 확인한다.
- UI 변경 뒤 390px, 820px, 1440px 화면과 키보드 탐색을 확인한다.
- 모든 새 코드에는 저장소의 기존 Allman 스타일과 짧은 한글 주석 규칙을 적용한다.

---

## 8. 주요 진입 주소

- 홈: `http://127.0.0.1:3000/`
- 하린 상세: `http://127.0.0.1:3000/characters/harin`
- 보관함: `http://127.0.0.1:3000/library`
- 설정·데이터 관리: `http://127.0.0.1:3000/settings`
- GitHub 커밋: `https://github.com/siwoo440/ChatBot/commits/main/`
