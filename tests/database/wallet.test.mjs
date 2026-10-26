import { after, before, beforeEach, describe, it } from "node:test"; // 테스트 수명
import assert from "node:assert/strict"; // 결과 비교
import { mkdtemp, readFile, rm } from "node:fs/promises"; // SQL·임시 데이터
import { tmpdir } from "node:os"; // 임시 폴더
import { basename, dirname, join, resolve } from "node:path"; // 경로 검사
import { PGlite } from "@electric-sql/pglite"; // 로컬 PostgreSQL

let db; // 검증 데이터베이스
let directory; // 검증 전용 임시 폴더
const user = "11111111-1111-4111-8111-111111111111"; // 첫 계정
const other = "22222222-2222-4222-8222-222222222222"; // 다른 계정
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; // 첫 요청
const reserve = (id = requestId, extra = {}) => ({ requestId: id, fingerprint: "a".repeat(64), cost: 3, conversationId: "room-1", conversationTitle: "퇴근길 대화", characterId: "harin", versionId: "v1", work: "하린", perMinute: 20, perDay: 300, totalPerDay: 1000, ...extra }); // 서버 요청
const command = async (name, data = {}, owner = user) => (await db.query("select public.mv_wallet_command($1::uuid, $2::text, $3::jsonb) as result", [owner, name, JSON.stringify(data)])).rows[0].result; // 실제 RPC 실행

before(async () => // 데이터베이스 준비
{ // 준비 시작
    directory = await mkdtemp(join(tmpdir(), "mateverse-wallet-")); // 검증 전용 폴더 생성
    db = new PGlite(directory); // 외부 연결 없는 영속 데이터베이스
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; grant usage on schema public, auth to authenticated, service_role; grant execute on function auth.uid() to authenticated; "); // Supabase 권한 모형
    await db.exec(await readFile(new URL("../../supabase/wallet-setup.sql", import.meta.url), "utf8")); // 배포 SQL 실행
    await db.exec(`insert into auth.users values ('${user}'), ('${other}');`); // 계정 준비
}); // 준비 종료

beforeEach(async () => // 테스트별 초기화
{ // 초기화 시작
    await db.exec("reset role; truncate public.mv_wallets cascade; truncate public.mv_wallet_usage; set role service_role;"); // 지갑 초기화와 서버 권한
}); // 초기화 종료

after(async () => // 자원 정리
{ // 정리 시작
    await db?.close(); // 로컬 데이터베이스 종료
    if (directory && resolve(dirname(directory)) === resolve(tmpdir()) && basename(directory).startsWith("mateverse-wallet-")) // 직접 만든 임시 경로 확인
    { // 조건 시작
        await rm(directory, { recursive: true, force: true }); // 검증 파일 정리
    } // 조건 종료
}); // 정리 종료

describe("서버 지갑 실제 SQL", () => // 검증 묶음
{ // 묶음 시작
    it("시험 잔액을 가져오지 않고 0부터 시작하며 출석을 한 번만 지급", async () => // 출석 중복
    { // 검증 시작
        assert.equal((await command("read")).snapshot.wallet.balance, 0); // 최초 잔액
        const first = await command("reward", { reward: "attendance", amount: 99999 }); // 조작한 보상액
        assert.equal(first.snapshot.wallet.balance, 5); // 서버 고정 보상
        assert.equal((await command("reward", { reward: "attendance" })).snapshot.wallet.balance, 5); // 재수령 방지
        assert.equal(first.snapshot.records[0].source, "attendance"); // 원장 출처
        assert.ok(first.snapshot.records[0].createdAt); // 서버 시각
    }); // 검증 종료

    it("잔액 부족은 요청과 차감을 남기지 않고 거절", async () => // 부족한 잔액
    { // 검증 시작
        assert.equal((await command("reserve", reserve())).error, "insufficient-token"); // 호출 전 거절
        assert.equal((await command("read")).snapshot.records.length, 0); // 거짓 거래 방지
    }); // 검증 종료

    it("동일 요청은 한 번만 차감하고 다른 내용 재사용을 거절", async () => // 멱등성
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 5토큰 준비
        assert.equal((await command("reserve", reserve())).snapshot.wallet.balance, 2); // 3토큰 예약
        assert.equal((await command("reserve", reserve())).error, "duplicate-request"); // 재호출 거절
        assert.equal((await command("reserve", reserve(requestId, { fingerprint: "b".repeat(64) }))).error, "request-conflict"); // 내용 변경 거절
        assert.equal((await command("read")).snapshot.wallet.balance, 2); // 단일 차감
    }); // 검증 종료

    it("여러 요청을 동시에 보내도 잔액이 음수가 되지 않음", async () => // 동시 차감
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 5토큰 준비
        const results = await Promise.all([command("reserve", reserve()), command("reserve", reserve("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"))]); // 3토큰 요청 둘
        assert.equal(results.filter((item) => item.ok).length, 1); // 하나만 승인
        assert.equal((await command("read")).snapshot.wallet.balance, 2); // 음수 방지
    }); // 검증 종료

    it("첫 응답 전 반환은 한 번만 적용하고 이후 확정을 차단", async () => // 반환 경쟁
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 잔액 준비
        await command("reserve", reserve()); // 예약
        assert.equal((await command("refund", { requestId })).snapshot.wallet.balance, 5); // 반환
        assert.equal((await command("refund", { requestId })).snapshot.wallet.balance, 5); // 중복 반환 방지
        assert.equal((await command("settle", { requestId })).error, "request-closed"); // 늦은 응답 차단
        assert.equal((await command("read")).snapshot.wallet.totalUsed, 0); // 순 사용량
    }); // 검증 종료

    it("응답 확정 이후 중단은 반환하지 않고 채팅방 정보를 보존", async () => // 사용 확정
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 잔액 준비
        await command("reserve", reserve()); // 예약
        assert.equal((await command("settle", { requestId })).ok, true); // 사용 확정
        assert.equal((await command("refund", { requestId })).snapshot.wallet.balance, 2); // 확정된 사용 유지
        const record = (await command("read")).snapshot.records.find((item) => item.source === "chat"); // 사용 원장
        assert.equal(record.conversationTitle, "퇴근길 대화"); // 당시 채팅방 이름
        assert.equal(record.conversationId, "room-1"); // 방 식별자
        assert.equal(record.characterId, "harin"); // 캐릭터 식별자
        assert.equal(record.amount, 3); // 사용량
    }); // 검증 종료

    it("오래된 미확정 예약은 조회 때 반환하고 늦은 응답을 거절", async () => // 프로세스 중단 복구
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 잔액 준비
        await command("reserve", reserve()); // 예약
        await db.exec("update public.mv_wallet_requests set created_at = now() - interval '11 minutes';"); // 중단된 요청 모형
        assert.equal((await command("read")).snapshot.wallet.balance, 5); // 자동 반환
        assert.equal((await command("settle", { requestId })).error, "request-closed"); // 무료 응답 차단
    }); // 검증 종료

    it("사용량 제한은 DB에 유지되고 보조 요청도 동일한 분 한도 적용", async () => // 영속 한도
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 잔액 준비
        await command("reserve", reserve(requestId, { perMinute: 1 })); // 한도 채우기
        assert.equal((await command("assist", { perMinute: 1 })).error, "rate-limited"); // 보조 우회 차단
        assert.equal((await command("reserve", reserve("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", { perMinute: 1, cost: 1 }))).error, "rate-limited"); // 다른 요청도 차단
    }); // 검증 종료

    it("계정별 하루 한도와 전체 서비스 한도를 적용", async () => // 하루 한도
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 첫 계정 잔액
        await command("reserve", reserve(requestId, { perDay: 1, cost: 1 })); // 하루 한도 채우기
        assert.equal((await command("reserve", reserve("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", { perDay: 1, cost: 1 }))).error, "daily-limit"); // 사용자 한도
        await command("reward", { reward: "attendance" }, other); // 다른 계정 잔액
        assert.equal((await command("reserve", reserve(requestId, { totalPerDay: 1, cost: 1 }), other)).error, "service-limit"); // 전체 한도
    }); // 검증 종료

    it("클라이언트가 주장하는 미션 진행·초대만으로 보상을 지급하지 않음", async () => // 보상 증거
    { // 검증 시작
        assert.equal((await command("reward", { reward: "send-messages", progress: 999 })).error, "reward-unavailable"); // 허위 진행 차단
        assert.equal((await command("reward", { reward: "favorite-work" })).error, "reward-unavailable"); // 로컬 좋아요 증거 차단
        assert.equal((await command("reward", { reward: "invite-welcome" })).error, "reward-unavailable"); // 검증 전 초대 차단
        assert.equal((await command("read")).snapshot.wallet.balance, 0); // 잔액 유지
    }); // 검증 종료

    it("로그인 사용자와 손님은 RPC와 직접 잔액 변경 권한이 없음", async () => // 변경 권한
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 데이터 준비
        await db.exec("set role authenticated;"); // 브라우저 권한
        await assert.rejects(command("reward", { reward: "attendance" }), /permission denied/); // RPC 접근 차단
        await assert.rejects(db.exec("update public.mv_wallets set balance = 999;"), /permission denied/); // 직접 변경 차단
        await db.exec("set role anon;"); // 손님 권한
        await assert.rejects(db.exec("select * from public.mv_wallet_entries;"), /permission denied/); // 손님 조회 차단
    }); // 검증 종료

    it("사용자는 자기 원장만 읽고 다른 사용자 내역은 볼 수 없음", async () => // RLS 격리
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 첫 계정
        await command("reward", { reward: "attendance" }, other); // 다른 계정
        await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`); // 첫 계정 권한
        const entries = await db.query("select user_id from public.mv_wallet_entries;"); // 직접 읽기
        assert.equal(entries.rows.length, 1); // 내 기록만
        assert.equal(entries.rows[0].user_id, user); // 본인 원장
    }); // 검증 종료

    it("DB를 닫고 다시 열어도 잔액과 사용량 제한 유지", async () => // 재시작 영속성
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 5토큰 준비
        await command("reserve", reserve(requestId, { perMinute: 1 })); // 예약과 한도 기록
        await db.close(); // 실제 데이터베이스 종료
        db = new PGlite(directory); // 같은 저장소로 재시작
        await db.exec("set role service_role;"); // 서버 권한 복원
        assert.equal((await command("read")).snapshot.wallet.balance, 2); // 잔액 유지
        assert.equal((await command("assist", { perMinute: 1 })).error, "rate-limited"); // 제한 유지
    }); // 검증 종료

    it("한국 날짜가 바뀌면 오늘 사용량을 초기화하되 누적 사용 보존", async () => // 일 경계
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 잔액 준비
        await command("reserve", reserve()); // 사용 예약
        await command("settle", { requestId }); // 사용 확정
        await db.exec("update public.mv_wallets set usage_day = usage_day - 1;"); // 날짜 경과 모형
        const wallet = (await command("read")).snapshot.wallet; // 새 날짜 조회
        assert.equal(wallet.dailyChatUsed, 0); // 오늘 초기화
        assert.equal(wallet.totalUsed, 3); // 누적 보존
    }); // 검증 종료

    it("완료 대화 실적만 일일 보상에 반영하고 재수령 차단", async () => // 실제 미션
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 비용 준비
        for (let index = 1; index <= 5; index += 1) // 대화 5회
        { // 반복 시작
            const id = `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, "0")}`; // 고유 요청
            await command("reserve", reserve(id, { cost: 1 })); // 비용 예약
            await command("settle", { requestId: id }); // 응답 실적
        } // 반복 종료
        const result = await command("reward", { reward: "send-messages" }); // 보상 수령
        assert.equal(result.snapshot.wallet.balance, 3); // 고정 3토큰
        assert.equal((await command("reward", { reward: "send-messages" })).snapshot.wallet.balance, 3); // 중복 차단
        assert.equal((await command("reward", { reward: "start-conversation" })).snapshot.wallet.balance, 6); // 새 대화 실적
        assert.equal((await command("read")).snapshot.rewards.missions.progress["start-conversation"], 1); // 같은 방 중복 집계 방지
    }); // 검증 종료

    it("SQL을 재실행해도 기존 잔액과 원장 보존", async () => // 설치 재실행
    { // 검증 시작
        await command("reward", { reward: "attendance" }); // 원장 준비
        await db.exec("reset role;"); // 설치 권한
        await db.exec(await readFile(new URL("../../supabase/wallet-setup.sql", import.meta.url), "utf8")); // 재설치
        await db.exec("set role service_role;"); // 서버 권한
        assert.equal((await command("read")).snapshot.wallet.balance, 5); // 잔액 보존
        assert.equal((await command("read")).snapshot.records.length, 1); // 원장 보존
    }); // 검증 종료
}); // 묶음 종료
