import { describe, expect, it } from "vitest"; // 테스트 도구
import { makeController } from "@/test/chat-fixtures"; // 채팅 제어 생성

describe("채팅 흐름", () => // 채팅 묶음
{ // 묶음 시작
    it("응답 대기 중 두 번째 전송을 거절한다", async () => // 중복 전송 검증
    { // 검증 시작
        const controller = makeController({ balance: 100, replyDelayMs: 20 }); // 제어기 생성
        const first = controller.sendMessage("첫 메시지"); // 첫 전송
        const second = await controller.sendMessage("중복 메시지"); // 중복 전송
        await first; // 첫 응답 대기
        expect(second).toEqual({ ok: false, reason: "busy" }); // 거절 결과
        expect(controller.getMessages().filter((message) => message.role === "user")).toHaveLength(2); // 기존 한 건과 새 한 건
    }); // 검증 종료

    it("토큰 부족 시 어떤 대화 상태도 바꾸지 않는다", async () => // 원자성 검증
    { // 검증 시작
        const controller = makeController({ balance: 0, replyDelayMs: 0 }); // 빈 지갑 제어기
        const before = controller.snapshot(); // 변경 전 상태
        const result = await controller.sendMessage("안녕"); // 전송 시도
        expect(result).toEqual({ ok: false, reason: "insufficient-token" }); // 부족 결과
        expect(controller.snapshot()).toEqual(before); // 전체 상태 불변
    }); // 검증 종료
}); // 묶음 종료
