import { createTokenVerifier } from "@/lib/llm/chat-caller"; // 실제 계정 검증
import { refuse } from "@/lib/llm/chat-request"; // 공통 오류
import { createWalletGateway } from "@/lib/wallet/server"; // 서버 지갑 연결
import type { WalletError, WalletGateway } from "@/lib/wallet/types"; // 지갑 계약

export function walletFailure(error: WalletError): Response // 지갑 오류 응답
{ // 함수 시작
    const status = error === "insufficient-token" ? 402 : ["rate-limited", "daily-limit", "service-limit"].includes(error) ? 429 : error === "wallet-unavailable" ? 503 : error === "bad-request" ? 400 : 409; // 오류별 상태
    const untilTomorrow = Math.max(1, Math.ceil((86400000 - ((Date.now() + 9 * 3600000) % 86400000)) / 1000)); // 한국 자정까지 남은 초
    return Response.json({ error, detail: "" }, { status, headers: { "cache-control": "no-store", ...(status === 429 ? { "retry-after": error === "rate-limited" ? "60" : String(untilTomorrow) } : {}) } }); // 정제된 실패
} // 함수 종료

export async function openWallet(request: Request): Promise<{ ok: true; userId: string; gateway: WalletGateway } | { ok: false; response: Response }> // 인증된 지갑 열기
{ // 함수 시작
    const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1]; // 요청 출입증
    if (token === undefined) // 로그인 누락
    { // 조건 시작
        return { ok: false, response: refuse(401, "login-required") }; // 손님 차단
    } // 조건 종료
    const gateway = createWalletGateway(); // 서버 연결
    const verify = createTokenVerifier(process.env, (...args) => fetch(...args), () => Date.now(), 0); // 캐시 없는 계정 확인
    if (gateway === null || verify === null) // 연결 설정 누락
    { // 조건 시작
        return { ok: false, response: walletFailure("wallet-unavailable") }; // 실제 지갑 사용 차단
    } // 조건 종료
    const user = await verify(token); // 서버 검증
    return user.ok ? { ok: true, userId: user.userId, gateway } : { ok: false, response: refuse(user.reason === "invalid" ? 401 : 503, user.reason === "invalid" ? "login-required" : "auth-unavailable") }; // 본인 식별자만 반환
} // 함수 종료
