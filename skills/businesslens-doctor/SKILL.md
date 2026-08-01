---
name: businesslens-doctor
description: Investigate and optionally repair the health of a BusinessLens installation and .businesslens/ product model, including validation failures, stale codeRefs, missing managed instructions, semantic drift, and incomplete coverage. Use when a simple validation report is insufficient, findings need root-cause analysis, the model looks stale, or the user explicitly requests repairs; run `npx businesslens validate` directly for a read-only deterministic check.
---

# Diagnose BusinessLens

Diagnose without changing files unless the user explicitly asks for repair.

## Workflow

1. Locate the repository root and check whether `.businesslens/` exists.
2. Run `npx businesslens validate --json`. Capture the exit status and parse
   every error, warning, and count.
3. Inspect authored files for:
   - missing required top-level files or entity directories;
   - unresolved actors, experiences, domains, features, business rules,
     journeys, kinds, or scenario IDs;
   - `codeRefs` whose paths no longer exist in `git ls-files`;
   - features without experiences, journeys without features/scenarios/
     experiences, or disconnected business rules;
   - evidence-less journeys or scenarios sitting on the default branch, or
     `coverage.md` stuck in `draft` after implementation shipped — planned
     work that never went through `businesslens-verify`;
   - placeholder prose, unsupported certainty, or weak coverage claims;
   - generated `cache/` content accidentally tracked by Git.
4. Check root `AGENTS.md` for one well-formed
   `<!-- businesslens:begin/end -->` managed block. Confirm that it tells
   agents to read the model before behavior changes and update it afterward.
5. Inspect relevant diffs and recent commits for behavior changes touching
   mapped evidence. Report likely drift; do not call inference proven.
6. Classify findings:
   - **blocking** — validator cannot load or accept the model;
   - **drift** — authored truth likely no longer matches implementation;
   - **coverage** — material product surfaces remain unmapped;
   - **hygiene** — generated files, duplicated markers, or weak evidence.
7. Return a concise report with the exact files involved and an ordered repair
   plan. If everything is healthy, report counts and the evidence checked.
8. When the user explicitly requests repairs, make the smallest targeted
   changes and rerun validation until green.

## Guardrails

- Never execute target repository code.
- Never mutate the model during a diagnostic-only request.
- Never treat a green structural validator as proof that product coverage is
  complete.
