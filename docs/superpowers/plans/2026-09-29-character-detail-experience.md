# Character Detail Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 캐릭터에 적용되는 프리미엄 상세 페이지, 시작 프리셋, 다중 대화 회차, 로컬 반응, 샘플 랭킹, 연관 캐릭터, 캐릭터별 생성 프롤로그 이미지를 구현한다.

**Architecture:** 기존 React Context와 `AppState`를 상태 기준으로 유지하고, 상세 표시용 정적 프로필과 순수 선택 함수를 UI에서 분리한다. 저장 스키마 6에서 대화 시작 설정과 로컬 반응 상태를 보존하며, 상세 화면은 작은 섹션 컴포넌트로 조합한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, Vitest, Testing Library, Playwright, built-in ImageGen

**Spec:** `docs/superpowers/specs/2026-09-29-character-detail-experience-design.md`

---
## Global Constraints

- 외부 API, 로그인, 결제, 서버 저장소를 추가하지 않는다.
- 신규 npm 의존성을 추가하지 않는다.
- Mock 통계와 랭킹에는 `샘플 데이터` 또는 `샘플 랭킹`을 표시한다.
- 기존 캐릭터 대표 이미지와 저장 데이터는 삭제하거나 덮어쓰지 않는다.
- 저장 스키마는 Local Mock MVP와 공유하는 `6`만 사용한다.
- 캐릭터별 새 회차를 만들어도 기존 대화를 보존한다.
- 생성 래스터 이미지는 `public/images/characters/prologues/`에 저장한다.
- 아이콘과 배지는 ImageGen이 아니라 인라인 SVG 또는 CSS로 작성한다.
- 모든 TypeScript·TSX·CSS 코드 줄에 초보자가 이해할 수 있는 짧은 한글 명사형 주석을 유지한다.
- 390px, 820px, 1440px 화면에서 가로 넘침이 없어야 한다.
- `prefers-reduced-motion` 환경에서 불필요한 전환을 제거한다.

---
## Review Focus

- 손상되거나 일부 필드가 없는 스키마 5 데이터는 원본을 백업하고 데이터 손실 없이 스키마 6 기본값으로 복구되어야 한다. Task 1 마이그레이션 테스트로 고정한다.
- `새 대화 시작`을 빠르게 두 번 눌러도 같은 식별자의 회차가 중복 생성되지 않아야 한다. Task 4 통합 테스트로 고정한다.
- 상세 프로필 또는 프롤로그 이미지가 없는 랭킹 캐릭터도 기본 상세 화면과 대체 이미지를 표시해야 한다. Task 2와 Task 3 테스트로 고정한다.
- 클립보드 API가 없거나 거부될 때 상태를 변경하지 않고 오류 안내를 표시해야 한다. Task 5 통합 테스트로 고정한다.
- 매우 긴 설명과 태그가 있는 캐릭터도 390px 화면에서 가로 넘침 없이 키보드로 모든 주요 동작에 접근할 수 있어야 한다. Task 7 E2E로 고정한다.

---
## File Structure

새 파일:

- `src/features/character/character-detail-data.ts`: 주요 캐릭터 상세 프로필과 기본 프로필 생성
- `src/features/character/character-detail-model.ts`: 연관 캐릭터, 최근 대화, 새 회차 생성 순수 함수
- `src/features/character/CharacterDetail.module.css`: 상세 페이지 전용 반응형 스타일
- `src/features/character/CharacterHero.tsx`: 대표 이미지, 제작자, 배지, 지표, 빠른 동작
- `src/features/character/CharacterStoryInfo.tsx`: 소개, 성격, 세계관, 콘텐츠 안내
- `src/features/character/ConversationSetup.tsx`: 사용자 프로필과 시작 프리셋 선택
- `src/features/character/ProloguePreview.tsx`: 프롤로그 이미지와 첫 대사
- `src/features/character/CharacterDiscoverySections.tsx`: 업데이트, 샘플 랭킹, 연관 캐릭터
- `src/features/character/CharacterActionBar.tsx`: 이어하기와 새 회차 하단 동작
- `tests/unit/character-detail-model.test.ts`: 상세 모델 순수 함수 검증
- `tests/unit/character-detail-assets.test.ts`: 생성 이미지 파일 존재 검증
- `tests/e2e/character-detail.spec.ts`: 상세 페이지 핵심 흐름 검증
- `public/images/characters/prologues/*.png`: 주요 캐릭터 프롤로그 이미지 7개

수정 파일:

- `src/features/core/types.ts`: 스키마 6 상세·대화·반응 타입
- `src/features/core/initial-state.ts`: 스키마 6 기본 상태
- `src/features/core/app-reducer.ts`: 좋아요·팔로우·신고 동작
- `src/lib/repositories/local-storage-gateway.ts`: 스키마 5→6 이전과 검증
- `src/mocks/fixtures.ts`: 상세 프로필과 시작 설정에 필요한 기본값
- `src/features/character/CharacterDetail.tsx`: 섹션 조합과 상태 연결
- `src/features/library/LibraryScreen.tsx`: 캐릭터별 여러 회차 구분
- `src/features/library/LibraryScreen.module.css`: 회차 메타데이터 표시
- `tests/unit/fixtures.test.ts`: 스키마 6 기본값
- `tests/unit/app-reducer.test.ts`: 로컬 반응 상태
- `tests/unit/local-storage-gateway.test.ts`: 스키마 이전
- `tests/integration/character-detail.test.tsx`: 상세 화면과 회차 흐름
- `tests/integration/library.test.tsx`: 여러 회차 보존
- `docs/text-play-download-development.md`: 상세 페이지 구현 상태

---
### Task 1: 스키마 6과 로컬 반응 상태

**Files:**

- Modify: `src/features/core/types.ts`
- Modify: `src/features/core/initial-state.ts`
- Modify: `src/features/core/app-reducer.ts`
- Modify: `src/lib/repositories/local-storage-gateway.ts`
- Modify: `tests/unit/fixtures.test.ts`
- Modify: `tests/unit/app-reducer.test.ts`
- Modify: `tests/unit/local-storage-gateway.test.ts`

**Interfaces:**

- Consumes: 현재 `AppState`, `Conversation`, `LocalStorageGateway`, `appReducer`
- Produces: `AppState` 스키마 6, `ConversationStartSettings`, `CharacterMemory`, `CharacterReport`, `toggle-character-like`, `toggle-creator-follow`, `add-character-report`

- [ ] **Step 1: 스키마 6 실패 테스트 작성**

`tests/unit/fixtures.test.ts`에 초기 상태가 `schemaVersion: 6`, 빈 `memories`, 빈 `likedCharacterIds`, 빈 `followedCreatorIds`, 빈 `localReports`를 갖는지 검증한다.

`tests/unit/local-storage-gateway.test.ts`에 스키마 5 원본을 불러오면 모든 캐릭터·대화·메시지·지갑을 유지하면서 스키마 6 기본값과 대화 시작 설정을 추가하는 테스트를 작성한다. 일부 필드가 손상된 스키마 5 입력은 복구 백업에 보존되는지도 검증한다.

`tests/unit/app-reducer.test.ts`에 존재하는 캐릭터 좋아요, 제작자 팔로우, 신고 1회 추가, 존재하지 않는 캐릭터 동작 무시 테스트를 작성한다.

- [ ] **Step 2: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/unit/fixtures.test.ts tests/unit/app-reducer.test.ts tests/unit/local-storage-gateway.test.ts`

Expected: 스키마 6 필드와 reducer 동작 부재로 FAIL

- [ ] **Step 3: 타입과 이전 구현**

`src/features/core/types.ts`에 다음 정확한 타입을 추가한다.

- `ConversationStartSettings`: `profileId`, `presetId`, `relationshipStage`, `relationshipLevel`, `emotion`, `scene`, `greeting`
- `MemoryCategory`: `summary | event | preference`
- `CharacterMemory`: `id`, `characterId`, `conversationId`, `category`, `content`, `sourceMessageIds`, `editedByUser`, `createdAt`, `updatedAt`
- `ReportReason`: `incorrect-rating | harmful-content | copyright | spam | other`
- `CharacterReport`: `id`, `characterId`, `reason: ReportReason`, `createdAt`

`Conversation`에 `startSettings: ConversationStartSettings`를 추가한다. `AppState`를 `schemaVersion: 6`으로 올리고 `memories`, `likedCharacterIds`, `followedCreatorIds`, `localReports`를 추가한다.

`src/lib/repositories/local-storage-gateway.ts`에 `VersionFiveState`와 `migrateVersionFive(value: Record<string, unknown>): AppState | null`을 추가한다. 기존 0~4 버전은 5를 거쳐 6으로 이전한다.

- [ ] **Step 4: reducer 동작 구현**

`AppAction`에 `toggle-character-like`, `toggle-creator-follow`, `add-character-report`를 추가한다. 존재하는 캐릭터와 제작자만 상태를 변경하고, 신고는 같은 `id`를 중복 저장하지 않는다.

- [ ] **Step 5: 단위 테스트 통과 확인**

Run: `npm run test:run -- tests/unit/fixtures.test.ts tests/unit/app-reducer.test.ts tests/unit/local-storage-gateway.test.ts`

Expected: 대상 테스트 전체 PASS

- [ ] **Step 6: 전체 타입 검사와 커밋**

Run: `npm run typecheck`

Expected: exit 0

Commit: `feat: add character detail state schema`

---
### Task 2: 상세 프로필과 선택 모델

**Files:**

- Create: `src/features/character/character-detail-data.ts`
- Create: `src/features/character/character-detail-model.ts`
- Create: `tests/unit/character-detail-model.test.ts`
- Modify: `src/features/core/types.ts`
- Modify: `src/mocks/fixtures.ts`

**Interfaces:**

- Consumes: `Character`, `Conversation`, `AppState`, 주요 캐릭터 fixture 7명
- Produces: `CharacterDetailProfile`, `CharacterStartPreset`, `CharacterPrologue`, `CharacterReleaseNote`, `getCharacterDetailProfile(character)`, `getRelatedCharacters(character, allCharacters, limit)`, `getLatestActiveConversation(conversations, characterId)`

- [ ] **Step 1: 상세 모델 실패 테스트 작성**

`tests/unit/character-detail-model.test.ts`에 다음 테스트를 작성한다.

- 하린 상세 프로필이 강조색, 콘텐츠 등급, 기본 시작 프리셋, 프롤로그, 업데이트를 반환
- 상세 프로필이 없는 랭킹 캐릭터가 기존 필드로 기본 프로필 생성
- 연관 캐릭터가 자기 자신과 비공개 캐릭터를 제외하고 태그 일치 순으로 최대 8개 반환
- 활성 대화 중 `updatedAt`이 가장 최근인 대화 선택
- 보관 대화만 있을 때 최근 활성 대화 결과가 `null`

- [ ] **Step 2: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/unit/character-detail-model.test.ts`

Expected: 모듈 부재로 FAIL

- [ ] **Step 3: 상세 타입과 정적 데이터 구현**

`src/features/core/types.ts`에 다음 정확한 상세 타입을 추가한다.

- `ContentRating`: `all | teen | mature`
- `CharacterStartPreset`: `id`, `name`, `description`, `relationshipStage`, `relationshipLevel`, `emotion`, `scene`, `greeting`, `prologueId`
- `CharacterPrologue`: `id`, `title`, `description`, `image`, `imageAlt`, `greeting`
- `CharacterReleaseNote`: `version`, `date`, `title`, `changes`
- `CharacterSampleMetrics`: `conversations`, `bookmarks`, `ratings`
- `CharacterDetailProfile`: `characterId`, `accentColor`, `badges`, `contentRating`, `contentWarnings`, `dialogueStyle`, `relationshipSetup`, `startPresets`, `prologues`, `releaseNotes`, `sampleMetrics`, `relatedCharacterIds`

`src/features/character/character-detail-data.ts`에 주요 캐릭터 7명의 상세 프로필을 작성한다. 프롤로그 이미지 경로는 `/images/characters/prologues/<id>-prologue-v1.png`로 고정한다.

상세 데이터가 없는 캐릭터의 기본 프로필은 기존 `summary`, `worldSetting`, `greeting`, `tags`, `popularity`, `coverImage`만 사용하고 확인되지 않은 콘텐츠 경고나 통계를 만들어내지 않는다.

- [ ] **Step 4: 선택 함수 구현**

`getCharacterDetailProfile(character: Character): CharacterDetailProfile`, `getRelatedCharacters(character: Character, allCharacters: Character[], limit = 8): Character[]`, `getLatestActiveConversation(conversations: Conversation[], characterId: string): Conversation | null`을 구현한다.

- [ ] **Step 5: 대상 테스트 통과 확인과 커밋**

Run: `npm run test:run -- tests/unit/character-detail-model.test.ts tests/unit/fixtures.test.ts`

Expected: 대상 테스트 전체 PASS

Commit: `feat: add character detail profiles`

---
### Task 3: 히어로와 스토리 상세 UI

**Files:**

- Create: `src/features/character/CharacterDetail.module.css`
- Create: `src/features/character/CharacterHero.tsx`
- Create: `src/features/character/CharacterStoryInfo.tsx`
- Modify: `src/features/character/CharacterDetail.tsx`
- Modify: `tests/integration/character-detail.test.tsx`

**Interfaces:**

- Consumes: `CharacterDetailProfile`, 기존 보관 상태, Task 2 선택 함수
- Produces: 반응형 히어로, 상세 설명 확장, 콘텐츠 경고, 기본 이미지 대체 화면

- [ ] **Step 1: 화면 실패 테스트 작성**

`tests/integration/character-detail.test.tsx`를 Testing Library 렌더 테스트로 확장한다.

- 하린의 제작자, 이름, 소개, 배지, 콘텐츠 등급, 태그, `샘플 데이터` 표시
- 성격, 세계관, 관계 설정, 대화 스타일, 콘텐츠 주의 사항 표시
- 긴 설명의 `전체 보기`와 `접기` 동작
- 상세 프로필이 없는 캐릭터의 기본 화면
- 프롤로그 이미지 오류 시 대체 화면

- [ ] **Step 2: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/integration/character-detail.test.tsx`

Expected: 새 섹션과 문구 부재로 FAIL

- [ ] **Step 3: 히어로와 상세 컴포넌트 구현**

`CharacterHero`는 대표 이미지, 제작자, 배지, 태그, 샘플 지표, 좋아요·보관·공유·더보기 버튼을 렌더링한다. 각 버튼의 접근성 이름에 캐릭터 이름을 포함한다.

`CharacterStoryInfo`는 설명, 성격, 세계관, 관계 설정, 대화 스타일, 콘텐츠 주의 사항을 렌더링하고 긴 내용만 접는다.

`CharacterDetail.tsx`의 인라인 스타일을 제거하고 전용 CSS Module과 하위 컴포넌트를 조합한다.

- [ ] **Step 4: 반응형 스타일 구현**

데스크톱 2열, 모바일 단일 열, 캐릭터 강조색 CSS 변수, 이미지 기반 배경 흐림, 44px 조작 영역, 초점 표시, 모션 축소를 구현한다. 대표 `next/image`에는 실제 배치에 맞는 반응형 `sizes`를 지정하고 첫 화면 이미지에만 우선 로딩을 적용한다.

- [ ] **Step 5: 대상 테스트와 타입 검사 통과 확인**

Run: `npm run test:run -- tests/integration/character-detail.test.tsx`

Run: `npm run typecheck`

Expected: 두 명령 exit 0

- [ ] **Step 6: 커밋**

Commit: `feat: redesign character detail hero`

---
### Task 4: 시작 프리셋과 다중 대화 회차

**Files:**

- Create: `src/features/character/ConversationSetup.tsx`
- Create: `src/features/character/ProloguePreview.tsx`
- Create: `src/features/character/CharacterActionBar.tsx`
- Modify: `src/features/character/character-detail-model.ts`
- Modify: `src/features/character/CharacterDetail.tsx`
- Modify: `src/features/library/LibraryScreen.tsx`
- Modify: `src/features/library/LibraryScreen.module.css`
- Modify: `tests/unit/character-detail-model.test.ts`
- Modify: `tests/integration/character-detail.test.tsx`
- Modify: `tests/integration/library.test.tsx`

**Interfaces:**

- Consumes: `CharacterStartPreset`, `ConversationStartSettings`, `AppState`, `upsert-conversation`, `select-conversation`
- Produces: `createConversationFromPreset(state, character, profile, presetId, userProfileId, now)`, 이어하기, 새 회차 생성, 보관함 회차 구분

- [ ] **Step 1: 회차 모델 실패 테스트 작성**

`tests/unit/character-detail-model.test.ts`에 `createConversationFromPreset`이 고유 대화 ID, 선택한 시작 설정, 첫 대사, 장면, 현재 시각을 저장하고 기존 대화를 변경하지 않는지 검증한다.

같은 시각에 두 번 호출해도 서로 다른 ID를 반환하는 입력을 사용하고, 잘못된 프리셋 ID는 기본 프리셋으로 복구되는지 검증한다.

- [ ] **Step 2: 화면 흐름 실패 테스트 작성**

`tests/integration/character-detail.test.tsx`에 프리셋 변경 시 프롤로그 제목·설명·첫 대사가 함께 바뀌는 테스트, 최근 대화 이어하기, 새 회차 빠른 이중 클릭 시 하나만 생성되는 테스트를 작성한다.

`tests/integration/library.test.tsx`에 같은 캐릭터의 여러 회차가 각각 제목, 프리셋, 최근 시각과 함께 유지되는 테스트를 작성한다.

- [ ] **Step 3: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/unit/character-detail-model.test.ts tests/integration/character-detail.test.tsx tests/integration/library.test.tsx`

Expected: 프리셋 UI와 다중 회차 함수 부재로 FAIL

- [ ] **Step 4: 회차 생성 함수 구현**

`createConversationFromPreset(state: AppState, character: Character, profile: CharacterDetailProfile, presetId: string, userProfileId: string, now: string): ConversationStartResult`를 구현한다.

식별자는 캐릭터 ID와 ISO 시각을 기본값으로 만들고 같은 식별자가 상태에 있으면 가장 작은 미사용 숫자 접미사를 붙인다. 연속 호출 테스트는 첫 번째 결과 상태를 두 번째 입력으로 사용한다. 함수는 기존 상태를 변경하지 않고 새 대화와 선택 상태가 포함된 복사본을 반환한다.

- [ ] **Step 5: 프리셋·프롤로그·동작 영역 구현**

`ConversationSetup`은 사용자 프로필과 시작 프리셋을 선택한다. `ProloguePreview`는 선택값에 맞는 프롤로그를 지연 로딩 이미지로 표시하고 실제 배치에 맞는 반응형 `sizes`를 지정한다. `CharacterActionBar`는 최근 활성 대화가 있을 때만 `이어하기`를 표시하고 항상 `새 대화 시작`을 제공한다.

이중 클릭 방지는 생성 처리 중 버튼 비활성화로 구현한다.

- [ ] **Step 6: 보관함 회차 표시 구현**

같은 캐릭터의 대화들을 각각 표시하고 프리셋 이름과 갱신 시각으로 구분한다. 기존 이름 변경·보관·내보내기·삭제 동작을 유지한다.

- [ ] **Step 7: 대상 테스트 통과 확인과 커밋**

Run: `npm run test:run -- tests/unit/character-detail-model.test.ts tests/integration/character-detail.test.tsx tests/integration/library.test.tsx`

Expected: 대상 테스트 전체 PASS

Commit: `feat: add character conversation presets`

---
### Task 5: 업데이트·랭킹·연관 캐릭터와 로컬 반응

**Files:**

- Create: `src/features/character/CharacterDiscoverySections.tsx`
- Modify: `src/features/character/CharacterHero.tsx`
- Modify: `src/features/character/CharacterDetail.tsx`
- Modify: `src/features/character/CharacterDetail.module.css`
- Modify: `tests/integration/character-detail.test.tsx`
- Modify: `tests/unit/app-reducer.test.ts`

**Interfaces:**

- Consumes: Task 1 reducer 동작, Task 2 프로필·연관 선택 함수
- Produces: 업데이트 목록, `샘플 랭킹`, 연관 캐릭터 레일, 좋아요·팔로우·공유·신고 동작

- [ ] **Step 1: 보조 섹션 실패 테스트 작성**

`tests/integration/character-detail.test.tsx`에 업데이트 버전·날짜 표시, 샘플 랭킹 탭 변경, 연관 캐릭터 최대 8개, 자기 자신 제외를 검증한다.

좋아요와 제작자 팔로우의 눌림 상태, 공유 성공 상태, 클립보드 API 부재·거부 오류, 신고 대화상자 사유 선택과 저장을 검증한다.

- [ ] **Step 2: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/integration/character-detail.test.tsx tests/unit/app-reducer.test.ts`

Expected: 보조 섹션과 상호작용 부재로 FAIL

- [ ] **Step 3: 보조 섹션 구현**

`CharacterDiscoverySections`에 업데이트 이력, 주간·일간·누적 샘플 랭킹, 연관 캐릭터 가로 레일을 구현한다. 랭킹 제목과 수치 가까이에 Mock 표시를 둔다.

- [ ] **Step 4: 로컬 반응과 오류 상태 구현**

`CharacterHero`에 reducer 기반 좋아요·팔로우·신고와 클립보드 공유를 연결한다. 신고 대화상자는 포커스를 내부에 고정하고 닫은 뒤 원래 버튼으로 복귀시킨다.

- [ ] **Step 5: 대상 테스트와 접근성 검사 통과 확인**

Run: `npm run test:run -- tests/integration/character-detail.test.tsx tests/unit/app-reducer.test.ts`

Run: `npm run lint`

Expected: 두 명령 exit 0

- [ ] **Step 6: 커밋**

Commit: `feat: add character discovery sections`

---
### Task 6: 캐릭터별 프롤로그 이미지 생성

**Files:**

- Create: `public/images/characters/prologues/rian-prologue-v1.png`
- Create: `public/images/characters/prologues/harin-prologue-v1.png`
- Create: `public/images/characters/prologues/sera-prologue-v1.png`
- Create: `public/images/characters/prologues/kyle-prologue-v1.png`
- Create: `public/images/characters/prologues/noah-prologue-v1.png`
- Create: `public/images/characters/prologues/miel-prologue-v1.png`
- Create: `public/images/characters/prologues/yuna-prologue-v1.png`
- Create: `tests/unit/character-detail-assets.test.ts`

**Interfaces:**

- Consumes: 기존 `public/images/characters/<id>.webp` 정체성 기준 이미지, Task 2 프롤로그 경로
- Produces: 검토 완료된 가로형 원본 프롤로그 이미지 7개

- [ ] **Step 1: 자산 실패 테스트 작성**

`tests/unit/character-detail-assets.test.ts`에 주요 캐릭터 7명의 프롤로그 경로가 `public` 아래 실제 파일로 존재하고 파일 크기가 0보다 큰지 검증한다.

- [ ] **Step 2: 대상 테스트 실패 확인**

Run: `npm run test:run -- tests/unit/character-detail-assets.test.ts`

Expected: 생성 이미지 파일 부재로 FAIL

- [ ] **Step 3: ImageGen 기준 이미지 확인**

각 기존 초상을 `view_image`로 원본 확인하고 다음 역할로 지정한다: `Image 1: identity and illustration-style reference`. 편집 대상이 아니라 새 장면 생성의 참고 이미지로 사용한다.

- [ ] **Step 4: built-in ImageGen으로 7개 장면 생성**

각 캐릭터마다 별도 `imagegen` 호출을 사용한다. 공통 제약은 얼굴·머리·의상 정체성과 화풍 유지, 가로형 시네마틱 구도, 중심 안전 영역, 텍스트·로고·워터마크·말풍선·추가 전경 인물 금지다.

개별 장면은 다음과 같이 고정한다.

- 리안: 새벽 직전 기억 도서관, 빛나는 책을 펼치는 장면
- 하린: 비 오는 저녁 골목 카페, 따뜻한 잔을 건네는 장면
- 세라: 빗물이 흐르는 방과 후 교실, 창가에서 책을 펼치는 장면
- 카일: 성간선 관측실, 감정에 반응하는 별자리 지도를 가리키는 장면
- 노아: 보름달 기록관, 투명한 감정 기록 카드를 정리하는 장면
- 미엘: 숲속 유리 온실, 빛나는 약초를 살피는 장면
- 유나: 해 질 무렵 옥상 연습실, 기타를 들고 미완성 노래를 준비하는 장면

- [ ] **Step 5: 결과 검토와 저장소 복사**

각 결과를 원본 크기로 확인해 얼굴, 손, 의상, 배경, 잘림, 워터마크를 검사한다. 부적합한 자산은 한 가지 문제만 수정해 다시 생성한다.

최종 선택본을 `public/images/characters/prologues/<id>-prologue-v1.png`에 복사한다. 프로젝트에서 참조하는 최종본을 `$CODEX_HOME/generated_images`에만 남기지 않는다.

- [ ] **Step 6: 자산 테스트 통과 확인과 커밋**

Run: `npm run test:run -- tests/unit/character-detail-assets.test.ts tests/unit/character-detail-model.test.ts`

Expected: 대상 테스트 전체 PASS

Commit: `feat: add character prologue artwork`

---
### Task 7: E2E·반응형·문서와 최종 검증

**Files:**

- Create: `tests/e2e/character-detail.spec.ts`
- Modify: `docs/text-play-download-development.md`
- Modify: `src/features/character/CharacterDetail.module.css`
- Modify: `src/features/character/CharacterDetail.tsx`
- Modify: `tests/integration/character-detail.test.tsx`

**Interfaces:**

- Consumes: Task 1~6 전체 기능
- Produces: 키보드·반응형·외부 요청 차단 검증과 최신 개발 문서

- [ ] **Step 1: E2E 실패 테스트 작성**

`tests/e2e/character-detail.spec.ts`에 다음 시나리오를 작성한다.

- 홈에서 하린 상세 진입
- 프리셋 선택과 새 회차 시작
- 상세 페이지 복귀 후 최근 대화 이어하기
- 같은 캐릭터의 두 회차가 보관함에 모두 존재
- 390px, 820px, 1440px에서 문서 너비가 화면 너비를 넘지 않음
- 긴 설명과 긴 태그 fixture에서도 가로 넘침 없음
- 키보드만으로 전체 보기, 프리셋 선택, 보관, 공유, 신고, 새 대화 시작 수행
- Mock 모드에서 외부 HTTP·WebSocket 요청이 발생하지 않음

- [ ] **Step 2: E2E 실패 확인**

Run: `npm run test:e2e -- tests/e2e/character-detail.spec.ts`

Expected: 누락된 최종 조정 항목 또는 E2E fixture 부재로 FAIL

- [ ] **Step 3: 반응형·접근성 수정**

실패한 너비와 키보드 흐름만 수정한다. 모바일 하단 동작 영역은 앱 하단 메뉴와 안전 영역을 공유하고 본문 마지막 콘텐츠를 가리지 않도록 패딩을 적용한다.

- [ ] **Step 4: 개발 문서 갱신**

`docs/text-play-download-development.md`에 캐릭터 상세 페이지, 다중 회차, 생성 이미지, Mock 지표의 구현 상태와 제약을 추가한다.

- [ ] **Step 5: 전체 검증 실행**

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm run test:run`

Run: `npm run test:e2e`

Run: `npm run build`

Expected: 모든 명령 exit 0, Vitest 실패 0개, Playwright 실패 0개

- [ ] **Step 6: 최종 변경 범위 확인과 커밋**

Run: `git status --short`

Run: `git diff --check`

Expected: 계획 범위 파일만 변경되고 공백 오류 없음

Commit: `test: verify character detail experience`
