---
title: Overview
description: Three self-contained skills cover adoption, intended product change, and automatic verification-to-resolution.
section: open-source
group: Skills
order: 17
---

# BusinessLens agent skills

BusinessLens installs exactly three skills:

| Skill | Use it when | Writes |
| --- | --- | --- |
| [`businesslens-map`](./skill-businesslens-map.md) | Existing behavior needs an initial model, scoped remap, or coverage expansion | Approved model meaning inside `.businesslens/` |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | You are deciding what the product should do | Approved model meaning inside `.businesslens/` |
| [`businesslens-verify`](./skill-businesslens-verify.md) | You ask to implement the model, or need branch, named, or current-state model/code alignment | Nothing during classification; approved resolution and optional Reference bookkeeping. Code is written by your agent |

Map and ideate answer opposite questions: “what already exists?” and “what
should exist?” Verify owns the loop between those authorities after code moves.

You don't have to name a skill: ask your agent to change the product or to
implement it, and it picks the right one. The three installed skills are
self-contained, and none of them writes code: when you ask to implement, verify
has your own agent implement the work in phases, your usual way, and checks
each part. See the [development loop](./index.md#the-development-loop).

Catalog contribution is a deterministic CLI workflow:

```bash
npx businesslens blueprint contribute
```

Claude Code uses `/businesslens-map`; Codex commonly uses `$businesslens-map`.
See [Installation](./installation.md) for provider paths.
