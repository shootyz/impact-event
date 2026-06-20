alter table events add column if not exists form_config jsonb;
alter table form_registrations add column if not exists extra_fields jsonb;
