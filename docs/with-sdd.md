---
title: With SDD tools
description: How Product-Driven Development coexists with OpenSpec, spec-kit, and other spec-driven frameworks — the borderline, and how the two link.
section: open-source
group: Integration
order: 18
---

# With a spec-driven framework

BusinessLens owns the **product level**: what the product does, for whom, and —
when you plan by editing the model on a branch — what it will do next.

Spec-driven development frameworks own the **technical level**: how a change is
designed, built, and broken into tasks.

## The borderline

| | PDD (BusinessLens) | SDD (OpenSpec, spec-kit, freestyle) |
| --- | --- | --- |
| Answers | What the product does, for whom, where is the proof | How a change is designed, built, and verified technically |
| Altitude | Product: actors, capabilities, rules, journeys, observable scenarios | Technical: specs, designs, task lists |
| Lifetime | Durable — lives as long as the product | Transient — proposals land and get archived |
| Change model | Git: branches plan, PRs review, `validate` green = done | Its own change/proposal folders |

On the default branch the model is always descriptive, evidence-backed truth. On
a working branch it may briefly claim more than the code delivers — that gap is
exactly what `businesslens-sync` closes before merge.

## The loop

```text
/businesslens-ideate guest checkout    → the product delta, in the model
openspec / spec-kit change             → the technical proposal, citing journey IDs
implement
/businesslens-sync                     → verdicts and evidence
archive the SDD change                 → the model stays
```

The SDD change is transient and the model is durable, which is why the citation
runs one way.

## How they link

**SDD → PDD.** Change proposals cite the journeys and experiences they affect by
ID (`journeys/browse-and-buy`). "This change affects journey X" becomes a
reviewable claim rather than a sentence in a description.

**PDD → SDD.** Model entities point at specs and design documents with `links:`:

```yaml
links:
  - rel: spec        # spec | proposal | doc | adr
    href: openspec/specs/checkout/spec.md
    title: Checkout spec
```

**The model never copies spec content.** It references it. See
[Evidence & coverage](./evidence.md#links-the-bridge-to-your-specs) for the
full `links` shape.

## Detection

`businesslens-init` detects SDD roots — `openspec/`, `specs/`, `.kiro/` — and
records them in `.businesslens/config.yaml`:

```yaml
schema: 1
sdd:
  paths: [openspec/]
```

Bring your own SDD, or none at all. The list is empty when nothing is detected.

## They never compete for the implementation step

A model states the acceptance criteria before the work starts, and
`businesslens-sync` checks the result after. What writes the code in between is
yours to choose.

## The strongest drift signal

**An archived SDD change with no matching model update.** Something shipped, the
technical record was filed, and nobody recorded what the product now does
differently. `businesslens-sync` is what closes that gap.
