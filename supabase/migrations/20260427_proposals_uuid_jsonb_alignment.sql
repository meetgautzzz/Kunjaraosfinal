-- =====================================================================
-- LAUNCH-PHASE SCHEMA ALIGNMENT
-- Applied via Supabase MCP on 2026-04-27.
--
-- Replaces the legacy Prisma-era proposals table (id text, per-field
-- columns, createdById text -> public.users) with the canonical shape
-- every recent route assumes:
--     id uuid PK · user_id uuid FK auth.users · data jsonb · timestamps
--
-- Live state at migration time: 2 dev-seed proposal rows with no real
-- owner, 0 proposal_payments rows. No production data lost.
-- =====================================================================

begin;

drop table if exists public.proposals cascade;
drop type  if exists public."ProposalStatus";

create table public.proposals (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index proposals_user_id_idx      on public.proposals(user_id);
create index proposals_user_created_idx on public.proposals(user_id, created_at desc);
create index proposals_data_status_idx  on public.proposals using gin ((data -> 'status'));

alter table public.proposals enable row level security;

drop policy if exists "select_own_proposals" on public.proposals;
create policy "select_own_proposals" on public.proposals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert_own_proposals" on public.proposals;
create policy "insert_own_proposals" on public.proposals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update_own_proposals" on public.proposals;
create policy "update_own_proposals" on public.proposals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete_own_proposals" on public.proposals;
create policy "delete_own_proposals" on public.proposals
  for delete to authenticated using (auth.uid() = user_id);

-- Repoint proposal_payments.proposal_id from text -> uuid (table is empty).
alter table public.proposal_payments
  drop constraint if exists proposal_payments_proposal_id_fkey;

alter table public.proposal_payments
  alter column proposal_id type uuid using proposal_id::uuid;

alter table public.proposal_payments
  add constraint proposal_payments_proposal_id_fkey
  foreign key (proposal_id) references public.proposals(id) on delete cascade;

commit;
