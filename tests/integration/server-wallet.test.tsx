import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"; // 화면 검증
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"; // 테스트 도구
import { AppProvider, useAppStore } from "@/features/core/AppProvider"; // 전역 상태
import { createInitialState } from "@/features/core/initial-state"; // 기본 상태
import { TokenSettings } from "@/features/settings/TokenSettings"; // 지갑 화면
import { RewardsScreen } from "@/features/rewards/RewardsScreen"; // 보상 화면
import type { AccountSession } from "@/lib/account/account-session"; // 계정 타입

const config = vi.hoisted(() => ({ mode: "supabase", url: "https://test.supabase.co", anonKey: "public" })); // 실제 계정 모형
const session = vi.hoisted(() => ({ current: { accountId: "user-one", name: "사용자", email: "user@example.com", provider: "email", signedInAt: "2026-10-26T00:00:00Z" } as AccountSession | null })); // 현재 계정
vi.mock("@/lib/account/account-config", () => ({ getAccountServiceConfig: () => config })); // 외부 설정 대체
vi.mock("@/features/account/use-account-session", () => ({ useAccountSession: () => session.current })); // 현재 계정 대체
vi.mock("@/lib/account/access-token", () => ({ getAccessTokenHeaders: async () => ({ authorization: "Bearer verified" }) })); // 출입증 대체
const initial = createInitialState(); // 시험 지갑 포함 상태
const snapshot = { revision: 2, wallet: { ...initial.wallet, balance: 7 }, records: [], rewards: initial.rewards }; // 서버 지갑
const repository = { load: () => structuredClone(initial), save: vi.fn() }; // 로컬 저장 대역

function Probe() // 표시 지갑과 가져오기
{ // 함수 시작
    const { state, dispatch } = useAppStore(); // 실제 표시 상태
    return <><output aria-label="잔액">{state.wallet.balance}</output><button onClick={() => dispatch({ type: "replace-state", state: { ...state, wallet: { ...state.wallet, balance: 999999 } } })}>백업 가져오기</button></>; // 조작한 백업
} // 함수 종료

beforeEach(() => // 초기 준비
{ // 준비 시작
    session.current = { accountId: "user-one", name: "사용자", email: "user@example.com", provider: "email", signedInAt: "2026-10-26T00:00:00Z" }; // 계정 초기화
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(snapshot))); // 서버 상태
}); // 준비 종료

afterEach(() => // 대역 정리
{ // 정리 시작
    vi.unstubAllGlobals(); // 연결 대역 해제
}); // 정리 종료

describe("실제 계정 지갑 화면", () => // 검증 묶음
{ // 묶음 시작
    it("서버 잔액을 표시하고 백업 복원으로 잔액을 변경하지 못함", async () => // 권한 분리
    { // 검증 시작
        render(<AppProvider repository={repository}><Probe /></AppProvider>); // 상태 공급
        await waitFor(() => expect(screen.getByLabelText("잔액")).toHaveTextContent(/^7$/)); // 서버 기준
        fireEvent.click(screen.getByRole("button", { name: "백업 가져오기" })); // 가져오기
        expect(screen.getByLabelText("잔액")).toHaveTextContent(/^7$/); // 서버 잔액 유지
    }); // 검증 종료

    it("지갑 연결 실패 시 시험 잔액을 표시하지 않고 오류와 다시 시도 제공", async () => // 연결 장애
    { // 검증 시작
        vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "wallet-unavailable" }, { status: 503 }))); // 서버 실패
        render(<AppProvider repository={repository}><TokenSettings /><Probe /></AppProvider>); // 토큰 화면
        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("서버 토큰")); // 장애 안내
        expect(screen.getByLabelText("잔액")).toHaveTextContent(/^0$/); // 시험 잔액 차단
        expect(screen.getByRole("button", { name: "잔액 새로고침" })).toBeVisible(); // 복구 경로
    }); // 검증 종료

    it("계정 전환 후 늦게 도착한 이전 계정 잔액을 무시", async () => // 비동기 격리
    { // 검증 시작
        let finish: (response: Response) => void = () => undefined; // 이전 요청 완료
        vi.stubGlobal("fetch", vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })).mockResolvedValue(Response.json({ ...snapshot, wallet: { ...snapshot.wallet, balance: 20 } }))); // 응답 순서
        const view = render(<AppProvider repository={repository}><Probe /></AppProvider>); // 첫 계정
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); // 첫 요청 시작
        session.current = { ...session.current!, accountId: "user-two" }; // 계정 전환
        view.rerender(<AppProvider repository={repository}><Probe /></AppProvider>); // 새 계정 반영
        await waitFor(() => expect(screen.getByLabelText("잔액")).toHaveTextContent(/^20$/)); // 새 계정 상태
        await act(async () => finish(Response.json(snapshot))); // 이전 응답 도착
        expect(screen.getByLabelText("잔액")).toHaveTextContent(/^20$/); // 타 계정 표시 방지
    }); // 검증 종료

    it("보상 실패를 수령 성공으로 알리지 않음", async () => // 거짓 수령 안내 방지
    { // 검증 시작
        vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => init?.method === "POST" ? Response.json({ error: "wallet-unavailable" }, { status: 503 }) : Response.json(snapshot))); // 조회 성공·수령 실패
        render(<AppProvider repository={repository}><RewardsScreen /></AppProvider>); // 보상 화면
        await waitFor(() => expect(screen.getByText("서버 계정 지갑")).toBeVisible()); // 실제 지갑 준비
        fireEvent.click(screen.getByRole("button", { name: "출석하기 · +5토큰" })); // 출석 시도
        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("서버 토큰")); // 실패 안내
        expect(screen.queryByText(/도장을 찍고 .*받았습니다/)).toBeNull(); // 수령 성공 오안내 차단
    }); // 검증 종료
}); // 묶음 종료
