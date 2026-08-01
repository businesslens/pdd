---
title: Overview
description: The seven BusinessLens agent skills — which one fits which situation.
section: open-source
group: Skills
order: 14
---

# Skills overview

BusinessLens ships seven agent skills. Each is self-contained, follows the
open Agent Skills folder format, and treats the target repository as
untrusted: skills inspect code statically and never execute it. Only
`businesslens-contribute` proposes anything publicly, and only on explicit
request.

| Skill | Use it when |
| --- | --- |
| [`businesslens-init`](./skill-businesslens-init.md) | Adopting BusinessLens in a repository that already has code |
| [`businesslens-plan`](./skill-businesslens-plan.md) | Planning a product (blank repo) or a feature (mapped repo) before code |
| [`businesslens-sync`](./skill-businesslens-sync.md) | The code moved and the model needs to catch up — with or without a plan |
| [`businesslens-deep-dive`](./skill-businesslens-deep-dive.md) | One journey or experience needs exhaustive coverage |
| [`businesslens-doctor`](./skill-businesslens-doctor.md) | The model fails validation, looks stale, or needs a health report |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | You are deciding what to build |
| [`businesslens-contribute`](./skill-businesslens-contribute.md) | You explicitly want the model in the public catalog |

## How they fit together

The lifecycle runs through three of them: `init` (or `plan`, for a blank
repository) creates the model, then every feature loops through `plan` →
implement → `sync`.

`sync` covers both directions. When a plan exists it checks the code against
it; when none does, it works out what the code became. You never pick between
those — it reads which situation you are in from git and tells you.

The rest are supporting tools: `deep-dive` adds depth to one area, `doctor`
diagnoses what `businesslens validate` cannot explain, `ideate` proposes what
to build next, and `contribute` proposes the model to the catalog. The full
decision table with situations lives in [Find your flow](./flows.md).

## Invoking skills

In Claude Code, Cursor, Gemini CLI, and GitHub Copilot, invoke a skill as
`/businesslens-<name>`; in Codex as `$businesslens-<name>`. Skills accept
free-text arguments — `/businesslens-plan quick: add dark mode` — and each
page in this section documents its inputs, what it reads and writes, and
its guardrails.
