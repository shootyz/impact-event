-- Atomic QR scan check-in: prevents double check-in race condition
create or replace function scan_checkin_atomic(
  p_token uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
  v_name text;
  v_email text;
  v_checked_in boolean;
  v_checked_in_at timestamptz;
begin
  select id, name, email, checked_in, checked_in_at
  into v_id, v_name, v_email, v_checked_in, v_checked_in_at
  from registrations
  where qr_token = p_token
  for update;

  if v_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_checked_in then
    return jsonb_build_object('status', 'already_checked_in', 'name', v_name, 'checked_in_at', v_checked_in_at);
  end if;

  update registrations
  set checked_in = true, checked_in_at = now()
  where id = v_id;

  return jsonb_build_object('status', 'success', 'name', v_name, 'email', v_email);
end;
$$;
