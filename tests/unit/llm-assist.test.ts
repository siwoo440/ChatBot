import { afterEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { POST } from "@/app/api/chat/assist/route"; // 보조 통로
import { buildSummaryPrompt, cleanSummary, parseAssistRequest, SUMMARY_LIMIT, type SummaryRequest } from "@/lib/llm/assist-builder"; // 보조 지시문
import { resetChatSlots } from "@/lib/llm/chat-gate"; // 문지기
import type { FetchLike } from "@/lib/llm/providers"; // 요청 함수 형식

const encoder = new TextEncoder(); // 글자 변환

function sse(text: string): Response // 가짜 Ollama 답(OpenAI 형식)
{ // 함수 시작
    const body = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`; // 흐름 글
    return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(encoder.encode(body)); controller.close(); } }), { status: 200 }); // 흐름 응답
} // 함수 종료

function useLocalModel(): void // 오픈챗(내 컴퓨터 모델)만 켠 환경
{ // 함수 시작
    vi.stubEnv("ENABLE_REAL_PROVIDERS", "true"); // 스위치 켬
    vi.stubEnv("CHAT_MODEL_OPEN", "qwen3:14b"); // 설치한 모델
    vi.stubEnv("LOCAL_BASE_URL", ""); // 기본 주소
    vi.stubEnv("LOCAL_API_KEY", ""); // 열쇠 없음
    vi.stubEnv("LOCAL_REASONING_EFFORT", ""); // 기본(생각 끔)
    vi.stubEnv("ANTHROPIC_API_KEY", ""); // 회사 열쇠 없음
    vi.stubEnv("GEMINI_API_KEY", ""); // 회사 열쇠 없음
    vi.stubEnv("OPENAI_API_KEY", ""); // 회사 열쇠 없음
    vi.stubEnv("CHAT_ALLOW_PUBLIC", ""); // 공개 꺼짐
} // 함수 종료

const summary: SummaryRequest = { task: "summary", tier: "open", contentRating: "all", language: "ko", title: "새벽 도서관의 리안 · 다시 온 독자", lines: [{ name: "소하", content: "오늘 비가 와서 우울해." }, { name: "리안", content: "*옆자리에 앉는다.* 여기 있을게." }] }; // 요약 요청
const post = (body: unknown, host = "localhost:3002") => POST(new Request(`http://${host}/api/chat/assist`, { method: "POST", headers: { host, "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) })); // 요청 보내기
const reason = async (response: Response) => (await response.json() as { error: string }).error; // 거절 이유

afterEach(() => // 테스트 정리
{ // 정리 시작
    vi.unstubAllEnvs(); // 환경 변수 복원
    vi.unstubAllGlobals(); // 전역 대역 복원
    resetChatSlots(); // 요청 기록 비움
}); // 정리 종료

describe("대화 요약 지시문", () => // 요약 묶음
{ // 묶음 시작
    it("요청을 검사하고 길이를 자른다", () => // 요청 정리 검증
    { // 검증 시작
        expect(parseAssistRequest(summary)).toEqual(summary); // 올바른 요청은 그대로
        expect(parseAssistRequest({ ...summary, task: "other" })).toBeNull(); // 모르는 일
        expect(parseAssistRequest({ ...summary, tier: "gold" })).toBeNull(); // 모르는 등급
        expect(parseAssistRequest({ ...summary, lines: [] })).toBeNull(); // 대화 없음
        expect(parseAssistRequest({ ...summary, lines: [{ name: "소하", content: "" }, { name: "", content: "말" }] })).toBeNull(); // 빈 줄만 있음
        const long = parseAssistRequest({ ...summary, language: "fr", contentRating: "x", lines: Array.from({ length: 40 }, (_item, index) => ({ name: "소하", content: `${index}번째 ${"가".repeat(2000)}` })) }); // 긴 요청
        expect(long?.task === "summary" ? [long.lines.length, long.lines[0].content.startsWith("20번째"), long.lines[0].content.length, long.language, long.contentRating] : null).toEqual([20, true, 800, "ko", "all"]); // 최근 20줄, 줄마다 800자, 모르는 값은 기본값
    }); // 검증 종료

    it("대화 줄과 요약 규칙을 담고, 답변 언어를 따른다", () => // 지시문 검증
    { // 검증 시작
        const prompt = buildSummaryPrompt(summary); // 지시문
        for (const part of ["2~3문장", "150자 안팎", "대화에 없는 내용을 지어내지 않는다", "요약 문장만 쓴다", "한국어로 쓴다"]) // 규칙
        { // 순회 시작
            expect(prompt.system).toContain(part); // 포함 확인
        } // 순회 종료
        expect(prompt.messages).toHaveLength(1); // 사용자 말 하나
        expect(prompt.messages[0].content).toContain("소하: 오늘 비가 와서 우울해.\n리안: *옆자리에 앉는다.* 여기 있을게."); // 대화 줄
        expect(prompt.messages[0].content).toContain("새벽 도서관의 리안 · 다시 온 독자"); // 대화방 이름
        expect(prompt.maxTokens).toBeLessThanOrEqual(400); // 짧은 답만 받음
        expect(buildSummaryPrompt({ ...summary, language: "en" }).system).toContain("Write the summary in English."); // 영어 요약
    }); // 검증 종료

    it("머리말·따옴표·줄바꿈을 걷어 내고 한도를 넘으면 문장 끝에서 자른다", () => // 요약 정리 검증
    { // 검증 시작
        expect(cleanSummary("요약: \"소하는 비 오는 날 도서관을 찾았다.\n리안은 곁에 있어 주었다.\"")).toBe("소하는 비 오는 날 도서관을 찾았다. 리안은 곁에 있어 주었다."); // 머리말·따옴표·줄바꿈 제거
        expect(cleanSummary("**Summary:** They met again.")).toBe("They met again."); // 영어 머리말과 강조 표시 제거
        const long = `${"가나다라마바사아자차. ".repeat(40)}`; // 긴 요약
        const cut = cleanSummary(long); // 정리
        expect(cut.length).toBeLessThanOrEqual(SUMMARY_LIMIT); // 한도 안
        expect(cut.endsWith(".")).toBe(true); // 문장 끝에서 자름
        expect(cleanSummary("   ")).toBe(""); // 빈 답
    }); // 검증 종료
}); // 묶음 종료

describe("보조 통로의 대화 요약", () => // 통로 묶음
{ // 묶음 시작
    it("꺼져 있거나 바깥 요청이거나 요청이 틀리면 거절한다", async () => // 거절 검증
    { // 검증 시작
        vi.stubEnv("ENABLE_REAL_PROVIDERS", "false"); // 스위치 끔
        const disabled = await post(summary); // 요청
        expect([disabled.status, await reason(disabled)]).toEqual([503, "disabled"]); // 연습용으로
        useLocalModel(); // 오픈챗 켬
        const outside = await post(summary, "mateverse.example"); // 바깥 요청
        expect([outside.status, await reason(outside)]).toEqual([403, "local-only"]); // 거절
        const broken = await post("{not-json"); // 깨진 요청
        expect([broken.status, await reason(broken)]).toEqual([400, "bad-request"]); // 거절
        const wrong = await post({ ...summary, lines: [] }); // 대화 없음
        expect([wrong.status, await reason(wrong)]).toEqual([400, "bad-request"]); // 거절
        const mature = await post({ ...summary, tier: "plus", contentRating: "mature" }); // 19세 작품을 회사 등급으로
        expect([mature.status, await reason(mature)]).toEqual([422, "mature-not-supported"]); // 연습용으로
        const noKey = await post({ ...summary, tier: "plus" }); // 열쇠 없는 등급
        expect([noKey.status, await reason(noKey)]).toEqual([503, "no-key"]); // 연습용으로
    }); // 검증 종료

    it("내 컴퓨터 모델에 요약을 맡기고 정리한 요약을 돌려준다", async () => // 요약 검증
    { // 검증 시작
        useLocalModel(); // 오픈챗 켬
        const fetcher = vi.fn<FetchLike>(async () => sse("요약: 소하는 비 오는 날 도서관을 찾았고, 리안은 곁에 있어 주었다.")); // 가짜 Ollama
        vi.stubGlobal("fetch", fetcher); // 요청 함수 바꿈
        const response = await post(summary); // 요청
        expect([response.status, await response.json()]).toEqual([200, { summary: "소하는 비 오는 날 도서관을 찾았고, 리안은 곁에 있어 주었다." }]); // 정리한 요약
        const sent = JSON.parse(fetcher.mock.calls[0][1].body as string) as { model: string; max_tokens: number; messages: Array<{ role: string; content: string }> }; // 보낸 내용
        expect([fetcher.mock.calls[0][0], sent.model]).toEqual(["http://127.0.0.1:11434/v1/chat/completions", "qwen3:14b"]); // 내 컴퓨터 모델
        expect(sent.messages[1].content).toContain("소하: 오늘 비가 와서 우울해."); // 대화 줄을 보냄
        vi.stubGlobal("fetch", vi.fn(async () => sse("   "))); // 빈 답
        const empty = await post(summary); // 요청
        expect([empty.status, await reason(empty)]).toEqual([502, "bad-output"]); // 쓸 수 없는 답
        vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); })); // 프로그램 꺼짐
        const offline = await post(summary); // 요청
        expect([offline.status, await reason(offline)]).toEqual([502, "model-offline"]); // 프로그램 꺼짐으로 알림
    }); // 검증 종료
}); // 묶음 종료
