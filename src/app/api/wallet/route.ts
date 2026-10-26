import { openWallet, walletFailure } from "@/lib/wallet/http"; // 인증과 오류
import { refuse } from "@/lib/llm/chat-request"; // 정제된 오류

export const runtime = "nodejs"; // 서버 실행
export const dynamic = "force-dynamic"; // 계정별 새 조회
const rewards = new Set(["attendance", "send-messages", "start-conversation", "weekly-messages", "weekly-conversations", "weekly-attendance"]); // 서버 증거가 있는 보상

export async function GET(request: Request): Promise<Response> // 본인 지갑 조회
{ // 함수 시작
    const caller = await openWallet(request); // 인증
    if (!caller.ok) // 연결 거절
    { // 조건 시작
        return caller.response; // 이유 반환
    } // 조건 종료
    const result = await caller.gateway.command(caller.userId, "read"); // 본인 서버 상태
    return result.ok ? Response.json(result.snapshot, { headers: { "cache-control": "no-store" } }) : walletFailure(result.error); // 최신 지갑
} // 함수 종료

export async function POST(request: Request): Promise<Response> // 보상 수령
{ // 함수 시작
    const caller = await openWallet(request); // 인증
    if (!caller.ok) // 연결 거절
    { // 조건 시작
        return caller.response; // 이유 반환
    } // 조건 종료
    let body: { reward?: unknown }; // 허용 본문
    try // 본문 읽기
    { // 시도 시작
        const raw = await request.text(); // 요청 내용
        if (raw.length > 2048) // 과한 요청
        { // 조건 시작
            return refuse(413, "too-large"); // 크기 거절
        } // 조건 종료
        body = JSON.parse(raw) as typeof body; // JSON 해석
    } // 시도 종료
    catch // 잘못된 JSON
    { // 실패 시작
        return refuse(400, "bad-request"); // 입력 오류
    } // 실패 종료
    if (typeof body?.reward !== "string" || !rewards.has(body.reward)) // 보상 종류 검사
    { // 조건 시작
        return refuse(409, "reward-unavailable"); // 미검증 보상 거절
    } // 조건 종료
    const result = await caller.gateway.command(caller.userId, "reward", { reward: body.reward }); // 수량·계정은 서버에서 결정
    return result.ok ? Response.json(result.snapshot, { headers: { "cache-control": "no-store" } }) : walletFailure(result.error); // 검증된 최신 상태
} // 함수 종료
