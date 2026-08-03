---
title: Overview
description: BusinessLens supplies durable product intent around your session plan, technical specification, and injected build flow.
section: open-source
group: Integrations
order: 19
---

# Integrating BusinessLens

BusinessLens replaces neither plan mode nor a spec-driven framework. It sits at
the durable product level above them.

| Layer | Artifact | Answers | Lifetime |
| --- | --- | --- | --- |
| Product | `.businesslens/` | What should the Product do, for whom, and through which Interfaces and Experiences? | Product lifetime |
| Change | SDD proposal/design | How should this change be designed and split? | Until landed/archived |
| Session | Harness plan | What edits should the agent make next? | Current conversation |

Your implementation workflow sits between the BusinessLens phases:

```text
ideate → plan mode / SDD / builder → verify (including final lint)
```

BusinessLens analysis remains static and never executes target code. See the
[development loop](./the-loop.md) for the shared workflow.

Read [Plan mode](./with-plan-mode.md), [SDD tools](./with-sdd.md), or
[CI/CD](./ci.md).
