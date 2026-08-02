# Canonical rubric contract

`rubric/CURRENT` identifies the rubric version used by the AI Immersion submission flow. The corresponding `rubric/<version>/rubric.json` file is the machine-readable scoring contract. `09-scoring.md` and the static-page scoring section are human-readable projections.

Version `2.2.0` locks:

- public track names, while preserving the stored `maas` enum;
- all 21 parameter weights, maxima, and L1-L5 descriptors;
- exactly eight overflow rules;
- the L3 evidence-gap cap, the stricter Virality-visitors L2 cap, and the staged-agent-output L3 cap;
- two anti-spoof ratios and their exception paths;
- the eight bonus-eligible parameters, half weights, and 50-point per-builder cap.

## Check the handbook

From this repository:

```bash
node scripts/check-rubric.mjs
```

The checker validates arithmetic, thresholds, copy invariants, local links, static-page fragments, and source hashes. It never writes another repository.

## Check backend and frontend consumers

After the backend/frontend owners sync their generated copies, run a read-only cross-repository check:

```bash
node scripts/check-rubric.mjs \
  --backend-root /absolute/path/to/gx-backend \
  --frontend-root /absolute/path/to/gx-client-next
```

The backend check compares every stable parameter ID, base weight, maximum, and rubric version. The frontend check verifies the corrected generated rubric copy and rejects stale ranking/revenue copy.

## Deterministic sync procedure

Both application repositories already contain rubric sync scripts. Point them explicitly at this repository so worktree layout cannot change the source:

```bash
AIWK_HANDBOOK_PATH=/absolute/path/to/this-repo/09-scoring.md \
  pnpm exec tsx scripts/sync-rubric.ts
```

Run that command from the backend repository. From the frontend repository:

```bash
AIWK_HANDBOOK_PATH=/absolute/path/to/this-repo/09-scoring.md \
  node scripts/sync-rubric.mjs
```

Those are write operations in the consumer repositories and must be run by their owners. This handbook worktree only provides the canonical inputs and read-only checker.

Any scoring-contract change requires a new version directory, an update to `rubric/CURRENT`, regenerated consumer copies, and a passing cross-repository check.
