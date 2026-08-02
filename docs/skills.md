---
title: Overview
description: The six BusinessLens agent skills — which one fits which situation.
section: open-source
group: Skills
order: 21
---

# Skills overview

BusinessLens ships six agent skills. Each is self-contained, follows the
open Agent Skills folder format, and treats the target repository as
untrusted: skills inspect code statically and never execute it. Only
`businesslens-contribute` proposes anything publicly, and only on explicit
request.

| Skill | Use it when |
| --- | --- |
| [`businesslens-init`](./skill-businesslens-init.md) | Adopting BusinessLens in a repository that already has code |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | Deciding what to build, and writing that decision into the model |
| [`businesslens-sync`](./skill-businesslens-sync.md) | The code moved and the model needs to catch up — with or without a plan |
| [`businesslens-deep-dive`](./skill-businesslens-deep-dive.md) | One journey or experience needs exhaustive coverage |
| [`businesslens-doctor`](./skill-businesslens-doctor.md) | The model fails validation, looks stale, or needs a health report |
| [`businesslens-contribute`](./skill-businesslens-contribute.md) | You explicitly want the model in the public catalog |

## How they fit together

Three of them carry the lifecycle, and one question separates them — **which
side is the source of truth for this edit?**

| Skill | Source of truth | What you end up with |
| --- | --- | --- |
| `init` | The code (there is no model yet) | A model describing today |
| `ideate` | **Your intent** | A model running ahead of the code, on purpose |
| `sync` | The code | A model caught up to what got built |

`init` runs once. After that, every feature loops through `ideate` →
implement → `sync`. Shortest form: **`ideate` is where you decide, `sync` is
where you settle up.**

`ideate` covers the whole arc from "what should this be" to a written model
change, because a conversation converges — it proposes until you choose, and
writes only what you approve. `sync` covers both directions too: when a plan
exists it checks the code against it, and when none does it works out what the
code became. You never pick between those — it reads which situation you are
in from git and tells you.

The rest are supporting tools: `deep-dive` adds depth to one area, `doctor`
diagnoses what `businesslens validate` cannot explain, and `contribute`
proposes the model to the catalog.

The full decision table lives in [Find your flow](./flows.md); where these sit
next to your harness's plan mode and your SDD framework is in
[Integration](./integration.md).

## Invoking skills

In Claude Code, Cursor, Gemini CLI, and GitHub Copilot, invoke a skill as
`/businesslens-<name>`; in Codex as `$businesslens-<name>`. Skills accept
free-text arguments — `/businesslens-ideate quick: add dark mode` — and each
page in this section documents its inputs, what it reads and writes, and
its guardrails.
