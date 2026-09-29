import { CHAT_VERSION_LIMIT } from "@/features/conversation/conversation-versioning"; // 버전 제한
import type { AppState, Conversation, ConversationVersion, Message } from "@/features/core/types"; // 대화 타입

export interface ConversationExport // 대화 내보내기 구조
{ // 구조 시작
    schemaVersion: 2; // 내보내기 버전
    conversation: Conversation; // 대상 대화
    versions: ConversationVersion[]; // 대화 버전
    messages: Message[]; // 연결 메시지
    currentVersionId: string; // 현재 버전 식별자
} // 구조 종료

function isRecord(value: unknown): value is Record<string, unknown> // 객체 판정
{ // 함수 시작
    return typeof value === "object" && value !== null && !Array.isArray(value); // 객체 여부 반환
} // 함수 종료

function hasString(record: Record<string, unknown>, key: string): boolean // 문자열 필드 판정
{ // 함수 시작
    return typeof record[key] === "string"; // 문자열 여부 반환
} // 함수 종료

function isConversation(value: unknown): value is Conversation // 대화 구조 판정
{ // 함수 시작
    return isRecord(value) && hasString(value, "id") && hasString(value, "characterId") && hasString(value, "userId") && hasString(value, "title") && hasString(value, "currentVersionId") && isRecord(value.startSettings) && (value.archivedAt === null || typeof value.archivedAt === "string") && hasString(value, "createdAt") && hasString(value, "updatedAt"); // 핵심 필드 확인
} // 함수 종료

function isVersion(value: unknown): value is ConversationVersion // 버전 구조 판정
{ // 함수 시작
    return isRecord(value) && hasString(value, "id") && hasString(value, "conversationId") && (value.parentVersionId === null || typeof value.parentVersionId === "string") && (value.forkRootVersionId === null || typeof value.forkRootVersionId === "string") && (value.forkedFromMessageId === null || typeof value.forkedFromMessageId === "string") && typeof value.ordinal === "number" && typeof value.relationshipLevel === "number" && hasString(value, "relationshipStage") && hasString(value, "emotion") && hasString(value, "currentScene") && hasString(value, "lastMessage") && hasString(value, "createdAt") && hasString(value, "updatedAt"); // 핵심 필드 확인
} // 함수 종료

function isMessage(value: unknown): value is Message // 메시지 구조 판정
{ // 함수 시작
    return isRecord(value) && hasString(value, "id") && hasString(value, "conversationId") && hasString(value, "versionId") && (value.sourceMessageId === null || typeof value.sourceMessageId === "string") && (value.role === "user" || value.role === "assistant") && hasString(value, "content") && (value.emotion === null || typeof value.emotion === "string") && (value.sceneEvent === null || typeof value.sceneEvent === "string") && hasString(value, "createdAt"); // 핵심 필드 확인
} // 함수 종료

function assertUnique(values: string[], label: string): void // 식별자 중복 검증
{ // 함수 시작
    if (new Set(values).size !== values.length) // 중복 여부 판정
    { // 조건 시작
        throw new Error(`${label} 식별자가 중복됩니다.`); // 중복 오류
    } // 조건 종료
} // 함수 종료

function assertNoParentCycle(versions: ConversationVersion[]): void // 부모 순환 검증
{ // 함수 시작
    const parentById = new Map(versions.map((version) => [version.id, version.parentVersionId])); // 부모 색인 생성
    versions.forEach((version) => // 버전 순회
    { // 순회 시작
        const visited = new Set<string>(); // 방문 목록 생성
        let currentId: string | null = version.id; // 현재 버전 설정
        while (currentId !== null) // 부모 순회
        { // 반복 시작
            if (visited.has(currentId)) // 재방문 판정
            { // 조건 시작
                throw new Error("대화 버전 부모 관계가 순환합니다."); // 순환 오류
            } // 조건 종료
            visited.add(currentId); // 방문 기록
            currentId = parentById.get(currentId) ?? null; // 다음 부모 이동
        } // 반복 종료
    }); // 순회 종료
} // 함수 종료

function validateConversationExport(value: unknown): asserts value is ConversationExport // 대화 파일 검증
{ // 함수 시작
    if (!isRecord(value) || value.schemaVersion !== 2 || !isConversation(value.conversation) || !Array.isArray(value.versions) || !value.versions.every(isVersion) || !Array.isArray(value.messages) || !value.messages.every(isMessage) || typeof value.currentVersionId !== "string") // 기본 구조 판정
    { // 조건 시작
        throw new Error("지원하지 않는 대화 파일입니다."); // 형식 오류
    } // 조건 종료
    const conversation = value.conversation; // 대화 참조
    const versions = value.versions; // 버전 참조
    const messages = value.messages; // 메시지 참조
    assertUnique(versions.map((version) => version.id), "버전"); // 버전 중복 검증
    assertUnique(messages.map((message) => message.id), "메시지"); // 메시지 중복 검증
    if (versions.length === 0 || versions.some((version) => version.conversationId !== conversation.id) || messages.some((message) => message.conversationId !== conversation.id)) // 대화 연결 판정
    { // 조건 시작
        throw new Error("대화 연결 정보가 올바르지 않습니다."); // 연결 오류
    } // 조건 종료
    const versionIds = new Set(versions.map((version) => version.id)); // 버전 식별자 집합
    if (!versionIds.has(value.currentVersionId) || conversation.currentVersionId !== value.currentVersionId) // 현재 버전 판정
    { // 조건 시작
        throw new Error("현재 대화 버전을 찾을 수 없습니다."); // 현재 버전 오류
    } // 조건 종료
    const roots = versions.filter((version) => version.parentVersionId === null); // 원본 버전 목록
    if (roots.length !== 1) // 원본 개수 판정
    { // 조건 시작
        throw new Error("원본 대화 버전은 하나여야 합니다."); // 원본 오류
    } // 조건 종료
    if (versions.some((version) => version.parentVersionId !== null && !versionIds.has(version.parentVersionId))) // 부모 존재 판정
    { // 조건 시작
        throw new Error("부모 대화 버전을 찾을 수 없습니다."); // 부모 오류
    } // 조건 종료
    if (messages.some((message) => !versionIds.has(message.versionId)) || versions.some((version) => !messages.some((message) => message.versionId === version.id))) // 메시지 연결 판정
    { // 조건 시작
        throw new Error("대화 버전 메시지를 찾을 수 없습니다."); // 메시지 오류
    } // 조건 종료
    const messageReferences = new Set(messages.flatMap((message) => [message.id, ...(message.sourceMessageId === null ? [] : [message.sourceMessageId])])); // 메시지 참조 집합
    if (versions.some((version) => version.forkedFromMessageId !== null && !messageReferences.has(version.forkedFromMessageId))) // 분기 메시지 판정
    { // 조건 시작
        throw new Error("분기 메시지를 찾을 수 없습니다."); // 분기 오류
    } // 조건 종료
    const groupCounts = new Map<string, number>(); // 분기 그룹 개수
    versions.filter((version) => version.forkRootVersionId !== null && version.forkedFromMessageId !== null).forEach((version) => // 수정 버전 순회
    { // 순회 시작
        if (!versionIds.has(version.forkRootVersionId!)) // 분기 원본 판정
        { // 조건 시작
            throw new Error("분기 원본 버전을 찾을 수 없습니다."); // 분기 원본 오류
        } // 조건 종료
        const key = `${version.forkRootVersionId}:${version.forkedFromMessageId}`; // 그룹 키 생성
        groupCounts.set(key, (groupCounts.get(key) ?? 1) + 1); // 원본 포함 개수 증가
    }); // 순회 종료
    if ([...groupCounts.values()].some((count) => count > CHAT_VERSION_LIMIT)) // 분기 제한 판정
    { // 조건 시작
        throw new Error("대화 버전 개수 제한을 초과했습니다."); // 제한 오류
    } // 조건 종료
    assertNoParentCycle(versions); // 부모 순환 검증
} // 함수 종료

export function createConversationExport(state: AppState, conversationId: string): ConversationExport // 대화 내보내기 함수
{ // 함수 시작
    const conversation = state.conversations.find((item) => item.id === conversationId); // 대상 대화 조회
    if (conversation === undefined) // 대화 부재 판정
    { // 조건 시작
        throw new Error("내보낼 대화를 찾을 수 없습니다."); // 대화 오류
    } // 조건 종료
    const versions = state.conversationVersions.filter((version) => version.conversationId === conversation.id); // 연결 버전 조회
    const messages = state.messages.filter((message) => message.conversationId === conversation.id); // 연결 메시지 조회
    const exported: ConversationExport = { schemaVersion: 2, conversation: structuredClone(conversation), versions: structuredClone(versions), messages: structuredClone(messages), currentVersionId: conversation.currentVersionId }; // 내보내기 생성
    validateConversationExport(exported); // 생성 파일 검증
    return exported; // 내보내기 반환
} // 함수 종료

export function parseConversationExport(raw: string): ConversationExport // 대화 파일 해석
{ // 함수 시작
    const value: unknown = JSON.parse(raw); // JSON 해석
    validateConversationExport(value); // 파일 검증
    return structuredClone(value); // 검증 파일 반환
} // 함수 종료

function createImportedConversationId(state: AppState, sourceId: string): string // 가져오기 대화 식별자 생성
{ // 함수 시작
    const usedIds = new Set(state.conversations.map((conversation) => conversation.id)); // 기존 대화 식별자 집합
    let candidate = `${sourceId}-imported`; // 기본 후보 생성
    let suffix = 2; // 접미사 시작값
    while (usedIds.has(candidate)) // 충돌 반복
    { // 반복 시작
        candidate = `${sourceId}-imported-${suffix}`; // 다음 후보 생성
        suffix += 1; // 접미사 증가
    } // 반복 종료
    return candidate; // 고유 식별자 반환
} // 함수 종료

export function mergeConversationExport(state: AppState, imported: ConversationExport): AppState // 대화 파일 병합
{ // 함수 시작
    validateConversationExport(imported); // 병합 전 검증
    const existingConversationIds = new Set(state.conversations.map((conversation) => conversation.id)); // 기존 대화 식별자 집합
    const existingVersionIds = new Set(state.conversationVersions.map((version) => version.id)); // 기존 버전 식별자 집합
    const existingMessageIds = new Set(state.messages.map((message) => message.id)); // 기존 메시지 식별자 집합
    const collision = existingConversationIds.has(imported.conversation.id) || imported.versions.some((version) => existingVersionIds.has(version.id)) || imported.messages.some((message) => existingMessageIds.has(message.id)); // 전체 충돌 판정
    if (!collision) // 충돌 없음 판정
    { // 조건 시작
        return { ...state, conversations: [...state.conversations, structuredClone(imported.conversation)], conversationVersions: [...state.conversationVersions, ...structuredClone(imported.versions)], messages: [...state.messages, ...structuredClone(imported.messages)], selectedConversationId: imported.conversation.id }; // 원본 식별자 병합
    } // 조건 종료
    const conversationId = createImportedConversationId(state, imported.conversation.id); // 새 대화 식별자 생성
    const versionIds = new Map(imported.versions.map((version, index) => [version.id, `${conversationId}-version-${index + 1}`])); // 버전 식별자 대응표
    const messageIds = new Map(imported.messages.map((message, index) => [message.id, `${conversationId}-message-${index + 1}`])); // 메시지 식별자 대응표
    const versions = imported.versions.map((version) => ({ ...version, id: versionIds.get(version.id)!, conversationId, parentVersionId: version.parentVersionId === null ? null : versionIds.get(version.parentVersionId)!, forkRootVersionId: version.forkRootVersionId === null ? null : versionIds.get(version.forkRootVersionId)!, forkedFromMessageId: version.forkedFromMessageId === null ? null : messageIds.get(version.forkedFromMessageId) ?? version.forkedFromMessageId })); // 버전 재매핑
    const messages = imported.messages.map((message) => ({ ...message, id: messageIds.get(message.id)!, conversationId, versionId: versionIds.get(message.versionId)!, sourceMessageId: message.sourceMessageId === null ? null : messageIds.get(message.sourceMessageId) ?? message.sourceMessageId })); // 메시지 재매핑
    const conversation = { ...imported.conversation, id: conversationId, currentVersionId: versionIds.get(imported.currentVersionId)!, title: `${imported.conversation.title} · 가져옴` }; // 대화 재매핑
    return { ...state, conversations: [...state.conversations, conversation], conversationVersions: [...state.conversationVersions, ...versions], messages: [...state.messages, ...messages], selectedConversationId: conversationId }; // 재매핑 상태 반환
} // 함수 종료
