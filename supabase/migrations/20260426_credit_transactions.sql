-- Credit-pack purchase ledger + atomic apply RPC.
-- Applied via Supabase MCP on 2026-04-26.

create table if not exists credit_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  credits_added   integer not null check (credits_added > 0),
  amount_paid     integer not null check (amount_paid >= 0),
  currency        text not null default 'INR',
  payment_id      text not null,
  pack            text not null default 'custom',
  status          text not null default 'success' check (status in ('pending','success','failed')),
  created_at      timestamptz not null default now()
);

create unique index if not exists credit_transactions_payment_id_uniq on credit_transactions(payment_id);
create index if not exists credit_transactions_user_created_idx on credit_transactions(user_id, created_at desc);

alter table credit_transactions enable row level security;

drop policy if exists "select_own_credit_tx" on credit_transactions;
create policy "select_own_credit_tx" on credit_transactions
  for select to authenticated using (auth.uid() = user_id);

create or replace function apply_credit_pack(
  p_user_id    uuid,
  p_credits    integer,
  p_amount     integer,
  p_payment_id text,
  p_pack       text
) returns table(idempotent boolean, new_balance integer, transaction_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_tx_id uuid;
  v_tx_id          uuid;
  v_credits_added  integer;
  v_events_used    integer;
begin
  if p_credits <= 0 then
    return query select true, 0, null::uuid;
    return;
  end if;

  select id into v_existing_tx_id from credit_transactions where payment_id = p_payment_id;
  if v_existing_tx_id is not null then
    select credits_added - events_used into v_credits_added
    from user_usage where user_id = p_user_id;
    return query select true, coalesce(greatest(0, v_credits_added), 0), v_existing_tx_id;
    return;
  end if;

  insert into user_usage (user_id, credits_added, events_used)
    values (p_user_id, 0, 0)
    on conflict (user_id) do nothing;

  select credits_added, events_used into v_credits_added, v_events_used
  from user_usage where user_id = p_user_id for update;

  update user_usage
    set credits_added = v_credits_added + p_credits,
        updated_at    = now()
    where user_id = p_user_id;

  insert into credit_transactions (user_id, credits_added, amount_paid, payment_id, pack, status)
    values (p_user_id, p_credits, p_amount, p_payment_id, p_pack, 'success')
    returning id into v_tx_id;

  return query select false, (v_credits_added + p_credits - v_events_used), v_tx_id;
end;
$$;

revoke all on function apply_credit_pack(uuid, integer, integer, text, text) from public, anon, authenticated;
grant execute on function apply_credit_pack(uuid, integer, integer, text, text) to service_role;
