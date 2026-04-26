-- AI credit hardening: per-call audit log + atomic SQL functions for
-- consume / refund / grant. Applied via Supabase MCP on 2026-04-26.
-- Idempotent — safe to re-run.

create table if not exists ai_usage_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  event_id          text,
  action_type       text not null,
  credits_used      integer not null check (credits_used >= 0),
  tokens_used       integer,
  model_used        text not null,
  response_time_ms  integer not null check (response_time_ms >= 0),
  status            text not null default 'success' check (status in ('success','error')),
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_created_idx on ai_usage_logs(user_id, created_at desc);
create index if not exists ai_usage_logs_event_idx        on ai_usage_logs(event_id) where event_id is not null;
create index if not exists ai_usage_logs_user_action_idx  on ai_usage_logs(user_id, action_type);

alter table ai_usage_logs enable row level security;

drop policy if exists "select_own_ai_logs" on ai_usage_logs;
create policy "select_own_ai_logs" on ai_usage_logs
  for select to authenticated using (auth.uid() = user_id);

create or replace function consume_ai_credits(
  p_user_id uuid,
  p_amount  integer
) returns table(success boolean, credits_remaining integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits_added integer;
  v_events_used   integer;
begin
  if p_amount <= 0 then
    return query select false, 0, 'INVALID_AMOUNT'::text;
    return;
  end if;

  select credits_added, events_used into v_credits_added, v_events_used
  from user_usage where user_id = p_user_id for update;

  if not found then
    return query select false, 0, 'NOT_FOUND'::text;
    return;
  end if;

  if v_events_used + p_amount > v_credits_added then
    return query select false, greatest(0, v_credits_added - v_events_used), 'LIMIT_REACHED'::text;
    return;
  end if;

  update user_usage
    set events_used = v_events_used + p_amount,
        updated_at  = now()
    where user_id = p_user_id;

  return query select true, (v_credits_added - v_events_used - p_amount), null::text;
end;
$$;

create or replace function refund_ai_credits(
  p_user_id uuid,
  p_amount  integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events_used integer;
begin
  if p_amount <= 0 then return 0; end if;

  select events_used into v_events_used
  from user_usage where user_id = p_user_id for update;

  if not found then return 0; end if;

  update user_usage
    set events_used = greatest(0, v_events_used - p_amount),
        updated_at  = now()
    where user_id = p_user_id;

  return greatest(0, v_events_used - p_amount);
end;
$$;

create or replace function grant_ai_credits(
  p_user_id uuid,
  p_amount  integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_total integer;
begin
  if p_amount <= 0 then return 0; end if;

  insert into user_usage (user_id, credits_added, events_used)
    values (p_user_id, p_amount, 0)
    on conflict (user_id) do update
      set credits_added = user_usage.credits_added + p_amount,
          updated_at    = now()
    returning credits_added into v_new_total;

  return v_new_total;
end;
$$;

revoke all on function consume_ai_credits(uuid, integer) from public, anon, authenticated;
revoke all on function refund_ai_credits(uuid, integer)  from public, anon, authenticated;
revoke all on function grant_ai_credits(uuid, integer)   from public, anon, authenticated;
grant execute on function consume_ai_credits(uuid, integer) to service_role;
grant execute on function refund_ai_credits(uuid, integer)  to service_role;
grant execute on function grant_ai_credits(uuid, integer)   to service_role;
