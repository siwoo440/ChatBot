import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { GET as readWallet, POST as claimWallet } from "@/app/api/wallet/route"; // 지갑 API
import { POST as chat } from "@/app/api/chat/route"; // 대화 API
import { POST as assist } from "@/app/api/chat/assist/route"; // 보조 API
import { identifyCaller, resetCallerCache } from "@/lib/llm/chat-caller"; // 계정 판정
import { createInitialState } from "@/features/core/initial-state"; // 기본 보상

const userId = "11111111-1111-4111-8111-111111111111"; // 검증된 계정
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; // 요청 번호
const state = createInitialState(); // 기본 상태
const snapshot = { wallet: { ...state.wallet, balance: 50 }, records: [], rewards: state.rewards, revision: 1 }; // 서버 상태
const metadata = { conversationId: "room-1", conversationTitle: "퇴근길", characterId: "harin", versionId: "v1" }; // 채팅방 표시
const payload = { tier: "open", character: { name: "하린" }, story: null, messages: [{ role: "user", content: "안녕" }], options: { length: 1 }, wallet: metadata }; // 올바른 대화
let commands: Array<{ p_user: string; p_command: string; p_data: Record<string, unknown> }>; // RPC 호출 기록
let providerCalls: number; // 실제 AI 호출 수
let provider: () => Response; // 실제 AI 대역
let refusal: string | null; // 예약 거절 사유

function request(path: string, body?: unknown, signed = true): Request // API 요청
{ // 함수 시작
    return new Request(`http://localhost:3107${path}`, { method: body === undefined ? "GET" : "POST", headers: { host: "localhost:3107", "content-type": "application/json", "x-wallet-request-id": requestId, ...(signed ? { authorization: "Bearer user-token" } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); // 로컬 실제 계정 요청
} // 함수 종료

beforeEach(() => // 설정 준비
{ // 준비 시작
    commands = []; // 호출 초기화
    providerCalls = 0; // 비용 호출 초기화
    refusal = null; // 정상 예약
    resetCallerCache(); // 인증 캐시 초기화
    const values = { ENABLE_REAL_PROVIDERS: "true", CHAT_MODEL_OPEN: "qwen3:14b", CHAT_ALLOW_PUBLIC: "false", NEXT_PUBLIC_ACCOUNT_SERVICE: "supabase", NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_public", SERVER_WALLET_ENABLED: "true", SUPABASE_SECRET_KEY: "sb_secret_server-only" }; // 실제 계정 모형
    Object.entries(values).forEach(([key, value]) => vi.stubEnv(key, value)); // 환경 주입
    provider = () => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: "안녕" } }] })}\n\ndata: [DONE]\n\n`); // 정상 응답
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => // 서버 연결 대역
    { // 대역 시작
        if (String(url).endsWith("/auth/v1/user")) // 로그인 검증
        { // 조건 시작
            return Response.json({ id: userId }); // 실제 검증 계정
        } // 조건 종료
        if (String(url).endsWith("/rpc/mv_wallet_command")) // 지갑 명령
        { // 조건 시작
            const command = JSON.parse(init!.body as string); // RPC 본문
            commands.push(command); // 기록
            return Response.json(refusal && command.p_command === "reserve" ? { ok: false, error: refusal } : { ok: true, snapshot }); // 서버 결과
        } // 조건 종료
        providerCalls += 1; // 실제 AI 진입 기록
        return provider(); // 모델 대역
    })); // 대역 종료
}); // 준비 종료

afterEach(() => // 테스트 정리
{ // 정리 시작
    vi.unstubAllEnvs(); // 환경 복원
    vi.unstubAllGlobals(); // 연결 복원
    resetCallerCache(); // 인증 복원
}); // 정리 종료

describe("서버 지갑과 채팅 연결", () => // 검증 묶음
{ // 묶음 시작
    it("실제 계정 모드는 로컬 주소에서도 로그인 검증을 생략하지 않음", async () => // 로컬 우회 방지
    { // 검증 시작
        expect(await identifyCaller(request("/api/chat"))).toEqual({ kind: "member", userId }); // 계정 소유자
        expect(await identifyCaller(request("/api/chat", undefined, false))).toMatchObject({ kind: "refused", code: "login-required" }); // 로그인 필요
    }); // 검증 종료

    it("공개 모드는 로컬 Host를 붙여도 로그인 우회 불가", async () => // Host 위조 경계
    { // 검증 시작
        vi.stubEnv("CHAT_ALLOW_PUBLIC", "true"); // 공개 환경 모형
        vi.stubEnv("NEXT_PUBLIC_ACCOUNT_SERVICE", "practice"); // 잘못된 계정 설정 모형
        expect(await identifyCaller(request("/api/chat", undefined, false))).toMatchObject({ kind: "refused", code: "login-required" }); // 로컬 Host 우회 차단
    }); // 검증 종료

    it("지갑 조회는 로그인 필수이며 서버에서 확인한 계정만 사용", async () => // 조회 인증
    { // 검증 시작
        expect((await readWallet(request("/api/wallet", undefined, false))).status).toBe(401); // 손님 차단
        expect((await readWallet(request("/api/wallet"))).status).toBe(200); // 본인 조회
        expect(commands[0]).toEqual({ p_user: userId, p_command: "read", p_data: {} }); // 서버 소유자
    }); // 검증 종료

    it("보상량과 사용자 ID를 브라우저에서 지정할 수 없음", async () => // 지급 권한
    { // 검증 시작
        const response = await claimWallet(request("/api/wallet", { reward: "attendance", userId: "victim", amount: 99999 })); // 조작 시도
        expect(response.status).toBe(200); // 정상 출석만
        expect(commands[0]).toEqual({ p_user: userId, p_command: "reward", p_data: { reward: "attendance" } }); // 허용 데이터만
    }); // 검증 종료

    it("첫 응답 전에 서버 비용으로 예약·확정한 뒤 내용 반환", async () => // 정상 사용
    { // 검증 시작
        const response = await chat(request("/api/chat", payload)); // 대화 요청
        expect(await response.text()).toBe("안녕"); // 실제 응답
        expect(commands.map((item) => item.p_command)).toEqual(["reserve", "settle"]); // 처리 순서
        expect(commands[0]).toMatchObject({ p_user: userId, p_data: { requestId, cost: 1, ...metadata } }); // 서버 계산과 방 정보
        expect(providerCalls).toBe(1); // 실제 호출 한 번
    }); // 검증 종료

    it("예약 거절은 실제 AI 호출 전에 종료", async () => // 중복·잔액
    { // 검증 시작
        refusal = "duplicate-request"; // 중복 모형
        const response = await chat(request("/api/chat", payload)); // 재전송
        expect(response.status).toBe(409); // 중복 안내
        expect(providerCalls).toBe(0); // 외부 비용 방지
        expect(commands.map((item) => item.p_command)).toEqual(["reserve"]); // 추가 명령 없음
    }); // 검증 종료

    it("비밀 키 누락과 채팅방 정보 누락은 실제 호출 없이 거절", async () => // 설정·입력
    { // 검증 시작
        vi.stubEnv("SUPABASE_SECRET_KEY", ""); // 미설정
        expect((await chat(request("/api/chat", payload))).status).toBe(503); // 설정 안내
        vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_server-only"); // 설정 복원
        expect((await chat(request("/api/chat", { ...payload, wallet: null }))).status).toBe(400); // 채팅방 정보 필요
        expect(providerCalls).toBe(0); // 비용 없음
    }); // 검증 종료

    it("응답 전 회사 오류와 빈 응답은 예약을 반환", async () => // 자동 반환
    { // 검증 시작
        provider = () => new Response("error", { status: 500 }); // 회사 오류
        expect((await chat(request("/api/chat", payload))).status).toBe(502); // 오류 안내
        expect(commands.map((item) => item.p_command)).toEqual(["reserve", "refund"]); // 반환 실행
        commands = []; // 다음 모형
        provider = () => new Response("data: [DONE]\n\n"); // 빈 응답
        expect((await chat(request("/api/chat", payload))).status).toBe(502); // 빈 응답 안내
        expect(commands.map((item) => item.p_command)).toEqual(["reserve", "refund"]); // 빈 응답 반환
    }); // 검증 종료

    it("보조 AI도 DB에 요청 한도를 기록", async () => // 보조 우회 방지
    { // 검증 시작
        provider = () => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: "대화 요약" } }] })}\n\ndata: [DONE]\n\n`); // 요약 답변
        await assist(request("/api/chat/assist", { task: "summary", tier: "open", title: "대화", lines: [{ name: "사용자", content: "안녕" }] })); // 보조 요청
        expect(commands.map((item) => item.p_command)).toEqual(["assist"]); // 영속 분 한도
    }); // 검증 종료
}); // 묶음 종료
