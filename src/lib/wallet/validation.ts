import { isRewardState, isTokenRecord } from "@/lib/repositories/state-validation"; // 상태 검사
import type { WalletSnapshot } from "@/lib/wallet/types"; // 서버 상태 타입

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value); // 객체 검사
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0; // 안전한 수량

export function isWalletSnapshot(value: unknown): value is WalletSnapshot // 서버 지갑 응답 검사
{ // 함수 시작
    if (!object(value) || !object(value.wallet) || !count(value.revision) || !Array.isArray(value.records) || !isRewardState(value.rewards)) // 필수 구조
    { // 조건 시작
        return false; // 잘못된 상태
    } // 조건 종료
    const wallet = value.wallet; // 지갑
    return [wallet.balance, wallet.totalUsed, wallet.dailyChatUsed, wallet.dailyImageUsed].every(count) && typeof wallet.updatedAt === "string" && Number.isFinite(Date.parse(wallet.updatedAt)) && value.records.length <= 300 && value.records.every(isTokenRecord); // 수량·시각·기록 확인
} // 함수 종료
