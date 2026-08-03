---
title: Overview
description: Three self-contained skills cover adoption, intended product change, and automatic verification-to-resolution.
section: open-source
group: Skills
order: 22
---

# BusinessLens skills

BusinessLens installs exactly three skills:

| Skill | Use it when | Writes |
| --- | --- | --- |
| [`businesslens-map`](./skill-businesslens-map.md) | Existing behavior needs an initial model, scoped remap, or coverage expansion | Approved model meaning inside `.businesslens/` |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | You are deciding what the product should do | Approved model meaning inside `.businesslens/` |
| [`businesslens-verify`](./skill-businesslens-verify.md) | You need branch, named, or current-state model/code alignment | Nothing during classification; approved resolution and optional Reference bookkeeping |

Map and ideate answer opposite questions: “what already exists?” and “what
should exist?” Verify owns the loop between those authorities after code moves.

Users invoke verify once. It runs narrow mapping or intent-resolution protocols
internally and calls the harness-injected builder when code must change. The
three installed skills remain self-contained; none loads a sibling skill file.

Catalog contribution is a deterministic CLI workflow:

```bash
npx businesslens@latest blueprint contribute
```

There is no contribution, doctor, deep-dive, init, or sync skill. Named depth is
a map/verify scope; diagnosis and repair belong to verify.

Claude Code uses `/businesslens-map`; Codex commonly uses `$businesslens-map`.
See [Installation](./installation.md) for provider paths.
