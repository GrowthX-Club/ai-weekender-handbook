# Static-page publication runbook

Production destination: `https://growthx.club/docs/ai-immersion-handbook`.

Publication is an outward production action. It requires an explicit go-ahead for this exact release candidate. The steps below default to read-only or dry-run behavior.

## 1. Prepare the release candidate

```bash
node scripts/prepare-static-page-publication.mjs
node scripts/check-rubric.mjs
```

The first command regenerates `static-page/ai-immersion-handbook.publish.html` from the editable source and validates it against the 1,024,000-character backend limit. Record both emitted hashes/sizes in the rollout ticket or handoff. The `.publish.html` hash is the approval target. Do not publish if either command fails.

## 2. Render locally

Serve the repository root and open both the editable source and generated publish candidate:

```bash
python3 -m http.server 4173
```

Open:

- `http://127.0.0.1:4173/static-page/ai-immersion-handbook.html`
- `http://127.0.0.1:4173/static-page/ai-immersion-handbook.publish.html`

For both files, check desktop and mobile widths, navigate every handbook page, switch rubric tabs, and verify external links open in a new tab. The generated candidate must match the source for title, navigation/page counts, visible copy, rubric tabs, and interactions.

## 3. Compare production read-only

Fetch the live page only for a current-state comparison. The `/docs` response may include application wrapping, so its response-body hash is not proof that MongoDB `html_content` equals the candidate. Before a write, use the approved read-only static-page admin/database path to back up and hash the currently stored `html_content`. Reading either surface does not authorize a write.

## 4. Approval gate

Before any write, obtain an explicit go-ahead that identifies:

- slug `ai-immersion-handbook`;
- the exact generated `.publish.html` SHA-256 and character count emitted in step 1;
- the editable source SHA-256 for traceability;
- the intended cutoff copy: Sunday 2 Aug, 8pm IST;
- the rollback source or current production HTML backup.

## 5. Publish through the approved GrowthX workflow

Use the GrowthX static-page admin at `https://growthx.club/platform/static-pages` or the existing approved AWS-backed production database procedure. Replace only the `html_content` for slug `ai-immersion-handbook`, and use `static-page/ai-immersion-handbook.publish.html` — never the oversized editable source. Never print database credentials or secret values.

This repository intentionally has no `--apply` implementation. `scripts/prepare-static-page-publication.mjs --apply` refuses to run, preventing an accidental production write from the handbook checkout.

## 6. Verify after publication

After the write is separately authorized and completed:

1. Read back the stored `html_content` and compare its SHA-256 and character count with the approved `.publish.html` candidate.
2. Open the live page logged out and verify schedule, rubric tabs, revenue weight, and mobile rendering.
3. Confirm the submission link points at the new AI Immersion event flow before sharing it.
4. Record production status precisely as published and verified; a committed candidate alone is not deployed.
