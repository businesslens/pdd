# 0005 — Reviewability is a first-class quality axis

Status: **Accepted** — 2026-08-26

## Context

`businesslens-map` step 7 requires the human to approve product meaning before
anything is written. That gate is the product's answer to "the agent might get
it wrong."

An independent double-authoring of this repository showed the gate cannot do
that job. The divergence between two lint-clean models was concentrated in
**granularity and omission** — one Capability where four belonged, two Actors
where three belonged, four Journeys where five belonged. None of it is visible
in a delta. **A reviewer reviews what is present; the divergence lives in what
is absent.**

Legibility does not cover this. A model can be perfectly readable and still give
its reviewer no way to check it.

## Decision

**Reviewability is an axis in its own right, ranked second, after determinism.**

The test for any entity distinction: *could a reader who has seen only `docs/`
identify that this choice could defensibly have gone the other way?* Where the
answer is no, the distinction is a reviewability defect regardless of how well
it is argued.

Determinism and reviewability are the pair that make the agent-authored premise
work: determinism means the agent does not wobble, reviewability means the human
catches it when it does.

## Consequences

- A proposed model delta must state its judgment calls and the alternative each
  was chosen over. Both authoring runs in the review volunteered this
  unprompted; it should be required rather than hoped for.
- `docs/` is aimed at the **reviewer**, not the author, because the human never
  authors.
- An entity kind whose presence or granularity cannot be challenged from the
  docs is a candidate for removal.
