// 실제 AI 어댑터: 실제 AI를 쓸 수 있는 등급이면 서버 통로로 답을 받고, 아니면(열쇠 없음·19세 작품·서버 없음) 연습용 AI로 답한다. 요약과 스탯 판단은 아직 연습용 규칙을 쓴다.
import type { ChatReplyOptions, LLMAdapter, LLMInput, SummaryInput } from "@/lib/adapters/llm-adapter"; // 어댑터 계약
import { loadModelStatus, type ModelStatus } from "@/lib/adapters/model-status"; // 실제 AI 상태
import { MockLLMAdapter } from "@/lib/adapters/mock-llm-adapter"; // 연습용 AI
import type { StatChange, StatJudgeInput } from "@/features/chat/stat-model"; // 스탯 판단 형식
import type { ChatRequest } from "@/lib/llm/prompt-builder"; // 서버 통로 요청

export type ChatServiceCode = "bad-key" | "rate-limited" | "provider-busy" | "provider-error" | "local-only" | "bad-request" | "too-large" | "unknown"; // 실패 이유

export class ChatServiceError extends Error // 실제 AI 실패(이유 코드 포함)
{ // 클래스 시작
    public constructor(public readonly code: ChatServiceCode, detail = "") // 이유와 설명
    { // 생성자 시작
        super(detail.length === 0 ? code : `${code}: ${detail}`); // 설명 전달
        this.name = "ChatServiceError"; // 오류 이름
    } // 생성자 종료
} // 클래스 종료

const fallbackCodes = new Set(["disabled", "no-key", "mature-not-supported"]); // 연습용으로 넘기는 이유
const knownCodes = new Set<ChatServiceCode>(["bad-key", "rate-limited", "provider-busy", "provider-error", "local-only", "bad-request", "too-large"]); // 화면에 알리는 이유

export function isMatureInput(input: Pick<LLMInput, "character" | "contentRating">): boolean // 19세 작품 여부(외부 AI 약관 때문에 연습용으로 답함)
{ // 함수 시작
    return input.character.contentRating === "mature" || input.contentRating === "mature"; // 캐릭터·작품 등급
} // 함수 종료

export function toChatRequest(input: LLMInput, options: ChatReplyOptions): ChatRequest // 서버 통로에 보낼 요청 만들기(지시문은 서버가 조립)
{ // 함수 시작
    const { character, story } = input; // 캐릭터와 스토리
    return { // 요청
        tier: options.tier, // 등급
        character: { name: character.name, summary: character.summary, description: character.description, personality: character.personality, greeting: character.greeting, worldSetting: character.worldSetting, prompt: character.prompt, tags: character.tags, contentRating: isMatureInput(input) ? "mature" : character.contentRating }, // 캐릭터
        story: story === undefined ? null : { title: story.title, synopsis: story.synopsis, userRole: story.userRole, cast: story.cast.map((member) => ({ displayName: member.displayName, role: member.role })) }, // 스토리
        messages: input.messages.flatMap((message) => message.role === "user" || message.role === "assistant" ? [{ role: message.role, content: message.content }] : []), // 대화(안내 메시지 제외)
        options, // 응답 조건
    }; // 요청 반환
} // 함수 종료

export class RemoteLLMAdapter implements LLMAdapter // 실제 AI 어댑터
{ // 클래스 시작
    public constructor(private readonly fallback: LLMAdapter = new MockLLMAdapter(), private readonly fetcher: typeof fetch = (...args) => fetch(...args), private readonly status: () => Promise<ModelStatus> = () => loadModelStatus()) // 연습용 AI·요청 함수·상태 읽기
    { // 생성자 시작
    } // 생성자 종료

    public async *streamReply(input: LLMInput, signal?: AbortSignal): AsyncIterable<string> // 답변 흐름
    { // 함수 시작
        const options = input.options; // 응답 조건
        const status = await this.status(); // 실제 AI 상태
        if (options === undefined || status.tiers[options.tier] !== true || isMatureInput(input)) // 연습용으로 답할 경우
        { // 조건 시작
            yield* this.fallback.streamReply(input, signal); // 연습용 AI
            return; // 종료
        } // 조건 종료
        const response = await this.fetcher("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(toChatRequest(input, options)), signal }); // 서버 통로 요청
        if (!response.ok || response.body === null) // 거절
        { // 조건 시작
            const body = await response.json().catch(() => null) as { error?: unknown; detail?: unknown } | null; // 이유
            const code = typeof body?.error === "string" ? body.error : "unknown"; // 이유 코드
            if (fallbackCodes.has(code)) // 연습용으로 넘길 이유
            { // 조건 시작
                yield* this.fallback.streamReply(input, signal); // 연습용 AI
                return; // 종료
            } // 조건 종료
            throw new ChatServiceError(knownCodes.has(code as ChatServiceCode) ? code as ChatServiceCode : "unknown", typeof body?.detail === "string" ? body.detail : ""); // 화면에 알림
        } // 조건 종료
        const reader = response.body.getReader(); // 읽기 도구
        const decoder = new TextDecoder(); // 글자 변환
        let received = false; // 글자를 받았는지
        try // 읽기 시도
        { // 시도 시작
            while (true) // 조각 순회
            { // 순회 시작
                const { done, value } = await reader.read(); // 다음 조각
                const chunk = done ? decoder.decode() : decoder.decode(value, { stream: true }); // 글자로
                if (chunk.length > 0) // 글자 있음
                { // 조건 시작
                    received = true; // 받음
                    yield chunk; // 조각 반환
                } // 조건 종료
                if (done) // 끝
                { // 조건 시작
                    break; // 종료
                } // 조건 종료
            } // 순회 종료
        } // 시도 종료
        finally // 정리
        { // 정리 시작
            reader.releaseLock(); // 읽기 도구 반납
        } // 정리 종료
        if (!received) // 빈 답
        { // 조건 시작
            throw new ChatServiceError("provider-error", "empty reply"); // 다시 시도 안내
        } // 조건 종료
    } // 함수 종료

    public summarizeConversation(input: SummaryInput): Promise<string> // 대화 요약(연습용 규칙)
    { // 함수 시작
        return this.fallback.summarizeConversation(input); // 연습용 요약
    } // 함수 종료

    public async judgeStats(input: StatJudgeInput, signal?: AbortSignal): Promise<StatChange[]> // 스탯 판단(연습용 규칙)
    { // 함수 시작
        return this.fallback.judgeStats === undefined ? [] : this.fallback.judgeStats(input, signal); // 연습용 판단
    } // 함수 종료
} // 클래스 종료
