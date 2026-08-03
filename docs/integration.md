---
title: Overview
description: BusinessLens supplies durable product intent around your session plan, technical specification, and injected build flow.
section: open-source
group: Integration
order: 17
---

# Integrating BusinessLens

BusinessLens replaces neither plan mode nor a spec-driven framework. It sits at
the durable product level above them.

| Layer | Artifact | Answers | Lifetime |
| --- | --- | --- | --- |
| Product | `.businesslens/` | What should the product do, for whom, under which rules? | Product lifetime |
| Change | SDD proposal/design | How should this change be designed and split? | Until landed/archived |
| Session | Harness plan | What edits should the agent make next? | Current conversation |

The build step is injected between BusinessLens phases:

```text
ideate → plan mode / SDD / builder → verify (including final lint)
```

Verify can return an acceptance packet to that builder and resume automatically.
BusinessLens analysis remains static and never executes target code; the builder
uses separate normal repository permissions.

Read [With plan mode](./with-plan-mode.md), [With SDD tools](./with-sdd.md), or
[Lint in CI](./ci.md).
