import { afterEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { GET, POST } from "@/app/api/chat/route"; // 서버 통로
import { chatTiers, fillTierOptions, getMessageCost, getTierCost, getTierOption } from "@/features/chat/chat-tiers"; // 채팅 등급
import { createDefaultConversationSettings } from "@/features/core/defaults"; // 기본값
import { CHAT_REQUESTS_PER_MINUTE, isChatAllowedFrom, isLocalHost, resetChatSlots, takeChatSlot } from "@/lib/llm/chat-gate"; // 문지기
import { getTierAvailability, isRealChatEnabled, resolveModel } from "@/lib/llm/model-catalog"; // 모델 목록
import { buildChatPrompt, buildSystemPrompt, parseChatRequest, PROMPT_HISTORY_MESSAGES, PROMPT_START_TEXT, trimHistory, type ChatRequest } from "@/lib/llm/prompt-builder"; // 지시문 만들기
import { ProviderError, readSseData, streamProviderReply, type FetchLike } from "@/lib/llm/providers"; // AI 회사 연결
import { isConversationSettings } from "@/lib/repositories/state-validation"; // 설정 검사

const encoder = new TextEncoder(); // 글자 변환

function sse(chunks: string[]): Response // 여러 조각으로 흘러나오는 답(가짜 AI 회사)
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

const request: ChatRequest = { // 캐릭터 대화 요청
    tier: "plus", // 플러스챗
    character: { name: "리안", summary: "기억을 기록하는 사서", description: "새벽 도서관에서 일한다.", personality: "차분하고 다정하다.", greeting: "어서 와.", worldSetting: "기억이 책이 되는 도서관", prompt: "반말을 쓴다.", tags: ["판타지"], contentRating: "all" }, // 캐릭터
    story: null, // 스토리 아님
    messages: [{ role: "assistant", content: "어서 와." }, { role: "user", content: "오늘도 왔어." }], // 대화
    options: { tier: "plus", length: 1.5, thinking: "off", writingStyle: "romance", preventImpersonation: true, persona: { name: "소하", description: "도서관 단골" }, userNote: "비 오는 날을 좋아함", memories: ["어제 우산을 빌려줌"], playGuide: "", stats: [{ name: "호감도", target: "리안", value: 34, min: 0, max: 100 }], lore: [{ title: "달의 문", keywords: ["문"], content: "자정에만 열린다." }], examples: [{ user: "안녕", reply: "왔구나." }], language: "ko" }, // 응답 조건
}; // 요청 종료

afterEach(() => // 테스트 정리
{ // 정리 시작
    vi.unstubAllEnvs(); // 환경 변수 복원
    vi.unstubAllGlobals(); // 전역 대역 복원
    resetChatSlots(); // 요청 기록 비움
}); // 정리 종료

describe("채팅 등급", () => // 등급 묶음
{ // 묶음 시작
    it("등급은 여섯 개이고 별명과 모델 이름, 회사를 함께 가진다", () => // 등급 목록 검증
    { // 검증 시작
        expect(chatTiers.map((tier) => [tier.id, tier.label, tier.model, tier.provider])).toEqual([["master", "마스터챗", "Claude Fable", "anthropic"], ["premium", "프리미엄챗", "Claude Opus", "anthropic"], ["plus", "플러스챗", "Claude Sonnet", "anthropic"], ["balance", "밸런스챗", "GPT", "openai"], ["smart", "스마트챗", "Gemini Pro", "gemini"], ["basic", "베이직챗", "Gemini Flash", "gemini"]]); // 비싼 순서
        expect(chatTiers.map((tier) => getTierCost(tier.id, { length: 1, thinking: "off" }))).toEqual([12, 8, 3, 2, 2, 1]); // 기본 비용
    }); // 검증 종료

    it("세 등급만 있던 예전 설정도 그대로 읽고, 없는 등급은 기본값으로 채운다", () => // 예전 데이터 검증
    { // 검증 시작
        const old = { ...createDefaultConversationSettings(), tier: "plus" as const, tierOptions: { basic: { length: 1 as const, thinking: "off" as const }, plus: { length: 3 as const, thinking: "deep" as const }, premium: { length: 1 as const, thinking: "off" as const } } }; // 예전 모양
        expect(isConversationSettings(old)).toBe(true); // 검사 통과
        expect(getTierOption(old.tierOptions, "master")).toEqual({ length: 1, thinking: "off" }); // 없는 등급은 기본값
        expect(getTierOption(old.tierOptions, "plus")).toEqual({ length: 3, thinking: "deep" }); // 저장된 값
        expect(Object.keys(fillTierOptions(old.tierOptions)).sort()).toEqual(["balance", "basic", "master", "plus", "premium", "smart"]); // 여섯 등급 모두
        expect(getMessageCost({ ...old, tier: "master" })).toBe(12); // 새 등급 비용
        expect(isConversationSettings({ ...old, tier: "ultra" })).toBe(false); // 모르는 등급 거부
        expect(isConversationSettings({ ...old, tierOptions: { ...old.tierOptions, ultra: { length: 1, thinking: "off" } } })).toBe(false); // 모르는 등급의 설정 거부
        expect(Object.keys(createDefaultConversationSettings().tierOptions)).toHaveLength(6); // 새 대화는 여섯 등급
    }); // 검증 종료
}); // 묶음 종료

describe("모델 목록과 문지기", () => // 서버 설정 묶음
{ // 묶음 시작
    it("스위치를 켜고 열쇠를 넣은 회사의 등급만 실제 모델에 연결한다", () => // 모델 연결 검증
    { // 검증 시작
        expect(isRealChatEnabled({})).toBe(false); // 기본은 꺼짐
        expect(resolveModel("plus", { ANTHROPIC_API_KEY: "key" })).toBeNull(); // 스위치가 꺼져 있으면 없음
        const env = { ENABLE_REAL_PROVIDERS: "true", ANTHROPIC_API_KEY: " key-a ", GEMINI_API_KEY: "", OPENAI_API_KEY: "key-o", OPENAI_BASE_URL: "https://example.test/v1/", CHAT_MODEL_BALANCE: "custom-model" }; // 열쇠 두 개
        expect(resolveModel("plus", env)).toEqual({ provider: "anthropic", model: "claude-sonnet-5-5", apiKey: "key-a", baseUrl: "https://api.anthropic.com/v1" }); // 기본 모델과 주소
        expect(resolveModel("balance", env)).toEqual({ provider: "openai", model: "custom-model", apiKey: "key-o", baseUrl: "https://example.test/v1" }); // 환경 변수로 바꾼 모델과 주소
        expect(resolveModel("basic", env)).toBeNull(); // 열쇠가 없는 회사
        expect(getTierAvailability(env)).toEqual({ master: true, premium: true, plus: true, balance: true, smart: false, basic: false }); // 등급별 가능 여부
    }); // 검증 종료

    it("내 컴퓨터에서 온 요청만 받고 1분에 정해진 횟수까지만 받는다", () => // 문지기 검증
    { // 검증 시작
        expect(["localhost:3002", "127.0.0.1:3005", "[::1]:3000", "app.localhost"].every(isLocalHost)).toBe(true); // 로컬 주소
        expect(["mateverse.example", "192.168.0.5:3000", "localhost.evil.example", null].some(isLocalHost)).toBe(false); // 바깥 주소
        expect(isChatAllowedFrom("mateverse.example", {})).toBe(false); // 바깥은 거절
        expect(isChatAllowedFrom("mateverse.example", { CHAT_ALLOW_PUBLIC: "true" })).toBe(true); // 명시적으로 켠 경우만
        const start = 1_000_000; // 기준 시각
        expect(Array.from({ length: CHAT_REQUESTS_PER_MINUTE }, (_item, index) => takeChatSlot(start + index)).every(Boolean)).toBe(true); // 한도까지 받음
        expect(takeChatSlot(start + 100)).toBe(false); // 한도 초과
        expect(takeChatSlot(start + 61_000)).toBe(true); // 1분 뒤 다시 받음
    }); // 검증 종료
}); // 묶음 종료

describe("지시문 만들기", () => // 지시문 묶음
{ // 묶음 시작
    it("캐릭터 설정과 대화 프로필, 기억, 설정집, 스탯, 문체, 규칙을 한 글로 조립한다", () => // 캐릭터 지시문 검증
    { // 검증 시작
        const prompt = buildChatPrompt(request); // 지시문
        for (const part of ["너는 롤플레이 캐릭터 '리안'이다", "기억을 기록하는 사서", "차분하고 다정하다.", "기억이 책이 되는 도서관", "반말을 쓴다.", "대화 상대(소하)", "도서관 단골", "비 오는 날을 좋아함", "- 어제 우산을 빌려줌", "- 달의 문: 자정에만 열린다.", "- 리안 호감도: 34 (0~100)", "소하: 안녕\n리안: 왔구나.", "소하의 말과 행동, 생각은 대신 쓰지 않는다.", "525자 안팎", "답변은 한국어로 쓴다.", "인물의 내면과 감정의 떨림", "성적으로 노골적인 묘사는 쓰지 않고"]) // 들어가야 할 내용
        { // 순회 시작
            expect(prompt.system).toContain(part); // 포함 확인
        } // 순회 종료
        expect(prompt.messages).toEqual([{ role: "user", content: PROMPT_START_TEXT }, { role: "assistant", content: "어서 와." }, { role: "user", content: "오늘도 왔어." }]); // 사용자 말로 시작
        expect(prompt.maxTokens).toBe(1500); // 1.5배 길이
        const english = buildSystemPrompt({ ...request, options: { ...request.options, language: "en", preventImpersonation: false, writingStyle: "default" } }); // 영어·사칭 허용·기본 문체
        expect(english).toContain("Write the reply in English."); // 영어로 답하라는 지시
        expect(english).not.toContain("대신 쓰지 않는다"); // 사칭 방지 끔
        expect(english).not.toContain("- 문체:"); // 기본 문체는 지침 없음
    }); // 검증 종료

    it("스토리는 등장인물과 [이름] 대사 형식을 알려 준다", () => // 스토리 지시문 검증
    { // 검증 시작
        const system = buildSystemPrompt({ ...request, story: { title: "비 그친 밤의 기록관", synopsis: "사라진 기록을 찾는다.", userRole: "새로 온 견습생", cast: [{ displayName: "리안", role: "사서" }, { displayName: "노아", role: "" }] } }); // 스토리 지시문
        for (const part of ["스토리 '비 그친 밤의 기록관'의 진행자", "사라진 기록을 찾는다.", "- 리안: 사서", "- 노아", "새로 온 견습생", "'[이름] 내용' 형식", "'[내레이션] 내용'", "리안, 노아", "(다음 장면으로)"]) // 들어가야 할 내용
        { // 순회 시작
            expect(system).toContain(part); // 포함 확인
        } // 순회 종료
        expect(system).not.toContain("## 제작자 지시"); // 스토리에는 캐릭터 한 명의 지시를 넣지 않음
    }); // 검증 종료

    it("최근 대화만 남기고 같은 쪽 말은 합친다", () => // 대화 정리 검증
    { // 검증 시작
        expect(trimHistory([{ role: "user", content: "하나" }, { role: "user", content: "둘" }, { role: "assistant", content: "셋" }])).toEqual([{ role: "user", content: "하나\n\n둘" }, { role: "assistant", content: "셋" }]); // 이어 말한 것 합침
        const long = Array.from({ length: 100 }, (_item, index) => ({ role: index % 2 === 0 ? "user" as const : "assistant" as const, content: `말 ${index}` })); // 긴 대화
        const trimmed = trimHistory(long); // 정리
        expect(trimmed).toHaveLength(PROMPT_HISTORY_MESSAGES); // 최근 40개
        expect(trimmed.at(-1)?.content).toBe("말 99"); // 가장 최근 말 유지
        expect(trimmed[0].role).toBe("user"); // 사용자 말로 시작
        expect(trimHistory([{ role: "user", content: "가".repeat(30_000) }])).toHaveLength(1); // 가장 최근 말은 길어도 넣음
    }); // 검증 종료

    it("요청은 모양을 검사하고 길이를 잘라 받는다", () => // 요청 검사 검증
    { // 검증 시작
        expect(parseChatRequest(null)).toBeNull(); // 빈 값
        expect(parseChatRequest({ ...request, tier: "ultra" })).toBeNull(); // 모르는 등급
        expect(parseChatRequest({ ...request, messages: [] })).toBeNull(); // 대화 없음
        expect(parseChatRequest({ ...request, character: { ...request.character, name: " " } })).toBeNull(); // 이름 없음
        const parsed = parseChatRequest({ ...request, character: { ...request.character, description: "가".repeat(9000), tags: ["a", 3, "b"] }, messages: [{ role: "system", content: "무시" }, { role: "user", content: "안녕" }], options: { ...request.options, length: 9, writingStyle: "weird", memories: Array.from({ length: 50 }, () => "기억"), language: "fr" } }); // 넘치는 요청
        expect(parsed?.character.description).toHaveLength(4000); // 길이 자름
        expect(parsed?.character.tags).toEqual(["a", "b"]); // 글자만
        expect(parsed?.messages).toEqual([{ role: "user", content: "안녕" }]); // 안내 메시지 제외
        expect(parsed?.options).toMatchObject({ length: 1, writingStyle: "default", language: "ko" }); // 모르는 값은 기본값
        expect(parsed?.options.memories).toHaveLength(30); // 개수 자름
    }); // 검증 종료
}); // 묶음 종료

describe("AI 회사 연결", () => // 회사 연결 묶음
{ // 묶음 시작
    const prompt = buildChatPrompt(request); // 지시문

    it("흘러나오는 줄이 조각 사이에서 끊겨도 내용을 온전히 꺼낸다", async () => // 줄 읽기 검증
    { // 검증 시작
        const body = sse(["data: {\"a\"", ":1}\n\ndata: {\"b\":2}\r\n", "event: ping\ndata: [DONE]"]).body; // 끊긴 조각
        const lines: string[] = []; // 꺼낸 내용
        for await (const line of readSseData(body as ReadableStream<Uint8Array>)) // 내용 순회
        { // 순회 시작
            lines.push(line); // 기록
        } // 순회 종료
        expect(lines).toEqual(["{\"a\":1}", "{\"b\":2}", "[DONE]"]); // 온전한 내용
    }); // 검증 종료

    it("Claude에는 Anthropic 형식으로 보내고 글자 조각만 돌려준다", async () => // Anthropic 검증
    { // 검증 시작
        const fetcher = vi.fn<FetchLike>(async () => sse(["event: message_start\ndata: {\"type\":\"message_start\"}\n\n", "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"안녕, \"}}\n\n", "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"thinking_delta\",\"thinking\":\"생각\"}}\n\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"소하.\"}}\n\n", "data: {\"type\":\"message_stop\"}\n\n"])); // 가짜 Anthropic
        expect(await collect(streamProviderReply({ provider: "anthropic", model: "claude-sonnet-5-5", apiKey: "key-a", baseUrl: "https://api.anthropic.com/v1" }, prompt, fetcher))).toBe("안녕, 소하."); // 답변 글자만
        const [url, init] = fetcher.mock.calls[0]; // 보낸 요청
        expect(url).toBe("https://api.anthropic.com/v1/messages"); // 주소
        expect(init.headers).toMatchObject({ "x-api-key": "key-a", "anthropic-version": "2023-06-01", "content-type": "application/json" }); // 머리말
        expect(JSON.parse(init.body as string)).toEqual({ model: "claude-sonnet-5-5", max_tokens: 1500, system: prompt.system, messages: prompt.messages, stream: true }); // 내용
    }); // 검증 종료

    it("Gemini에는 Google 형식으로 보내고 생각 과정은 뺀다", async () => // Gemini 검증
    { // 검증 시작
        const fetcher = vi.fn<FetchLike>(async () => sse(["data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"생각 중\",\"thought\":true},{\"text\":\"어서 \"}]}}]}\n\n", "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"와.\"}]}}]}\n\n"])); // 가짜 Google
        expect(await collect(streamProviderReply({ provider: "gemini", model: "gemini-2.5-flash", apiKey: "key-g", baseUrl: "https://generativelanguage.googleapis.com/v1beta" }, prompt, fetcher))).toBe("어서 와."); // 답변 글자만
        const [url, init] = fetcher.mock.calls[0]; // 보낸 요청
        expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse"); // 주소
        expect(init.headers).toMatchObject({ "x-goog-api-key": "key-g" }); // 머리말
        const body = JSON.parse(init.body as string) as { systemInstruction: { parts: Array<{ text: string }> }; contents: Array<{ role: string; parts: Array<{ text: string }> }>; generationConfig: { maxOutputTokens: number } }; // 내용
        expect(body.systemInstruction.parts[0].text).toBe(prompt.system); // 역할 글
        expect(body.contents.map((item) => item.role)).toEqual(["user", "model", "user"]); // 캐릭터 말은 model
        expect(body.generationConfig.maxOutputTokens).toBeGreaterThan(1500); // 생각 분량 여유
    }); // 검증 종료

    it("GPT에는 OpenAI 형식으로 보내고 끝 표시에서 멈춘다", async () => // OpenAI 검증
    { // 검증 시작
        const fetcher = vi.fn<FetchLike>(async () => sse(["data: {\"choices\":[{\"delta\":{\"role\":\"assistant\",\"content\":\"\"}}]}\n\n", "data: {\"choices\":[{\"delta\":{\"content\":\"기다렸어.\"}}]}\n\ndata: [DONE]\n\ndata: {\"choices\":[{\"delta\":{\"content\":\"무시\"}}]}\n\n"])); // 가짜 OpenAI
        expect(await collect(streamProviderReply({ provider: "openai", model: "gpt-5", apiKey: "key-o", baseUrl: "https://api.openai.com/v1" }, prompt, fetcher))).toBe("기다렸어."); // 끝 표시 뒤는 버림
        const [url, init] = fetcher.mock.calls[0]; // 보낸 요청
        expect(url).toBe("https://api.openai.com/v1/chat/completions"); // 주소
        expect(init.headers).toMatchObject({ authorization: "Bearer key-o" }); // 머리말
        const body = JSON.parse(init.body as string) as { model: string; stream: boolean; messages: Array<{ role: string; content: string }> }; // 내용
        expect(body).toMatchObject({ model: "gpt-5", stream: true }); // 모델과 흐름
        expect(body.messages[0]).toEqual({ role: "system", content: prompt.system }); // 역할 글이 맨 앞
        expect(body.messages).toHaveLength(prompt.messages.length + 1); // 대화가 이어짐
    }); // 검증 종료

    it("회사가 거절하면 상태 코드와 설명을 담은 오류를 낸다", async () => // 오류 검증
    { // 검증 시작
        const fetcher: FetchLike = async () => new Response("{\"error\":\"invalid key\"}", { status: 401 }); // 열쇠 거절
        await expect(collect(streamProviderReply({ provider: "anthropic", model: "m", apiKey: "bad", baseUrl: "https://api.anthropic.com/v1" }, prompt, fetcher))).rejects.toMatchObject({ name: "ProviderError", status: 401 }); // 오류
        const midway: FetchLike = async () => sse(["data: {\"type\":\"error\",\"error\":{\"type\":\"overloaded_error\"}}\n\n"]); // 도중 오류
        await expect(collect(streamProviderReply({ provider: "anthropic", model: "m", apiKey: "k", baseUrl: "https://api.anthropic.com/v1" }, prompt, midway))).rejects.toBeInstanceOf(ProviderError); // 오류
    }); // 검증 종료
}); // 묶음 종료

describe("서버 통로", () => // 서버 통로 묶음
{ // 묶음 시작
    const post = (body: unknown, host = "localhost:3002") => POST(new Request(`http://${host}/api/chat`, { method: "POST", headers: { host, "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) })); // 요청 보내기
    const reason = async (response: Response) => (await response.json() as { error: string }).error; // 거절 이유

    it("스위치가 꺼져 있으면 모든 등급을 연습용으로 알리고 요청을 받지 않는다", async () => // 꺼짐 검증
    { // 검증 시작
        vi.stubEnv("ENABLE_REAL_PROVIDERS", "false"); // 스위치 끔
        vi.stubEnv("ANTHROPIC_API_KEY", "key-a"); // 열쇠는 있음
        const status = await GET(new Request("http://localhost:3002/api/chat", { headers: { host: "localhost:3002" } })).json() as { enabled: boolean; tiers: Record<string, boolean> }; // 상태
        expect(status.enabled).toBe(false); // 꺼짐
        expect(Object.values(status.tiers).some(Boolean)).toBe(false); // 모두 연습용
        const response = await post(request); // 요청
        expect([response.status, await reason(response)]).toEqual([503, "disabled"]); // 거절
    }); // 검증 종료

    it("켜져 있으면 열쇠가 있는 등급을 알리고, 잘못된 요청·19세 작품·열쇠 없는 등급·바깥 요청은 거절한다", async () => // 거절 검증
    { // 검증 시작
        vi.stubEnv("ENABLE_REAL_PROVIDERS", "true"); // 스위치 켬
        vi.stubEnv("ANTHROPIC_API_KEY", "key-a"); // Claude 열쇠
        vi.stubEnv("GEMINI_API_KEY", ""); // Gemini 열쇠 없음
        vi.stubEnv("OPENAI_API_KEY", ""); // GPT 열쇠 없음
        vi.stubEnv("CHAT_ALLOW_PUBLIC", ""); // 공개 꺼짐
        const status = await GET(new Request("http://localhost:3002/api/chat", { headers: { host: "localhost:3002" } })).json() as { enabled: boolean; tiers: Record<string, boolean> }; // 상태
        expect(status).toEqual({ enabled: true, tiers: { master: true, premium: true, plus: true, balance: false, smart: false, basic: false } }); // Claude 등급만
        expect(JSON.stringify(status)).not.toContain("key-a"); // 열쇠 값은 내보내지 않음
        const outside = await GET(new Request("http://mateverse.example/api/chat", { headers: { host: "mateverse.example" } })).json() as { enabled: boolean; tiers: Record<string, boolean> }; // 바깥에서 물음
        expect(outside.enabled).toBe(false); // 바깥에는 꺼진 것으로
        expect([(await post(request, "mateverse.example")).status]).toEqual([403]); // 바깥 요청 거절
        expect(await reason(await post("{broken"))).toBe("bad-request"); // 깨진 글
        expect(await reason(await post({ ...request, messages: [] }))).toBe("bad-request"); // 모양이 다름
        expect(await reason(await post({ ...request, character: { ...request.character, contentRating: "mature" } }))).toBe("mature-not-supported"); // 19세 작품
        expect(await reason(await post({ ...request, tier: "basic" }))).toBe("no-key"); // 열쇠 없는 등급
    }); // 검증 종료

    it("AI 회사의 답을 글자 조각으로 흘려보내고, 열쇠가 틀리면 이유를 알려 준다", async () => // 흐름 검증
    { // 검증 시작
        vi.stubEnv("ENABLE_REAL_PROVIDERS", "true"); // 스위치 켬
        vi.stubEnv("ANTHROPIC_API_KEY", "key-a"); // Claude 열쇠
        const fetcher = vi.fn(async () => sse(["data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"왔구나, \"}}\n\n", "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"소하.\"}}\n\n"])); // 가짜 Anthropic
        vi.stubGlobal("fetch", fetcher); // 요청 함수 바꿈
        const response = await post(request); // 요청
        expect(response.status).toBe(200); // 성공
        expect(response.headers.get("content-type")).toContain("text/plain"); // 글자 흐름
        expect(response.headers.get("x-chat-model")).toBe("claude-sonnet-5-5"); // 답한 모델
        expect(await response.text()).toBe("왔구나, 소하."); // 답변
        vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid x-api-key", { status: 401 }))); // 열쇠 거절
        const refused = await post(request); // 요청
        expect([refused.status, await reason(refused)]).toEqual([502, "bad-key"]); // 열쇠 문제로 알림
        vi.stubGlobal("fetch", vi.fn(async () => new Response("slow down", { status: 429 }))); // 회사 한도
        const busy = await post(request); // 요청
        expect([busy.status, await reason(busy)]).toEqual([429, "provider-busy"]); // 한도로 알림
    }); // 검증 종료
}); // 묶음 종료
