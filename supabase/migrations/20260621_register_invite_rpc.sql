-- Atomic invite-code registration: prevents duplicate + race condition
create or replace function register_invite_atomic(
  p_event_id uuid,
  p_name text,
  p_email text,
  p_invite_code_id uuid default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_event_id uuid;
  v_qr_token uuid;
  v_new_id uuid;
begin
  -- Resolve event: explicit id or active event
  if p_event_id is not null then
    select id into v_event_id from events where id = p_event_id for update;
  else
    select id into v_event_id from events where active = true limit 1 for update;
  end if;

  if v_event_id is null then
    return jsonb_build_object('error', 'event_not_found');
  end if;

  -- Duplicate check
  if exists (
    select 1 from registrations
    where event_id = v_event_id and lower(email) = lower(trim(p_email))
  ) then
    select qr_token into v_qr_token from registrations
    where event_id = v_event_id and lower(email) = lower(trim(p_email))
    limit 1;
    return jsonb_build_object('error', 'duplicate', 'token', v_qr_token);
  end if;

  v_qr_token := gen_random_uuid();

  insert into registrations (name, email, event_id, qr_token, checked_in, invite_code_id)
  values (
    trim(p_name),
    lower(trim(p_email)),
    v_event_id,
    v_qr_token,
    false,
    p_invite_code_id
  )
  returning id into v_new_id;

  -- Mark invite code used
  if p_invite_code_id is not null then
    update invite_codes set used = true where id = p_invite_code_id;
  end if;

  return jsonb_build_object('ok', true, 'id', v_new_id, 'token', v_qr_token, 'event_id', v_event_id);
end;
$$;
