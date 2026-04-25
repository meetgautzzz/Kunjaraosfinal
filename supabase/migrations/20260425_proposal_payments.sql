-- Architecture A: planner records client payments manually.
-- Money flow happens off-platform (UPI / bank transfer); we just track it.
-- Run this once in the Supabase SQL editor.

create table if not exists proposal_payments (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          integer not null check (amount > 0),
  currency        text not null default 'INR',
  description     text not null default '',
  due_date        date,
  method          text not null default 'UPI', -- 'UPI' | 'BANK'
  payment_target  text not null default '',    -- planner's UPI id or bank line shown to client
  status          text not null default 'REQUESTED' check (status in (
                    'REQUESTED', 'PAID', 'CONFIRMED', 'CANCELLED'
                  )),
  payer_name      text,
  payer_reference text,                         -- UTR / txn id the client enters
  payer_note      text,
  submitted_at    timestamptz,                  -- when client clicked "I've paid"
  confirmed_at    timestamptz,                  -- when planner verified receipt
  planner_notes   text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposal_payments_proposal_id_idx on proposal_payments(proposal_id);
create index if not exists proposal_payments_user_id_status_idx on proposal_payments(user_id, status);

alter table proposal_payments enable row level security;

-- Planners read/write only their own payment records.
create policy "select_own_payments" on proposal_payments
  for select to authenticated
  using (auth.uid() = user_id);

create policy "insert_own_payments" on proposal_payments
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "update_own_payments" on proposal_payments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_payments" on proposal_payments
  for delete to authenticated
  using (auth.uid() = user_id);

-- Public-share writes (client marking "I've paid") happen via service-role
-- key in the API route, which bypasses RLS — no anon policy needed.
