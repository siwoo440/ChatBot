import { describe, expect, it } from "vitest"; // 테스트 도구
import { getConversationSummary, getConversationVersion, getVersionMessages } from "@/features/conversation/conversation-versioning"; // 버전 조회 함수
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태 생성
import type { ConversationVersion, Message } from "@/features/core/types"; // 도메인 타입

describe("대화 버전 조회", () => // 조회 묶음
{ // 묶음 시작
    it("요청 버전과 현재 버전을 대화 경계 안에서 조회한다", () => // 버전 경계 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const conversation = state.conversations[0]; // 기준 대화 조회
        const foreignVersion = state.conversationVersions.find((version) => version.conversationId !== conversation.id); // 외부 버전 조회
        expect(getConversationVersion(state, conversation.id, conversation.currentVersionId)?.id).toBe(conversation.currentVersionId); // 요청 버전 확인
        expect(getConversationVersion(state, conversation.id, foreignVersion?.id)?.id).toBe(conversation.currentVersionId); // 현재 버전 복구 확인
        expect(getConversationVersion(state, "missing-conversation", null)).toBeNull(); // 누락 대화 확인
    }); // 검증 종료

    it("현재 버전이 잘못되면 원본 버전으로 복구한다", () => // 원본 복구 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const conversation = state.conversations[0]; // 기준 대화 조회
        const changed = { ...state, conversations: state.conversations.map((item) => item.id === conversation.id ? { ...item, currentVersionId: "missing-version" } : item) }; // 잘못된 현재 버전 생성
        expect(getConversationVersion(changed, conversation.id, "foreign-version")?.ordinal).toBe(1); // 원본 버전 확인
    }); // 검증 종료

    it("선택 버전 메시지만 생성 시각과 식별자 순서로 반환한다", () => // 메시지 조회 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const conversation = state.conversations[0]; // 기준 대화 조회
        const versionId = `${conversation.id}-version-2`; // 추가 버전 식별자
        const version: ConversationVersion = { ...state.conversationVersions[0], id: versionId, parentVersionId: conversation.currentVersionId, forkRootVersionId: conversation.currentVersionId, forkedFromMessageId: state.messages[0].id, ordinal: 2 }; // 추가 버전 생성
        const messages: Message[] = // 추가 메시지 목록
        [ // 목록 시작
            { ...state.messages[0], id: "later", versionId, createdAt: "2026-09-22T08:00:00.000Z" }, // 나중 메시지
            { ...state.messages[0], id: "earlier-b", versionId, createdAt: "2026-09-22T07:00:00.000Z" }, // 같은 시각 뒷순서
            { ...state.messages[0], id: "earlier-a", versionId, createdAt: "2026-09-22T07:00:00.000Z" }, // 같은 시각 앞순서
        ]; // 목록 종료
        const changed = { ...state, conversationVersions: [...state.conversationVersions, version], messages: [...state.messages, ...messages] }; // 버전 상태 생성
        expect(getVersionMessages(changed, conversation.id, versionId).map((message) => message.id)).toEqual(["earlier-b", "earlier-a", "later"]); // 안정 정렬 결과 확인
    }); // 검증 종료

    it("대화 요약이 현재 버전의 진행 상태를 사용한다", () => // 요약 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const conversation = state.conversations[0]; // 기준 대화 조회
        const currentVersion = state.conversationVersions.find((version) => version.id === conversation.currentVersionId); // 현재 버전 조회
        expect(getConversationSummary(state, conversation.id)).toEqual({ versionId: currentVersion?.id, relationshipLevel: currentVersion?.relationshipLevel, relationshipStage: currentVersion?.relationshipStage, emotion: currentVersion?.emotion, currentScene: currentVersion?.currentScene, lastMessage: currentVersion?.lastMessage, updatedAt: currentVersion?.updatedAt }); // 요약 값 확인
    }); // 검증 종료
}); // 묶음 종료
