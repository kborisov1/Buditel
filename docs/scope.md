# Buditel: v1 Scope

Buditel is a Duolingo/Brilliant-style learning app about the Bulgarian National Revival (1762-1878).

## 1. Product summary

- **Audience:** mixed, from students to curious adults.
- **Platform:** web-first.
- **UI language:** Bulgarian. Lesson content is read by learners in Bulgarian. Backend values (field names, keys, internal identifiers) are in English for ease of use.
- **Project type:** portfolio / personal project.
- **Success criteria for v1:**
  - All 40-60 lessons authored and live.
  - A smooth authoring workflow for the author.
  - Polished enough to show in a portfolio.

## 2. Content scope

- **Period:** 1762-1878, covering all themes: key figures; church, education and culture; the revolutionary movement and the Russo-Turkish War and Liberation; daily life and economy.
- **Size:** about 40-60 thin lessons, grouped into units. Proposed units (to be adjusted):
  1. Early awakening
  2. Education and church
  3. Revolutionary organization
  4. Uprising and liberation
- **Structure:** strictly linear. Each lesson unlocks the next.
- **Authoring:** a mix of the author writing lessons and AI-assisted drafting. No extra accuracy layer in v1 (no source references, contested-topic markers or review flags).

## 3. Learner experience

### Lessons
- 5-10 minutes each. Step count and length vary per lesson, so the editor must not impose hard limits.
- Lesson structure varies per lesson (story first, mixed steps, etc.).
- Lessons are self-contained. There is no glossary in v1.

### Step types
- **Story:** narrative text, optionally with an image.
- **Quiz formats:** multiple choice, true/false, matching, ordering, fill-in.
- **Interactives:**
  - Timeline builder (drag events into order).
  - Cause-and-effect chains (connect events to consequences).

### Images
- Usable as question images (e.g. a portrait with "Who is this?"), in story steps, and in matching/ordering items.
- Not used as answer options in v1.
- Every image has alt text.

### Answer handling
- Missed questions are re-queued at the end of the lesson.
- The end of a lesson shows a result summary and a "Continue" button.

### Navigation and progress
- **Home screen:** a vertical path of lessons.
- Learners can re-open any completed lesson.
- Leaving mid-lesson restarts the lesson.
- **Profile:** display name and overall progress (e.g. 12 of 50 lessons).

### Engagement
- No gamification pressure in v1 (no streaks, XP, leaderboards, badges).
- Retention mechanics are decided at a later stage, once the app works and is filled with content.

## 4. Accounts

- **Roles in v1:** learner and admin/author.
- **Sign-up:** email + password. SSO comes later.
- **Admin test tools:**
  - Start any account at any progress point.
  - Preview draft (unpublished) lessons as a learner would.
  - Reset an account's progress.
  - Switch between accounts quickly.

## 5. Admin editor

- Create and edit lessons and their steps (story, quiz, interactives).
- Create and edit timelines and cause-and-effect chains.
- **Image library:** upload once, reuse across lessons, with alt text.
- **Publishing:** per lesson, with a draft/published switch. Edits to a published lesson are live immediately.

## 6. Out of scope for v1 (deferred)

- Gamification and retention mechanics.
- Illustrations of figures and scenes.
- Custom historical maps, map exploration and map data in the editor (v2+).
- Glossary and people/events/places reference pages.
- SSO login.
- Additional UI languages.
- Extra accuracy layer (sources, contested-topic flags, review status).
- Bulk import/export of content (undecided; a likely v1.5 item given AI-assisted drafting).
- "Forgot Password" feature