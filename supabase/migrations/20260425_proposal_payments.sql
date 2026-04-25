-- Architecture A: planner records client payments manually.
-- Money flow happens off-platform (UPI / bank transfer); we just track it.
-- Idempotent — safe to re-run.

-- proposal_id is TEXT to match the live proposals.id column type (Prisma-era
-- cuid). user_id is uuid -> auth.users since auth schema is canonical.
create table if not exists proposal_payments (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     text not null references proposals(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          integer not null check (amount > 0),
  currency        text not null default 'INR',
  description     text not null default '',
  due_date        date,
  method          text not null default 'UPI',
  payment_target  text not null default '',
  status          text not null default 'REQUESTED' check (status in (
                    'REQUESTED', 'PAID', 'CONFIRMED', 'CANCELLED'
                  )),
  payer_name      text,
  payer_reference text,
  payer_note      text,
  submitted_at    timestamptz,
  confirmed_at    timestamptz,
  planner_notes   text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposal_payments_proposal_id_idx on proposal_payments(proposal_id);
create index if not exists proposal_payments_user_id_status_idx on proposal_payments(user_id, status);

alter table proposal_payments enable row level security;

drop policy if exists "select_own_payments" on proposal_payments;
create policy "select_own_payments" on proposal_payments
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert_own_payments" on proposal_payments;
create policy "insert_own_payments" on proposal_payments
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update_own_payments" on proposal_payments;
create policy "update_own_payments" on proposal_payments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete_own_payments" on proposal_payments;
create policy "delete_own_payments" on proposal_payments
  for delete to authenticated
  using (auth.uid() = user_id);

-- Public-share writes (client marking "I've paid") use service-role and
-- bypass RLS, so no anon policy is required.
