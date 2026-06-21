alter table campaigns add column if not exists lang_group_id uuid;
create index if not exists campaigns_lang_group_id_idx on campaigns(lang_group_id);
