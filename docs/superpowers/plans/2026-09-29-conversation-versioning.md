---
# 대화 메시지 버전 관리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 과거 사용자 메시지 수정 시 원본을 보존한 독립 대화 버전을 만들고 메시지 아래 전환기로 안전하게 이동·관리한다.

**Architecture:** `Conversation`은 공통 메타데이터만 유지하고 `ConversationVersion`이 메시지 진행 상태와 관계·감정·장면을 소유한다. 기존 데이터는 스키마 7로 변환하며, 수정 응답이 성공했을 때만 버전 스냅샷과 토큰 차감을 원자적으로 반영한다.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest, Testing Library, Playwright, 브라우저 LocalStorage

**Spec:** `docs/superpowers/specs/2026-09-29-conversation-versioning-design.md`

---
## Global Constraints

- 모든 TypeScript와 TSX는 Allman 스타일과 줄별 짧은 한글 명사형 주석을 유지한다.
- 사용자 메시지 최대 길이는 현재 구현에 제한이 없으므로 이번 작업에서 `CHAT_MESSAGE_MAX_LENGTH = 2000`으로 명시하고 작성·수정에 동일 적용한다.
- 같은 분기 지점의 버전은 원본을 포함해 최대 10개다.
- 수정 응답 생성 성공 시에만 채팅 토큰 1개를 차감한다.
- 실패·중단·저장 실패 시 원본 버전과 토큰을 변경하지 않는다.
- 메시지 삭제는 현재 버전에만 적용하고 다른 버전은 보존한다.
- 원본 버전 삭제는 금지하고 수정 버전 삭제 시 하위 버전을 함께 제거한다.
- 스트리밍 중 수정·삭제·버전 전환을 비활성화한다.
- 버전 전환기의 시각적 크기는 작게 유지하고 실제 터치 영역은 최소 44×44픽셀로 구현한다.
- 새 런타임 의존성은 추가하지 않는다.

---
## Review Focus

- 다른 대화·캐릭터의 버전 ID가 주소에 들어오면 해당 대화의 마지막 선택 버전 또는 원본으로 안전하게 복구하는지 Task 6에서 검증한다.
- 같은 분기 지점이 이미 10개일 때 원본·토큰 변경 없이 생성을 거부하는지 Task 3과 Task 4에서 검증한다.
- 삭제 전 백업 저장이 실패하면 메시지·버전 삭제를 실행하지 않는지 Task 5에서 검증한다.
- AI 스트림 실패·중단 시 임시 수정본, 부분 응답, 토큰 차감이 남지 않는지 Task 4에서 검증한다.
- 가져온 데이터에 순환 부모, 외부 대화 버전, 누락 메시지가 있으면 기존 상태를 변경하지 않는지 Task 7에서 검증한다.

---
## 파일 구조

- `src/features/core/types.ts`: 최종 스키마 7 타입과 버전 엔터티
- `src/features/conversation/conversation-versioning.ts`: 버전 조회·분기·삭제 순수 도메인 함수
- `src/features/conversation/conversation-export.ts`: 전체 버전 내보내기와 가져오기 검증
- `src/features/chat/chat-controller.ts`: 현재 버전 대화와 원자적 수정 응답 처리
- `src/features/chat/MessageList.tsx`: 메시지 목록 조정
- `src/features/chat/MessageItem.tsx`: 복사·수정·삭제와 버전 전환 UI
- `src/features/chat/MessageList.module.css`: 메시지 동작·전환기 반응형 스타일
- `src/features/chat/ChatScreen.tsx`: URL, 편집, 확인창, 백업 흐름 조정
- `src/features/core/app-reducer.ts`: 버전 선택·삭제와 연결 데이터 정리
- `src/lib/repositories/local-storage-gateway.ts`: 스키마 6→7 변환, 백업 사유, 가져오기 검증
- `src/features/character/character-detail-model.ts`: 새 대화의 원본 버전 생성
- `src/features/library/LibraryScreen.tsx`: 마지막 선택 버전 요약과 버전 포함 파일 왕복
- `src/components/app-shell/ConversationPanel.tsx`: 현재 버전의 최근 메시지 표시

---
### Task 1: 스키마 7과 기존 데이터 마이그레이션

**Files:**

- Modify: `src/features/core/types.ts`
- Modify: `src/features/core/initial-state.ts`
- Modify: `src/mocks/fixtures.ts`
- Modify: `src/features/character/character-detail-model.ts`
- Modify: `src/lib/repositories/local-storage-gateway.ts`
- Modify: `tests/unit/local-storage-gateway.test.ts`
- Modify: `tests/unit/fixtures.test.ts`
- Modify: `tests/unit/character-detail-model.test.ts`

**Interfaces:**

- Produces: `ConversationVersion`, `Conversation.currentVersionId`, `Message.versionId`, `Message.sourceMessageId`, `AppState.conversationVersions`, 스키마 버전 7
- Produces: `migrateVersionSix(value: Record<string, unknown>): AppState | null`
- Consumes: 기존 스키마 6 `Conversation`, `Message`, `AppState`

- [ ] **Step 1: 스키마 6 변환 실패 테스트 작성**

```ts
it("스키마 6 대화마다 원본 버전과 연결 메시지를 만든다", () => // 변환 검증
{ // 검증 시작
    expect(result.state.schemaVersion).toBe(7); // 버전 확인
    expect(result.state.conversationVersions).toHaveLength(result.state.conversations.length); // 원본 버전 확인
    expect(result.state.messages.every((message) => message.versionId.length > 0)).toBe(true); // 메시지 연결 확인
}); // 검증 종료
```

기존 대화에 메시지가 없거나 연결 캐릭터가 누락된 입력도 비파괴적으로 거부하는 테스트를 추가한다.

- [ ] **Step 2: 대상 테스트가 스키마 7 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/local-storage-gateway.test.ts tests/unit/fixtures.test.ts tests/unit/character-detail-model.test.ts`

Expected: `ConversationVersion`, `versionId` 또는 스키마 7 기대값 불일치로 FAIL

- [ ] **Step 3: 타입과 마이그레이션 최소 구현**

`ConversationVersion`에 `id`, `conversationId`, `parentVersionId`, `forkRootVersionId`, `forkedFromMessageId`, `ordinal`, 관계 수치·단계, 감정, 장면, 최근 메시지, 생성·수정 시각을 정의한다. 원본 버전은 세 분기 필드가 `null`이고 `ordinal`은 1이다.

이 단계에서는 안전한 전환을 위해 기존 `Conversation`의 버전 소유 필드를 유지한다. 새 대화 생성과 Mock fixture는 원본 버전, 현재 버전 ID, 버전 연결 메시지를 동시에 만든다. 스키마 6 입력은 기존 대화 상태를 원본 버전에 복사하고 기존 메시지에 원본 버전 ID를 지정한다.

- [ ] **Step 4: 변환과 기존 회귀 테스트 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/local-storage-gateway.test.ts tests/unit/fixtures.test.ts tests/unit/character-detail-model.test.ts`

Expected: PASS

- [ ] **Step 5: 커밋**

Run: `git add src/features/core/types.ts src/features/core/initial-state.ts src/mocks/fixtures.ts src/features/character/character-detail-model.ts src/lib/repositories/local-storage-gateway.ts tests/unit/local-storage-gateway.test.ts tests/unit/fixtures.test.ts tests/unit/character-detail-model.test.ts`

Run: `git commit -m "feat: add conversation version schema"`

---
### Task 2: 버전 중심 런타임과 조회 경계

**Files:**

- Create: `src/features/conversation/conversation-versioning.ts`
- Create: `tests/unit/conversation-versioning.test.ts`
- Modify: `src/features/core/types.ts`
- Modify: `src/features/chat/chat-controller.ts`
- Modify: `src/lib/adapters/llm-adapter.ts`
- Modify: `src/lib/adapters/mock-llm-adapter.ts`
- Modify: `src/lib/story/story-engine.ts`
- Modify: `src/features/chat/ChatScreen.tsx`
- Modify: `src/features/library/LibraryScreen.tsx`
- Modify: `src/components/app-shell/ConversationPanel.tsx`
- Modify: `tests/integration/chat-flow.test.tsx`
- Modify: `tests/unit/mock-adapters.test.ts`
- Modify: `tests/unit/story-engine.test.ts`

**Interfaces:**

- Produces: `getConversationVersion(state: AppState, conversationId: string, requestedVersionId?: string | null): ConversationVersion | null`
- Produces: `getVersionMessages(state: AppState, conversationId: string, versionId: string): Message[]`
- Produces: `getConversationSummary(state: AppState, conversationId: string): ConversationSummary | null`
- Produces: `ConversationSummary` 필드 `versionId`, `relationshipLevel`, `relationshipStage`, `emotion`, `currentScene`, `lastMessage`, `updatedAt`
- Produces: `LLMInput.version: ConversationVersion`, `StoryInput.version: ConversationVersion`
- Consumes: Task 1의 스키마 7 데이터

- [ ] **Step 1: 유효·누락·교차 대화 버전 조회 테스트 작성**

```ts
it("잘못된 버전 대신 현재 버전과 원본 순서로 복구한다", () => // 복구 검증
{ // 검증 시작
    expect(getConversationVersion(state, conversation.id, "foreign-version")?.id).toBe(conversation.currentVersionId); // 현재 버전 확인
}); // 검증 종료
```

현재 버전 메시지만 시간순으로 반환하고 요약이 현재 버전의 관계·감정·최근 메시지를 사용하는 테스트를 추가한다.

- [ ] **Step 2: 조회 함수 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-versioning.test.ts tests/integration/chat-flow.test.tsx tests/unit/mock-adapters.test.ts tests/unit/story-engine.test.ts`

Expected: 새 조회 함수와 버전 입력 부재로 FAIL

- [ ] **Step 3: 버전 조회 경계와 기존 대화 흐름 이관**

채팅 제어기, LLM 입력, 스토리 판정, 채팅 화면, 보관함과 왼쪽 패널이 `ConversationVersion`을 통해 상태를 읽고 갱신하게 한다. 일반 전송·재생성·장면 생성은 현재 버전에만 메시지와 상태를 반영한다.

모든 소비처 이관 후 `Conversation`에서 관계 수치·단계, 감정, 장면과 최근 메시지를 제거해 중복 상태를 없앤다.

- [ ] **Step 4: 버전 런타임과 타입 검사 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-versioning.test.ts tests/integration/chat-flow.test.tsx tests/unit/mock-adapters.test.ts tests/unit/story-engine.test.ts`

Expected: PASS

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

Expected: exit code 0

- [ ] **Step 5: 커밋**

Run: `git add src/features/conversation/conversation-versioning.ts tests/unit/conversation-versioning.test.ts src/features/core/types.ts src/features/chat/chat-controller.ts src/lib/adapters/llm-adapter.ts src/lib/adapters/mock-llm-adapter.ts src/lib/story/story-engine.ts src/features/chat/ChatScreen.tsx src/features/library/LibraryScreen.tsx src/components/app-shell/ConversationPanel.tsx tests/integration/chat-flow.test.tsx tests/unit/mock-adapters.test.ts tests/unit/story-engine.test.ts`

Run: `git commit -m "refactor: use version state for conversations"`

---
### Task 3: 순수 분기·선택·삭제 도메인

**Files:**

- Modify: `src/features/conversation/conversation-versioning.ts`
- Modify: `src/features/core/app-reducer.ts`
- Modify: `tests/unit/conversation-versioning.test.ts`
- Modify: `tests/unit/app-reducer.test.ts`

**Interfaces:**

- Produces: `CHAT_VERSION_LIMIT = 10`, `CHAT_MESSAGE_MAX_LENGTH = 2000`
- Produces: `getMessageVersionGroup(state: AppState, versionId: string, messageId: string): MessageVersionGroup`
- Produces: `createVersionFork(state: AppState, input: CreateVersionForkInput): VersionForkResult`
- Produces: `removeVersionTree(state: AppState, conversationId: string, versionId: string): VersionDeletionResult`
- Produces: `removeMessageFromVersion(state: AppState, versionId: string, messageId: string): AppState`
- Produces: `MessageVersionGroup` 필드 `rootVersionId`, `sourceMessageId`, `versionIds`, `currentIndex`
- Produces: `CreateVersionForkInput` 필드 `conversationId`, `baseVersionId`, `targetMessageId`, `content`, `assistantMessage`, `versionState`, `now`
- Produces: `VersionForkResult` 필드 `state`, `version`, `messages`, `group`; `VersionDeletionResult` 필드 `state`, `selectedVersionId`, `versionCount`, `messageCount`
- Produces: reducer actions `select-conversation-version`, `apply-conversation-version`, `delete-conversation-version`, `delete-version-message`

- [ ] **Step 1: 분기 불변성과 제한 테스트 작성**

```ts
it("수정 분기는 원본을 유지하고 독립 메시지 스냅샷을 만든다", () => // 분기 검증
{ // 검증 시작
    expect(result.state.messages.filter((message) => message.versionId === base.id)).toEqual(baseMessages); // 원본 유지 확인
    expect(result.version.parentVersionId).toBe(base.id); // 부모 연결 확인
}); // 검증 종료
```

10개 제한, 같은 메시지 반복 수정 그룹, 현재 버전 메시지 삭제 격리, 원본 삭제 거부, 하위 버전 연쇄 삭제를 각각 테스트한다.

- [ ] **Step 2: 도메인 함수와 reducer 액션 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-versioning.test.ts tests/unit/app-reducer.test.ts`

Expected: 새 함수 또는 액션 부재로 FAIL

- [ ] **Step 3: 순수 도메인 함수와 reducer 최소 구현**

분기 그룹은 `forkRootVersionId`와 `forkedFromMessageId`로 계산한다. 첫 수정은 현재 버전을 분기 루트로 사용하고 같은 메시지의 반복 수정은 기존 루트를 유지한다. 모든 상태 변경은 입력 상태를 변경하지 않고 새 상태를 반환한다.

대화·캐릭터 전체 삭제 시 연결 버전도 함께 제거한다. 버전 삭제 결과에는 확인창 표시용 `versionCount`와 `messageCount`를 포함한다.

- [ ] **Step 4: 도메인과 reducer 테스트 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-versioning.test.ts tests/unit/app-reducer.test.ts`

Expected: PASS

- [ ] **Step 5: 커밋**

Run: `git add src/features/conversation/conversation-versioning.ts src/features/core/app-reducer.ts tests/unit/conversation-versioning.test.ts tests/unit/app-reducer.test.ts`

Run: `git commit -m "feat: add conversation version domain actions"`

---
### Task 4: 원자적 메시지 수정과 AI 재생성

**Files:**

- Modify: `src/features/chat/chat-controller.ts`
- Modify: `src/features/chat/ChatComposer.tsx`
- Modify: `tests/integration/chat-flow.test.tsx`
- Modify: `src/test/chat-fixtures.ts`

**Interfaces:**

- Produces: `ChatController.editUserMessage(messageId: string, text: string, onProgress?: ChatProgressHandler): Promise<EditMessageResult>`
- Produces: `EditMessageResult` 실패 사유 `empty`, `unchanged`, `too-long`, `busy`, `cancelled`, `insufficient-token`, `missing-message`, `version-limit`
- Consumes: Task 3의 `createVersionFork`, 길이·버전 제한 상수

- [ ] **Step 1: 성공·실패·중단 원자성 테스트 작성**

```ts
it("수정 응답 성공 뒤에만 새 버전과 토큰 차감을 확정한다", async () => // 원자성 검증
{ // 검증 시작
    expect(result).toEqual({ ok: true, versionId: expect.any(String) }); // 성공 결과 확인
    expect(after.wallet.balance).toBe(before.wallet.balance - 1); // 성공 비용 확인
    expect(after.conversationVersions).toHaveLength(before.conversationVersions.length + 1); // 버전 추가 확인
}); // 검증 종료
```

AI 예외, 사용자 중단, 토큰 부족, 10개 제한, 같은 문장, 2,001자 입력에서 전체 상태가 원본과 같은지 테스트한다. 편집 중 진행 콜백은 임시 상태를 표시하되 실패 후 원본 상태로 되돌아오는지도 검증한다.

- [ ] **Step 2: 편집 메서드 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/chat-flow.test.tsx`

Expected: `editUserMessage` 부재로 FAIL

- [ ] **Step 3: 후보 상태 기반 편집 요청 구현**

요청 시작 상태를 보관하고 후보 스냅샷에서만 수정 메시지와 부분 AI 응답을 만든다. 성공 시 관계 판정, 버전·메시지 추가, 현재 버전 선택과 토큰 차감을 한 번에 확정한다. 예외와 중단은 시작 상태를 복원하며 부분 상태를 저장소에 전달하지 않는다.

일반 작성 입력에도 `CHAT_MESSAGE_MAX_LENGTH`를 적용해 수정과 동일한 제한을 유지한다.

- [ ] **Step 4: 편집 원자성과 기존 채팅 회귀 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/chat-flow.test.tsx`

Expected: PASS

- [ ] **Step 5: 커밋**

Run: `git add src/features/chat/chat-controller.ts src/features/chat/ChatComposer.tsx tests/integration/chat-flow.test.tsx src/test/chat-fixtures.ts`

Run: `git commit -m "feat: add atomic message editing"`

---
### Task 5: 메시지 동작과 버전 전환 UI

**Files:**

- Create: `src/features/chat/MessageItem.tsx`
- Create: `src/features/chat/MessageList.module.css`
- Modify: `src/features/chat/MessageList.tsx`
- Modify: `src/features/chat/ChatScreen.tsx`
- Modify: `src/features/chat/ChatScreen.module.css`
- Modify: `src/features/core/AppProvider.tsx`
- Modify: `src/lib/repositories/local-storage-gateway.ts`
- Modify: `tests/components/app-provider.test.tsx`
- Modify: `tests/integration/chat-flow.test.tsx`
- Modify: `tests/unit/local-storage-gateway.test.ts`

**Interfaces:**

- Produces: `MessageItem`의 복사·인라인 수정·메시지 삭제·`‹ n / m ›` 전환 UI
- Produces: `AppStore.createBackup(reason: BackupReason): boolean`
- Produces: `LocalStorageGateway.createBackupFromState(state: AppState, reason: BackupReason, now?: string): BackupSnapshot`
- Extends: `BackupReason`에 `message-delete`, `version-delete`
- Consumes: Task 3의 그룹 조회·삭제 범위와 Task 4의 편집 메서드

- [ ] **Step 1: 접근성·백업·삭제 차단 테스트 작성**

```tsx
it("버전 전환기를 표시하고 백업 성공 뒤 현재 버전만 삭제한다", async () => // 화면 동작 검증
{ // 검증 시작
    expect(screen.getByLabelText("대화 버전 1/2")).toBeInTheDocument(); // 위치 표시 확인
    expect(events).toEqual(["backup", "save"]); // 백업 순서 확인
}); // 검증 종료
```

클립보드 성공·실패, 공백·동일 문장 편집, 스트리밍 중 비활성화, 백업 실패 시 무삭제, 원본 버전 삭제 버튼 미표시, 하위 버전 삭제 개수 안내를 테스트한다.

- [ ] **Step 2: UI와 백업 API 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/chat-flow.test.tsx tests/components/app-provider.test.tsx tests/unit/local-storage-gateway.test.ts`

Expected: 새 동작과 백업 API 부재로 FAIL

- [ ] **Step 3: 메시지 항목과 안전 삭제 흐름 구현**

`MessageList`에서 개별 표시 책임을 `MessageItem`으로 분리한다. 시각적 전환 버튼과 44픽셀 클릭 영역을 분리하고, 전환 뒤 대응 버튼에 포커스를 유지한다. 삭제는 확인창을 거쳐 백업 성공 시에만 reducer 동작을 실행한다.

클립보드 오류, 검증 오류, 편집 생성 오류는 `role="status"` 또는 `role="alert"`로 알리고 데이터는 변경하지 않는다.

- [ ] **Step 4: UI·백업 테스트와 스타일 검사 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/chat-flow.test.tsx tests/components/app-provider.test.tsx tests/unit/local-storage-gateway.test.ts`

Expected: PASS

Run: `.\node_modules\.bin\eslint.cmd . --ignore-pattern '.worktrees/**'`

Expected: exit code 0

- [ ] **Step 5: 커밋**

Run: `git add src/features/chat/MessageItem.tsx src/features/chat/MessageList.module.css src/features/chat/MessageList.tsx src/features/chat/ChatScreen.tsx src/features/chat/ChatScreen.module.css src/features/core/AppProvider.tsx src/lib/repositories/local-storage-gateway.ts tests/components/app-provider.test.tsx tests/integration/chat-flow.test.tsx tests/unit/local-storage-gateway.test.ts`

Run: `git commit -m "feat: add message version controls"`

---
### Task 6: URL 복원과 대화 목록 요약

**Files:**

- Modify: `src/app/chat/[characterId]/page.tsx`
- Modify: `src/features/chat/ChatScreen.tsx`
- Modify: `src/features/character/character-detail-model.ts`
- Modify: `src/features/library/LibraryScreen.tsx`
- Modify: `src/components/app-shell/ConversationPanel.tsx`
- Modify: `tests/integration/character-detail.test.tsx`
- Modify: `tests/integration/library.test.tsx`
- Modify: `tests/components/app-shell.test.tsx`
- Modify: `tests/integration/chat-flow.test.tsx`

**Interfaces:**

- Produces: 채팅 주소 `/chat/{characterId}?conversation={conversationId}&version={versionId}`
- Produces: `resolveConversationRoute(state: AppState, characterId: string, conversationId?: string, versionId?: string): ConversationRouteSelection`
- Produces: `ConversationRouteSelection` 필드 `conversation`, `version`, `canonicalHref`, `recovered`
- Consumes: Task 2의 버전 조회·요약 함수

- [ ] **Step 1: 주소 검증과 목록 요약 테스트 작성**

```ts
it("다른 캐릭터 버전 주소를 원본 버전으로 복구한다", () => // 주소 복구 검증
{ // 검증 시작
    expect(selection.conversation.characterId).toBe("harin"); // 캐릭터 경계 확인
    expect(selection.version.id).toBe(selection.conversation.currentVersionId); // 안전 버전 확인
}); // 검증 종료
```

새로고침 동일 버전 유지, 보관함 카드 한 개 유지, 마지막 선택 버전 요약과 패널 링크 쿼리 포함을 테스트한다.

- [ ] **Step 2: 새 주소 선택 함수 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/character-detail.test.tsx tests/integration/library.test.tsx tests/components/app-shell.test.tsx tests/integration/chat-flow.test.tsx`

Expected: URL 버전 선택 기대값 불일치로 FAIL

- [ ] **Step 3: 서버 검색 매개변수와 안전 복원 구현**

채팅 페이지가 `searchParams`를 읽어 `ChatScreen`에 초기 대화·버전 ID를 전달한다. 전환 성공 시 `router.replace`로 쿼리를 갱신하고, 누락·교차 참조는 현재 버전 또는 원본으로 정규화한다.

상세 화면, 보관함, 왼쪽 패널은 대화별 마지막 선택 버전의 상태와 쿼리 포함 링크를 사용한다.

- [ ] **Step 4: URL·목록 통합 테스트 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/integration/character-detail.test.tsx tests/integration/library.test.tsx tests/components/app-shell.test.tsx tests/integration/chat-flow.test.tsx`

Expected: PASS

- [ ] **Step 5: 커밋**

Run: `git add src/app/chat/[characterId]/page.tsx src/features/chat/ChatScreen.tsx src/features/character/character-detail-model.ts src/features/library/LibraryScreen.tsx src/components/app-shell/ConversationPanel.tsx tests/integration/character-detail.test.tsx tests/integration/library.test.tsx tests/components/app-shell.test.tsx tests/integration/chat-flow.test.tsx`

Run: `git commit -m "feat: persist selected conversation version"`

---
### Task 7: 전체 버전 내보내기와 안전 가져오기

**Files:**

- Modify: `src/features/conversation/conversation-export.ts`
- Modify: `src/features/library/LibraryScreen.tsx`
- Modify: `src/features/library/LibraryScreen.module.css`
- Modify: `tests/unit/conversation-export.test.ts`
- Modify: `tests/integration/library.test.tsx`

**Interfaces:**

- Produces: `ConversationExport` 스키마 2
- Produces: `createConversationExport(state: AppState, conversationId: string): ConversationExport`
- Produces: `parseConversationExport(raw: string): ConversationExport`
- Produces: `mergeConversationExport(state: AppState, imported: ConversationExport): AppState`
- Produces: `ConversationExport` 필드 `schemaVersion: 2`, `conversation`, `versions`, `messages`, `currentVersionId`
- Consumes: Task 1의 스키마 7 데이터와 Task 3의 분기 불변 조건

- [ ] **Step 1: 전체 왕복과 악성 관계 거부 테스트 작성**

```ts
it("대화의 모든 버전과 메시지를 내보내고 다시 가져온다", () => // 왕복 검증
{ // 검증 시작
    expect(restored.conversationVersions).toEqual(exported.versions); // 버전 왕복 확인
    expect(restored.messages).toEqual(exported.messages); // 메시지 왕복 확인
}); // 검증 종료
```

순환 부모, 다른 대화 ID, 누락 부모·메시지, 원본 버전 부재, 10개 초과 분기, 기존 ID 충돌에서 기존 상태 불변을 테스트한다.

- [ ] **Step 2: 스키마 2 내보내기 함수 부재로 실패하는지 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-export.test.ts tests/integration/library.test.tsx`

Expected: 스키마 2와 검증 함수 부재로 FAIL

- [ ] **Step 3: 직렬화·검증·보관함 가져오기 구현**

내보내기 파일에 대화, 모든 버전, 연결 메시지와 현재 버전 ID를 포함한다. 가져오기 검증이 끝난 뒤에만 상태를 병합하며 ID 충돌은 파일 전체를 새 대화 ID 영역으로 일관되게 재매핑한다.

보관함 대화 탭에 JSON 파일 가져오기 입력과 성공·실패 안내를 추가한다. 실패 시 현재 상태와 저장 데이터는 변경하지 않는다.

- [ ] **Step 4: 왕복과 화면 테스트 확인**

Run: `.\node_modules\.bin\vitest.cmd run tests/unit/conversation-export.test.ts tests/integration/library.test.tsx`

Expected: PASS

- [ ] **Step 5: 커밋**

Run: `git add src/features/conversation/conversation-export.ts src/features/library/LibraryScreen.tsx src/features/library/LibraryScreen.module.css tests/unit/conversation-export.test.ts tests/integration/library.test.tsx`

Run: `git commit -m "feat: export and import conversation versions"`

---
### Task 8: 브라우저 회귀와 완료 검증

**Files:**

- Create: `tests/e2e/conversation-versioning.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `docs/text-play-download-development.md`

**Interfaces:**

- Consumes: Task 1~7의 완성 기능
- Produces: 사용자 관점 버전 수정·전환·삭제·복원 회귀 테스트와 개발 현황 문서

- [ ] **Step 1: 사용자 전체 경로 브라우저 테스트 작성**

```ts
test("메시지를 수정하고 원본과 새 버전을 왕복한 뒤 새로고침한다", async ({ page }) => // 버전 경로 검증
{ // 검증 시작
    await expect(page.getByLabel("대화 버전 2/2")).toBeVisible(); // 새 버전 확인
    await expect(page).toHaveURL(/version=/); // 버전 주소 확인
}); // 검증 종료
```

390픽셀 가로 넘침, 키보드 전환, 스트리밍 중 비활성화, 수정 버전 삭제 후 부모 복귀, 실패 시 토큰·원본 유지, 외부 네트워크 요청 부재를 추가한다.

- [ ] **Step 2: 새 브라우저 테스트가 구현 누락을 잡는지 확인**

Run: 개발 서버를 `127.0.0.1:3000`에서 시작한 뒤 `.\node_modules\.bin\playwright.cmd test tests/e2e/conversation-versioning.spec.ts`

Expected: 누락된 통합 동작이 있으면 FAIL, 모두 구현됐으면 PASS

- [ ] **Step 3: 브라우저 결과 확인과 개발 문서 갱신**

브라우저 테스트가 실패하면 커밋하지 않고 실패를 소유한 Task의 테스트 단계로 돌아가 원인을 수정한다. 통과하면 `docs/text-play-download-development.md`의 메시지 관리 항목을 버전 기능 완료 상태와 검증 결과로 갱신한다.

- [ ] **Step 4: 전체 검증**

Run: `.\node_modules\.bin\eslint.cmd . --ignore-pattern '.worktrees/**'`

Expected: exit code 0

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

Expected: exit code 0

Run: `.\node_modules\.bin\vitest.cmd run`

Expected: 모든 테스트 PASS

Run: `.\node_modules\.bin\next.cmd build --webpack`

Expected: 프로덕션 빌드 성공

Run: 개발 서버를 `127.0.0.1:3000`에서 시작한 뒤 `.\node_modules\.bin\playwright.cmd test`

Expected: 모든 브라우저 테스트 PASS

Run: `git diff --check`

Expected: 출력 없음

- [ ] **Step 5: 커밋**

Run: `git add tests/e2e/conversation-versioning.spec.ts playwright.config.ts docs/text-play-download-development.md`

Run: `git commit -m "test: cover conversation version workflow"`

---
## 완료 후 검토 기준

- `Conversation`에 버전별 관계·감정·장면·최근 메시지 중복 필드가 남지 않는다.
- 모든 메시지는 유효한 대화와 버전에 연결된다.
- 모든 대화에는 정확히 하나의 원본 버전이 존재한다.
- 수정 실패와 중단은 저장 상태와 토큰을 변경하지 않는다.
- 백업 실패는 파괴적 동작을 차단한다.
- URL, 보관함, 내보내기 파일이 같은 현재 버전을 가리킨다.
- 테스트와 제품 코드의 새 줄은 Allman 스타일과 줄별 한글 명사형 주석을 지킨다.
