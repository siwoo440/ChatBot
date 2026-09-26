import { screen, waitFor } from "@testing-library/react"; // 화면 검증 도구
import userEvent from "@testing-library/user-event"; // 사용자 동작 도구
import { describe, expect, it } from "vitest"; // 테스트 도구
import { ChatScreen } from "@/features/chat/ChatScreen"; // 채팅 화면
import type { ChatProgress } from "@/features/chat/chat-controller"; // 진행 상태 타입
import { ChatController } from "@/features/chat/chat-controller"; // 채팅 제어기
import { createInitialState } from "@/features/core/initial-state"; // 초기 상태 생성
import type { LLMAdapter, LLMInput, SummaryInput } from "@/lib/adapters/llm-adapter"; // 대화 어댑터 타입
import { MockImageAdapter } from "@/lib/adapters/mock-image-adapter"; // 이미지 어댑터
import { makeController } from "@/test/chat-fixtures"; // 채팅 제어 생성
import { renderWithApp } from "@/test/render-with-app"; // 앱 렌더 도구

class ControlledLLMAdapter implements LLMAdapter // 제어형 대화 어댑터
{ // 클래스 시작
    private readonly waiting: Promise<void>; // 대기 약속
    private continueReply: () => void = () => undefined; // 재개 함수

    public constructor() // 생성자
    { // 생성자 시작
        this.waiting = new Promise((resolve) => // 대기 약속 생성
        { // 약속 시작
            this.continueReply = resolve; // 재개 함수 저장
        }); // 약속 종료
    } // 생성자 종료

    public continue(): void // 응답 재개
    { // 함수 시작
        this.continueReply(); // 대기 해제
    } // 함수 종료

    public async *streamReply(_input: LLMInput): AsyncIterable<string> // 응답 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        yield "첫 조각"; // 첫 응답 조각
        await this.waiting; // 다음 조각 대기
        yield " 두 번째 조각"; // 둘째 응답 조각
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

class FailingLLMAdapter implements LLMAdapter // 실패 대화 어댑터
{ // 클래스 시작
    public async *streamReply(_input: LLMInput): AsyncIterable<string> // 실패 응답 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        await Promise.resolve(); // 비동기 경계
        throw new Error("테스트 응답 실패"); // 응답 실패 발생
        yield ""; // 생성기 형식 유지
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

class AbortAwareLLMAdapter implements LLMAdapter // 중단 가능 대화 어댑터
{ // 클래스 시작
    public readonly firstChunkReached: Promise<void>; // 첫 조각 도착 약속
    private markFirstChunk: () => void = () => undefined; // 첫 조각 알림

    public constructor() // 생성자
    { // 생성자 시작
        this.firstChunkReached = new Promise((resolve) => // 도착 약속 생성
        { // 약속 시작
            this.markFirstChunk = resolve; // 도착 알림 저장
        }); // 약속 종료
    } // 생성자 종료

    public async *streamReply(_input: LLMInput, signal?: AbortSignal): AsyncIterable<string> // 중단 가능 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        yield "중단 전 조각"; // 첫 응답 조각
        this.markFirstChunk(); // 첫 조각 알림
        await new Promise<void>((resolve, reject) => // 후속 조각 대기
        { // 약속 시작
            const timeout = setTimeout(resolve, 60); // 기본 완료 예약
            signal?.addEventListener("abort", () => // 중단 감지
            { // 감지 시작
                clearTimeout(timeout); // 완료 예약 해제
                reject(new DOMException("응답 중단", "AbortError")); // 중단 오류 반환
            }, { once: true }); // 일회 감지
        }); // 약속 종료
        yield " 중단 후 조각"; // 후속 응답 조각
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

class IgnoringAbortLLMAdapter implements LLMAdapter // 중단 무시 대화 어댑터
{ // 클래스 시작
    public readonly firstChunkReached: Promise<void>; // 첫 조각 도착 약속
    private readonly waiting: Promise<void>; // 후속 조각 대기 약속
    private markFirstChunk: () => void = () => undefined; // 첫 조각 알림
    private continueReply: () => void = () => undefined; // 응답 재개 함수

    public constructor() // 생성자
    { // 생성자 시작
        this.firstChunkReached = new Promise((resolve) => // 도착 약속 생성
        { // 약속 시작
            this.markFirstChunk = resolve; // 도착 알림 저장
        }); // 약속 종료
        this.waiting = new Promise((resolve) => // 대기 약속 생성
        { // 약속 시작
            this.continueReply = resolve; // 재개 함수 저장
        }); // 약속 종료
    } // 생성자 종료

    public continue(): void // 응답 재개
    { // 함수 시작
        this.continueReply(); // 대기 해제
    } // 함수 종료

    public async *streamReply(_input: LLMInput, _signal?: AbortSignal): AsyncIterable<string> // 중단 무시 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        void _signal; // 중단 신호 무시 표시
        yield "무시 전 조각"; // 첫 응답 조각
        this.markFirstChunk(); // 첫 조각 알림
        await this.waiting; // 후속 조각 대기
        yield " 무시 후 조각"; // 후속 응답 조각
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

class RetryLLMAdapter implements LLMAdapter // 재시도 대화 어댑터
{ // 클래스 시작
    private attempt = 0; // 요청 횟수

    public async *streamReply(_input: LLMInput): AsyncIterable<string> // 재시도 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        this.attempt += 1; // 요청 횟수 증가
        if (this.attempt === 1) // 첫 요청 판정
        { // 조건 시작
            throw new Error("첫 요청 실패"); // 첫 요청 실패
        } // 조건 종료
        yield "재시도 성공"; // 재시도 응답
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

class RegenerateLLMAdapter implements LLMAdapter // 다시 생성 대화 어댑터
{ // 클래스 시작
    private attempt = 0; // 요청 횟수

    public async *streamReply(_input: LLMInput): AsyncIterable<string> // 다시 생성 스트림
    { // 함수 시작
        void _input; // 입력 사용 표시
        this.attempt += 1; // 요청 횟수 증가
        yield this.attempt === 1 ? "첫 번째 응답" : "교체된 응답"; // 순서별 응답
    } // 함수 종료

    public async summarizeConversation(_input: SummaryInput): Promise<string> // 대화 요약
    { // 함수 시작
        void _input; // 입력 사용 표시
        return Promise.resolve("테스트 요약"); // 요약 반환
    } // 함수 종료
} // 클래스 종료

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

    it("응답 조각마다 하나의 임시 메시지를 갱신한다", async () => // 진행 상태 검증
    { // 검증 시작
        const controller = makeController({ balance: 100, replyDelayMs: 0 }); // 제어기 생성
        const beforeCount = controller.getMessages().filter((message) => message.role === "assistant").length; // 기존 응답 수
        const progress: ChatProgress[] = []; // 진행 상태 목록
        const result = await controller.sendMessage("스트리밍 확인", (update) => progress.push(update)); // 진행 콜백 전송
        const assistantProgress = progress.filter((update) => update.phase === "assistant"); // 응답 진행 목록
        const messageIds = new Set(assistantProgress.map((update) => update.messageId)); // 응답 식별자 목록
        const contents = assistantProgress.map((update) => update.state.messages.find((message) => message.id === update.messageId)?.content); // 진행 내용 목록
        const finalMessages = controller.getMessages().filter((message) => message.role === "assistant"); // 최종 응답 목록
        expect(result).toEqual({ ok: true }); // 전송 성공 확인
        expect(contents[0]).toBe(""); // 빈 임시 응답 확인
        expect(contents.length).toBeGreaterThan(2); // 여러 조각 확인
        expect(messageIds.size).toBe(1); // 단일 메시지 확인
        expect(finalMessages).toHaveLength(beforeCount + 1); // 응답 한 건 추가 확인
        expect(contents.at(-1)).toBe(finalMessages.at(-1)?.content); // 최종 내용 일치 확인
    }); // 검증 종료

    it("응답이 끝나기 전에 부분 문구를 화면에 표시한다", async () => // 화면 스트리밍 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 생성
        const llm = new ControlledLLMAdapter(); // 제어형 대화 생성
        renderWithApp(<ChatScreen characterId="rian" llm={llm} images={new MockImageAdapter()} />); // 채팅 화면 렌더
        await user.type(screen.getByLabelText("메시지"), "부분 응답 확인"); // 메시지 입력
        await user.click(screen.getByRole("button", { name: "전송" })); // 메시지 전송
        expect(await screen.findByText("첫 조각")).toBeInTheDocument(); // 첫 조각 표시 확인
        expect(screen.getByRole("list", { name: "대화 메시지" })).toHaveAttribute("aria-busy", "true"); // 응답 중 상태 확인
        llm.continue(); // 응답 재개
        expect(await screen.findByText("첫 조각 두 번째 조각")).toBeInTheDocument(); // 최종 응답 확인
        await waitFor(() => expect(screen.getByRole("list", { name: "대화 메시지" })).toHaveAttribute("aria-busy", "false")); // 완료 상태 확인
    }); // 검증 종료

    it("응답 실패 후 입력 잠금과 스트리밍 상태를 해제한다", async () => // 실패 복구 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 생성
        renderWithApp(<ChatScreen characterId="rian" llm={new FailingLLMAdapter()} images={new MockImageAdapter()} />); // 실패 화면 렌더
        await user.type(screen.getByLabelText("메시지"), "실패 응답 확인"); // 메시지 입력
        await user.click(screen.getByRole("button", { name: "전송" })); // 메시지 전송
        expect(await screen.findByRole("status")).toHaveTextContent("응답을 받지 못했습니다. 다시 시도해 주세요."); // 실패 안내 확인
        expect(screen.getByLabelText("메시지")).toBeEnabled(); // 입력 잠금 해제 확인
        expect(screen.getByRole("list", { name: "대화 메시지" })).toHaveAttribute("aria-busy", "false"); // 스트리밍 해제 확인
    }); // 검증 종료

    it("응답 중단 시 후속 조각을 차단하고 부분 응답을 유지한다", async () => // 응답 중단 검증
    { // 검증 시작
        const adapter = new AbortAwareLLMAdapter(); // 중단 가능 어댑터
        const state = createInitialState(); // 초기 상태 생성
        const initialBalance = state.wallet.balance; // 초기 잔액 저장
        const controller = new ChatController({ state, conversationId: "conversation-rian", llm: adapter, images: new MockImageAdapter() }); // 제어기 생성
        const request = controller.sendMessage("중단 대상 메시지"); // 응답 요청
        await adapter.firstChunkReached; // 첫 조각 대기
        const cancelled = controller.cancelReply(); // 응답 중단 시도
        const result = await request; // 중단 결과 대기
        const lastMessage = controller.getMessages().at(-1); // 마지막 메시지 조회
        expect(cancelled).toBe(true); // 중단 요청 확인
        expect(result).toEqual({ ok: false, reason: "cancelled" }); // 중단 결과 확인
        expect(lastMessage?.content).toBe("중단 전 조각"); // 부분 응답 유지 확인
        expect(controller.isBusy()).toBe(false); // 응답 잠금 해제 확인
        expect(controller.snapshot().wallet.balance).toBe(initialBalance - 1); // 대화 비용 유지 확인
    }); // 검증 종료

    it("어댑터가 중단 신호를 무시해도 즉시 잠금을 풀고 후속 조각을 차단한다", async () => // 제어기 중단 보장 검증
    { // 검증 시작
        const adapter = new IgnoringAbortLLMAdapter(); // 중단 무시 어댑터
        const state = createInitialState(); // 초기 상태 생성
        const controller = new ChatController({ state, conversationId: "conversation-rian", llm: adapter, images: new MockImageAdapter() }); // 제어기 생성
        const request = controller.sendMessage("중단 무시 대상"); // 응답 요청
        await adapter.firstChunkReached; // 첫 조각 대기
        controller.cancelReply(); // 응답 중단
        const earlyResult = await Promise.race([request, new Promise<"waiting">((resolve) => setTimeout(() => resolve("waiting"), 20))]); // 즉시 완료 경쟁
        adapter.continue(); // 남은 어댑터 정리
        await request; // 요청 정리 대기
        expect(earlyResult).toEqual({ ok: false, reason: "cancelled" }); // 즉시 중단 결과 확인
        expect(controller.getMessages().at(-1)?.content).toBe("무시 전 조각"); // 후속 조각 차단 확인
        expect(controller.isBusy()).toBe(false); // 응답 잠금 해제 확인
    }); // 검증 종료

    it("실패한 응답을 사용자 메시지 중복 없이 다시 시도한다", async () => // 재시도 화면 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 생성
        renderWithApp(<ChatScreen characterId="rian" llm={new RetryLLMAdapter()} images={new MockImageAdapter()} />); // 재시도 화면 렌더
        await user.type(screen.getByLabelText("메시지"), "재시도 대상 메시지"); // 메시지 입력
        await user.click(screen.getByRole("button", { name: "전송" })); // 첫 요청 전송
        expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument(); // 재시도 버튼 확인
        await user.click(screen.getByRole("button", { name: "다시 시도" })); // 재시도 실행
        expect(await screen.findByText("재시도 성공")).toBeInTheDocument(); // 재시도 응답 확인
        expect(screen.getAllByText("재시도 대상 메시지")).toHaveLength(1); // 사용자 메시지 단일 확인
        expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument(); // 재시도 버튼 해제 확인
    }); // 검증 종료

    it("실패와 재시도 비용을 각각 차감하고 스토리는 성공 시 한 번 반영한다", async () => // 재시도 비용 검증
    { // 검증 시작
        const state = createInitialState(); // 초기 상태 생성
        const initialBalance = state.wallet.balance; // 초기 잔액 저장
        const conversation = state.conversations.find((item) => item.id === "conversation-rian"); // 초기 대화 조회
        const initialRelationship = conversation?.relationshipLevel ?? 0; // 초기 관계 저장
        const controller = new ChatController({ state, conversationId: "conversation-rian", llm: new RetryLLMAdapter(), images: new MockImageAdapter() }); // 재시도 제어기 생성
        await expect(controller.sendMessage("비용 재시도 대상")).rejects.toThrow("첫 요청 실패"); // 첫 요청 실패 확인
        expect(controller.snapshot().wallet.balance).toBe(initialBalance - 1); // 실패 비용 확인
        expect(controller.snapshot().conversations.find((item) => item.id === "conversation-rian")?.relationshipLevel).toBe(initialRelationship); // 실패 관계 유지 확인
        await expect(controller.regenerateLastReply()).resolves.toEqual({ ok: true }); // 재시도 성공 확인
        expect(controller.snapshot().wallet.balance).toBe(initialBalance - 2); // 재시도 비용 확인
        expect(controller.snapshot().conversations.find((item) => item.id === "conversation-rian")?.relationshipLevel).toBe(initialRelationship + 1); // 관계 단일 반영 확인
    }); // 검증 종료

    it("완료된 마지막 응답을 새 메시지 추가 없이 다시 생성한다", async () => // 다시 생성 검증
    { // 검증 시작
        const adapter = new RegenerateLLMAdapter(); // 다시 생성 어댑터
        const state = createInitialState(); // 초기 상태 생성
        const initialBalance = state.wallet.balance; // 초기 잔액 저장
        const controller = new ChatController({ state, conversationId: "conversation-rian", llm: adapter, images: new MockImageAdapter() }); // 제어기 생성
        await controller.sendMessage("다시 생성 대상 메시지"); // 첫 응답 생성
        const afterFirst = controller.getMessages(); // 첫 응답 상태
        const result = await controller.regenerateLastReply(); // 마지막 응답 다시 생성
        const afterRepeat = controller.getMessages(); // 다시 생성 상태
        expect(result).toEqual({ ok: true }); // 다시 생성 성공 확인
        expect(afterRepeat.filter((message) => message.role === "user")).toHaveLength(afterFirst.filter((message) => message.role === "user").length); // 사용자 메시지 수 유지 확인
        expect(afterRepeat.filter((message) => message.role === "assistant")).toHaveLength(afterFirst.filter((message) => message.role === "assistant").length); // 응답 메시지 수 유지 확인
        expect(afterRepeat.at(-1)?.content).toBe("교체된 응답"); // 응답 교체 확인
        expect(controller.snapshot().wallet.balance).toBe(initialBalance - 2); // 두 요청 비용 확인
    }); // 검증 종료

    it("완료된 응답의 다시 생성 버튼으로 화면 메시지를 교체한다", async () => // 다시 생성 화면 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 생성
        renderWithApp(<ChatScreen characterId="rian" llm={new RegenerateLLMAdapter()} images={new MockImageAdapter()} />); // 다시 생성 화면 렌더
        await user.type(screen.getByLabelText("메시지"), "화면 다시 생성 대상"); // 메시지 입력
        await user.click(screen.getByRole("button", { name: "전송" })); // 첫 요청 전송
        expect(await screen.findByText("첫 번째 응답")).toBeInTheDocument(); // 첫 응답 확인
        await user.click(screen.getByRole("button", { name: "다시 생성" })); // 다시 생성 실행
        expect(await screen.findByText("교체된 응답")).toBeInTheDocument(); // 교체 응답 확인
        expect(screen.queryByText("첫 번째 응답")).not.toBeInTheDocument(); // 이전 응답 제거 확인
        expect(screen.getAllByText("화면 다시 생성 대상")).toHaveLength(1); // 사용자 메시지 단일 확인
    }); // 검증 종료

    it("사용자 메시지가 없는 대화에는 다시 생성 버튼을 표시하지 않는다", () => // 무효 버튼 방지 검증
    { // 검증 시작
        renderWithApp(<ChatScreen characterId="sera" llm={new RegenerateLLMAdapter()} images={new MockImageAdapter()} />); // 응답 전용 대화 렌더
        expect(screen.queryByRole("button", { name: "다시 생성" })).not.toBeInTheDocument(); // 다시 생성 버튼 부재 확인
    }); // 검증 종료

    it("화면에서 응답을 중단하고 입력을 다시 활성화한다", async () => // 중단 화면 검증
    { // 검증 시작
        const user = userEvent.setup(); // 사용자 생성
        const adapter = new AbortAwareLLMAdapter(); // 중단 가능 어댑터
        renderWithApp(<ChatScreen characterId="rian" llm={adapter} images={new MockImageAdapter()} />); // 중단 화면 렌더
        await user.type(screen.getByLabelText("메시지"), "화면 중단 대상"); // 메시지 입력
        await user.click(screen.getByRole("button", { name: "전송" })); // 메시지 전송
        await adapter.firstChunkReached; // 첫 조각 대기
        await user.click(screen.getByRole("button", { name: "응답 중단" })); // 응답 중단
        expect(await screen.findByRole("status")).toHaveTextContent("응답을 중단했습니다."); // 중단 안내 확인
        expect(screen.getByText("중단 전 조각")).toBeInTheDocument(); // 부분 응답 유지 확인
        expect(screen.getByLabelText("메시지")).toBeEnabled(); // 입력 활성화 확인
        expect(screen.getByRole("list", { name: "대화 메시지" })).toHaveAttribute("aria-busy", "false"); // 응답 상태 해제 확인
    }); // 검증 종료
}); // 묶음 종료
