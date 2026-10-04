import { render, screen, within } from "@testing-library/react"; // 화면 조회 도구
import userEvent from "@testing-library/user-event"; // 사용자 동작 도구
import { afterEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { ChatScreen } from "@/features/chat/ChatScreen"; // 채팅 화면
import { TierSelector } from "@/features/chat/TierSelector"; // 등급 선택
import { createDefaultConversationSettings } from "@/features/core/defaults"; // 기본값
import type { LLMAdapter, LLMInput } from "@/lib/adapters/llm-adapter"; // 어댑터 계약
import { MockImageAdapter } from "@/lib/adapters/mock-image-adapter"; // 이미지 어댑터
import { resetModelStatus, type ModelStatus } from "@/lib/adapters/model-status"; // 실제 AI 상태
import { ChatServiceError, RemoteLLMAdapter, toChatRequest } from "@/lib/adapters/remote-llm-adapter"; // 실제 AI 어댑터
import { mockCharacters, mockConversations, mockConversationVersions } from "@/mocks/fixtures"; // Mock 데이터
import { renderWithApp } from "@/test/render-with-app"; // 앱 렌더 도구

vi.mock("next/navigation", () => // 경로 도구 대체
({ // 대체 시작
    usePathname: () => "/chat/rian", // 현재 경로 제공
    useSearchParams: () => new URLSearchParams(), // 검색 매개변수 제공
    useRouter: () => ({ push: () => undefined, replace: () => undefined }), // 이동 함수 제공
})); // 대체 종료

vi.setConfig({ testTimeout: 20_000 }); // 화면이 큰 테스트라 넉넉히 기다림

const encoder = new TextEncoder(); // 글자 변환
const options = { tier: "plus" as const, length: 1 as const, thinking: "off" as const, writingStyle: "default" as const, preventImpersonation: true, persona: null, userNote: "", memories: [], playGuide: "", stats: [], lore: [], examples: [] }; // 응답 조건
const message = (role: "user" | "assistant" | "system", content: string) => ({ id: `m-${content}`, conversationId: mockConversations[0].id, versionId: mockConversationVersions[0].id, sourceMessageId: null, role, content, emotion: null, sceneEvent: null, createdAt: "2026-10-04T00:00:00.000Z" }); // 메시지 생성
const input: LLMInput = { character: mockCharacters[0], conversation: mockConversations[0], version: mockConversationVersions[0], messages: [message("system", "안내"), message("assistant", "어서 와."), message("user", "안녕")], options, contentRating: "all" }; // 대화 입력
const live: ModelStatus = { enabled: true, tiers: { plus: true } }; // 플러스챗만 실제 AI
const practice: LLMAdapter = { async *streamReply() { yield "연습용 답"; }, summarizeConversation: async () => "요약", judgeStats: async () => [] }; // 연습용 AI 대역

function streamed(chunks: string[]): Response // 글자 조각으로 흘러나오는 답
{ // 함수 시작
    return new Response(new ReadableStream<Uint8Array>({ start(controller) { chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk))); controller.close(); } }), { status: 200 }); // 흐름 응답
} // 함수 종료

async function collect(chunks: AsyncIterable<string>): Promise<string> // 흐름 모으기
{ // 함수 시작
    let text = ""; // 누적
    for await (const chunk of chunks) // 조각 순회
    { // 순회 시작
        text += chunk; // 붙임
    } // 순회 종료
    return text; // 전체 반환
} // 함수 종료

afterEach(() => // 테스트 정리
{ // 정리 시작
    vi.unstubAllGlobals(); // 전역 대역 복원
    resetModelStatus(); // 상태 기억 지움
}); // 정리 종료

describe("실제 AI 어댑터", () => // 어댑터 묶음
{ // 묶음 시작
    it("실제 AI를 쓸 수 있는 등급이면 서버 통로로 보내고 흘러나온 답을 그대로 돌려준다", async () => // 실제 AI 검증
    { // 검증 시작
        const fetcher = vi.fn(async () => streamed(["왔구나, ", "소하."])); // 서버 통로 대역
        const adapter = new RemoteLLMAdapter(practice, fetcher as unknown as typeof fetch, async () => live); // 어댑터
        expect(await collect(adapter.streamReply(input))).toBe("왔구나, 소하."); // 실제 답
        const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]; // 보낸 요청
        expect(url).toBe("/api/chat"); // 서버 통로
        expect(init.method).toBe("POST"); // 보내기
        const body = JSON.parse(init.body as string) as ReturnType<typeof toChatRequest>; // 내용
        expect(body.tier).toBe("plus"); // 등급
        expect(body.character.name).toBe(mockCharacters[0].name); // 캐릭터
        expect(body.messages).toEqual([{ role: "assistant", content: "어서 와." }, { role: "user", content: "안녕" }]); // 안내 메시지 제외
        expect(body.story).toBeNull(); // 캐릭터 대화
        expect(JSON.stringify(body)).not.toContain("coverImage"); // 필요한 정보만 보냄
    }); // 검증 종료

    it("열쇠가 없는 등급·19세 작품·서버가 연습용으로 넘긴 경우에는 연습용 AI로 답한다", async () => // 연습용 검증
    { // 검증 시작
        const fetcher = vi.fn(async () => streamed(["실제"])); // 서버 통로 대역
        const adapter = new RemoteLLMAdapter(practice, fetcher as unknown as typeof fetch, async () => live); // 어댑터
        expect(await collect(adapter.streamReply({ ...input, options: { ...options, tier: "basic" } }))).toBe("연습용 답"); // 열쇠 없는 등급
        expect(await collect(adapter.streamReply({ ...input, contentRating: "mature" }))).toBe("연습용 답"); // 19세 작품
        expect(await collect(adapter.streamReply({ ...input, options: undefined }))).toBe("연습용 답"); // 조건 없음
        expect(fetcher).not.toHaveBeenCalled(); // 서버 통로를 부르지 않음
        const noKey = new RemoteLLMAdapter(practice, (async () => Response.json({ error: "no-key" }, { status: 503 })) as unknown as typeof fetch, async () => live); // 서버가 열쇠 없음으로 답함
        expect(await collect(noKey.streamReply(input))).toBe("연습용 답"); // 연습용으로 넘김
        expect(await adapter.summarizeConversation({ conversation: mockConversations[0], version: mockConversationVersions[0], messages: [] })).toBe("요약"); // 요약은 연습용 규칙
    }); // 검증 종료

    it("열쇠가 틀리거나 답이 비면 이유를 담은 오류를 낸다", async () => // 실패 검증
    { // 검증 시작
        const badKey = new RemoteLLMAdapter(practice, (async () => Response.json({ error: "bad-key", detail: "invalid" }, { status: 502 })) as unknown as typeof fetch, async () => live); // 열쇠 거절
        await expect(collect(badKey.streamReply(input))).rejects.toMatchObject({ name: "ChatServiceError", code: "bad-key" }); // 열쇠 문제
        const strange = new RemoteLLMAdapter(practice, (async () => new Response("oops", { status: 500 })) as unknown as typeof fetch, async () => live); // 알 수 없는 실패
        await expect(collect(strange.streamReply(input))).rejects.toMatchObject({ code: "unknown" }); // 알 수 없음
        const empty = new RemoteLLMAdapter(practice, (async () => streamed([])) as unknown as typeof fetch, async () => live); // 빈 답
        await expect(collect(empty.streamReply(input))).rejects.toMatchObject({ code: "provider-error" }); // 다시 시도 안내
    }); // 검증 종료
}); // 묶음 종료

describe("등급 선택 화면", () => // 화면 묶음
{ // 묶음 시작
    it("등급마다 별명과 모델 이름을 보여 주고, 실제 AI를 쓸 수 있는 등급을 표시한다", async () => // 등급 목록 검증
    { // 테스트 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        vi.stubGlobal("fetch", vi.fn(async () => Response.json({ enabled: true, tiers: { master: true, premium: true, plus: true, balance: false, smart: false, basic: false } }))); // 상태 대역(Claude 열쇠만 있음)
        const onSelect = vi.fn(); // 선택 처리
        render(<TierSelector settings={createDefaultConversationSettings()} onSelect={onSelect} onSaveOptions={() => undefined} />); // 선택기 렌더
        await user.click(screen.getByRole("button", { name: "채팅 모델 베이직챗, 메시지당 1 토큰" })); // 목록 열기
        const items = within(screen.getByRole("menu", { name: "채팅 모델 선택" })).getAllByRole("menuitemradio"); // 등급 항목
        expect(items.map((item) => item.querySelector("strong")?.textContent)).toEqual(["마스터챗", "프리미엄챗", "플러스챗", "밸런스챗", "스마트챗", "베이직챗"]); // 여섯 등급
        expect(items[2]).toHaveTextContent("Claude Sonnet"); // 모델 이름
        expect(items[3]).toHaveTextContent("GPT"); // 모델 이름
        expect(items[5]).toHaveTextContent("Gemini Flash"); // 모델 이름
        expect(await within(items[2]).findByText("실제 AI")).toBeInTheDocument(); // 열쇠가 있는 등급
        expect(within(items[5]).getByText("연습용 AI")).toBeInTheDocument(); // 열쇠가 없는 등급
        await user.click(items[0]); // 마스터챗 고르기
        expect(onSelect).toHaveBeenCalledWith("master"); // 선택 전달
    }); // 테스트 종료

    it("실제 AI가 실패하면 채팅 화면이 이유를 쉬운 말로 알려 주고 다시 시도할 수 있게 한다", async () => // 실패 안내 검증
    { // 테스트 시작
        const user = userEvent.setup(); // 사용자 도구 생성
        const failing: LLMAdapter = { streamReply: () => ({ [Symbol.asyncIterator]: () => ({ next: async () => { throw new ChatServiceError("bad-key"); } }) }), summarizeConversation: async () => "" }; // 열쇠가 틀린 실제 AI
        renderWithApp(<ChatScreen characterId="rian" llm={failing} images={new MockImageAdapter()} />); // 채팅 화면 렌더
        const box = screen.getByRole("textbox", { name: "메시지" }); // 입력창
        await user.type(box, "안녕{Enter}"); // 보내기
        expect(await screen.findByText("AI 열쇠가 맞지 않아요. .env.local의 열쇠를 확인한 뒤 서버를 다시 켜 주세요.")).toBeInTheDocument(); // 이유 안내
        expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument(); // 다시 시도
    }); // 테스트 종료
}); // 묶음 종료
