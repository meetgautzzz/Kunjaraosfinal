-- Single atomic operation for the billing webhook: idempotency check +
-- credit grant + plan stamp + last_payment_id stamp, all inside one
-- SELECT FOR UPDATE. Eliminates the 4-branch race logic that lived in
-- the webhook route. Applied via Supabase MCP on 2026-04-26.

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
  v_existing_payment text;
  v_total            integer;
begin
  if p_amount <= 0 then
    return query select true, 0;
    return;
  end if;

  insert into user_usage (user_id, plan, credits_added, last_payment_id, events_used)
    values (p_user_id, p_plan, p_amount, p_payment_id, 0)
    on conflict (user_id) do nothing;

  select last_payment_id into v_existing_payment
  from user_usage where user_id = p_user_id for update;

  if v_existing_payment is not distinct from p_payment_id then
    select credits_added into v_total
    from user_usage where user_id = p_user_id;
    return query select true, v_total;
    return;
  end if;

  update user_usage
    set plan            = p_plan,
        credits_added   = credits_added + p_amount,
        last_payment_id = p_payment_id,
        updated_at      = now()
    where user_id = p_user_id
    returning credits_added into v_total;

  return query select false, v_total;
end;
$$;

revoke all on function apply_payment_credits(uuid, text, integer, text) from public, anon, authenticated;
grant execute on function apply_payment_credits(uuid, text, integer, text) to service_role;
