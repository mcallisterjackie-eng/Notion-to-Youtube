-- Covering indexes for the composite (id, account_id) foreign keys, flagged by the
-- Supabase performance advisor. They keep cascading deletes and parent lookups fast.
create index connection_secrets_connection_account_idx on public.connection_secrets (connection_id, account_id);
create index data_sources_connection_account_idx on public.data_sources (connection_id, account_id);
create index mapping_configs_data_source_account_idx on public.mapping_configs (data_source_id, account_id);
create index field_mappings_config_account_idx on public.field_mappings (mapping_config_id, account_id);
create index status_mappings_config_account_idx on public.status_mappings (mapping_config_id, account_id);
create index upload_jobs_data_source_account_idx on public.upload_jobs (data_source_id, account_id);
create index upload_jobs_republish_account_idx on public.upload_jobs (republish_of_job_id, account_id);
create index job_errors_job_account_idx on public.job_errors (upload_job_id, account_id);
