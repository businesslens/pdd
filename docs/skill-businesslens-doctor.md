---
title: doctor
description: Investigate installation and Product Model health — diagnose by default, repair only on explicit request.
section: open-source
group: Skills
order: 16
---

# `businesslens-doctor`

Root-cause analysis for a model that fails validation, looks stale, or just
feels wrong. Doctor diagnoses by default and never mutates anything unless
you explicitly ask for repairs.

## When to use it

- A simple validation report is not enough — findings need investigation.
- The model may have drifted semantically even though validation is green.
- You want a health report before a release or catalog contribution.

## Invocation

```text
/businesslens-doctor
/businesslens-doctor and repair what you find
```

## What it checks

- Validator output, parsed in full.
- Missing files, unresolved relations, `codeRefs` no longer in
  `git ls-files`, features without experiences, journeys without features or
  scenarios, and disconnected business rules.
- Evidence-less entities sitting on the default branch, or `coverage.md`
  stuck in `draft` after implementation shipped — planned work that never
  went through [`businesslens-sync`](./skill-businesslens-sync.md).
- Placeholder prose, unsupported certainty, weak coverage claims, generated
  `cache/` content accidentally tracked.
- Any `<!-- businesslens:begin/end -->` managed block still sitting in the root
  `AGENTS.md`, left by a version that wrote there. BusinessLens no longer
  writes outside `.businesslens/`, so the block is stale — doctor reports it
  and leaves removal to you, because `AGENTS.md` is yours.
- Recent diffs and commits for likely drift — reported as likely, never as
  proven.

## What it reports

Findings classified as **blocking** (validator cannot accept the model),
**drift** (authored truth likely no longer matches the implementation),
**coverage** (material surfaces unmapped), or **hygiene** (generated files,
duplicated markers, weak evidence) — with the exact files involved and an
ordered repair plan. On explicit request it makes the smallest targeted
repairs and re-validates until green.

## Guardrails

- Never mutates the model during a diagnostic-only request.
- Never treats a green structural validator as proof of complete coverage.
- Never executes target code or submits the Product Model.
