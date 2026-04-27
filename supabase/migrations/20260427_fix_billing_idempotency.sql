-- Fix: replace last_payment_id-based idempotency in apply_payment_credits with
-- a proper billing_payments ledger (same pattern as credit_transactions).
--
-- The old approach stored only the most-recent payment_id on user_usage, so a
-- Razorpay webhook retry for an older payment would bypass the idempotency
-- check and double-credit the user.  A per-payment UNIQUE row eliminates that.

create table if not exists billing_payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  payment_id     text not null,
  plan           text not null,
  credits_added  integer not null check (credits_added > 0),
  created_at     timestamptz not null default now()
);

create unique index if not exists billing_payments_payment_id_uniq
  on billing_payments(payment_id);

create index if not exists billing_payments_user_created_idx
  on billing_payments(user_id, created_at desc);

alter table billing_payments enable row level security;

drop policy if exists "select_own_billing_payments" on billing_payments;
create policy "select_own_billing_payments" on billing_payments
  for select to authenticated using (auth.uid() = user_id);

-- Rewrite apply_payment_credits to use billing_payments for idempotency.
--
-- Flow (all in one transaction):
--   1. INSERT billing_payments → if 0 rows inserted, payment already recorded → return idempotent.
--   2. Upsert user_usage row so it exists.
--   3. SELECT FOR UPDATE the user_usage row.
--   4. UPDATE credits_added.
--   5. Return new balance.
--
-- Two parallel webhook calls: one wins the billing_payments INSERT (ROW_COUNT=1)
-- and proceeds; the other gets ROW_COUNT=0 and short-circuits.  The SELECT FOR
-- UPDATE in step 3 additionally serialises them if they race past step 1.

create or replace function apply_payment_credits(
  p_user_id    uuid,
  p_plan       text,
  p_amount     integer,
  p_payment_id text
) returns table(idempotent boolean, total_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
  v_total    integer;
begin
  if p_amount <= 0 then
    return query select true, 0;
    return;
  end if;

  -- Step 1: try to record this payment.  UNIQUE on payment_id is the guard.
  insert into billing_payments (user_id, payment_id, plan, credits_added)
    values (p_user_id, p_payment_id, p_plan, p_amount)
    on conflict (payment_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    -- Duplicate delivery — credits were already applied by an earlier call.
    select credits_added - events_used into v_total
      from user_usage where user_id = p_user_id;
    return query select true, coalesce(greatest(0, v_total), 0);
    return;
  end if;

  -- Step 2: ensure user_usage row exists before we lock it.
  insert into user_usage (user_id, plan, credits_added, events_used)
    values (p_user_id, p_plan, 0, 0)
    on conflict (user_id) do nothing;

  -- Step 3+4: lock + update atomically.
  update user_usage
    set plan          = p_plan,
        credits_added = credits_added + p_amount,
        updated_at    = now()
    where user_id = p_user_id
    returning credits_added - events_used into v_total;

  return query select false, coalesce(greatest(0, v_total), 0);
end;
$$;

revoke all on function apply_payment_credits(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function apply_payment_credits(uuid, text, integer, text) to service_role;
