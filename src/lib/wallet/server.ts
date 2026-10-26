import { createHash } from "node:crypto"; // 요청 지문
import { getTierCost, USER_NOTE_EXTENDED_COST, USER_NOTE_LIMIT } from "@/features/chat/chat-tiers"; // 기존 비용표
import { readAccountServiceConfig } from "@/lib/account/account-config"; // 기존 계정 설정
import type { ChatRequest } from "@/lib/llm/prompt-builder"; // 검증된 대화
import { isWalletSnapshot } from "@/lib/wallet/validation"; // 서버 응답 검사
import { walletErrors, type WalletGateway, type WalletMetadata, type WalletResult } from "@/lib/wallet/types"; // 지갑 계약

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value); // 객체 확인

function isSecret(value: string): boolean // 서버 비밀 키 검사
{ // 함수 시작
    if (value.startsWith("sb_secret_") && value.length > 10) // 새 비밀 키
    { // 조건 시작
        return true; // 서버 키
    } // 조건 종료
    try // 예전 JWT 키 검사
    { // 시도 시작
        const parts = value.split("."); // JWT 구성
        return parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part)) && JSON.parse(Buffer.from(parts[1], "base64url").toString()).role === "service_role"; // 서버 역할만 허용
    } // 시도 종료
    catch // 잘못된 키
    { // 실패 시작
        return false; // 공개·알 수 없는 키 차단
    } // 실패 종료
} // 함수 종료

export function createWalletGateway(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = (...args) => fetch(...args)): WalletGateway | null // 서버 전용 REST 연결
{ // 함수 시작
    const config = readAccountServiceConfig({ service: env.NEXT_PUBLIC_ACCOUNT_SERVICE, url: env.NEXT_PUBLIC_SUPABASE_URL, anonKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }); // 기존 서비스 설정
    const secret = (env.SUPABASE_SECRET_KEY ?? "").trim(); // 서버 전용 비밀 값
    if (env.SERVER_WALLET_ENABLED !== "true" || config.mode !== "supabase" || !isSecret(secret)) // 설정 미완료
    { // 조건 시작
        return null; // 실제 지갑 비활성
    } // 조건 종료
    const url = new URL((env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()); // 정리 전 프로젝트 주소
    if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) // 주소 안전 검사
    { // 조건 시작
        return null; // 비밀 키 전송 차단
    } // 조건 종료
    return { // 연결 계약
        async command(userId, command, data = {}): Promise<WalletResult> // 서버 명령 실행
        { // 함수 시작
            try // 외부 요청
            { // 시도 시작
                const headers: Record<string, string> = { apikey: secret, "content-type": "application/json" }; // 비밀 키 머리말
                if (!secret.startsWith("sb_secret_")) // 예전 서비스 역할 JWT
                { // 조건 시작
                    headers.authorization = `Bearer ${secret}`; // 예전 인증 형식
                } // 조건 종료
                const response = await fetcher(`${config.url}/rest/v1/rpc/mv_wallet_command`, { method: "POST", headers, body: JSON.stringify({ p_user: userId, p_command: command, p_data: data }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) }); // 제한 시간과 고정 주소
                const result: unknown = response.ok ? await response.json() : null; // 원문 오류 비공개
                if (object(result) && result.ok === true && isWalletSnapshot(result.snapshot)) // 올바른 상태
                { // 조건 시작
                    return { ok: true, snapshot: result.snapshot }; // 검증 결과
                } // 조건 종료
                if (object(result) && result.ok === false && walletErrors.includes(result.error as never)) // 알려진 오류
                { // 조건 시작
                    return { ok: false, error: result.error as Extract<WalletResult, { ok: false }>["error"] }; // 정해진 오류만 공개
                } // 조건 종료
            } // 시도 종료
            catch // 네트워크·응답 오류
            { // 실패 시작
                return { ok: false, error: "wallet-unavailable" }; // 비밀 값 없는 실패
            } // 실패 종료
            return { ok: false, error: "wallet-unavailable" }; // 알 수 없는 응답
        }, // 함수 종료
    }; // 연결 종료
} // 함수 종료

export function getServerChatCost(chat: ChatRequest): number // 서버 검증 조건으로 비용 결정
{ // 함수 시작
    return getTierCost(chat.tier, { length: chat.options.length, thinking: chat.options.thinking }) + (chat.options.userNote.length > USER_NOTE_LIMIT ? USER_NOTE_EXTENDED_COST : 0); // 등급·길이·노트 비용
} // 함수 종료

export function readWalletMetadata(value: unknown): WalletMetadata | null // 채팅방 표시 정보 검사
{ // 함수 시작
    if (!object(value) || ![value.conversationId, value.conversationTitle, value.characterId].every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 160) || (value.versionId !== undefined && (typeof value.versionId !== "string" || value.versionId.length > 160))) // 필수·길이 검사
    { // 조건 시작
        return null; // 잘못된 정보
    } // 조건 종료
    return { conversationId: value.conversationId as string, conversationTitle: value.conversationTitle as string, characterId: value.characterId as string, ...(typeof value.versionId === "string" ? { versionId: value.versionId } : {}) }; // 허용 정보만 복사
} // 함수 종료

export function walletFingerprint(chat: ChatRequest, metadata: WalletMetadata): string // 같은 번호의 내용 변경 감지
{ // 함수 시작
    return createHash("sha256").update(JSON.stringify({ chat, metadata })).digest("hex"); // 검증된 요청 전체 지문
} // 함수 종료
