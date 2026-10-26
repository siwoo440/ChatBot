import assert from "node:assert/strict"; // 엄격한 검증
import { once } from "node:events"; // 서버 준비 대기
import { createServer } from "node:http"; // 실제 HTTP 시험 서버
import { mkdtempSync, rmSync } from "node:fs"; // 임시 시험 폴더
import { tmpdir } from "node:os"; // 임시 폴더 위치
import { join } from "node:path"; // 경로 조합
import { spawnSync } from "node:child_process"; // 실제 명령 실행
import { fileURLToPath } from "node:url"; // 명령 파일 경로
import { test } from "node:test"; // Node 내장 검사
import { checkAccountSetup, formatAccountCheck } from "../../scripts/account-check.mjs"; // 실제 점검 도구

const publicKey = "sb_publishable_account_check_fixture"; // 공개 키 시험값

async function withBackend(overrides, run) // 읽기 전용 HTTP 시험 환경
{ // 함수 시작
    const requests = []; // 받은 요청 기록
    const server = createServer((request, response) => // 실제 요청 처리
    { // 처리 시작
        requests.push({ method: request.method, path: request.url, headers: request.headers }); // 요청 경계 기록
        const fallback = request.url === "/auth/v1/settings" ? { status: 200, body: { external: { email: true, google: false } } } : { status: 401, body: { code: "42501" } }; // 기본 시험 응답
        const reply = overrides(request) ?? fallback; // 사례별 응답 선택
        response.writeHead(reply.status, { "content-type": "application/json", ...reply.headers }); // 응답 머리말
        response.end(JSON.stringify(reply.body ?? {})); // 응답 본문
    }); // 처리 종료
    server.listen(0, "127.0.0.1"); // 비어 있는 시험 포트
    await once(server, "listening"); // 준비 완료 대기
    const url = `http://127.0.0.1:${server.address().port}`; // 시험 서버 주소
    try // 시험 실행
    { // 시도 시작
        await run(url, requests); // 실제 점검 호출
    } // 시도 종료
    finally // 시험 자원 정리
    { // 정리 시작
        server.closeAllConnections(); // 남은 연결 종료
        await new Promise((resolve) => server.close(resolve)); // 시험 서버 종료
    } // 정리 종료
} // 함수 종료

test("설정이 없으면 외부 요청 없이 실제 확인을 미실행으로 남긴다", async () => // 미설정 검증
{ // 검사 시작
    await withBackend(() => undefined, async (url, requests) => // 실제 시험 서버
    { // 사례 시작
        const report = await checkAccountSetup({ service: "practice", url, anonKey: publicKey }); // 연습용 설정 점검
        assert.equal(requests.length, 0); // 외부 요청 부재
        assert.equal(report.readyForManualCheck, false); // 실제 확인 준비 미완료
        assert.equal(report.liveAccountVerified, false); // 실제 사용자 미검증
        assert.match(formatAccountCheck(report), /미실행/); // 사실과 같은 안내
    }); // 사례 종료
}); // 검사 종료

test("공개 키와 세 개의 GET 요청으로 읽기 준비만 확인한다", async () => // 정상 준비 검증
{ // 검사 시작
    await withBackend(() => undefined, async (url, requests) => // 실제 시험 서버
    { // 사례 시작
        const report = await checkAccountSetup({ service: "supabase", url, anonKey: publicKey }); // 실제 점검 호출
        assert.equal(report.readyForManualCheck, true); // 수동 확인 준비
        assert.equal(report.liveAccountVerified, false); // 실제 계정 완료 과장 방지
        assert.deepEqual(requests.map((request) => [request.method, request.path]), [["GET", "/auth/v1/settings"], ["GET", "/rest/v1/mv_snapshots?select=user_id&limit=0"], ["GET", "/rest/v1/mv_blobs?select=hash&limit=0"]]); // 읽기 요청만 확인
        assert.ok(requests.every((request) => request.headers.apikey === publicKey && request.headers.authorization === undefined)); // 공개 키 머리말 확인
        const output = formatAccountCheck(report); // 사용자 안내 생성
        assert.ok(!output.includes(publicKey) && !output.includes(url)); // 설정 값 출력 방지
    }); // 사례 종료
}); // 검사 종료

for (const key of ["sb_secret_never_send", `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.fixture`]) // 위험 키 사례
{ // 사례 시작
    test("비밀 키는 서버로 보내지 않고 값도 출력하지 않는다", async () => // 비밀 키 차단 검증
    { // 검사 시작
        await withBackend(() => undefined, async (url, requests) => // 실제 시험 서버
        { // 확인 시작
            const report = await checkAccountSetup({ service: "supabase", url, anonKey: key }); // 위험 설정 점검
            assert.equal(report.readyForManualCheck, false); // 위험 설정 거부
            assert.equal(requests.length, 0); // 위험 키 전송 부재
            assert.ok(!formatAccountCheck(report).includes(key)); // 위험 키 출력 부재
        }); // 확인 종료
    }); // 검사 종료
} // 사례 종료

test("예전 anon JWT 공개 키도 읽기 점검에 사용할 수 있다", async () => // 기존 키 호환 검증
{ // 검사 시작
    const key = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.fixture`; // 기존 공개 키 시험값
    await withBackend(() => undefined, async (url) => // 실제 시험 서버
    { // 사례 시작
        const report = await checkAccountSetup({ service: "supabase", url: `${url}/rest/v1/`, anonKey: key }); // 기존 주소 형식 점검
        assert.equal(report.readyForManualCheck, true); // 기존 공개 키 허용
    }); // 사례 종료
}); // 검사 종료

test("깨진 JWT의 빈 조각과 잘못된 헤더를 요청 전에 차단한다", async () => // 잘못된 기존 키 검증
{ // 검사 시작
    const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url"); // 공개 역할 시험값
    const invalidKeys = // 잘못된 서명 키 목록
    [ // 목록 시작
        `.${payload}.`, // 빈 헤더와 서명
        `eyJhbGciOiJIUzI1NiJ9.${payload}.`, // 빈 서명
        `not-json.${payload}.fixture`, // JSON이 아닌 헤더
        `${Buffer.from("null").toString("base64url")}.${payload}.fixture`, // 객체가 아닌 헤더
        `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${payload}.fixture`, // 서명 없는 알고리즘
        `eyJhbGciOiJIUzI1NiJ9.${payload}.bad+signature`, // Base64URL이 아닌 서명
    ]; // 목록 종료
    for (const key of invalidKeys) // 잘못된 키 순회
    { // 순회 시작
        let requests = 0; // 요청 횟수
        const report = await checkAccountSetup({ service: "supabase", url: "https://example.test", anonKey: key }, { fetcher: async () => // 요청 경계 관찰
        { // 요청 시작
            requests += 1; // 잘못 발생한 요청 기록
            return new Response(JSON.stringify({ external: { email: true } }), { status: 200 }); // 이후 요청도 감지 가능한 응답
        } }); // 점검 종료
        assert.equal(requests, 0); // 잘못된 키 전송 차단
        assert.equal(report.checks[0].status, "fail"); // 설정 단계 실패 확인
        assert.ok(!formatAccountCheck(report).includes(key)); // 잘못된 키 출력 차단
    } // 순회 종료
}); // 검사 종료

for (const url of ["http://remote.example.test", "https://person:password@example.test", "https://example.test?key=private", "https://example.test/other"]) // 잘못된 연결 주소
{ // 사례 시작
    test("평문 원격 주소와 인증값·불필요한 경로가 붙은 주소를 요청 전에 거부한다", async () => // 주소 경계 검증
    { // 검사 시작
        const report = await checkAccountSetup({ service: "supabase", url, anonKey: publicKey }, { fetcher: () => assert.fail("잘못된 주소에 요청 발생") }); // 잘못된 주소 점검
        assert.equal(report.readyForManualCheck, false); // 주소 거부 확인
        assert.ok(!formatAccountCheck(report).includes(url)); // 주소 출력 부재
    }); // 검사 종료
} // 사례 종료

test("표가 없거나 익명으로 읽을 수 있으면 준비 완료로 알리지 않는다", async () => // 표 권한 검증
{ // 검사 시작
    for (const reply of [{ status: 404, body: { code: "PGRST205" } }, { status: 200, body: [] }, { status: 401, body: { code: "invalid_api_key" } }]) // 실패 응답 목록
    { // 순회 시작
        await withBackend((request) => request.url.startsWith("/rest/") ? reply : undefined, async (url) => // 실패 표 서버
        { // 사례 시작
            const report = await checkAccountSetup({ service: "supabase", url, anonKey: publicKey }); // 표 상태 점검
            assert.equal(report.readyForManualCheck, false); // 잘못된 통과 방지
            assert.ok(report.checks.some((check) => check.status === "fail")); // 실패 사유 표시
        }); // 사례 종료
    } // 순회 종료
}); // 검사 종료

test("서버 오류가 키와 주소를 포함해도 사용자 안내에 노출하지 않는다", async () => // 응답 비밀 보호 검증
{ // 검사 시작
    await withBackend(() => ({ status: 500, body: { message: `${publicKey} https://private.example.test` } }), async (url) => // 민감 응답 시험 서버
    { // 사례 시작
        const report = await checkAccountSetup({ service: "supabase", url, anonKey: publicKey }); // 오류 응답 점검
        const output = formatAccountCheck(report); // 사용자 안내 생성
        assert.equal(report.readyForManualCheck, false); // 서버 오류 확인
        assert.ok(!output.includes(publicKey) && !output.includes("private.example.test") && !output.includes(url)); // 원시 오류 숨김
    }); // 사례 종료
}); // 검사 종료

test("리디렉션을 따라가며 공개 키를 다른 주소로 전달하지 않는다", async () => // 이동 응답 차단 검증
{ // 검사 시작
    await withBackend(() => undefined, async (otherUrl, otherRequests) => // 이동 대상 시험 서버
    { // 대상 시작
        await withBackend(() => ({ status: 302, headers: { location: otherUrl } }), async (url) => // 이동 응답 서버
        { // 사례 시작
            const report = await checkAccountSetup({ service: "supabase", url, anonKey: publicKey }); // 이동 응답 점검
            assert.equal(report.readyForManualCheck, false); // 이동 응답 거부
            assert.equal(otherRequests.length, 0); // 다른 서버 요청 부재
        }); // 사례 종료
    }); // 대상 종료
}); // 검사 종료

test("연결 예외와 제한 시간 초과를 민감 값 없는 실패로 반환한다", async () => // 연결 실패 검증
{ // 검사 시작
    const report = await checkAccountSetup({ service: "supabase", url: "https://example.test", anonKey: publicKey }, { fetcher: async (_url, options) => // 중단 신호 시험 요청
    { // 요청 시작
        await once(options.signal, "abort"); // 제한 시간 대기
        throw new Error(publicKey); // 민감 값이 있는 연결 오류
    }, timeoutMs: 20 }); // 요청 제한 시간
    assert.equal(report.readyForManualCheck, false); // 연결 실패 확인
    assert.ok(!formatAccountCheck(report).includes(publicKey)); // 원시 연결 오류 숨김
}); // 검사 종료

test("실제 명령은 설정이 없으면 비밀 값을 출력하지 않고 종료 코드 2를 반환한다", () => // 명령 경계 검증
{ // 검사 시작
    const folder = mkdtempSync(join(tmpdir(), "mateverse-account-check-")); // 시험 전용 폴더
    try // 명령 실행
    { // 시도 시작
        const script = fileURLToPath(new URL("../../scripts/account-check-cli.mjs", import.meta.url)); // 실제 명령 경로
        const result = spawnSync(process.execPath, [script], { cwd: folder, encoding: "utf8", env: { ...process.env, NEXT_PUBLIC_ACCOUNT_SERVICE: "practice", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" } }); // 미설정 명령 실행
        assert.equal(result.status, 2); // 미준비 종료 코드
        assert.match(result.stdout, /실제 계정 검증: 미실행/); // 미검증 안내
        assert.equal(result.stderr, ""); // 원시 오류 출력 부재
    } // 시도 종료
    finally // 시험 폴더 정리
    { // 정리 시작
        rmSync(folder, { recursive: true, force: true }); // 시험 자료 제거
    } // 정리 종료
}); // 검사 종료
