import { beforeEach, describe, expect, it } from "vitest"; // 테스트 도구
import { readAccountServiceConfig } from "@/lib/account/account-config"; // 계정 서비스 설정
import { createSupabaseAuthAdapter, createSupabaseSnapshotStore, SUPABASE_TOKENS_KEY, SUPABASE_VERIFIER_KEY } from "@/lib/account/supabase-account"; // Supabase 연결

const config = { mode: "supabase" as const, url: "https://demo.supabase.co", anonKey: "public-anon-key" }; // 시험용 설정(가짜 주소와 공개 키)
const userId = "0a1b2c3d-1111-2222-3333-444455556666"; // 가짜 서버의 사용자 식별자

interface Call { url: string; method: string; headers: Record<string, string>; body: unknown } // 가짜 서버가 받은 요청

class FakeSupabase // 가짜 Supabase(로그인과 저장본 표만 흉내 냄)
{ // 클래스 시작
    public calls: Call[] = []; // 받은 요청
    public row: { user_id: string; revision: number; state: string; device_id: string; updated_at: string } | null = null; // 저장본 표의 내 줄
    public confirmEmail = false; // 가입할 때 메일 확인이 필요한지
    public accessToken = "access-1"; // 지금 유효한 출입증
    public refreshes = 0; // 출입증을 새로 받은 횟수

    private session(email: string, provider = "email", name?: string): Record<string, unknown> // 로그인 결과
    { // 함수 시작
        return { access_token: this.accessToken, refresh_token: "refresh-1", expires_in: 3600, user: { id: userId, email, app_metadata: { provider }, user_metadata: name === undefined ? {} : { full_name: name } } }; // 세션 반환
    } // 함수 종료

    public fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => // 가짜 요청 처리
    { // 함수 시작
        const url = String(input); // 주소
        const body: unknown = typeof init.body === "string" ? JSON.parse(init.body) : null; // 내용
        const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>).map(([key, value]) => [key.toLowerCase(), value])); // 머리말
        this.calls.push({ url, method: init.method ?? "GET", headers, body }); // 기록
        const json = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); // JSON 응답
        const record = body as Record<string, string> | null; // 내용 읽기
        if (url.endsWith("/auth/v1/settings")) // 켜 둔 로그인 방법
        { // 조건 시작
            return json(200, { external: { google: true, kakao: false, email: true, github: true } }); // Google만 켬
        } // 조건 종료
        if (url.endsWith("/auth/v1/token?grant_type=password")) // 이메일 로그인
        { // 조건 시작
            return record?.password === "right-password-1" ? json(200, this.session(record.email)) : record?.email === "unconfirmed@example.com" ? json(400, { code: 400, error_code: "email_not_confirmed", msg: "Email not confirmed" }) : json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }); // 결과
        } // 조건 종료
        if (url.endsWith("/auth/v1/signup")) // 회원가입
        { // 조건 시작
            return record?.email === "taken@example.com" ? json(422, { code: 422, error_code: "user_already_exists", msg: "User already registered" }) : this.confirmEmail ? json(200, { id: userId, email: record?.email, confirmation_sent_at: "2026-10-06T00:00:00Z" }) : json(200, this.session(record?.email ?? "")); // 결과
        } // 조건 종료
        if (url.endsWith("/auth/v1/token?grant_type=pkce")) // 간편 로그인 마무리
        { // 조건 시작
            return record?.auth_code === "good-code" && typeof record.code_verifier === "string" && record.code_verifier.length >= 43 ? json(200, this.session("soha@example.com", "google", "소하")) : json(400, { error_code: "bad_code_verifier" }); // 결과
        } // 조건 종료
        if (url.endsWith("/auth/v1/token?grant_type=refresh_token")) // 출입증 새로 받기
        { // 조건 시작
            this.refreshes += 1; // 횟수
            this.accessToken = `access-${this.refreshes + 1}`; // 새 출입증
            return record?.refresh_token === "refresh-1" ? json(200, this.session("soha@example.com")) : json(400, { error_code: "refresh_token_not_found" }); // 결과
        } // 조건 종료
        if (url.endsWith("/auth/v1/logout")) // 로그아웃
        { // 조건 시작
            return new Response(null, { status: 204 }); // 완료
        } // 조건 종료
        if (url.includes("/rest/v1/mv_snapshots")) // 저장본 표
        { // 조건 시작
            if (headers.authorization !== `Bearer ${this.accessToken}`) // 출입증이 다름
            { // 조건 시작
                return json(401, { message: "JWT expired" }); // 거절
            } // 조건 종료
            if (init.method === "POST") // 첫 저장
            { // 조건 시작
                if (this.row !== null) // 이미 있음
                { // 조건 시작
                    return json(409, { code: "23505", message: "duplicate key value" }); // 겹침
                } // 조건 종료
                this.row = { user_id: record?.user_id ?? "", revision: Number(record?.revision), state: record?.state ?? "", device_id: record?.device_id ?? "", updated_at: "2026-10-06T01:00:00+00:00" }; // 줄 만들기
                return json(201, [this.row]); // 만든 줄
            } // 조건 종료
            if (init.method === "PATCH") // 고쳐 저장
            { // 조건 시작
                const expected = Number(new URL(url).searchParams.get("revision")?.replace("eq.", "")); // 내가 본 번호
                if (this.row === null || this.row.revision !== expected) // 번호가 다름
                { // 조건 시작
                    return json(200, []); // 바뀐 줄 없음
                } // 조건 종료
                this.row = { ...this.row, revision: Number(record?.revision), state: record?.state ?? "", device_id: record?.device_id ?? "", updated_at: "2026-10-06T02:00:00+00:00" }; // 줄 고치기
                return json(200, [this.row]); // 고친 줄
            } // 조건 종료
            return json(200, this.row === null ? [] : [this.row]); // 읽기
        } // 조건 종료
        return json(404, { message: "not found" }); // 모르는 주소
    }; // 함수 종료
} // 클래스 종료

describe("계정 서비스 설정", () => // 설정 묶음
{ // 묶음 시작
    it("스위치를 켜고 주소와 공개 키가 모두 있을 때만 실제 서비스를 쓴다", () => // 설정 판정 검증
    { // 검증 시작
        expect(readAccountServiceConfig({})).toEqual({ mode: "practice" }); // 아무것도 없으면 연습용
        expect(readAccountServiceConfig({ service: "practice", url: "https://demo.supabase.co", anonKey: "key" })).toEqual({ mode: "practice" }); // 값을 넣어 두어도 스위치가 꺼져 있으면 연습용
        expect(readAccountServiceConfig({ service: "supabase", url: "https://demo.supabase.co/", anonKey: " key " })).toEqual({ mode: "supabase", url: "https://demo.supabase.co", anonKey: "key" }); // 켜면 실제 서비스(주소 끝의 빗금과 빈칸 정리)
        expect(readAccountServiceConfig({ service: "supabase", url: "", anonKey: "key" })).toEqual({ mode: "practice" }); // 주소가 없으면 연습용
        expect(readAccountServiceConfig({ service: "supabase", url: "https://demo.supabase.co", anonKey: "" })).toEqual({ mode: "practice" }); // 키가 없으면 연습용
        expect(readAccountServiceConfig({ service: "supabase", url: "demo.supabase.co/rest", anonKey: "key" })).toEqual({ mode: "practice" }); // 주소 모양이 다르면 연습용
    }); // 검증 종료
}); // 묶음 종료

describe("Supabase 로그인", () => // 로그인 묶음
{ // 묶음 시작
    let server: FakeSupabase; // 가짜 서버
    const redirects: string[] = []; // 간편 로그인으로 보낸 주소
    const adapter = () => createSupabaseAuthAdapter(config, { storage: localStorage, session: sessionStorage, fetcher: server.fetch as typeof fetch, now: () => Date.parse("2026-10-06T00:00:00.000Z"), redirect: (href) => { redirects.push(href); } }); // 로그인 구현

    beforeEach(() => // 준비
    { // 준비 시작
        localStorage.clear(); // 저장소 비움
        sessionStorage.clear(); // 탭 저장소 비움
        redirects.length = 0; // 기록 비움
        server = new FakeSupabase(); // 새 가짜 서버
    }); // 준비 종료

    it("이메일과 비밀번호로 로그인하면 계정 세션을 돌려주고 출입증을 따로 보관한다", async () => // 이메일 로그인 검증
    { // 검증 시작
        const result = await adapter().signIn({ email: " Soha@Example.com ", password: "right-password-1" }); // 로그인
        expect(result).toEqual({ ok: true, session: { accountId: userId, name: "soha", email: "soha@example.com", provider: "email", signedInAt: "2026-10-06T00:00:00.000Z" } }); // 계정 세션(이름은 이메일 앞부분)
        expect(JSON.parse(localStorage.getItem(SUPABASE_TOKENS_KEY) ?? "{}")).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1", userId }); // 출입증 보관
        expect(server.calls[0]).toMatchObject({ url: "https://demo.supabase.co/auth/v1/token?grant_type=password", method: "POST", headers: { apikey: "public-anon-key" }, body: { email: "soha@example.com", password: "right-password-1" } }); // 보낸 요청
        expect(adapter().mode).toBe("live"); // 실제 서비스
        expect(adapter().listAccounts()).toEqual([]); // 연습용 계정 목록은 없음
    }); // 검증 종료

    it("틀린 정보·확인하지 않은 메일·잘못된 입력을 이유별로 알려 주고 서버에 보내기 전에 거른다", async () => // 실패 이유 검증
    { // 검증 시작
        expect(await adapter().signIn({ email: "soha@example.com", password: "wrong-password-1" })).toEqual({ ok: false, reason: "wrong-credentials" }); // 틀린 비밀번호
        expect(await adapter().signIn({ email: "unconfirmed@example.com", password: "wrong-password-1" })).toEqual({ ok: false, reason: "confirm-email" }); // 메일 확인 전
        const before = server.calls.length; // 지금까지의 요청 수
        expect(await adapter().signIn({ email: "not-an-email", password: "right-password-1" })).toEqual({ ok: false, reason: "invalid-email" }); // 이메일 모양
        expect(await adapter().signUp({ email: "soha@example.com", password: "short" })).toEqual({ ok: false, reason: "weak-password" }); // 짧은 비밀번호
        expect(server.calls).toHaveLength(before); // 서버에 보내지 않음
        expect(localStorage.getItem(SUPABASE_TOKENS_KEY)).toBeNull(); // 출입증 없음
        const offline = createSupabaseAuthAdapter(config, { storage: localStorage, session: sessionStorage, fetcher: (async () => { throw new TypeError("fetch failed"); }) as typeof fetch }); // 닿지 않는 서버
        expect(await offline.signIn({ email: "soha@example.com", password: "right-password-1" })).toEqual({ ok: false, reason: "unavailable" }); // 연결 실패
    }); // 검증 종료

    it("회원가입은 메일 확인이 필요하면 그렇게 알리고, 필요 없으면 바로 로그인하며, 가입한 메일은 거절한다", async () => // 회원가입 검증
    { // 검증 시작
        server.confirmEmail = true; // 메일 확인 필요
        expect(await adapter().signUp({ email: "new@example.com", password: "right-password-1" })).toEqual({ ok: false, reason: "confirm-email" }); // 메일 확인 안내
        expect(localStorage.getItem(SUPABASE_TOKENS_KEY)).toBeNull(); // 아직 로그인 아님
        server.confirmEmail = false; // 메일 확인 없음
        expect(await adapter().signUp({ email: "new@example.com", password: "right-password-1" })).toMatchObject({ ok: true, session: { email: "new@example.com", provider: "email" } }); // 바로 로그인
        expect(await adapter().signUp({ email: "taken@example.com", password: "right-password-1" })).toEqual({ ok: false, reason: "email-taken" }); // 이미 가입한 메일
    }); // 검증 종료

    it("켜 둔 간편 로그인만 알려 주고, 시작할 때 확인 글을 탭에 남긴 뒤 서비스 주소로 보내고, 돌아오면 코드로 로그인을 마친다", async () => // 간편 로그인 검증
    { // 검증 시작
        expect(await adapter().socialProviders()).toEqual(["google"]); // 켠 서비스 가운데 지원하는 것만
        await adapter().startSocialSignIn("google", "http://localhost:3002/auth/callback"); // 시작
        const target = new URL(redirects[0]); // 보낸 주소
        expect([target.origin + target.pathname, target.searchParams.get("provider"), target.searchParams.get("redirect_to"), target.searchParams.get("code_challenge_method")]).toEqual(["https://demo.supabase.co/auth/v1/authorize", "google", "http://localhost:3002/auth/callback", "s256"]); // 주소와 값
        const verifier = sessionStorage.getItem(SUPABASE_VERIFIER_KEY) ?? ""; // 탭에 남긴 확인 글
        expect(verifier.length).toBeGreaterThanOrEqual(43); // 충분히 긴 글
        expect(target.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/); // 확인 글의 지문만 보냄
        expect(target.searchParams.get("code_challenge")).not.toBe(verifier); // 확인 글 자체는 보내지 않음
        expect(await adapter().completeSocialSignIn(new URLSearchParams("error=access_denied"))).toEqual({ ok: false, reason: "unavailable" }); // 서비스에서 거절
        expect(await adapter().completeSocialSignIn(new URLSearchParams("code=bad-code"))).toEqual({ ok: false, reason: "unavailable" }); // 틀린 코드
        sessionStorage.setItem(SUPABASE_VERIFIER_KEY, verifier); // 다시 시도
        expect(await adapter().completeSocialSignIn(new URLSearchParams("code=good-code"))).toMatchObject({ ok: true, session: { accountId: userId, name: "소하", email: "soha@example.com", provider: "google" } }); // 로그인 완료(서비스가 준 이름)
        expect(sessionStorage.getItem(SUPABASE_VERIFIER_KEY)).toBeNull(); // 확인 글은 한 번 쓰고 지움
    }); // 검증 종료

    it("로그아웃하면 서비스에 알리고 출입증을 지운다", async () => // 로그아웃 검증
    { // 검증 시작
        const signedIn = await adapter().signIn({ email: "soha@example.com", password: "right-password-1" }); // 로그인
        await adapter().signOut(signedIn.ok ? signedIn.session : { accountId: userId, name: "", email: null, provider: "email", signedInAt: "" }); // 로그아웃
        expect(server.calls.at(-1)).toMatchObject({ url: "https://demo.supabase.co/auth/v1/logout", method: "POST", headers: { authorization: "Bearer access-1" } }); // 서비스에 알림
        expect(localStorage.getItem(SUPABASE_TOKENS_KEY)).toBeNull(); // 출입증 지움
    }); // 검증 종료
}); // 묶음 종료

describe("Supabase 저장본", () => // 저장본 묶음
{ // 묶음 시작
    let server: FakeSupabase; // 가짜 서버
    let clock = Date.parse("2026-10-06T00:00:00.000Z"); // 지금 시각
    const store = () => createSupabaseSnapshotStore(config, { storage: localStorage, fetcher: server.fetch as typeof fetch, now: () => clock }); // 저장본 구현

    beforeEach(async () => // 준비
    { // 준비 시작
        localStorage.clear(); // 저장소 비움
        clock = Date.parse("2026-10-06T00:00:00.000Z"); // 시각 되돌림
        server = new FakeSupabase(); // 새 가짜 서버
        await createSupabaseAuthAdapter(config, { storage: localStorage, session: sessionStorage, fetcher: server.fetch as typeof fetch, now: () => clock }).signIn({ email: "soha@example.com", password: "right-password-1" }); // 로그인해 둠
        server.calls = []; // 기록 비움
    }); // 준비 종료

    it("저장본이 없으면 없다고 하고, 처음에는 새 줄을 만들고, 그다음부터는 내가 본 번호와 같을 때만 고친다", async () => // 올리기·받기 검증
    { // 검증 시작
        expect(store().mode).toBe("live"); // 실제 서비스
        expect(await store().pull(userId)).toBeNull(); // 처음에는 없음
        expect(await store().push(userId, "{\"a\":1}", null, "device-a")).toEqual({ ok: true, revision: 1, updatedAt: "2026-10-06T01:00:00+00:00" }); // 첫 저장
        expect(server.calls.at(-1)).toMatchObject({ method: "POST", headers: { apikey: "public-anon-key", authorization: "Bearer access-1", prefer: "return=representation" }, body: { user_id: userId, revision: 1, state: "{\"a\":1}", device_id: "device-a" } }); // 보낸 요청
        expect(await store().pull(userId)).toEqual({ revision: 1, state: "{\"a\":1}", updatedAt: "2026-10-06T01:00:00+00:00", deviceId: "device-a" }); // 받기
        expect(await store().push(userId, "{\"a\":2}", 1, "device-a")).toMatchObject({ ok: true, revision: 2 }); // 번호가 맞으면 고침
        expect(new URL(server.calls.at(-1)?.url ?? "").searchParams.get("revision")).toBe("eq.1"); // 내가 본 번호를 조건으로 보냄
        expect(await store().push(userId, "{\"a\":3}", 1, "device-b")).toEqual({ ok: false, reason: "conflict", remote: { revision: 2, state: "{\"a\":2}", updatedAt: "2026-10-06T02:00:00+00:00", deviceId: "device-a" } }); // 번호가 다르면 겹침과 서버 것
        expect(await store().push(userId, "{\"a\":4}", null, "device-b")).toMatchObject({ ok: false, reason: "conflict", remote: { revision: 2 } }); // 이미 있는데 처음이라고 올려도 겹침
        expect(server.row?.state).toBe("{\"a\":2}"); // 서버 것은 그대로
    }); // 검증 종료

    it("출입증이 곧 끝나면 새로 받아 쓰고, 로그인하지 않았거나 서버가 받지 않으면 저장하지 못했다고 알린다", async () => // 출입증·실패 검증
    { // 검증 시작
        clock += 3590 * 1000; // 출입증이 10초 뒤 끝남
        expect(await store().pull(userId)).toBeNull(); // 받기
        expect(server.refreshes).toBe(1); // 새로 받음
        expect(JSON.parse(localStorage.getItem(SUPABASE_TOKENS_KEY) ?? "{}").accessToken).toBe("access-2"); // 새 출입증 보관
        localStorage.removeItem(SUPABASE_TOKENS_KEY); // 로그인하지 않음
        await expect(store().pull(userId)).rejects.toThrow(); // 받지 못함(맞추기 도구가 연결 실패로 처리)
        expect(await store().push(userId, "{}", null, "device-a")).toEqual({ ok: false, reason: "unavailable" }); // 올리지 못함
    }); // 검증 종료
}); // 묶음 종료
