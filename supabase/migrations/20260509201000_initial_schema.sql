create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists exam_domains (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  name text not null,
  weight_percent integer,
  position integer not null,
  unique(exam_id, name)
);

create table if not exists exam_topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  domain_id uuid not null references exam_domains(id) on delete cascade,
  name text not null,
  description text,
  services text[] default '{}',
  concepts text[] default '{}',
  common_misconceptions text[] default '{}',
  position integer not null,
  unique(exam_id, name)
);

create table if not exists study_decks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  filename text not null,
  storage_path text not null,
  type text not null check (type in ('markdown')),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  extracted_text text,
  error_message text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table if not exists source_excerpts (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  asset_id uuid not null references uploaded_assets(id) on delete cascade,
  text text not null,
  page_number integer,
  image_region jsonb,
  created_at timestamptz default now()
);

create table if not exists source_excerpt_topics (
  id uuid primary key default gen_random_uuid(),
  source_excerpt_id uuid not null references source_excerpts(id) on delete cascade,
  exam_topic_id uuid not null references exam_topics(id) on delete cascade,
  confidence numeric not null default 0,
  rationale text
);

create table if not exists study_items (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  exam_domain_id uuid not null references exam_domains(id),
  exam_topic_id uuid not null references exam_topics(id),
  type text not null check (type in ('flashcard', 'recall_question', 'scenario_question')),
  source text not null check (source in ('markdown_notes', 'blueprint_gap', 'diagnostic', 'remediation')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null,
  answer text,
  answer_choices jsonb,
  correct_answer_key text,
  explanation text not null,
  why_wrong_answers_are_wrong jsonb,
  source_excerpt_id uuid references source_excerpts(id),
  status text not null default 'active' check (status in ('active', 'hidden', 'flagged')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  study_item_id uuid not null references study_items(id) on delete cascade,
  selected_answer_key text,
  is_correct boolean,
  confidence_before integer check (confidence_before between 1 and 5),
  confidence_after integer check (confidence_after between 1 and 5),
  time_to_answer_ms integer,
  explanation_helpful boolean,
  created_at timestamptz default now()
);

create table if not exists study_item_feedback (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  study_item_id uuid not null references study_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('wrong_answer','unclear_wording','not_exam_relevant','duplicate','bad_explanation','too_easy','too_hard')),
  note text,
  owner_review_status text not null default 'open' check (owner_review_status in ('open','ignored','fixed','hidden')),
  created_at timestamptz default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  stage text not null default 'extracting' check (stage in ('extracting', 'mapping', 'generating', 'saving')),
  input_asset_ids uuid[] not null default '{}',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_study_decks_owner on study_decks(owner_user_id);
create index if not exists idx_uploaded_assets_deck on uploaded_assets(deck_id);
create index if not exists idx_source_excerpts_deck on source_excerpts(deck_id);
create index if not exists idx_source_excerpt_topics_topic on source_excerpt_topics(exam_topic_id);
create index if not exists idx_study_items_deck_topic on study_items(deck_id, exam_topic_id);
create index if not exists idx_practice_attempts_user_deck on practice_attempts(user_id, deck_id);
create index if not exists idx_practice_attempts_item on practice_attempts(study_item_id);
create index if not exists idx_study_item_feedback_item on study_item_feedback(study_item_id);
create index if not exists idx_generation_jobs_deck_status on generation_jobs(deck_id, status);

alter table profiles enable row level security;
alter table study_decks enable row level security;
alter table uploaded_assets enable row level security;
alter table source_excerpts enable row level security;
alter table source_excerpt_topics enable row level security;
alter table study_items enable row level security;
alter table practice_attempts enable row level security;
alter table study_item_feedback enable row level security;
alter table generation_jobs enable row level security;

create policy "profiles own rows" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "decks owner rows" on study_decks for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "assets owner rows" on uploaded_assets for all using (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid())) with check (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid()));
create policy "excerpts owner rows" on source_excerpts for all using (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid())) with check (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid()));
create policy "excerpt topics owner rows" on source_excerpt_topics for all using (exists (select 1 from source_excerpts e join study_decks d on d.id = e.deck_id where e.id = source_excerpt_id and d.owner_user_id = auth.uid())) with check (exists (select 1 from source_excerpts e join study_decks d on d.id = e.deck_id where e.id = source_excerpt_id and d.owner_user_id = auth.uid()));
create policy "items owner rows" on study_items for all using (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid())) with check (exists (select 1 from study_decks d where d.id = deck_id and d.owner_user_id = auth.uid()));
create policy "attempts owner rows" on practice_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "feedback owner rows" on study_item_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "jobs owner rows" on generation_jobs for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

insert into exams (code, name) values ('SAA-C03', 'AWS Certified Solutions Architect - Associate') on conflict (code) do nothing;
