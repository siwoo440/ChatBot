-- 2단계 서버 지갑: account-setup.sql 이후 SQL Editor에서 실행할 독립 설치 스크립트
begin; -- 설치 원자성

create table if not exists public.mv_wallets -- 사용자별 권한 지갑
( -- 표 시작
    user_id uuid primary key references auth.users(id) on delete cascade, -- 계정 식별자
    balance integer not null default 0 check (balance >= 0), -- 사용 가능 잔액
    total_used integer not null default 0 check (total_used >= 0), -- 반환 제외 누적 사용
    revision bigint not null default 0, -- 변경 순서
    recent timestamptz[] not null default '{}', -- 최근 요청 시각
    usage_day date not null default (now() at time zone 'Asia/Seoul')::date, -- 한도 기준 날짜
    day_messages integer not null default 0, -- 오늘 요청 횟수
    day_tokens integer not null default 0, -- 오늘 대화 토큰
    attendance_date date, -- 마지막 출석일
    cycle_day integer not null default 0, -- 연속 출석 칸
    total_days integer not null default 0, -- 누적 출석일
    updated_at timestamptz not null default now() -- 마지막 변경 시각
); -- 표 종료

create table if not exists public.mv_wallet_requests -- 요청별 처리 상태
( -- 표 시작
    user_id uuid not null references public.mv_wallets(user_id) on delete cascade, -- 소유 계정
    request_id uuid not null, -- 재전송 구별 번호
    fingerprint text not null check (length(fingerprint) = 64), -- 요청 내용 지문
    cost integer not null check (cost between 1 and 1000), -- 서버 계산 비용
    status text not null check (status in ('pending', 'charged', 'refunded')), -- 예약·사용·반환
    metadata jsonb not null, -- 사용 당시 채팅방 정보
    created_at timestamptz not null default now(), -- 예약 시각
    settled_at timestamptz, -- 사용 확정 시각
    primary key (user_id, request_id) -- 계정별 중복 방지
); -- 표 종료

create table if not exists public.mv_wallet_entries -- 변경 이력 원장
( -- 표 시작
    entry_id bigint generated always as identity primary key, -- 거래 순서
    user_id uuid not null references public.mv_wallets(user_id) on delete cascade, -- 소유 계정
    event_key text not null, -- 보상·차감 중복 방지 키
    direction text not null check (direction in ('earn', 'spend')), -- 지급·사용
    source text not null, -- 발생 항목
    label text not null, -- 표시 이름
    amount integer not null check (amount > 0), -- 변경 수량
    balance integer not null check (balance >= 0), -- 변경 직후 잔액
    metadata jsonb not null default '{}', -- 채팅방 정보
    created_at timestamptz not null default now(), -- 서버 거래 시각
    unique (user_id, event_key) -- 계정별 일회 지급
); -- 표 종료

create table if not exists public.mv_wallet_usage -- 서비스 전체 한도
( -- 표 시작
    day date primary key, -- 한국 날짜
    messages integer not null default 0 check (messages >= 0) -- 전체 요청 수
); -- 표 종료

create index if not exists mv_wallet_entries_user_time on public.mv_wallet_entries(user_id, entry_id desc); -- 최근 내역 조회
create index if not exists mv_wallet_requests_user_time on public.mv_wallet_requests(user_id, settled_at) where status = 'charged'; -- 보상 실적 조회
create index if not exists mv_wallet_requests_pending on public.mv_wallet_requests(user_id, created_at) where status = 'pending'; -- 중단 예약 조회

alter table public.mv_wallets enable row level security; -- 지갑 행 격리
alter table public.mv_wallet_requests enable row level security; -- 요청 행 격리
alter table public.mv_wallet_entries enable row level security; -- 원장 행 격리
alter table public.mv_wallet_usage enable row level security; -- 전체 한도 비공개
revoke all on public.mv_wallets, public.mv_wallet_requests, public.mv_wallet_entries, public.mv_wallet_usage from public, anon, authenticated; -- 브라우저 변경 차단
revoke all on sequence public.mv_wallet_entries_entry_id_seq from public, anon, authenticated; -- 원장 순번 변경 차단
grant select on public.mv_wallets, public.mv_wallet_entries to authenticated; -- 본인 조회 허용
grant all on public.mv_wallets, public.mv_wallet_requests, public.mv_wallet_entries, public.mv_wallet_usage to service_role; -- 서버 전용 변경
grant usage, select on sequence public.mv_wallet_entries_entry_id_seq to service_role; -- 서버 원장 순번
drop policy if exists mv_wallets_read_own on public.mv_wallets; -- 재실행 준비
create policy mv_wallets_read_own on public.mv_wallets for select to authenticated using ((select auth.uid()) = user_id); -- 본인 지갑 조회
drop policy if exists mv_wallet_entries_read_own on public.mv_wallet_entries; -- 재실행 준비
create policy mv_wallet_entries_read_own on public.mv_wallet_entries for select to authenticated using ((select auth.uid()) = user_id); -- 본인 원장 조회

create or replace function public.mv_wallet_snapshot(p_user uuid) returns jsonb -- 서버 조회 결과
language plpgsql security invoker set search_path = '' -- 호출자 권한과 고정 경로
as $$ -- 함수 본문
declare -- 지역 변수
    w public.mv_wallets%rowtype; -- 지갑 행
    d date := (now() at time zone 'Asia/Seoul')::date; -- 오늘
    monday date := date_trunc('week', now() at time zone 'Asia/Seoul')::date; -- 이번 주 월요일
    today_messages integer; -- 오늘 완료 대화
    today_rooms integer; -- 오늘 새 대화
    weekly_messages integer; -- 이번 주 완료 대화
    weekly_rooms integer; -- 이번 주 새 대화
    weekly_days integer; -- 이번 주 출석
    records jsonb; -- 최근 원장
    daily_claimed jsonb; -- 받은 일일 미션
    weekly_claimed jsonb; -- 받은 주간 미션
begin -- 함수 시작
    select * into w from public.mv_wallets where user_id = p_user; -- 본인 지갑
    select count(*) filter (where (settled_at at time zone 'Asia/Seoul')::date = d), count(*) filter (where (settled_at at time zone 'Asia/Seoul')::date >= monday) into today_messages, weekly_messages from public.mv_wallet_requests where user_id = p_user and status = 'charged'; -- 검증된 대화 수
    select count(*) filter (where (first_at at time zone 'Asia/Seoul')::date = d), count(*) filter (where (first_at at time zone 'Asia/Seoul')::date >= monday) into today_rooms, weekly_rooms from (select min(settled_at) as first_at from public.mv_wallet_requests where user_id = p_user and status = 'charged' group by metadata->>'conversationId') as rooms; -- 최초 대화 실적
    select count(*) into weekly_days from public.mv_wallet_entries where user_id = p_user and source = 'attendance' and (created_at at time zone 'Asia/Seoul')::date >= monday; -- 서버 출석 수
    select coalesce(jsonb_agg(to_jsonb(split_part(event_key, ':', 3))), '[]') into daily_claimed from public.mv_wallet_entries where user_id = p_user and event_key like 'mission:' || d::text || ':%'; -- 일일 수령 목록
    select coalesce(jsonb_agg(to_jsonb(split_part(event_key, ':', 3))), '[]') into weekly_claimed from public.mv_wallet_entries where user_id = p_user and event_key like 'weekly:' || monday::text || ':%'; -- 주간 수령 목록
    select coalesce(jsonb_agg(item order by entry_id desc), '[]') into records from (select entry_id, jsonb_build_object('id', 'server-' || entry_id::text, 'direction', direction, 'source', source, 'label', label, 'amount', amount, 'balance', balance, 'createdAt', created_at) || metadata as item from public.mv_wallet_entries where user_id = p_user order by entry_id desc limit 300) as latest; -- 최근 300건 표시
    return jsonb_build_object('revision', w.revision, 'wallet', jsonb_build_object('balance', w.balance, 'totalUsed', w.total_used, 'dailyChatUsed', case when w.usage_day = d then w.day_tokens else 0 end, 'dailyImageUsed', 0, 'updatedAt', w.updated_at), 'records', records, 'rewards', jsonb_build_object('attendance', jsonb_build_object('lastDate', w.attendance_date, 'cycleDay', w.cycle_day, 'totalDays', w.total_days), 'missions', jsonb_build_object('dateKey', d, 'progress', jsonb_build_object('send-messages', today_messages, 'start-conversation', today_rooms), 'claimed', daily_claimed, 'bonusClaimed', false), 'weekly', jsonb_build_object('weekKey', monday, 'progress', jsonb_build_object('weekly-messages', weekly_messages, 'weekly-conversations', weekly_rooms, 'weekly-attendance', weekly_days), 'claimed', weekly_claimed), 'totalEarned', (select coalesce(sum(amount), 0) from public.mv_wallet_entries where user_id = p_user and direction = 'earn' and source <> 'refund'))); -- 클라이언트 읽기 전용 결과
end; -- 함수 종료
$$; -- 본문 종료

create or replace function public.mv_wallet_release(p_user uuid, p_request uuid) returns void -- 미확정 예약 반환
language plpgsql security invoker set search_path = '' -- 서버 호출자 권한
as $$ -- 함수 본문
declare -- 지역 변수
    r public.mv_wallet_requests%rowtype; -- 예약 행
    remaining integer; -- 반환 직후 잔액
begin -- 함수 시작
    perform 1 from public.mv_wallets where user_id = p_user for update; -- 지갑 직렬화
    select * into r from public.mv_wallet_requests where user_id = p_user and request_id = p_request for update; -- 본인 요청
    if r.status = 'pending' then -- 미확정 예약만 반환
        update public.mv_wallets set balance = balance + r.cost, total_used = total_used - r.cost, day_tokens = day_tokens - case when usage_day = (r.created_at at time zone 'Asia/Seoul')::date then r.cost else 0 end, revision = revision + 1, updated_at = now() where user_id = p_user returning balance into remaining; -- 잔액 복구
        update public.mv_wallet_requests set status = 'refunded' where user_id = p_user and request_id = p_request; -- 반환 확정
        insert into public.mv_wallet_entries(user_id, event_key, direction, source, label, amount, balance, metadata) values (p_user, 'refund:' || p_request::text, 'earn', 'refund', '응답 전 실패 토큰 반환', r.cost, remaining, r.metadata); -- 반환 원장
    end if; -- 반환 조건 종료
end; -- 함수 종료
$$; -- 본문 종료

create or replace function public.mv_wallet_command(p_user uuid, p_command text, p_data jsonb default '{}') returns jsonb -- 서비스 전용 지갑 명령
language plpgsql security invoker set search_path = '' -- 권한 상승 없는 고정 경로
as $$ -- 함수 본문
declare -- 지역 변수
    w public.mv_wallets%rowtype; -- 잠근 지갑
    r public.mv_wallet_requests%rowtype; -- 요청 행
    expired record; -- 중단된 예약
    d date := (now() at time zone 'Asia/Seoul')::date; -- 한국 날짜
    monday date := date_trunc('week', now() at time zone 'Asia/Seoul')::date; -- 주간 기준
    rid uuid; -- 요청 번호
    recent_times timestamptz[]; -- 최근 분 요청
    minute_limit integer := coalesce((p_data->>'perMinute')::integer, 20); -- 분 한도
    day_limit integer := coalesce((p_data->>'perDay')::integer, 300); -- 일 한도
    total_limit integer := coalesce((p_data->>'totalPerDay')::integer, 0); -- 서비스 한도
    global_messages integer; -- 전체 요청 수
    cost integer; -- 서버 비용
    metadata jsonb; -- 표시용 정보
    reward text := p_data->>'reward'; -- 보상 종류
    event text; -- 일회 보상 키
    amount integer; -- 지급 수량
    source text; -- 지급 출처
    label text; -- 지급 설명
    snapshot jsonb; -- 실적 계산
    next_day integer; -- 출석 칸
begin -- 함수 시작
    if p_user is null or p_command not in ('read', 'reserve', 'settle', 'refund', 'assist', 'reward') then -- 명령 검사
        return jsonb_build_object('ok', false, 'error', 'bad-request'); -- 잘못된 명령
    end if; -- 검사 종료
    insert into public.mv_wallets(user_id) values (p_user) on conflict do nothing; -- 최초 지갑 생성
    select * into w from public.mv_wallets where user_id = p_user for update; -- 계정 단위 잠금
    if w.usage_day <> d then -- 한국 날짜 변경
        update public.mv_wallets set usage_day = d, day_messages = 0, day_tokens = 0 where user_id = p_user; -- 오늘 한도 초기화
    end if; -- 날짜 조건 종료
    for expired in select request_id from public.mv_wallet_requests where user_id = p_user and status = 'pending' and created_at <= now() - interval '10 minutes' loop -- 서버 중단 예약 회수
        perform public.mv_wallet_release(p_user, expired.request_id); -- 중복 없는 반환
    end loop; -- 회수 종료
    select * into w from public.mv_wallets where user_id = p_user; -- 회수 후 지갑
    if p_command in ('reserve', 'settle', 'refund') then -- 요청 번호 필요
        rid := (p_data->>'requestId')::uuid; -- UUID 검사
        if rid is null then -- 요청 번호 누락
            return jsonb_build_object('ok', false, 'error', 'bad-request'); -- 거절
        end if; -- 검사 종료
        select * into r from public.mv_wallet_requests where user_id = p_user and request_id = rid; -- 본인 처리 기록
    end if; -- 요청 분기 종료
    if p_command = 'reserve' and r.request_id is not null then -- 같은 요청 재전송
        return jsonb_build_object('ok', false, 'error', case when r.fingerprint = p_data->>'fingerprint' then 'duplicate-request' else 'request-conflict' end); -- 이중 호출·변조 차단
    end if; -- 중복 조건 종료
    if p_command = 'reserve' then -- 새 예약 검사
        cost := (p_data->>'cost')::integer; -- 서버 계산액
        if cost is null or cost not between 1 and 1000 or length(coalesce(p_data->>'fingerprint', '')) <> 64 or length(coalesce(p_data->>'conversationId', '')) not between 1 and 160 then -- 필수 요청 모양
            return jsonb_build_object('ok', false, 'error', 'bad-request'); -- 잘못된 예약
        end if; -- 검사 종료
        if w.balance < cost then -- 잔액 부족
            return jsonb_build_object('ok', false, 'error', 'insufficient-token'); -- 실제 AI 호출 전 차단
        end if; -- 잔액 조건 종료
    end if; -- 예약 검사 종료
    if p_command in ('reserve', 'assist') then -- 실제 AI 요청 한도
        select coalesce(array_agg(t), '{}') into recent_times from unnest(w.recent) as t where t > now() - interval '1 minute'; -- 최근 분만 유지
        if minute_limit < 1 or day_limit < 1 or total_limit < 0 then -- 서버 설정 검사
            return jsonb_build_object('ok', false, 'error', 'bad-request'); -- 잘못된 한도
        end if; -- 설정 검사 종료
        if cardinality(recent_times) >= minute_limit then -- 분 한도
            return jsonb_build_object('ok', false, 'error', 'rate-limited'); -- 거절
        end if; -- 분 검사 종료
        if p_command = 'reserve' and w.day_messages >= day_limit then -- 개인 하루 한도
            return jsonb_build_object('ok', false, 'error', 'daily-limit'); -- 거절
        end if; -- 개인 검사 종료
        if p_command = 'reserve' then -- 전체 요청 한도
            insert into public.mv_wallet_usage(day) values (d) on conflict do nothing; -- 오늘 집계 생성
            select messages into global_messages from public.mv_wallet_usage where day = d for update; -- 전체 집계 잠금
            if total_limit > 0 and global_messages >= total_limit then -- 서비스 한도
                return jsonb_build_object('ok', false, 'error', 'service-limit'); -- 거절
            end if; -- 서비스 검사 종료
            update public.mv_wallet_usage set messages = messages + 1 where day = d; -- 전체 횟수 기록
        end if; -- 전체 한도 종료
        update public.mv_wallets set recent = array_append(recent_times, now()), day_messages = day_messages + case when p_command = 'reserve' then 1 else 0 end where user_id = p_user; -- 영속 요청 횟수
    end if; -- 한도 분기 종료
    if p_command = 'reserve' then -- 원자적 예약 차감
        metadata := jsonb_strip_nulls(jsonb_build_object('conversationId', left(p_data->>'conversationId', 160), 'conversationTitle', left(p_data->>'conversationTitle', 160), 'characterId', left(p_data->>'characterId', 160), 'versionId', left(p_data->>'versionId', 160), 'work', left(p_data->>'work', 160))); -- 허용한 표시 정보만 저장
        insert into public.mv_wallet_requests(user_id, request_id, fingerprint, cost, status, metadata) values (p_user, rid, p_data->>'fingerprint', cost, 'pending', metadata); -- 중복 방지 예약
        update public.mv_wallets set balance = balance - cost, total_used = total_used + cost, day_tokens = day_tokens + cost, revision = revision + 1, updated_at = now() where user_id = p_user returning * into w; -- 잠금 상태 차감
        insert into public.mv_wallet_entries(user_id, event_key, direction, source, label, amount, balance, metadata) values (p_user, 'spend:' || rid::text, 'spend', 'chat', '대화', cost, w.balance, metadata); -- 원장 추가
    elsif p_command = 'settle' then -- 첫 응답 직전 확정
        if r.status is distinct from 'pending' then -- 반환·완료·없는 요청
            return jsonb_build_object('ok', false, 'error', 'request-closed'); -- 늦은 응답 차단
        end if; -- 상태 검사 종료
        update public.mv_wallet_requests set status = 'charged', settled_at = now() where user_id = p_user and request_id = rid; -- 사용 실적 확정
        update public.mv_wallets set revision = revision + 1, updated_at = now() where user_id = p_user; -- 실적 화면 갱신 순서
    elsif p_command = 'refund' then -- 응답 전 실패
        perform public.mv_wallet_release(p_user, rid); -- 미확정 예약만 반환
    elsif p_command = 'reward' then -- 검증된 보상
        snapshot := public.mv_wallet_snapshot(p_user); -- 서버 실적
        if reward = 'attendance' then -- 출석
            event := 'attendance:' || d::text; -- 한국 날짜별 일회 키
            next_day := case when w.attendance_date = d - 1 and w.cycle_day < 7 then w.cycle_day + 1 else 1 end; -- 연속 출석 칸
            amount := case when next_day = 7 then 20 else 5 end; -- 기존 출석 비용표
            source := 'attendance'; -- 출석 출처
            label := '출석 ' || next_day::text || '일차'; -- 출석 설명
        elsif reward in ('send-messages', 'start-conversation') and coalesce((snapshot #>> array['rewards', 'missions', 'progress', reward])::integer, 0) >= (case when reward = 'send-messages' then 5 else 1 end) then -- 일일 대화 실적
            event := 'mission:' || d::text || ':' || reward; -- 일일 일회 키
            amount := 3; -- 기존 미션 보상
            source := 'mission'; -- 미션 출처
            label := case when reward = 'send-messages' then '미션: 메시지 5번 보내기' else '미션: 새 대화 시작하기' end; -- 미션 설명
        elsif reward in ('weekly-messages', 'weekly-conversations', 'weekly-attendance') and coalesce((snapshot #>> array['rewards', 'weekly', 'progress', reward])::integer, 0) >= (case reward when 'weekly-messages' then 30 when 'weekly-conversations' then 3 else 5 end) then -- 주간 서버 실적
            event := 'weekly:' || monday::text || ':' || reward; -- 주간 일회 키
            amount := 10; -- 기존 주간 보상
            source := 'mission'; -- 미션 출처
            label := case reward when 'weekly-messages' then '주간 미션: 메시지 30번 보내기' when 'weekly-conversations' then '주간 미션: 새 대화 3번 시작하기' else '주간 미션: 5일 출석하기' end; -- 주간 설명
        else -- 서버 증거 부족
            return jsonb_build_object('ok', false, 'error', 'reward-unavailable'); -- 브라우저 진행·초대 지급 차단
        end if; -- 보상 선택 종료
        if not exists (select 1 from public.mv_wallet_entries where user_id = p_user and event_key = event) then -- 일회 지급
            update public.mv_wallets set balance = balance + amount, revision = revision + 1, updated_at = now(), attendance_date = case when reward = 'attendance' then d else attendance_date end, cycle_day = case when reward = 'attendance' then next_day else cycle_day end, total_days = total_days + case when reward = 'attendance' then 1 else 0 end where user_id = p_user returning * into w; -- 서버 보상 지급
            insert into public.mv_wallet_entries(user_id, event_key, direction, source, label, amount, balance) values (p_user, event, 'earn', source, label, amount, w.balance); -- 지급 원장
        end if; -- 일회 지급 종료
    end if; -- 명령 처리 종료
    return jsonb_build_object('ok', true, 'snapshot', public.mv_wallet_snapshot(p_user)); -- 최신 서버 결과
end; -- 함수 종료
$$; -- 본문 종료

revoke all on function public.mv_wallet_snapshot(uuid) from public, anon, authenticated; -- 조회 함수 외부 호출 차단
revoke all on function public.mv_wallet_release(uuid, uuid) from public, anon, authenticated; -- 반환 함수 외부 호출 차단
revoke all on function public.mv_wallet_command(uuid, text, jsonb) from public, anon, authenticated; -- 명령 외부 호출 차단
grant execute on function public.mv_wallet_snapshot(uuid), public.mv_wallet_release(uuid, uuid), public.mv_wallet_command(uuid, text, jsonb) to service_role; -- 서버에만 실행 허용
notify pgrst, 'reload schema'; -- REST 함수 목록 갱신
commit; -- 설치 확정
