---
title: PDD ♥ SDD
description: How Product-Driven Development coexists with spec-driven development frameworks like OpenSpec and spec-kit.
section: open-source
group: Concepts
order: 6
---

# PDD ♥ SDD

BusinessLens owns the **product level**: what the product does, for whom,
and — when you plan by editing the map on a branch — what it will do next.
Spec-driven development frameworks own the **technical level**: how a change
is designed, built, and broken into tasks. The borderline:

| | PDD (BusinessLens) | SDD (OpenSpec, spec-kit, freestyle) |
| --- | --- | --- |
| Answers | What the product does (and, on a branch, what it will do), for whom, where is the proof | How a change is designed, built, and verified technically |
| Altitude | Product: actors, journeys, observable scenarios | Technical: specs, designs, task lists |
| Lifetime | Durable — the map lives as long as the product | Transient — proposals land and get archived |
| Change model | Git: branches plan, PRs review, `validate` green = done | Its own change/proposal folders |

On the default branch the map is always descriptive, evidence-backed truth.
On a working branch it may briefly claim more than the code delivers — that
gap is exactly what `businesslens-verify` closes before merge.

## How they link

- **SDD → PDD**: change proposals cite the journeys and experiences they
  affect by ID (`journeys/compare-snapshots`). "This change affects journey
  X" becomes a reviewable claim.
- **PDD → SDD**: map entities point at specs and design docs with `links:`
  (`rel: spec|proposal|doc|adr`). The map never copies spec content.
- **The loop**: plan the product delta by updating the map
  (`businesslens-plan`), design and implement against your SDD change, then
  `businesslens-verify` checks the code delivers the planned behavior and
  attaches evidence. An archived SDD change with no matching map update is
  the strongest drift signal (`businesslens-sync`).

The `businesslens-init` skill detects SDD roots (`openspec/`, `specs/`,
`.kiro/`), records them in `.businesslens/config.yaml`, and includes the
coexistence rule in the managed `AGENTS.md` block only when one is present.
Bring your own SDD — or none at all.
