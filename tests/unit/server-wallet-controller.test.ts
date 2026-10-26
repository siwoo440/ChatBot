import { describe, expect, it } from "vitest"; // 테스트 도구
import { ChatController } from "@/features/chat/chat-controller"; // 채팅 제어
import { createInitialState } from "@/features/core/initial-state"; // 기본 상태
import { MockImageAdapter } from "@/lib/adapters/mock-image-adapter"; // 이미지 대역
import { MockLLMAdapter } from "@/lib/adapters/mock-llm-adapter"; // 대화 대역

describe("서버 지갑 채팅 제어", () => // 검증 묶음
{ // 묶음 시작
    it("서버 지갑 모드는 로컬 차감과 중복 원장을 만들지 않음", async () => // 중복 차감 방지
    { // 검증 시작
        const state = createInitialState(); // 상태 준비
        const llm = Object.assign(new MockLLMAdapter({ delayMs: 0 }), { serverWallet: true }); // 서버 차감 대역
        const controller = new ChatController({ state, conversationId: "conversation-rian", llm, images: new MockImageAdapter() }); // 제어기
        expect(await controller.sendMessage("안녕")).toEqual({ ok: true }); // 응답 완료
        expect(controller.snapshot().wallet).toEqual(state.wallet); // 로컬 추가 차감 없음
    }); // 검증 종료
}); // 묶음 종료
