const defaultTimeoutMs = 8000; // 기본 요청 제한 시간
const allowedPaths = new Set(["", "/rest/v1", "/auth/v1"]); // 기존 설정의 허용 경로
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]); // 평문 통신 허용 시험 주소

function finish(checks) // 읽기 점검 결과 생성
{ // 함수 시작
    return { checks, readyForManualCheck: checks.length > 0 && checks.every((check) => check.status === "pass"), liveAccountVerified: false }; // 실제 계정 검증과 구별
} // 함수 종료

function readUrl(value) // 키 전송 대상 검증
{ // 함수 시작
    try // 주소 해석
    { // 시도 시작
        const url = new URL((value ?? "").trim()); // 프로젝트 주소 해석
        const secure = url.protocol === "https:" || url.protocol === "http:" && localHosts.has(url.hostname); // 원격 HTTPS와 로컬 시험만 허용
        const path = url.pathname.replace(/\/+$/, ""); // 끝 경로 정리
        return secure && !url.username && !url.password && !url.search && !url.hash && allowedPaths.has(path) ? url.origin : null; // 부가 인증값과 다른 경로 거부
    } // 시도 종료
    catch // 잘못된 주소
    { // 실패 시작
        return null; // 주소 거부
    } // 실패 종료
} // 함수 종료

function isPublicKey(value) // 공개 키 형식 검증
{ // 함수 시작
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) // 현재 공개 키 형식
    { // 조건 시작
        return true; // 공개 키 허용
    } // 조건 종료
    try // 기존 공개 키 해석
    { // 시도 시작
        const parts = value.split("."); // JWT 조각 분리
        if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) // 빈 조각과 잘못된 인코딩 판정
        { // 조건 시작
            return false; // 잘못된 JWT 거부
        } // 조건 종료
        const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); // JWT 헤더 해석
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); // JWT 공개 역할 해석
        const signedHeader = header !== null && typeof header === "object" && !Array.isArray(header) && typeof header.alg === "string" && header.alg.trim().length > 0 && header.alg.toLowerCase() !== "none"; // 서명 알고리즘 형식 확인
        return signedHeader && payload !== null && typeof payload === "object" && !Array.isArray(payload) && payload.role === "anon"; // 기존 anon 키 형식만 허용
    } // 시도 종료
    catch // 해석 실패
    { // 실패 시작
        return false; // 알 수 없는 키 거부
    } // 실패 종료
} // 함수 종료

async function readJson(url, key, fetcher, timeoutMs) // 제한 시간이 있는 읽기 요청
{ // 함수 시작
    const controller = new AbortController(); // 요청 중단 제어
    const timer = setTimeout(() => controller.abort(), timeoutMs); // 제한 시간 예약
    try // 읽기 요청
    { // 시도 시작
        const response = await fetcher(url, { method: "GET", headers: { apikey: key }, redirect: "error", signal: controller.signal }); // 다른 주소로 키 전달 차단
        const body = await response.json().catch(() => null); // 내부 판정용 응답
        return { status: response.status, body }; // 원시 응답은 내부에서만 사용
    } // 시도 종료
    catch // 요청 실패
    { // 실패 시작
        return { status: 0, body: null }; // 민감 값 없는 공통 실패
    } // 실패 종료
    finally // 요청 정리
    { // 정리 시작
        clearTimeout(timer); // 남은 제한 시간 해제
    } // 정리 종료
} // 함수 종료

function tableResult(id, name, result) // 익명 테이블 접근 판정
{ // 함수 시작
    if ((result.status === 401 || result.status === 403) && result.body?.code === "42501") // SQL에서 정한 익명 권한 거절
    { // 조건 시작
        return { id, status: "pass", message: `${name}: 익명 읽기 차단 확인. 실제 계정 간 권한 검증은 별도.` }; // 읽기 점검 범위만 안내
    } // 조건 종료
    if (result.status === 404 && result.body?.code === "PGRST205") // 표 노출 또는 생성 누락
    { // 조건 시작
        return { id, status: "fail", message: `${name}: 테이블 또는 API 노출 설정 확인 필요. 최신 설정 SQL 적용 여부 점검.` }; // 설정 점검 안내
    } // 조건 종료
    if (result.status >= 200 && result.status < 300) // 예상과 다른 익명 접근 허용
    { // 조건 시작
        return { id, status: "fail", message: `${name}: 익명 요청이 허용됨. 공개 권한과 RLS를 확인해야 함.` }; // 잘못된 통과 방지
    } // 조건 종료
    return { id, status: "fail", message: `${name}: 확인 실패. 연결·공개 키·권한·요청 제한 시간 확인 필요.` }; // 원시 오류 없는 안내
} // 함수 종료

export async function checkAccountSetup(values, options = {}) // 실제 가입 전 읽기 준비 점검
{ // 함수 시작
    if (values.service?.trim() !== "supabase") // 실제 계정 방식 미선택
    { // 조건 시작
        return finish([{ id: "configuration", status: "pending", message: "연습용 모드. 실제 계정 연결 설정과 수동 확인이 남아 있음." }]); // 외부 요청 없는 미준비 결과
    } // 조건 종료
    if (!values.url?.trim() || !values.anonKey?.trim()) // 연결값 누락
    { // 조건 시작
        return finish([{ id: "configuration", status: "pending", message: "프로젝트 주소 또는 공개 키 미설정. .env.local에서 설정 필요." }]); // 누락 안내
    } // 조건 종료
    const url = readUrl(values.url); // 요청 주소 검증
    const key = values.anonKey.trim(); // 공개 키 정리
    if (url === null || !isPublicKey(key)) // 위험하거나 잘못된 설정
    { // 조건 시작
        return finish([{ id: "configuration", status: "fail", message: "설정 형식 오류. 올바른 HTTPS 주소와 Publishable 또는 anon 공개 키만 허용." }]); // 값 없는 오류 안내
    } // 조건 종료
    const fetcher = options.fetcher ?? globalThis.fetch; // 실제 요청 함수
    const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? options.timeoutMs : defaultTimeoutMs; // 유효 제한 시간
    const checks = [{ id: "configuration", status: "pass", message: "실제 계정 방식과 공개 연결값 형식 확인." }]; // 설정 점검 기록
    const auth = await readJson(`${url}/auth/v1/settings`, key, fetcher, timeoutMs); // 가입 없는 로그인 설정 조회
    if (auth.status !== 200 || auth.body?.external?.email !== true) // 이메일 연결 준비 미완료
    { // 조건 시작
        checks.push({ id: "auth", status: "fail", message: "이메일 로그인 설정 확인 실패. 연결·공개 키·이메일 로그인 허용 여부 점검 필요." }); // 원시 응답 없는 안내
        return finish(checks); // 다음 요청 생략
    } // 조건 종료
    checks.push({ id: "auth", status: "pass", message: `이메일 로그인 설정 조회 성공. Google 로그인 ${auth.body.external.google === true ? "활성" : "비활성"}.` }); // 공개 설정 결과만 기록
    const snapshots = await readJson(`${url}/rest/v1/mv_snapshots?select=user_id&limit=0`, key, fetcher, timeoutMs); // 실제 데이터 없는 접근 확인
    checks.push(tableResult("snapshots", "저장본 표", snapshots)); // 저장본 권한 결과
    const blobs = await readJson(`${url}/rest/v1/mv_blobs?select=hash&limit=0`, key, fetcher, timeoutMs); // 조각 본문 없는 접근 확인
    checks.push(tableResult("blobs", "조각 표", blobs)); // 조각 권한 결과
    return finish(checks); // 수동 확인 준비 결과
} // 함수 종료

export function formatAccountCheck(report) // 민감 값 없는 명령 안내
{ // 함수 시작
    const labels = { pass: "통과", fail: "실패", pending: "대기" }; // 상태 표시
    const lines = report.checks.map((check) => `[${labels[check.status]}] ${check.message}`); // 고정 안내문만 표시
    return ["Mate Verse 계정 연결 읽기 점검", ...lines, `수동 확인 준비: ${report.readyForManualCheck ? "완료" : "미완료"}`, "실제 계정 검증: 미실행 — 가입·로그인·두 기기 복원·탈퇴는 별도 확인", "데이터 쓰기·삭제·메일 발송·SQL 실행: 없음"].join("\n"); // 한계를 포함한 결과
} // 함수 종료
