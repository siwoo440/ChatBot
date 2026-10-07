-- Mate Verse ChatBot 계정 데이터 설정
-- Supabase 화면의 SQL Editor에 이 파일의 내용을 통째로 붙여 넣고 한 번 실행한다(여러 번 실행해도 같은 결과가 된다).
-- 만드는 것: 계정마다 앱 데이터 한 벌(저장본)을 두는 표와, "자기 줄만 읽고 쓸 수 있다"는 권한 규칙.

begin;

-- 저장본 표: 계정마다 한 줄. 저장할 때마다 번호(revision)가 1씩 오른다.
create table if not exists public.mv_snapshots
(
    user_id uuid primary key references auth.users (id) on delete cascade, -- 계정(계정을 지우면 저장본도 함께 지워짐)
    revision bigint not null check (revision > 0), -- 저장 번호(다른 기기가 그 사이 저장했는지 가리는 데 씀)
    state text not null check (char_length(state) <= 8000000), -- 앱 데이터(JSON 글. 글자 수 한도)
    device_id text not null default '' check (char_length(device_id) <= 80), -- 저장한 기기 이름
    updated_at timestamptz not null default now() -- 저장한 시각
);

-- 줄 단위 권한 규칙을 켠다(켜지 않으면 공개 키만으로 모든 줄을 읽을 수 있다).
alter table public.mv_snapshots enable row level security;

-- 로그인한 사람은 자기 줄만 읽고, 만들고, 고치고, 지울 수 있다.
drop policy if exists mv_snapshots_select_own on public.mv_snapshots;
create policy mv_snapshots_select_own on public.mv_snapshots for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists mv_snapshots_insert_own on public.mv_snapshots;
create policy mv_snapshots_insert_own on public.mv_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists mv_snapshots_update_own on public.mv_snapshots;
create policy mv_snapshots_update_own on public.mv_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists mv_snapshots_delete_own on public.mv_snapshots;
create policy mv_snapshots_delete_own on public.mv_snapshots for delete to authenticated using ((select auth.uid()) = user_id);

-- 로그인하지 않은 요청(공개 키만 가진 요청)은 이 표에 아무 권한이 없다.
revoke all on public.mv_snapshots from anon;
grant select, insert, update, delete on public.mv_snapshots to authenticated;

-- 고칠 때마다 저장한 시각을 서버 시각으로 맞춘다(브라우저가 보낸 시각을 믿지 않음).
create or replace function public.mv_touch_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists mv_snapshots_touch on public.mv_snapshots;
create trigger mv_snapshots_touch before update on public.mv_snapshots for each row execute function public.mv_touch_snapshot();

-- 계정 지우기(탈퇴): 로그인한 사람이 자기 계정을 지운다. 계정을 지우면 위 표의 저장본도 함께 지워진다(on delete cascade).
-- 계정 표(auth.users)는 로그인한 사람의 권한으로는 지울 수 없어, 만든 사람의 권한으로 도는 함수(security definer)를 두고 자기 것만 지우게 한다.
create or replace function public.mv_delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if (select auth.uid()) is null then
        raise exception 'not signed in' using errcode = '28000';
    end if;
    delete from auth.users where id = (select auth.uid());
end;
$$;

-- 이 함수는 로그인한 사람만 부를 수 있다(공개 키만 가진 요청은 부르지 못함).
revoke all on function public.mv_delete_account() from public;
revoke all on function public.mv_delete_account() from anon;
grant execute on function public.mv_delete_account() to authenticated;

commit;
