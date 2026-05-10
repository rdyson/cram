alter table uploaded_assets drop constraint if exists uploaded_assets_type_check;
alter table uploaded_assets add constraint uploaded_assets_type_check check (type in ('markdown', 'screenshot'));

alter table study_items drop constraint if exists study_items_source_check;
alter table study_items add constraint study_items_source_check check (source in ('markdown_notes', 'screenshot', 'blueprint_gap', 'diagnostic', 'remediation'));
