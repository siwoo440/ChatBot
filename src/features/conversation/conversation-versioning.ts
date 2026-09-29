import type { AppState, ConversationVersion, Message, RelationshipStage } from "@/features/core/types"; // 도메인 타입

export interface ConversationSummary // 대화 요약 구조
{ // 구조 시작
    versionId: string; // 버전 식별자
    relationshipLevel: number; // 관계 수치
    relationshipStage: RelationshipStage; // 관계 단계
    emotion: string; // 현재 감정
    currentScene: string; // 현재 장면
    lastMessage: string; // 최근 메시지
    updatedAt: string; // 수정 시각
} // 구조 종료

export function getConversationVersion(state: AppState, conversationId: string, requestedVersionId?: string | null): ConversationVersion | null // 대화 버전 조회
{ // 함수 시작
    const conversation = state.conversations.find((item) => item.id === conversationId); // 대화 조회
    if (conversation === undefined) // 대화 부재 판정
    { // 조건 시작
        return null; // 빈 버전 반환
    } // 조건 종료
    const versions = state.conversationVersions.filter((version) => version.conversationId === conversationId); // 연결 버전 목록
    const requested = requestedVersionId === null || requestedVersionId === undefined ? undefined : versions.find((version) => version.id === requestedVersionId); // 요청 버전 조회
    if (requested !== undefined) // 요청 버전 존재 판정
    { // 조건 시작
        return requested; // 요청 버전 반환
    } // 조건 종료
    const current = versions.find((version) => version.id === conversation.currentVersionId); // 현재 버전 조회
    if (current !== undefined) // 현재 버전 존재 판정
    { // 조건 시작
        return current; // 현재 버전 반환
    } // 조건 종료
    return versions.sort((left, right) => left.ordinal - right.ordinal || left.id.localeCompare(right.id))[0] ?? null; // 원본 버전 반환
} // 함수 종료

export function getVersionMessages(state: AppState, conversationId: string, versionId: string): Message[] // 버전 메시지 조회
{ // 함수 시작
    return state.messages.filter((message) => message.conversationId === conversationId && message.versionId === versionId).map((message) => ({ ...message })).sort((left, right) => left.createdAt.localeCompare(right.createdAt)); // 시간순 메시지 반환
} // 함수 종료

export function getConversationSummary(state: AppState, conversationId: string): ConversationSummary | null // 대화 요약 조회
{ // 함수 시작
    const version = getConversationVersion(state, conversationId); // 현재 버전 조회
    if (version === null) // 버전 부재 판정
    { // 조건 시작
        return null; // 빈 요약 반환
    } // 조건 종료
    return { versionId: version.id, relationshipLevel: version.relationshipLevel, relationshipStage: version.relationshipStage, emotion: version.emotion, currentScene: version.currentScene, lastMessage: version.lastMessage, updatedAt: version.updatedAt }; // 버전 요약 반환
} // 함수 종료
