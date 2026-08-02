# AI Immersion — Builder Handbook

Four-day sprint from consuming AI to shipping with it. Powered by GrowthX.

This repo holds the AI Immersion handbook as plain markdown. One install command drops it into your project folder and wires it into your coding-agent sessions — so when you ask about ideas, tracks, the rubric, or the build pipeline, the agent answers with the real handbook in context.

## Install

Inside your AI Immersion project folder, paste this:

```bash
curl -fsSL https://raw.githubusercontent.com/GrowthX-Club/ai-weekender-handbook/main/install.sh | bash
```

What it does:
- Downloads this repo and drops the markdown pages into `./handbook/`
- Appends a block to your project's `CLAUDE.md` pointing Claude at the handbook
- Stamps a version marker so future updates know what you have

**To update** (when this repo has new content), re-run the exact same command. It'll back up your old copy and pull the latest.

## Pages

- [00 Cover](00-cover.md) — title page
- [01 Welcome](01-welcome.md) — where you are on the L1→L5 ladder
- [02 How the week runs](02-how-the-week-runs.md) — day-by-day outcomes (Thu–Sun)
- [03 Mindset](03-mindset.md) — the pledge
- [04 Setup](04-setup.md) — install Claude Code + dependencies in ~30 min
- [05 Skills](05-skills.md) — install 6 skills Claude uses silently while building
- [06 Pick an idea](06-pick-an-idea.md) — ideas across Virality / Revenue / AI Agent as a Service
- [07 Build pipeline](07-build-pipeline.md) — local → github → vercel → user
- [08 Build process](08-build-process.md) — scope, POC, build; no skipping
- [09 Scoring](09-scoring.md) — canonical rubric, bonus points, evidence rules, overflow, and anti-spoof

## How it works

After install, your project folder looks like:

```
your-project/
├── CLAUDE.md          ← pointer block appended
├── handbook/          ← this repo's markdown
│   ├── 00-cover.md
│   ├── ...
│   └── .weekender-handbook   ← version marker
└── (your code)
```

Every coding-agent session in this folder reads its project instructions, which point the agent at `./handbook/` when the user asks about the immersion. No extra prompting needed.

## Canonical rubric

The scoring contract is versioned at [`rubric/2.2.0/rubric.json`](rubric/2.2.0/rubric.json). Run `node scripts/check-rubric.mjs` before changing scoring copy. See [`rubric/README.md`](rubric/README.md) for backend/frontend sync instructions.

The editable static-page source is versioned at [`static-page/ai-immersion-handbook.html`](static-page/ai-immersion-handbook.html). Run `node scripts/prepare-static-page-publication.mjs` to deterministically generate the size-safe [`static-page/ai-immersion-handbook.publish.html`](static-page/ai-immersion-handbook.publish.html) release candidate. Publication is a separate, approval-gated operation; this repository does not write production.

## Voice

The handbook is written in GrowthX house voice — lowercase headings, direct, confrontational when useful. Don't rewrite it into corporate tone if you fork.

## License

Internal GrowthX material. Ask before redistributing.
