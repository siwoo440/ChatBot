import type { RewardState, TokenRecord, TokenWallet } from "@/features/core/types"; // 화면 지갑 타입

export interface WalletSnapshot // 서버 권한 상태
{ // 구조 시작
    wallet: TokenWallet; // 서버 잔액
    records: TokenRecord[]; // 최근 거래
    rewards: RewardState; // 서버 확인 보상 실적
    revision: number; // 상태 변경 순서
} // 구조 종료

export interface WalletMetadata // 사용한 채팅방
{ // 구조 시작
    conversationId: string; // 채팅방 식별자
    conversationTitle: string; // 사용 당시 이름
    characterId: string; // 연결 캐릭터
    versionId?: string; // 사용한 버전
} // 구조 종료

export const walletErrors = ["wallet-unavailable", "insufficient-token", "duplicate-request", "request-conflict", "request-closed", "rate-limited", "daily-limit", "service-limit", "reward-unavailable", "bad-request"] as const; // 공개 오류 목록
export type WalletError = typeof walletErrors[number]; // 공개 오류 타입
export type WalletCommand = "read" | "reserve" | "settle" | "refund" | "assist" | "reward"; // 서버 명령
export type WalletResult = { ok: true; snapshot: WalletSnapshot } | { ok: false; error: WalletError }; // 명령 결과

export interface WalletGateway // 영속 지갑 계약
{ // 구조 시작
    command(userId: string, command: WalletCommand, data?: Record<string, unknown>): Promise<WalletResult>; // 서버 권한 명령
} // 구조 종료
