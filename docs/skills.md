---
title: Skills overview
description: Three self-contained skills cover adoption, intended product change, and verification with approved resolution. None of them changes how you implement.
section: open-source
group: Skills
order: 16
---

# pdd-kit agent skills

pdd-kit installs exactly three skills:

| Skill | Use it when | Writes |
| --- | --- | --- |
| [`pdd-map`](./skill-pdd-map.md) | Existing behavior needs an initial model, scoped remap, or coverage expansion | Approved model meaning inside `product-model/` |
| [`pdd-ideate`](./skill-pdd-ideate.md) | You are deciding what the product should do | Approved model meaning inside `product-model/` |
| [`pdd-verify`](./skill-pdd-verify.md) | You want to check the code against the model: a branch, a named part, or the current state | Nothing until you choose what to fix; then approved model changes and optional Reference bookkeeping. Code is written by your agent |

Map and ideate answer opposite questions: “what already exists?” and “what
should exist?” Verify owns the loop between those authorities after code moves.

You don't have to name a skill: ask your agent to change the product or to
check the code against it, and it picks the right one. The three installed
skills are self-contained, and none of them writes code or changes how you
implement: your agent implements your usual way. If you want verify to run
implementation in phases and check each part,
[opt in to implement with verify](./skill-pdd-verify.md#implement-with-verify-opt-in). See the
[development loop](./index.md#the-development-loop).

Blueprint contribution is a deterministic CLI workflow:

```bash
npx pdd-toolkit blueprint contribute
```

Claude Code uses `/pdd-map`; Codex commonly uses `$pdd-map`.
See [Installation](./installation.md) for provider paths.
