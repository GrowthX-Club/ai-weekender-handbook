# Handbook scratchpad — AI Immersion submission

Chronological implementation ledger. Record source-of-truth findings, copy decisions, commands, validation output, and deferred publication work. Keep `SCOPE.md` clean.

## 2026-08-02

- Worktree created from `origin/main` at `a01e883`.
- Live page source currently exists outside this repo as `/Users/udayan/Downloads/ai immersion handbook v3.html`; determine the cleanest canonical ownership before copying it.
- No handbook or production page changed yet.

### Handbook implementation

- No repository-root `learnings.md` exists in this worktree; followed `/Users/udayan/AGENTS.md` and the scope bundle.
- Imported `/Users/udayan/Downloads/ai immersion handbook v3.html` byte-for-byte into `static-page/ai-immersion-handbook.html`. Import SHA-256: `d2cfa11e6edff59996131a22f32cf7c62eb3cc0daa0e1360f4680f170eba1dc7`.
- Corrected schedule copy to the locked four check-ins: Thu 30 Jul 8pm, Fri 31 Jul 8pm, Sat 1 Aug 11am, Sun 2 Aug morning Q&A; submission cutoff remains Sun 2 Aug 8pm IST.
- Removed stale participant-ranking language. The contract is solo builders, individual feedback, no ranking and no Sunday presentation.
- Public third-track name is `AI Agent as a Service`; engineering compatibility remains stored enum `maas`.
- Corrected Revenue-generated base weight to 4, base maximum 16, while preserving overflow at 15 points per additional $500 beyond $2,000. Corrected the $46 worked example to L2 and 4 base points.
- Added exact overflow/evidence wording: eight overflow parameters; default evidence gap cap L3; visitors without read-only analytics cap L2; staged/test agent output cap L3; bonus requires the same evidence.
- Established `rubric/2.2.0/rubric.json` as the machine-readable canonical contract and `rubric/CURRENT` as the version pointer. Handbook installer version advanced from 1.2.1 to 1.3.0.
- Added `scripts/check-rubric.mjs`, a read-only validator for rubric arithmetic, 21 parameter IDs, eight overflow rules, evidence rules, anti-spoof direction, bonus math, schedule/copy invariants, local links, HTML fragments, and optional backend/frontend consumers.
- Added a deliberately non-writing static-page preparation script and approval-gated runbook. No production write or publication was attempted.

### Verification

- `node scripts/check-rubric.mjs` — PASS, 173 checks.
- Canonical contract SHA-256: `0cb9b2eb2830aa9f390962df5ce7aa8ed297a45e2da315089f592352da47a0f1`.
- Scoring Markdown SHA-256: `1d93d56431c7faec26dc14ea1cddd8370a885035b7aae5fb42113767eb357891`.
- Static-page candidate SHA-256: `5c764c271179860a6fc936eefeb7f6cb14a045289e1ac9e156a9916bd7a2eca0` (1,062,021 bytes).
- `node scripts/prepare-static-page-publication.mjs` — PASS, dry-run only; `production_write_attempted: false`.
- Browser verification via local server and `agent-browser` — PASS: title `AI Immersion · Builder Handbook`, 11 pages, 11 navigation items, one active page, six rubric tabs, meaningful content, no framework error overlay. Screenshot: `/tmp/ai-immersion-handbook-render.png`.
- `git diff --check` — PASS.
- Read-only cross-worktree check: backend parameter weights/maxima and rubric version already match 2.2.0; frontend generated rubric copy still has six stale strings and must be synced by the frontend owner after handbook commit.

### Deferred, approval-gated work

- Publish `static-page/ai-immersion-handbook.publish.html` to slug `ai-immersion-handbook` only after an explicit go-ahead for the exact candidate SHA.
- After publication, compare live SHA, verify the live page logged out and on mobile, then distinguish published from verified in the handoff.

### Continuation — corrected release candidate

- Found and corrected a stale schedule block missed by the first checker: `08-build-process.md` still said Thursday L2, Friday L3, and Saturday 8pm submission. It now matches the locked Thursday-start / Friday-L2 / Saturday-L3 / Sunday-8pm-IST sequence.
- Corrected all 54 remaining static-page occurrences of `AI Agent As A Service` to the exact public name `AI Agent as a Service`; preserved `maas` only as the engineering enum.
- Updated participant-facing installer context headings from AI Weekender to AI Immersion while preserving the existing repository name, marker filename, and `weekender.md` compatibility paths.
- The earlier 1,062,021-byte static HTML was not publishable: the GrowthX `html_content` limit is 1,024,000 characters. It is now explicitly the editable source, not the publish artifact.
- `node scripts/prepare-static-page-publication.mjs` now deterministically generates `static-page/ai-immersion-handbook.publish.html` and refuses production writes. It verifies equal visible text, tag inventory, element IDs, fragment links, byte-identical scripts, and byte-identical `<pre>` content.
- Editable source: 1,062,021 bytes / 1,058,837 characters; SHA-256 `691f04b30d48b273dc49659c460e9f74d854249d83e9a661850f25f4e6e57dcf`.
- Generated publish candidate: 1,021,854 bytes / 1,018,706 characters; SHA-256 `3e793e3c488f26adfe8c0b5f6b2d068a2de032b800fab73fac5a77402f7877cd`.
- Publish headroom is only 5,294 characters. Any source edit requires regeneration and another limit check.
- `node scripts/check-rubric.mjs --json` — PASS, 575 checks.
- Read-only backend/frontend consumer check — PASS, 657 checks against the current isolated worktrees.
- Browser verification — PASS for both source and generated candidate: title correct; 11 pages; 11 navigation items; exactly one active page/nav item through all 11 destinations; six rubric tabs; all four locked dates; Sunday 8pm IST cutoff; rubric 2.2.0 and corrected revenue example; no stale public track casing; no error overlay or page errors.
- Source rubric-tab interaction confirmed `AI Agent as a Service` became the active tab and scrolled to its target. Generated candidate desktop and 390×844 mobile renders were visually inspected.
- Browser evidence: `/tmp/ai-immersion-handbook-source.png`, `/tmp/ai-immersion-handbook-publish.png`, `/tmp/ai-immersion-handbook-publish-mobile.png`.
- The preferred in-app browser bootstrap failed with `Cannot redefine property: process`; verification used the documented `agent-browser` fallback against the local server.
- `git diff --check` — PASS after the continuation changes.
- No production write, publication, push, merge, or edit to the backend/frontend worktrees was performed.

### Follow-up — submission CTA and handbook parity blockers

- Added the canonical participant CTA `https://growthx.club/ai-immersion/submit` to `02-how-the-week-runs.md`, `08-build-process.md`, and the editable static page; regenerated the publish candidate. Both publication scripts now require the exact URL.
- Replaced all 82 visible legacy `Scores on` blocks with track-specific `Rubric fit` guidance that sends builders to the rubric 2.2.0 Scoring page. Removed all visible `Sarvam parameter` scoring instructions and the remaining legacy dimension language. Sarvam APIs remain only as optional implementation surfaces, with explicit copy that integrations do not score by themselves.
- Synced participant Markdown and the static page to the five-level L1 to L5 welcome ladder. Removed the stale membership/Slack sanction and updated the README ladder reference to L1 to L5.
- The checker now rejects the old welcome/sanction copy and the legacy Idea Bank scoring vocabulary in both source and publish candidate.
- `node scripts/check-rubric.mjs --json` — PASS, 629 checks.
- Backend/frontend cross-worktree validation — PASS, 711 checks.
- Legacy copy scan — PASS in source and publish candidate: zero `Scores on`, `Sarvam parameter`, `Voice Experience`, `Document Intelligence`, `Memory and Context`, `Job-to-be-done`, `Weak on:`, and `This is the part that is scored`; one canonical CTA and 82 `Rubric fit` blocks in each artifact.
- Publication integrity — PASS: equal visible text, tag inventory, IDs, fragment links, scripts, and preformatted content. Source SHA-256 `5168a9d67dd14df03a2b5c49f80011b8b472012c9a2b2a0962421b631d912443`; publish candidate SHA-256 `3bbb3d7904af56e6ef963a3299f5b0f9b7aa08568e0e0bb16bf7bda2eb2492f4`; 14,950 characters remain under the GrowthX limit; `production_write_attempted: false`.
- Browser verification — PASS for source and publish candidate: 11 pages, exactly one active page/nav item, six rubric tabs, five-level welcome without sanction, exact CTA/href, no legacy scoring labels, no blank page, error overlay, console errors, or page errors. The CTA was visually checked at 1440×1000 and 390×844; an Idea Bank card was expanded and its replacement `Rubric fit` guidance was visually confirmed.
- Browser evidence: `/tmp/ai-immersion-handbook-source-cta-desktop.png`, `/tmp/ai-immersion-handbook-source-cta-mobile.png`, `/tmp/ai-immersion-handbook-publish-cta-desktop.png`, `/tmp/ai-immersion-handbook-publish-idea-rubric-fit.png`.
- `git diff --check` — PASS. No production write, publication, push, or merge was performed.

### Checker-only P2 follow-up — card-scoped Rubric fit validation

- Both `scripts/check-rubric.mjs` and `scripts/prepare-static-page-publication.mjs` now validate each visible `Rubric fit` block inside its containing `article.ib-card` against that card's `data-track`; the stored `Agent` track maps to the public `AI Agent as a Service` label.
- Added an in-memory mutation that swaps the first Virality and Revenue Rubric fit paragraphs while preserving their global totals. The card-scoped validation must reject the swap.
- `node scripts/prepare-static-page-publication.mjs` — PASS, dry-run only. Source and publish hashes remain `5168a9d67dd14df03a2b5c49f80011b8b472012c9a2b2a0962421b631d912443` and `3bbb3d7904af56e6ef963a3299f5b0f9b7aa08568e0e0bb16bf7bda2eb2492f4`; 14,950 characters remain under the limit.
- Full read-only cross-worktree check — PASS, 738/738 checks against the isolated backend and frontend worktrees.
- `node --check` for both scripts and `git diff --check` — PASS. No handbook content, production state, push, PR, merge, deployment, migration, or publication changed.
