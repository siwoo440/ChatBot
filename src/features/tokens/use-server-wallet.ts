"use client"; // 브라우저 상태

import { useCallback, useEffect, useRef, useState } from "react"; // 비동기 상태 도구
import { useAccountSession } from "@/features/account/use-account-session"; // 현재 계정
import { getAccountServiceConfig } from "@/lib/account/account-config"; // 서비스 방식
import { getAccessTokenHeaders } from "@/lib/account/access-token"; // 계정 출입증
import { WALLET_CHANGED_EVENT } from "@/lib/wallet/events"; // 재조회 알림
import { isWalletSnapshot } from "@/lib/wallet/validation"; // 응답 검사
import type { WalletSnapshot } from "@/lib/wallet/types"; // 서버 상태

export const emptyServerWallet: WalletSnapshot = { revision: 0, wallet: { balance: 0, totalUsed: 0, dailyChatUsed: 0, dailyImageUsed: 0, updatedAt: "1970-01-01T00:00:00.000Z" }, records: [], rewards: { attendance: { lastDate: null, cycleDay: 0, totalDays: 0 }, missions: { dateKey: null, progress: {}, claimed: [], bonusClaimed: false }, totalEarned: 0 } }; // 시험 잔액 없는 대기 상태
type Status = "loading" | "ready" | "error"; // 연결 상태
interface LoadedWallet // 계정별 조회 결과
{ // 구조 시작
    owner: string | null; // 결과의 계정
    snapshot: WalletSnapshot | null; // 마지막 서버 상태
    status: Status; // 조회 상태
    notice: string; // 안내
} // 구조 종료

export function useServerWallet() // 실제 계정의 읽기 전용 지갑
{ // 함수 시작
    const session = useAccountSession(); // 로그인 계정
    const managed = getAccountServiceConfig().mode === "supabase"; // 실제 계정 모드
    const owner = managed ? session?.accountId ?? null : null; // 계정 식별자
    const generation = useRef(0); // 계정 전환 세대
    const [loaded, setLoaded] = useState<LoadedWallet>({ owner: null, snapshot: null, status: "loading", notice: "" }); // 조회 결과
    const [busy, setBusy] = useState(false); // 보상 처리 중
    const request = useCallback(async (reward?: string): Promise<boolean> => // 서버 지갑 읽기·수령
    { // 함수 시작
        if (owner === null) // 로그인하지 않음
        { // 조건 시작
            return false; // 요청 생략
        } // 조건 종료
        const ticket = generation.current; // 요청 당시 계정 세대
        try // 조회 시도
        { // 시도 시작
            const headers = await getAccessTokenHeaders(); // 현재 출입증
            if (ticket !== generation.current) // 출입증 대기 중 계정 변경
            { // 조건 시작
                return false; // 타 계정 요청 생략
            } // 조건 종료
            const response = await fetch("/api/wallet", { method: reward === undefined ? "GET" : "POST", headers: { ...headers, "content-type": "application/json" }, cache: "no-store", ...(reward === undefined ? {} : { body: JSON.stringify({ reward }) }), signal: AbortSignal.timeout(12000) }); // 서버 권한 지갑
            const body: unknown = await response.json(); // 결과 읽기
            if (ticket !== generation.current) // 이전 계정 응답
            { // 조건 시작
                return false; // 상태 반영 차단
            } // 조건 종료
            if (!response.ok || !isWalletSnapshot(body)) // 조회 실패
            { // 조건 시작
                throw new Error(response.status === 401 ? "login-required" : "wallet-unavailable"); // 정제된 실패
            } // 조건 종료
            setLoaded((current) => ({ owner, snapshot: current.owner === owner && current.snapshot !== null && current.snapshot.revision > body.revision ? current.snapshot : body, status: "ready", notice: "" })); // 오래된 응답 덮어쓰기 차단
            return true; // 서버 처리 완료
        } // 시도 종료
        catch (error) // 연결 실패
        { // 실패 시작
            if (ticket === generation.current) // 같은 계정 요청
            { // 조건 시작
                setLoaded((current) => ({ owner, snapshot: current.owner === owner ? current.snapshot : null, status: "error", notice: error instanceof Error && error.message === "login-required" ? "로그인이 만료됐어요. 다시 로그인해 주세요." : "서버 토큰을 불러오거나 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요." })); // 마지막 확인값과 실패 안내
            } // 조건 종료
            return false; // 성공 안내 금지
        } // 실패 종료
    }, [owner]); // 계정별 요청
    const refreshWallet = useCallback(async () => // 다시 읽기
    { // 함수 시작
        await request(); // 서버 최신 상태
    }, [request]); // 함수 종료
    const claimReward = useCallback(async (reward: string): Promise<boolean> => // 실제 보상 수령
    { // 함수 시작
        setBusy(true); // 처리 표시
        try // 수령 시도
        { // 시도 시작
            return await request(reward); // 서버 검증
        } // 시도 종료
        finally // 처리 정리
        { // 정리 시작
            setBusy(false); // 처리 해제
        } // 정리 종료
    }, [request]); // 계정별 수령
    useEffect(() => // 계정 연결과 재조회
    { // 효과 시작
        generation.current += 1; // 이전 계정 요청 무효화
        if (!managed || owner === null) // 연습 또는 손님
        { // 조건 시작
            return; // 외부 연결 생략
        } // 조건 종료
        void refreshWallet(); // 최초 서버 확인
        const refresh = () => // 화면 복귀·사용 종료
        { // 함수 시작
            void refreshWallet(); // 비동기 재조회
        }; // 함수 종료
        window.addEventListener(WALLET_CHANGED_EVENT, refresh); // 사용 종료
        window.addEventListener("focus", refresh); // 다른 컴퓨터 사용 후 복귀
        const timer = window.setInterval(refresh, 60000); // 다른 기기 사용량 재조회
        return () => // 계정 전환·화면 정리
        { // 정리 시작
            generation.current += 1; // 늦은 응답 차단
            window.removeEventListener(WALLET_CHANGED_EVENT, refresh); // 알림 해제
            window.removeEventListener("focus", refresh); // 복귀 감지 해제
            window.clearInterval(timer); // 주기 조회 해제
        }; // 정리 종료
    }, [managed, owner, refreshWallet]); // 연결 의존
    const current = loaded.owner === owner && owner !== null ? loaded : null; // 현재 계정만 선택
    return { managed, snapshot: current?.snapshot ?? emptyServerWallet, walletStatus: owner === null ? "login" : current?.status ?? "loading", walletNotice: current?.notice ?? "", walletBusy: busy, refreshWallet, claimReward }; // 읽기 전용 상태
} // 함수 종료
