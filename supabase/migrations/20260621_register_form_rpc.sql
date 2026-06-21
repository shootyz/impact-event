-- Atomic form registration: locks event row to prevent capacity race conditions
create or replace function register_form_atomic(
  p_event_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_company text default null,
  p_message text default null,
  p_extra_fields jsonb default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_registration_type text;
  v_max_capacity integer;
  v_count integer;
  v_new_id uuid;
begin
  -- Lock the event row — serializes concurrent registrations for the same event
  select registration_type, max_capacity
  into v_registration_type, v_max_capacity
  from events
  where id = p_event_id
  for update;

  if not found then
    return jsonb_build_object('error', 'event_not_found');
  end if;

  if v_registration_type != 'form' then
    return jsonb_build_object('error', 'not_form_event');
  end if;

  -- Duplicate check
  if exists (
    select 1 from form_registrations
    where event_id = p_event_id and lower(email) = lower(trim(p_email))
  ) then
    return jsonb_build_object('error', 'duplicate');
  end if;

  -- Capacity check (inside the lock)
  if v_max_capacity is not null then
    select count(*) into v_count
    from form_registrations
    where event_id = p_event_id and status in ('pending', 'confirmed');

    if v_count >= v_max_capacity then
      return jsonb_build_object('error', 'capacity_full');
    end if;
  end if;

  insert into form_registrations (event_id, first_name, last_name, email, company, message, extra_fields, status)
  values (
    p_event_id,
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_company, '')), ''),
    nullif(trim(coalesce(p_message, '')), ''),
    p_extra_fields,
    'pending'
  )
  returning id into v_new_id;

  return jsonb_build_object('ok', true, 'id', v_new_id);
end;
$$;
