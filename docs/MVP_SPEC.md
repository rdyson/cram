# SAA-C03 Study Coach MVP Spec

Generated: 2026-05-09

## 0. Current Implementation Scope

Engineering review scope decision: **build single-user first**.

The shared-deck and study-partner model remains part of the product roadmap, but it is not part of the first implementation pass. The first build should prove the personal study loop before adding invite flows, deck memberships, per-user sharing permissions, or friend progress separation.

First implementation target:

```text
Sign in
  ↓
Create SAA-C03 deck
  ↓
Upload one Markdown file
  ↓
Extract text
  ↓
Map to small seeded topic map
  ↓
Generate 5 flashcards + 5 scenario questions
  ↓
Practice loop records attempts/confidence
  ↓
Dashboard shows coverage + mastery
```

## 1. Product Summary

Build a private web app for AWS Certified Solutions Architect - Associate (SAA-C03) exam prep.

In the first implementation, one learner uploads a Markdown notes file, the app extracts study material, maps it against the official SAA-C03 blueprint, generates flashcards and practice questions, then tracks coverage, attempts, confidence, and mastery.

Core product sentence for the first build:

> A private SAA-C03 study coach where one learner uploads notes, the app generates a blueprint-mapped study deck, and the learner gets practice history, confidence tracking, weak-area dashboard, and bad-question feedback.

Roadmap product sentence:

> A private shared SAA-C03 study deck builder where one user uploads notes/screenshots, the app generates a study deck, and invited learners get separate practice history, confidence tracking, weak-area dashboard, and bad-question feedback.

## 2. Product Principles

1. **Blueprint first.** The official SAA-C03 exam guide is the curriculum backbone.
2. **Notes are exposure, not mastery.** Uploaded notes show what the learner has seen, not what they know.
3. **Answers prove mastery.** Practice attempts, confidence, and wrong answers define the learner profile.
4. **Single-user first, share later.** Prove the personal study loop before adding invite flows and multi-user permissions.
5. **Generate automatically, flag bad items.** Do not force manual approval before studying. Let users flag issues as they appear.
6. **Scenario questions matter most.** Flashcards help memory, but AWS exams mostly test architecture tradeoffs.
7. **Keep v1 private and narrow.** SAA-C03 only, one learner, no invite flows, no marketplace, no payments, no classrooms.

## 3. Target Users

### 3.1 Deck Owner

The user preparing for SAA-C03 who has screenshots and notes.

Can:

- Create a SAA-C03 deck
- Upload Markdown notes
- Upload screenshots
- Generate study items
- Study the deck
- Flag bad items
- Hide or regenerate bad items

### 3.2 Study Partner, roadmap

A friend studying for the same exam is a roadmap user, not part of the first implementation pass.

Later, a study partner should be able to accept an invite, study from the generated deck, take diagnostic quizzes, track personal progress, and flag bad items without uploading source materials.

## 4. MVP Scope

### 4.1 Must Have

- Email sign-in
- Create SAA-C03 study deck
- Markdown upload
- Text extraction from Markdown
- Built-in SAA-C03 domain/topic map
- Coverage mapping from uploaded material to topic map
- Study item generation:
  - flashcards
  - quick recall questions
  - scenario questions
  - blueprint-gap questions
- Practice loop:
  - answer question
  - confidence before answer
  - correctness
  - explanation
  - why wrong answers are wrong
  - flag bad item
- Per-user progress dashboard:
  - deck coverage
  - personal mastery
  - weak domains
  - weak topics
  - dangerous misconceptions where detectable

### 4.2 Should Have

- Skippable diagnostic quiz
- Source citations for note-derived items
- Basic bad-item flagging
- Basic extracted-text preview

### 4.3 Defer

- Screenshot upload and OCR
- Invite-only deck membership
- Study partners
- Shared deck permissions
- Multiple exams
- Public deck discovery
- Marketplace
- Payments
- Organizations/classes
- Comment threads
- Leaderboards
- Full Anki import/export
- Advanced spaced repetition
- Mobile app
- Rich collaborative editing
- Full item approval workflow
- Perfect OCR correction UI
- AI chat tutor as main interface

## 5. Core User Flows

### 5.1 Owner First Session

```text
Sign in
  ↓
Create SAA-C03 deck
  ↓
Upload Markdown file
  ↓
Extract text
  ↓
Preview extracted material
  ↓
Map material to SAA-C03 topic map
  ↓
Show coverage report
  ↓
Generate starter study items
  ↓
Optionally take diagnostic
  ↓
Open dashboard
```

### 5.2 Study Partner First Session, roadmap

Deferred until after the single-user loop works.

### 5.3 Daily Study Loop

```text
Open deck dashboard
  ↓
See recommended drill
  ↓
Answer question with confidence rating
  ↓
Read explanation + why wrong answers are wrong
  ↓
Flag if bad or unclear
  ↓
Progress updates
```

### 5.4 Bad Item Flow

```text
Learner sees bad item
  ↓
Clicks Flag bad item
  ↓
Selects reason
  ↓
Optional note
  ↓
Item is excluded from future practice by default
```

## 6. Screens

### 6.1 Auth

- Sign in
- Sign up
- Magic link or password auth

### 6.2 Deck List

Shows decks the user owns or has joined.

Fields:

- Deck title
- Exam code
- Role: owner / study partner
- Last studied
- Mastery summary

### 6.3 Create Deck

Fields:

- Title
- Exam: fixed to SAA-C03 in v1
- Description optional

### 6.4 Upload Materials

Copy:

> Your notes tell us what you have seen. Your answers tell us what you know.

Inputs:

- Markdown upload
- Screenshot upload multi-file, deferred until OCR milestone

States:

- uploaded
- processing
- processed
- failed

### 6.5 Extraction Preview

Shows:

- Asset list
- Extracted text preview
- Processing status
- Retry failed extraction

V1 does not need deep editing, but should allow deleting a bad upload.

### 6.6 Coverage Map

Domain table:

```text
Domain                               Exam Weight   Deck Coverage   Your Mastery
Design Secure Architectures          30%           Medium          Untested
Design Resilient Architectures       26%           Low             Untested
Design High-Performing Architectures 24%           Medium          Untested
Design Cost-Optimized Architectures  20%           Low             Untested
```

Topic table:

```text
Topic                         Coverage       Mastery       Diagnosis
RDS Multi-AZ vs replicas       High           Untested      Needs diagnostic
Route 53 failover routing      Low            Untested      Coverage gap
S3 lifecycle policies          High           Untested      Needs diagnostic
SQS visibility timeout         Missing        Untested      Coverage gap
```

Owner label: “Exposure from your materials.”

Study partner label: “Deck coverage.”

### 6.7 Study Items

Tabs:

- Flashcards
- Recall questions
- Scenario questions
- Gap-fill questions
- Flagged items, owner only

Each item displays:

- Type
- Domain
- Topic
- Difficulty
- Source
- Citation when available

### 6.8 Practice Session

Question screen:

```text
Question prompt

Confidence before answering:
[1] [2] [3] [4] [5]

A. ...
B. ...
C. ...
D. ...

[Submit]
```

Result screen:

```text
Correct / Incorrect

Explanation

Why the wrong answers are wrong:
A. ...
B. ...
C. ...
D. ...

Was this explanation helpful?
[Yes] [No]

[Flag bad item]
[Next]
```

### 6.9 Dashboard

Sections:

- Continue studying
- Most likely to cost you points
- Domain mastery
- Topic mastery
- Recent misses
- Flagged items

Example:

```text
Most likely to cost you points:
1. RDS failover vs read scaling
2. Route 53 routing policy selection
3. Disaster recovery pattern selection
4. SQS vs SNS vs EventBridge
5. Cost-optimized storage class choice
```

### 6.10 Invite Page, roadmap

Deferred until shared-deck milestone.

## 7. Data Model

Assumes Postgres/Supabase.

### 7.1 users

Supabase auth provides user identity. A profile table stores app metadata.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now()
);
```

### 7.2 exams

```sql
create table exams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz default now()
);
```

Seed v1:

```text
code: SAA-C03
name: AWS Certified Solutions Architect - Associate
```

### 7.3 exam_domains

```sql
create table exam_domains (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  name text not null,
  weight_percent integer,
  position integer not null
);
```

SAA-C03 domains:

```text
1. Design Secure Architectures, 30%
2. Design Resilient Architectures, 26%
3. Design High-Performing Architectures, 24%
4. Design Cost-Optimized Architectures, 20%
```

### 7.4 exam_topics

```sql
create table exam_topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  domain_id uuid not null references exam_domains(id) on delete cascade,
  name text not null,
  description text,
  services text[] default '{}',
  concepts text[] default '{}',
  common_misconceptions text[] default '{}',
  position integer not null
);
```

### 7.5 study_decks

```sql
create table study_decks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 7.6 deck_memberships, roadmap

Deferred until shared-deck milestone. First build uses `study_decks.owner_user_id` for ownership and access control.

### 7.7 deck_invites, roadmap

Deferred until shared-deck milestone.

### 7.8 uploaded_assets

```sql
create table uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  filename text not null,
  storage_path text not null,
  type text not null check (type in ('markdown')),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  -- Roadmap OCR milestone: add 'screenshot' to this check constraint.
  extracted_text text,
  error_message text,
  created_at timestamptz default now(),
  processed_at timestamptz
);
```

### 7.9 source_excerpts

```sql
create table source_excerpts (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  asset_id uuid not null references uploaded_assets(id) on delete cascade,
  text text not null,
  page_number integer,
  image_region jsonb,
  created_at timestamptz default now()
);
```

### 7.10 source_excerpt_topics

```sql
create table source_excerpt_topics (
  id uuid primary key default gen_random_uuid(),
  source_excerpt_id uuid not null references source_excerpts(id) on delete cascade,
  exam_topic_id uuid not null references exam_topics(id) on delete cascade,
  confidence numeric not null default 0,
  rationale text
);
```

### 7.11 study_items

```sql
create table study_items (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  exam_domain_id uuid not null references exam_domains(id),
  exam_topic_id uuid not null references exam_topics(id),
  type text not null check (type in ('flashcard', 'recall_question', 'scenario_question')),
  source text not null check (source in ('markdown_notes', 'blueprint_gap', 'diagnostic', 'remediation')),
  -- Roadmap OCR milestone: add 'screenshot' to this check constraint.
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
```

### 7.12 practice_attempts

```sql
create table practice_attempts (
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
```

### 7.13 study_item_feedback

```sql
create table study_item_feedback (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references study_decks(id) on delete cascade,
  study_item_id uuid not null references study_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in (
    'wrong_answer',
    'unclear_wording',
    'not_exam_relevant',
    'duplicate',
    'bad_explanation',
    'too_easy',
    'too_hard'
  )),
  note text,
  owner_review_status text not null default 'open' check (owner_review_status in ('open', 'ignored', 'fixed', 'hidden')),
  created_at timestamptz default now()
);
```

### 7.14 topic_profiles, roadmap

Do not create this table in the first build. Compute dashboard values on read from factual rows:

```text
coverage = source_excerpt_topics grouped by topic
mastery = practice_attempts joined through study_items grouped by topic
diagnosis = derived from coverage + mastery
```

Add a persisted `topic_profiles` table later only if dashboard queries become slow or too complex.

### 7.15 generation_jobs

Minimal durable job state for extraction, topic mapping, and study-item generation. This avoids duplicate or lost work if the request times out, the user refreshes, or OpenAI returns malformed output.

```sql
create table generation_jobs (
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
```

Implementation rule for first build: run the job from a server action or API route, not a full worker. Persist `status` and `stage` before each external call so retry and refresh are safe.

### 7.16 First-build Indexes

Add indexes for owner-scoped access, dashboard aggregation, feedback, and generation job polling.

```sql
create index idx_study_decks_owner on study_decks(owner_user_id);
create index idx_uploaded_assets_deck on uploaded_assets(deck_id);
create index idx_source_excerpts_deck on source_excerpts(deck_id);
create index idx_source_excerpt_topics_topic on source_excerpt_topics(exam_topic_id);
create index idx_study_items_deck_topic on study_items(deck_id, exam_topic_id);
create index idx_practice_attempts_user_deck on practice_attempts(user_id, deck_id);
create index idx_practice_attempts_item on practice_attempts(study_item_id);
create index idx_study_item_feedback_item on study_item_feedback(study_item_id);
create index idx_generation_jobs_deck_status on generation_jobs(deck_id, status);
```

## 8. Permissions and RLS Rules

### 8.1 Deck Access

A user can read and update a deck only when `study_decks.owner_user_id = auth.uid()`.

Shared-deck access through membership rows is deferred until the roadmap sharing milestone.

### 8.2 Assets

A user can upload, read, and delete source assets only for decks they own.

### 8.3 Study Items

A user can read and update study items only for decks they own.

### 8.4 Attempts

A user can only read/write their own attempts for decks they own.

### 8.5 Feedback

A user can create and read feedback only for items in decks they own.

## 9. SAA-C03 Topic Map v1

Seed the official domains and enough topics to power generation. This can be expanded iteratively.

### 9.1 Domain 1: Design Secure Architectures, 30%

Example topic clusters:

- IAM users, groups, roles, and policies
- Least privilege access
- Resource policies vs identity policies
- AWS Organizations and SCPs
- Secrets Manager vs Systems Manager Parameter Store
- KMS keys and encryption choices
- S3 bucket policies, ACLs, Block Public Access
- VPC security groups vs NACLs
- Private connectivity and endpoint security
- CloudTrail, CloudWatch, Config security visibility

### 9.2 Domain 2: Design Resilient Architectures, 26%

Example topic clusters:

- Multi-AZ vs multi-region
- RDS Multi-AZ vs read replicas
- Aurora availability and replicas
- Route 53 routing policies and failover
- Elastic Load Balancing patterns
- Auto Scaling groups
- SQS decoupling and visibility timeout
- SNS fanout
- EventBridge event routing
- Disaster recovery: backup/restore, pilot light, warm standby, active-active
- S3 durability, versioning, replication

### 9.3 Domain 3: Design High-Performing Architectures, 24%

Example topic clusters:

- EC2 instance families and placement groups
- EBS volume types and performance
- S3 performance patterns
- CloudFront caching
- ElastiCache use cases
- DynamoDB partition keys, GSIs, LSIs, DAX
- RDS performance patterns
- Lambda concurrency and integration patterns
- API Gateway patterns
- SQS vs SNS vs EventBridge vs Kinesis
- Global Accelerator vs CloudFront

### 9.4 Domain 4: Design Cost-Optimized Architectures, 20%

Example topic clusters:

- EC2 pricing: On-Demand, Reserved, Savings Plans, Spot
- S3 storage classes and lifecycle policies
- EBS cost choices
- NAT Gateway cost tradeoffs
- CloudFront cost/performance tradeoffs
- RDS right-sizing and reserved instances
- Serverless cost tradeoffs
- DynamoDB billing modes
- Data transfer costs
- Trusted Advisor, Cost Explorer, Budgets

## 10. Coverage and Mastery Logic

### 10.1 Coverage Score

Coverage is deck-level. For the owner, it can be phrased as exposure from their materials. For study partners, it is deck coverage.

```text
0 = absent from uploaded materials
1 = mentioned once
2 = lightly described
3 = explained
4 = explained with example
5 = repeated or diagram-backed coverage
```

Input signals:

- Number of source excerpts mapped to topic
- Length/detail of excerpts
- Whether examples or diagrams are detected
- Whether topic appears in Markdown vs screenshot only

### 10.2 Mastery Score

Mastery is per user.

```text
0 = untested
1 = repeatedly wrong
2 = shaky
3 = mixed
4 = mostly correct
5 = consistently correct under scenario pressure
```

Input signals:

- Correctness
- Confidence before answering
- Time to answer
- Difficulty
- Recency
- Whether similar questions are later answered correctly

### 10.3 Diagnosis

```text
coverage_gap:
  coverage low, mastery low or untested

false_familiarity:
  coverage high, mastery low

shaky:
  mixed correctness or low confidence

stable:
  repeated correct answers with medium/high confidence

untested:
  coverage exists, no attempts yet

unseen:
  no coverage and no attempts
```

## 11. AI / Processing Pipeline

### 11.1 Upload Processing

```text
Uploaded file
  ↓
Store in Supabase Storage
  ↓
Create uploaded_assets row
  ↓
Process by type
  ↓
Store extracted_text
  ↓
Chunk into source_excerpts
  ↓
Map excerpts to exam_topics
```

### 11.2 Markdown Extraction

- Read Markdown text directly
- Strip excessive formatting
- Preserve headings as context
- Chunk by heading first, then by token size

### 11.3 Screenshot Extraction, roadmap

Deferred until OCR milestone.

Later, use OpenAI vision or OCR pipeline to extract visible text, identify service names, summarize diagrams, preserve filename as citation, and store extracted text.

### 11.4 Topic Mapping

For each source excerpt:

Input:

- Excerpt text
- SAA-C03 topic map

Output JSON:

```json
{
  "matches": [
    {
      "topic_name": "RDS Multi-AZ vs read replicas",
      "confidence": 0.86,
      "rationale": "Excerpt distinguishes failover from read scaling."
    }
  ]
}
```

### 11.5 Study Item Generation

Generate in batches.

Suggested cap per initial deck:

```text
30 flashcards
20 recall questions
20 scenario questions
20 blueprint-gap questions
```

First implementation cap:

```text
5 flashcards
5 scenario questions
```

Study item sources for first build:

```text
markdown_notes
blueprint_gap
diagnostic
remediation
```

Roadmap OCR milestone adds:

```text
screenshot
```

### 11.6 Prompt Rules for Question Generation

For SAA-C03-style scenario questions:

- 4 answer choices
- One best answer
- Distractors must be plausible
- Explanation must identify tradeoff
- Include why each wrong answer is wrong
- Avoid trivia-only wording
- Avoid exact copyrighted exam-style phrasing
- Prefer architecture scenarios: availability, cost, performance, security

Output schema:

```json
{
  "items": [
    {
      "type": "scenario_question",
      "domain": "Design Resilient Architectures",
      "topic": "RDS Multi-AZ vs read replicas",
      "difficulty": "medium",
      "prompt": "...",
      "answer_choices": [
        { "key": "A", "text": "..." },
        { "key": "B", "text": "..." },
        { "key": "C", "text": "..." },
        { "key": "D", "text": "..." }
      ],
      "correct_answer_key": "C",
      "explanation": "...",
      "why_wrong_answers_are_wrong": {
        "A": "...",
        "B": "...",
        "D": "..."
      },
      "source_excerpt_id": "optional",
      "quality_checks": {
        "single_best_answer": true,
        "saa_c03_relevant": true,
        "not_pure_trivia": true
      }
    }
  ]
}
```

### 11.7 Generated Item Validation and Repair

Generated content must be validated before any `study_items` rows are inserted.

Pipeline:

```text
OpenAI output
  ↓
JSON parse
  ↓
Zod validate
  ↓
if invalid: repair prompt once
  ↓
validate again
  ↓
if valid: save study_items
  ↓
if invalid: generation_jobs.status=failed
```

Validation rules:

- `type` is one of `flashcard`, `recall_question`, `scenario_question`.
- `source` is one of the allowed study-item sources.
- `exam_domain_id` and `exam_topic_id` refer to existing seeded rows.
- Scenario questions have exactly four answer choices.
- Scenario questions have exactly one `correct_answer_key`.
- Wrong-answer explanations exist for all distractors.
- Prompt and explanation are non-empty.
- Note-derived items include `source_excerpt_id` when available.

Repair rule: make one repair attempt with the validation errors and the original model output. If the repaired output still fails validation, fail the generation job visibly and do not save partial items.

## 12. API Routes / Server Actions

Naming can change by framework, but the capabilities should exist.

### Auth

- Supabase auth handles sign-in/sign-up.

### Decks

- `createDeck(title, description)`
- `listDecks()`
- `getDeck(deckId)`
- `updateDeck(deckId, attrs)` owner only

### Invites, roadmap

Deferred until shared-deck milestone.

### Uploads

- `uploadAsset(deckId, file)` owner only
- `processAsset(assetId)` owner only/background
- `listAssets(deckId)` owner only
- `deleteAsset(assetId)` owner only

### Generation

- `createGenerationJob(deckId, inputAssetIds)` owner only
- `runGenerationJob(jobId)` owner only, stage-persisted and retry-safe
- `getGenerationJob(jobId)` owner only
- `generateCoverage(deckId)` owner only
- `generateStudyItems(deckId, options)` owner only
- `generateDiagnostic(deckId)` owner only or per-user from topic map

### Practice

- `startPracticeSession(deckId, mode)`
- `submitAttempt(studyItemId, selectedAnswer, confidence, timeToAnswer)`
- `rateExplanation(attemptId, helpful)`

### Feedback

- `flagStudyItem(studyItemId, reason, note)`
- `listFlaggedItems(deckId)` owner only
- `hideStudyItem(studyItemId)` owner only
- `ignoreFeedback(feedbackId)` owner only

### Dashboard

- `getCoverageDashboard(deckId)` owner only
- `getPersonalMastery(deckId)` current user only
- `getRecommendedDrills(deckId)` current user only

## 13. Recommended Stack

### Frontend

- Next.js
- React
- Tailwind or equivalent utility CSS

### Backend

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Next.js server actions or API routes

### AI

- OpenAI for topic mapping and study-item generation
- OpenAI vision for screenshot OCR in the roadmap OCR milestone, unless a cheaper OCR layer is added later

### Hosting

- Render or Vercel for app
- Supabase hosted project

## 14. Milestone Build Plan

### Milestone 1: Foundation

Build:

- Next.js app
- Supabase auth
- profiles table
- owner-scoped deck creation

Acceptance:

- User can sign in
- User can create a deck
- User can see only their own deck

### Milestone 2: Uploads and Extraction

Build:

- Upload Markdown
- Store file or text payload
- Extract Markdown text
- Show extraction preview

Acceptance:

- User uploads the real Markdown file
- App extracts text for the asset
- Failed extraction is visible and retryable

### Milestone 3: SAA-C03 Topic Map and Coverage

Build:

- Seed exam, domains, topics
- Chunk source excerpts
- Map excerpts to topics
- Compute coverage score
- Show coverage dashboard

Acceptance:

- App shows covered, lightly covered, and missing SAA-C03 topics

### Milestone 4: Study Item Generation

Build:

- Generate flashcards
- Generate recall questions
- Generate scenario questions
- Generate blueprint-gap questions
- Store study items
- Display study item library

Acceptance:

- App creates a starter deck from uploaded material and blueprint gaps
- Items have domain/topic/difficulty/source labels
- Note-derived items have citations where available

### Milestone 5: Practice Loop

Build:

- Practice session UI
- Confidence rating
- Answer submission
- Correct/incorrect result
- Explanation
- Why wrong answers are wrong
- Attempt storage
- Explanation helpfulness

Acceptance:

- User can answer generated deck items
- Attempts are stored with confidence and correctness
- Dashboard uses attempts to update mastery

### Milestone 6: Feedback

Build:

- Flag bad item
- Feedback reasons
- Exclude flagged items from future practice

Acceptance:

- User can flag a bad question
- Flagged item is excluded from future drills by default

### Milestone 7: Mastery Dashboard

Build:

- Per-user mastery score
- Weak domains
- Weak topics
- Recommended drills
- False familiarity detection

Acceptance:

- User sees weak areas
- App recommends drills based on attempts

## 15. Test Plan

### 15.1 Unit Tests

- Coverage score calculation
- Mastery score calculation
- Diagnosis classification
- Owner-scoped permission helpers
- Study item schema validation

### 15.2 Integration Tests

- User creates owner-scoped deck
- User uploads Markdown
- Generation creates study items tied to deck
- Attempt belongs to the signed-in user
- User cannot access another user's deck
- User can flag a bad item
- Flagged item is excluded from future practice

### 15.3 AI Pipeline Tests

Use fixtures:

- Small Markdown notes sample
- Topic map subset

Validate:

- Extracted text is stored
- Excerpts are created
- Topic mapping returns known topics
- Generated questions parse as valid JSON
- Generated questions pass Zod validation before DB insert
- Invalid generation receives one repair attempt
- Persistently invalid generation fails the `generation_jobs` row without saving partial items
- Scenario question has one correct answer
- Wrong-answer explanations exist for distractors

### 15.4 Generated Question Eval Suite

Generated study items need quality evals, not only schema checks. A syntactically valid question can still be harmful if it teaches the wrong AWS tradeoff.

Create 8-12 representative SAA-C03 eval fixtures across the four domains. Each fixture should include topic context, expected service tradeoffs, and known misconceptions.

Eval checks:

- One best answer.
- Domain/topic relevance.
- Explanation agrees with the correct answer.
- Wrong-answer explanations are plausible and specific.
- Scenario questions test architecture tradeoffs, not trivia.
- The item does not invent AWS service behavior.
- The item avoids copied real-exam phrasing.

Implementation approach:

- Keep deterministic schema validation with Zod.
- Add LLM-as-judge evals for educational correctness and SAA-C03 relevance.
- Save eval inputs/outputs for review when failures occur.
- Run evals against prompt changes and generation pipeline changes.

Minimum first fixtures:

1. RDS Multi-AZ vs read replicas.
2. S3 storage classes and lifecycle policies.
3. Route 53 failover vs latency routing.
4. SQS vs SNS vs EventBridge.
5. Security groups vs NACLs.
6. NAT Gateway vs Internet Gateway.
7. Disaster recovery: backup/restore vs pilot light vs warm standby.
8. DynamoDB on-demand vs provisioned capacity.
9. CloudFront vs Global Accelerator.
10. IAM role vs resource policy.

Pass threshold for v1: generated items used in production must pass schema validation and the eval suite for the prompt/template path that produced them.

### 15.5 E2E Tests

Critical path:

```text
User signs in
Creates deck
Uploads Markdown
Generates deck
Answers question with confidence rating
Sees dashboard update
Flags item
Flagged item no longer appears in practice
```

### 15.6 Security Tests

- User cannot read another user's deck
- User cannot read another user's attempts
- User cannot update another user's deck
- User cannot upload assets to another user's deck

## 16. Deployment Plan

### Environments

- Local dev
- Production prototype

### Secrets

- Supabase URL
- Supabase anon key
- Supabase service role key, server only
- OpenAI API key

Never expose service role or OpenAI key in client code.

### First Production Deploy Checklist

- Supabase project created
- Database migrations applied
- Storage bucket created
- RLS enabled and tested
- App deployed
- Environment variables configured
- Owner account created
- Real Markdown upload tested

## 17. Observability

V1 should log enough to debug failed AI/material processing.

Structured events:

- asset_uploaded
- asset_processing_started
- asset_processing_failed
- asset_processing_completed
- topic_mapping_started
- topic_mapping_failed
- topic_mapping_completed
- study_generation_started
- study_generation_failed
- study_generation_completed
- attempt_submitted
- item_flagged

Minimum metrics:

- Upload processing failure count
- Generation failure count
- Average generation time
- Number of active study items
- Number of flagged items
- Attempts per user

## 18. Failure Modes

| Codepath | Failure mode | User sees | Recovery |
|---|---|---|---|
| Upload | File too large | Clear validation error | Upload smaller batch |
| Upload | Unsupported file | Clear validation error | Use md/png/jpg |
| AI extraction | API timeout | Processing failed | Retry |
| AI generation | Malformed JSON | Generation failed | Retry with repair prompt |
| Topic mapping | Low confidence | Topic marked uncertain | Still allow generation, lower confidence |
| Practice | Item hidden mid-session | Skip item | Load next item |
| Permissions | Non-owner access | Not found/unauthorized | Sign in with the owning account |

## 19. Initial Prompt Sketches

### 19.1 Screenshot OCR Prompt

```text
Extract all visible text from this AWS certification study screenshot.
Preserve headings, bullet points, service names, and diagram labels.
If there is a diagram, describe the relationships briefly.
Return JSON:
{
  "text": "...",
  "services": ["..."],
  "diagram_summary": "optional"
}
```

### 19.2 Topic Mapping Prompt

```text
You are mapping study notes to the AWS SAA-C03 exam topic map.
Given this source excerpt and the allowed topic list, return the best matching topics.
Do not invent topics.
Return confidence from 0 to 1 and a short rationale.
```

### 19.3 Scenario Question Prompt

```text
Generate SAA-C03-style scenario questions for the given topic.
Rules:
- Four answer choices.
- Exactly one best answer.
- Distractors must be plausible.
- Focus on architecture tradeoffs, not trivia.
- Include why every wrong answer is wrong.
- Avoid copying real exam questions.
- Return valid JSON only.
```

### 19.4 Blueprint Gap Prompt

```text
The learner's uploaded materials have low coverage for this SAA-C03 topic.
Generate questions that teach and test the missing area.
Make the explanation self-contained because there may be no source citation.
```

## 20. Open Questions Before Coding

1. Should flagged items disappear immediately for the learner?
   - Recommendation: yes, hide from future drills by default.

2. Should generation happen synchronously after upload or via background job?
   - Decision: use a minimal `generation_jobs` table now. Run from a server action/API route first, but persist status and stage so refresh/retry are safe.

Roadmap questions for the sharing/OCR milestones:

- Should invite links be single-use or reusable for a small group?
- Should the owner be able to see friend progress?
- Should screenshots be processed one at a time or batch?

## 21. Recommended First Implementation Cut

Build the narrowest end-to-end slice first:

```text
Auth
  ↓
Create deck
  ↓
Upload one Markdown file
  ↓
Extract text
  ↓
Map to small seeded topic map
  ↓
Generate 5 flashcards + 5 scenario questions
  ↓
Answer questions with confidence ratings
  ↓
Dashboard shows coverage + mastery
```

Then add screenshots/OCR, larger generation, and invite-only sharing.

This avoids the trap of spending days on OCR or multi-user permissions before proving the personal study loop.

## 22. Definition of Done for MVP

MVP is done when:

- Owner can create a SAA-C03 deck.
- Owner can upload Markdown.
- App extracts usable text from Markdown.
- App maps material to SAA-C03 topics.
- App generates a mixed study set.
- User can study generated items.
- Attempts and confidence ratings are stored.
- Bad items can be flagged.
- Flagged items can be excluded from future practice.
- Dashboard computes coverage vs mastery from source mappings and practice attempts.

Roadmap done means:

- Owner can upload screenshots.
- App extracts usable text from screenshots.
- Owner can invite a friend.
- Friend can join without uploading anything.
- Both users can study the same items.
- Both users have separate progress/mastery.

## 23. Short Name Ideas

Working names:

- CertCoach
- Blueprint Coach
- ExamGap
- StudyDeck AI
- SAA Coach
- GapDeck

Temporary repo/product name:

```text
saa-study-coach
```

