---
title: Overview
description: The eight BusinessLens agent skills — which one fits which situation.
section: open-source
group: Skills
order: 12
---

# Skills overview

BusinessLens ships eight agent skills. Each is self-contained, follows the
open Agent Skills folder format, and treats the target repository as
untrusted: skills inspect code statically and never execute it. Only
`businesslens-publish` ever contacts the platform, and only on explicit
request.

| Skill | Use it when |
| --- | --- |
| [`businesslens-init`](./skill-businesslens-init.md) | Adopting BusinessLens in a repository that already has code |
| [`businesslens-plan`](./skill-businesslens-plan.md) | Planning a product (blank repo) or a feature (mapped repo) before code |
| [`businesslens-verify`](./skill-businesslens-verify.md) | Planned model changes were implemented and need evidence-backed checking |
| [`businesslens-sync`](./skill-businesslens-sync.md) | Code changed without a plan and the model drifted |
| [`businesslens-deep-dive`](./skill-businesslens-deep-dive.md) | One journey or experience needs exhaustive coverage |
| [`businesslens-validate`](./skill-businesslens-validate.md) | The model needs a read-only deterministic check |
| [`businesslens-doctor`](./skill-businesslens-doctor.md) | The model fails validation, looks stale, or needs a health report |
| [`businesslens-publish`](./skill-businesslens-publish.md) | You explicitly want the model on the platform |

## How they fit together

The lifecycle runs through four of them: `init` (or `plan`, for a blank
repository) creates the model, then every feature loops through `plan` →
implement → `verify`. `sync` is the recovery lane when code changed without
a plan. The rest are supporting tools: `deep-dive` adds depth to one area,
`validate` and `doctor` keep the model honest, `publish` reports immutable Product Model Versions to
the platform. The full decision table with situations lives in
[How it works](./guide.md).

## Invoking skills

In Claude Code, Cursor, Gemini CLI, and GitHub Copilot, invoke a skill as
`/businesslens-<name>`; in Codex as `$businesslens-<name>`. Skills accept
free-text arguments — `/businesslens-plan quick: add dark mode` — and each
page in this section documents its inputs, what it reads and writes, and
its guardrails.
