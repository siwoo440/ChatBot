// AI 회사 연결(서버 전용): 조립한 지시문을 Anthropic·Google·OpenAI 형식으로 보내고, 흘러나오는 답을 글자 조각으로 돌려준다. 따로 설치하는 도구 없이 fetch만 쓴다.
import type { ResolvedModel } from "@/lib/llm/model-catalog"; // 등급에 연결된 모델
import type { BuiltPrompt } from "@/lib/llm/prompt-builder"; // 조립한 지시문

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>; // 요청 함수(테스트에서 바꿔 끼움)

export class ProviderError extends Error // AI 회사 오류
{ // 클래스 시작
    public constructor(public readonly status: number, message: string) // 상태 코드와 설명
    { // 생성자 시작
        super(message); // 설명 전달
        this.name = "ProviderError"; // 오류 이름
    } // 생성자 종료
} // 클래스 종료

const REASONING_HEADROOM = 2048; // 생각에 쓰는 토큰 여유(생각하는 모델은 답변 길이에 생각 분량이 함께 잡힘)

export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncIterable<string> // 서버가 흘려보내는 줄(data: …)에서 내용만 꺼내기
{ // 함수 시작
    const reader = body.getReader(); // 읽기 도구
    const decoder = new TextDecoder(); // 글자 변환
    let buffer = ""; // 아직 끝나지 않은 줄
    try // 읽기 시도
    { // 시도 시작
        while (true) // 조각 순회
        { // 순회 시작
            const { done, value } = await reader.read(); // 다음 조각
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true }); // 글자로 바꿔 붙임
            const lines = buffer.split(/\r?\n/); // 줄 나누기
            buffer = done ? "" : lines.pop() ?? ""; // 마지막 줄은 다음 조각과 이어질 수 있어 남김
            for (const line of lines) // 줄 순회
            { // 순회 시작
                if (line.startsWith("data:")) // 내용 줄
                { // 조건 시작
                    yield line.slice(5).trim(); // 내용 반환
                } // 조건 종료
            } // 순회 종료
            if (done) // 끝
            { // 조건 시작
                return; // 종료
            } // 조건 종료
        } // 순회 종료
    } // 시도 종료
    finally // 정리
    { // 정리 시작
        reader.releaseLock(); // 읽기 도구 반납
    } // 정리 종료
} // 함수 종료

function parseJson(data: string): Record<string, unknown> | null // 내용 줄을 객체로(아니면 없음)
{ // 함수 시작
    try // 해석 시도
    { // 시도 시작
        const value: unknown = JSON.parse(data); // 해석
        return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; // 객체만
    } // 시도 종료
    catch // 해석 실패
    { // 실패 시작
        return null; // 건너뜀
    } // 실패 종료
} // 함수 종료

async function openStream(fetcher: FetchLike, url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> // 요청을 보내고 흐름 열기
{ // 함수 시작
    const response = await fetcher(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal }); // 요청
    if (!response.ok || response.body === null) // 실패
    { // 조건 시작
        const detail = (await response.text().catch(() => "")).slice(0, 300); // 회사가 보낸 설명(짧게)
        throw new ProviderError(response.status, detail.length === 0 ? `HTTP ${response.status}` : detail); // 오류
    } // 조건 종료
    return response.body; // 흐름 반환
} // 함수 종료

async function* streamAnthropic(model: ResolvedModel, prompt: BuiltPrompt, fetcher: FetchLike, signal?: AbortSignal): AsyncIterable<string> // Anthropic(Claude)
{ // 함수 시작
    const body = await openStream(fetcher, `${model.baseUrl}/messages`, { "x-api-key": model.apiKey, "anthropic-version": "2023-06-01" }, { model: model.model, max_tokens: prompt.maxTokens, system: prompt.system, messages: prompt.messages, stream: true }, signal); // 요청
    for await (const data of readSseData(body)) // 내용 순회
    { // 순회 시작
        const event = parseJson(data); // 사건
        const delta = event?.delta as { type?: string; text?: string } | undefined; // 바뀐 부분
        if (event?.type === "content_block_delta" && delta?.type === "text_delta" && typeof delta.text === "string") // 글자 조각
        { // 조건 시작
            yield delta.text; // 조각 반환
        } // 조건 종료
        if (event?.type === "error") // 회사 오류
        { // 조건 시작
            throw new ProviderError(502, JSON.stringify(event.error ?? event).slice(0, 300)); // 오류
        } // 조건 종료
    } // 순회 종료
} // 함수 종료

async function* streamGemini(model: ResolvedModel, prompt: BuiltPrompt, fetcher: FetchLike, signal?: AbortSignal): AsyncIterable<string> // Google(Gemini)
{ // 함수 시작
    const contents = prompt.messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })); // 대화
    const body = await openStream(fetcher, `${model.baseUrl}/models/${encodeURIComponent(model.model)}:streamGenerateContent?alt=sse`, { "x-goog-api-key": model.apiKey }, { systemInstruction: { parts: [{ text: prompt.system }] }, contents, generationConfig: { maxOutputTokens: prompt.maxTokens + REASONING_HEADROOM } }, signal); // 요청
    for await (const data of readSseData(body)) // 내용 순회
    { // 순회 시작
        const event = parseJson(data); // 사건
        const candidates = event?.candidates as Array<{ content?: { parts?: Array<{ text?: unknown; thought?: unknown }> } }> | undefined; // 답 후보
        for (const part of candidates?.[0]?.content?.parts ?? []) // 조각 순회
        { // 순회 시작
            if (typeof part.text === "string" && part.thought !== true) // 답변 글자(생각 과정 제외)
            { // 조건 시작
                yield part.text; // 조각 반환
            } // 조건 종료
        } // 순회 종료
        if (event?.error !== undefined) // 회사 오류
        { // 조건 시작
            throw new ProviderError(502, JSON.stringify(event.error).slice(0, 300)); // 오류
        } // 조건 종료
    } // 순회 종료
} // 함수 종료

async function* streamOpenAI(model: ResolvedModel, prompt: BuiltPrompt, fetcher: FetchLike, signal?: AbortSignal): AsyncIterable<string> // OpenAI(GPT)와 같은 형식을 쓰는 회사
{ // 함수 시작
    const messages = [{ role: "system", content: prompt.system }, ...prompt.messages]; // 역할 글과 대화
    const body = await openStream(fetcher, `${model.baseUrl}/chat/completions`, { authorization: `Bearer ${model.apiKey}` }, { model: model.model, messages, stream: true, max_completion_tokens: prompt.maxTokens + REASONING_HEADROOM }, signal); // 요청
    for await (const data of readSseData(body)) // 내용 순회
    { // 순회 시작
        if (data === "[DONE]") // 끝 표시
        { // 조건 시작
            return; // 종료
        } // 조건 종료
        const event = parseJson(data); // 사건
        const choices = event?.choices as Array<{ delta?: { content?: unknown } }> | undefined; // 답 후보
        const content = choices?.[0]?.delta?.content; // 글자 조각
        if (typeof content === "string" && content.length > 0) // 글자 있음
        { // 조건 시작
            yield content; // 조각 반환
        } // 조건 종료
        if (event?.error !== undefined) // 회사 오류
        { // 조건 시작
            throw new ProviderError(502, JSON.stringify(event.error).slice(0, 300)); // 오류
        } // 조건 종료
    } // 순회 종료
} // 함수 종료

export function streamProviderReply(model: ResolvedModel, prompt: BuiltPrompt, fetcher: FetchLike = fetch, signal?: AbortSignal): AsyncIterable<string> // 회사에 맞는 방식으로 답 받기
{ // 함수 시작
    return model.provider === "anthropic" ? streamAnthropic(model, prompt, fetcher, signal) : model.provider === "gemini" ? streamGemini(model, prompt, fetcher, signal) : streamOpenAI(model, prompt, fetcher, signal); // 회사별 흐름
} // 함수 종료
