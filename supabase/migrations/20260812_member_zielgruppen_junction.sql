-- A contact could only ever belong to exactly one Zielgruppe (members.zielgruppe_id,
-- a single nullable FK). This adds a many-to-many junction table so a contact can
-- belong to several Zielgruppen at once. members.zielgruppe_id is intentionally left
-- in place (unused by the app going forward) rather than dropped here — dropping it
-- in the same migration as the code cutover would leave a window where deployed code
-- and DB schema disagree, since the code deploy and this SQL run happen separately.

create table if not exists public.member_zielgruppen (
  member_id uuid not null references public.members(id) on delete cascade,
  zielgruppe_id uuid not null references public.zielgruppen(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, zielgruppe_id)
);

create index if not exists member_zielgruppen_zielgruppe_id_idx on public.member_zielgruppen(zielgruppe_id);

-- Backfill existing single-group memberships
insert into public.member_zielgruppen (member_id, zielgruppe_id)
select id, zielgruppe_id from public.members
where zielgruppe_id is not null
on conflict do nothing;

alter table public.member_zielgruppen enable row level security;

create policy "member_zielgruppen_no_anon" on public.member_zielgruppen
  for all to anon using (false);
