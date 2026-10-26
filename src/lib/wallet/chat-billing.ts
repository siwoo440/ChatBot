import type { AcceptedCaller } from "@/lib/llm/chat-request"; // 인증된 호출자
import { refuse, takeUsage } from "@/lib/llm/chat-request"; // 로컬 한도
import { readUsageLimits } from "@/lib/llm/chat-gate"; // 운영 한도
import type { ChatRequest } from "@/lib/llm/prompt-builder"; // 검증된 대화
import { createWalletGateway, getServerChatCost, readWalletMetadata, walletFingerprint } from "@/lib/wallet/server"; // 서버 계산
import { walletFailure } from "@/lib/wallet/http"; // 지갑 오류
import type { WalletGateway } from "@/lib/wallet/types"; // 연결 계약

export interface ChatBilling // 승인된 사용 예약
{ // 구조 시작
    gateway: WalletGateway; // 권한 연결
    userId: string; // 검증된 계정
    requestId: string; // 승인 번호
} // 구조 종료

export async function reserveChat(request: Request, caller: AcceptedCaller, chat: ChatRequest, payload: unknown): Promise<{ ok: true; billing: ChatBilling | null } | { ok: false; response: Response }> // 실제 대화 예약
{ // 함수 시작
    if (caller.kind === "local") // 연습용 로컬 호출
    { // 조건 시작
        const limited = takeUsage(caller, "message"); // 기존 분 한도
        return limited === null ? { ok: true, billing: null } : { ok: false, response: limited }; // 로컬 결과
    } // 조건 종료
    const gateway = createWalletGateway(); // 영속 지갑
    if (gateway === null) // 실제 계정 지갑 미설정
    { // 조건 시작
        return { ok: false, response: walletFailure("wallet-unavailable") }; // 브라우저 지갑 우회 차단
    } // 조건 종료
    const metadata = readWalletMetadata((payload as { wallet?: unknown } | null)?.wallet); // 표시용 채팅방
    const requestId = request.headers.get("x-wallet-request-id") ?? ""; // 멱등 번호
    if (metadata === null || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) // 번호·채팅방 검사
    { // 조건 시작
        return { ok: false, response: refuse(400, "bad-request") }; // 잘못된 요청
    } // 조건 종료
    const result = await gateway.command(caller.userId, "reserve", { ...metadata, requestId, fingerprint: walletFingerprint(chat, metadata), cost: getServerChatCost(chat), work: chat.story?.title ?? chat.character.name, ...readUsageLimits() }); // 서버 계산과 원자적 예약
    return result.ok ? { ok: true, billing: { gateway, userId: caller.userId, requestId } } : { ok: false, response: walletFailure(result.error) }; // 호출 승인
} // 함수 종료

export async function settleChat(billing: ChatBilling | null): Promise<Response | null> // 첫 응답 직전 확정
{ // 함수 시작
    if (billing === null) // 연습 호출
    { // 조건 시작
        return null; // 서버 차감 없음
    } // 조건 종료
    const result = await billing.gateway.command(billing.userId, "settle", { requestId: billing.requestId }); // 사용 확정
    return result.ok ? null : walletFailure(result.error); // 확정 실패 시 응답 차단
} // 함수 종료

export async function refundChat(billing: ChatBilling | null): Promise<void> // 응답 전 실패 반환
{ // 함수 시작
    if (billing !== null) // 실제 예약
    { // 조건 시작
        await billing.gateway.command(billing.userId, "refund", { requestId: billing.requestId }); // 장애 시 다음 조회에서 오래된 예약 회수
    } // 조건 종료
} // 함수 종료

export async function takeAssistUsage(caller: AcceptedCaller): Promise<Response | null> // 보조 AI 영속 한도
{ // 함수 시작
    if (caller.kind === "local") // 연습 모드
    { // 조건 시작
        return takeUsage(caller, "assist"); // 기존 로컬 분 한도
    } // 조건 종료
    const gateway = createWalletGateway(); // 실제 계정 지갑
    if (gateway === null) // 지갑 미설정
    { // 조건 시작
        return walletFailure("wallet-unavailable"); // 공개 우회 차단
    } // 조건 종료
    const result = await gateway.command(caller.userId, "assist", { ...readUsageLimits() }); // 서버에 요청 기록
    return result.ok ? null : walletFailure(result.error); // 한도 안내
} // 함수 종료
