import { describe, expect, it, vi } from "vitest"; // 테스트 도구
import { createWalletGateway, getServerChatCost, readWalletMetadata } from "@/lib/wallet/server"; // 서버 지갑
import { createInitialState } from "@/features/core/initial-state"; // 검증 상태
import { parseChatRequest } from "@/lib/llm/prompt-builder"; // 서버 요청 검사

const env = { SERVER_WALLET_ENABLED: "true", NEXT_PUBLIC_ACCOUNT_SERVICE: "supabase", NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_public", SUPABASE_SECRET_KEY: "sb_secret_server-only" }; // 공개·비밀 설정
const state = createInitialState(); // 기본 상태
const snapshot = { wallet: state.wallet, records: [], rewards: state.rewards, revision: 1 }; // 서버 결과

describe("서버 지갑 연결", () => // 검증 묶음
{ // 묶음 시작
    it("꺼진 설정과 공개 키를 비밀 키로 잘못 넣은 설정은 외부 요청 없이 차단", () => // 설정 오류
    { // 검증 시작
        expect(createWalletGateway({ ...env, SERVER_WALLET_ENABLED: "false" })).toBeNull(); // 스위치
        expect(createWalletGateway({ ...env, SUPABASE_SECRET_KEY: "sb_publishable_wrong" })).toBeNull(); // 공개 키 거절
        expect(createWalletGateway({ ...env, NEXT_PUBLIC_SUPABASE_URL: "http://test.supabase.co" })).toBeNull(); // 암호화 없는 외부 주소 거절
        expect(createWalletGateway({ ...env, NEXT_PUBLIC_SUPABASE_URL: "https://user:pass@test.supabase.co?bad=1" })).toBeNull(); // 인증 정보·쿼리 거절
    }); // 검증 종료

    it("반환 원장도 서버 결과로 읽을 수 있음", async () => // 반환 내역
    { // 검증 시작
        const result = { ...snapshot, records: [{ id: "server-refund", direction: "earn", source: "refund", label: "응답 전 실패 토큰 반환", amount: 3, balance: 5, createdAt: "2026-10-26T00:00:00.000Z" }] }; // 반환 원장
        const gateway = createWalletGateway(env, async () => Response.json({ ok: true, snapshot: result }))!; // REST 연결
        expect(await gateway.command("user", "read")).toEqual({ ok: true, snapshot: result }); // 반환 기록 유지
    }); // 검증 종료

    it("서버 비밀 키만 RPC에 전달하고 사용자 식별자·명령을 명시", async () => // 비밀 키 경계
    { // 검증 시작
        const fetcher = vi.fn(async () => Response.json({ ok: true, snapshot })); // REST 응답
        const result = await createWalletGateway(env, fetcher)!.command("verified-user", "read"); // 조회
        expect(result).toEqual({ ok: true, snapshot }); // 검증 결과
        const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]; // 전송 내용
        expect(url).toBe("https://test.supabase.co/rest/v1/rpc/mv_wallet_command"); // 고정 RPC
        expect(init.headers).toMatchObject({ apikey: "sb_secret_server-only" }); // 서버 전용 키
        expect(init.headers).not.toHaveProperty("authorization"); // 사용자 토큰과 비밀 키 혼용 차단
        expect(JSON.parse(init.body as string)).toEqual({ p_user: "verified-user", p_command: "read", p_data: {} }); // 권한 주체
        expect(init.redirect).toBe("error"); // 외부 리다이렉트 차단
    }); // 검증 종료

    it("DB 장애와 잘못된 반환은 비밀 값 없이 실패 처리", async () => // 오류 정제
    { // 검증 시작
        const failed = createWalletGateway(env, async () => Response.json({ message: "sb_secret_hidden" }, { status: 500 }))!; // DB 오류
        expect(await failed.command("user", "read")).toEqual({ ok: false, error: "wallet-unavailable" }); // 원문 차단
        const invalid = createWalletGateway(env, async () => Response.json({ ok: true, snapshot: { ...snapshot, wallet: { balance: -10 } } }))!; // 잘못된 지갑
        expect(await invalid.command("user", "read")).toEqual({ ok: false, error: "wallet-unavailable" }); // 잘못된 결과 차단
    }); // 검증 종료

    it("비용은 클라이언트 cost와 다른 서버 등급·길이·노트 기준으로 계산", () => // 비용 권한
    { // 검증 시작
        const chat = parseChatRequest({ tier: "plus", character: { name: "하린" }, messages: [{ role: "user", content: "안녕" }], options: { length: 1.5, userNote: "가".repeat(501), cost: 0 } })!; // 조작한 비용
        expect(getServerChatCost(chat)).toBe(5); // 기본 3·길이 1·노트 1
    }); // 검증 종료

    it("채팅방 메타데이터의 식별자와 표시 이름을 제한", () => // 입력 검사
    { // 검증 시작
        expect(readWalletMetadata({ conversationId: "room & one", conversationTitle: "퇴근길", characterId: "harin", versionId: "v1" })).toEqual({ conversationId: "room & one", conversationTitle: "퇴근길", characterId: "harin", versionId: "v1" }); // 이름 보존
        expect(readWalletMetadata({ conversationId: "", conversationTitle: "" })).toBeNull(); // 누락 거절
        expect(readWalletMetadata({ conversationId: "a".repeat(161), conversationTitle: "방", characterId: "harin" })).toBeNull(); // 과한 식별자 거절
    }); // 검증 종료
}); // 묶음 종료
