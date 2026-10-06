// 보조 지시문: 답변 말고 실제 AI에 맡기는 작은 일(대화 요약)의 요청을 검사하고, 지시문을 만들고, 돌아온 답을 정리한다.
import type { ChatTierId, ContentRating } from "@/features/core/types"; // 도메인 타입
import type { BuiltPrompt } from "@/lib/llm/prompt-builder"; // 조립한 지시문 형식

export interface AssistLine // 대화 한 줄(말한 사람의 이름과 내용)
{ // 구조 시작
    name: string; // 말한 사람
    content: string; // 내용
} // 구조 종료

export interface SummaryRequest // 대화 요약 요청
{ // 구조 시작
    task: "summary"; // 맡길 일
    tier: ChatTierId; // 채팅 등급(이 등급의 모델이 요약함)
    contentRating: ContentRating; // 작품 이용 등급(19세 작품은 직접 돌리는 모델만)
    language: "ko" | "en"; // 요약 언어
    title: string; // 대화방 이름
    lines: AssistLine[]; // 요약할 대화(오래된 것부터)
} // 구조 종료

export type AssistRequest = SummaryRequest; // 보조 요청

export const ASSIST_LINE_LIMIT = 800; // 대화 한 줄의 최대 글자 수
export const ASSIST_LINES = 20; // 받는 대화 줄 수(넘으면 오래된 것부터 버림)
export const SUMMARY_LIMIT = 220; // 요약 최대 글자 수
export const ASSIST_TIMEOUT_MS = 30_000; // 보조 요청을 기다리는 시간(넘으면 브라우저가 연습용 규칙으로 넘어감)
const tierIds: readonly ChatTierId[] = ["open", "basic", "smart", "balance", "plus", "premium", "master"]; // 등급 목록

function isRecord(value: unknown): value is Record<string, unknown> // 객체 판정
{ // 함수 시작
    return typeof value === "object" && value !== null && !Array.isArray(value); // 객체 여부
} // 함수 종료

function text(value: unknown, limit: number): string // 글자로 읽고 길이 자르기
{ // 함수 시작
    return typeof value === "string" ? value.trim().slice(0, limit) : ""; // 글자가 아니면 빈 글
} // 함수 종료

function readLines(value: unknown): AssistLine[] // 대화 줄 읽기(빈 줄 제외, 최근 것만)
{ // 함수 시작
    const lines = Array.isArray(value) ? value.flatMap((item) => isRecord(item) && text(item.name, 40).length > 0 && text(item.content, ASSIST_LINE_LIMIT).length > 0 ? [{ name: text(item.name, 40), content: text(item.content, ASSIST_LINE_LIMIT) }] : []) : []; // 읽은 줄
    return lines.slice(-ASSIST_LINES); // 최근 줄만
} // 함수 종료

export function parseAssistRequest(value: unknown): AssistRequest | null // 요청 검사와 정리(모양이 다르면 없음)
{ // 함수 시작
    if (!isRecord(value) || value.task !== "summary" || !tierIds.includes(value.tier as ChatTierId)) // 필수 모양
    { // 조건 시작
        return null; // 거부
    } // 조건 종료
    const lines = readLines(value.lines); // 대화 줄
    if (lines.length === 0) // 요약할 대화 없음
    { // 조건 시작
        return null; // 거부
    } // 조건 종료
    return { task: "summary", tier: value.tier as ChatTierId, contentRating: value.contentRating === "mature" ? "mature" : value.contentRating === "teen" ? "teen" : "all", language: value.language === "en" ? "en" : "ko", title: text(value.title, 120), lines }; // 정리한 요청
} // 함수 종료

export function buildSummaryPrompt(request: SummaryRequest): BuiltPrompt // 대화 요약 지시문
{ // 함수 시작
    const system = [ // 역할과 규칙
        "너는 롤플레이 대화를 기록하는 서기다. 아래 대화에서 일어난 일을 2~3문장, 150자 안팎으로 요약한다.", // 역할
        "- 누가 무엇을 했는지, 관계나 상황이 어떻게 달라졌는지 사실만 적는다.", // 내용
        "- 대화에 없는 내용을 지어내지 않는다. 느낌이나 평가를 덧붙이지 않는다.", // 지어내기 금지
        "- 과거형 평서문으로 쓴다. 머리말·따옴표·목록·줄바꿈 없이 요약 문장만 쓴다.", // 형식
        request.language === "en" ? "- Write the summary in English. Keep names as they are." : "- 요약은 한국어로 쓴다.", // 언어
    ].join("\n"); // 규칙 글
    const transcript = request.lines.map((line) => `${line.name}: ${line.content}`).join("\n"); // 대화 줄
    return { system, messages: [{ role: "user", content: `${request.title.length === 0 ? "" : `대화방: ${request.title}\n\n`}${transcript}\n\n위 대화를 요약해 줘.` }], maxTokens: 300 }; // 지시문 반환(요약은 짧게만 받음)
} // 함수 종료

export function cleanSummary(raw: string, limit = SUMMARY_LIMIT): string // 요약 정리(머리말·따옴표·줄바꿈 제거, 한도를 넘으면 문장 끝에서 자름)
{ // 함수 시작
    const flat = raw.replace(/\*\*/g, "").replace(/\s+/g, " ").trim().replace(/^(요약|summary)\s*[:：]\s*/i, "").replace(/^["“'‘]+|["”'’]+$/g, "").trim(); // 한 줄로 만들고 머리말과 양끝 따옴표 제거
    if (flat.length <= limit) // 한도 안
    { // 조건 시작
        return flat; // 그대로
    } // 조건 종료
    const cut = flat.slice(0, limit); // 한도까지
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("다."), cut.lastIndexOf("! "), cut.lastIndexOf("? ")); // 마지막 문장 끝
    return end < limit / 3 ? cut.trim() : cut.slice(0, cut[end] === "다" ? end + 2 : end + 1).trim(); // 문장 끝에서 자름(너무 앞이면 한도에서 자름)
} // 함수 종료
