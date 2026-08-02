# AI Immersion submission — handbook and rubric scope

## Objective

Make the AI Immersion handbook copy internally consistent and establish a versioned canonical rubric that can be checked against backend and frontend copies.

## Owned files

This worktree exclusively owns handbook Markdown/static-page source, rubric source/generation documentation, tests or check scripts local to this repository, and handbook rollout notes.

## Locked content

- Thu 30 Jul: 8pm.
- Fri 31 Jul: 8pm.
- Sat 1 Aug: 11am.
- Sun 2 Aug: morning Q&A and 8pm IST submission cutoff.
- Solo builders; no showcase and no top-two selection.
- Third track public name: `AI Agent as a Service`.
- Revenue generated: base weight 4, base max 16, overflow 15 points per additional $500 beyond $2,000.
- Preserve all published L1-L5 thresholds, evidence caps, anti-spoof ratios, bonus rules, and overflow formulas unless correcting an internal contradiction.

## Required work

1. Correct schedule and stale showcase/team copy.
2. Correct Revenue-generated table and worked example.
3. Rename public MaaS copy while retaining an engineering note that the stored enum remains `maas`.
4. Preserve/clarify the exact eight structured overflow rules.
5. Make the handbook rubric the canonical source and provide a deterministic sync/check artifact consumable by backend/frontend.
6. Add the current production static-page HTML source and a dry-run-first publication procedure if the repo does not already own it.
7. Do not publish the static page in this workstream.

## Verification

- Calendar/time and forbidden-copy searches.
- Formula/table arithmetic check.
- Structured rubric fixture/check output matches all thresholds and weights.
- Editable static source and generated publish candidate render locally and contain no stale top-two/showcase/team-only claims.
- Generated publish candidate remains at or below the GrowthX static-page limit of 1,024,000 characters, with source/candidate text, tag, ID, fragment, script, and preformatted-content integrity checked.
- Diff and link checks pass.

## Release-candidate artifacts

- Editable source: `static-page/ai-immersion-handbook.html`.
- Generated size-safe artifact: `static-page/ai-immersion-handbook.publish.html`.
- Only the generated `.publish.html` artifact is eligible for approval-gated publication; the editable source is intentionally larger than the production field limit.
- This workstream prepares and verifies the artifacts. It does not publish them.
