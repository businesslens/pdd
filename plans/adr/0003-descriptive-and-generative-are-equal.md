# 0003 — Descriptive and generative use are judged equally

Status: **Accepted** — 2026-08-26

Implemented: `spec/format.md` Journey rule restated structurally, 2026-09-03 —
a Journey is established by an achieved Journey Scenario spanning two or more
Capabilities toward its Actor outcome; whether code implements it is
`coverage.status`'s claim.

## Context

The same nine entity kinds serve two opposite directions.

- **Descriptive** — `businesslens-map` derives a model from a repository and
  `businesslens-verify` checks it against code. Evidence is the authority, and
  the format's many "only when repository evidence supports it" rules do real
  work.
- **Generative** — `businesslens-ideate` and `blueprint pull` produce a model
  with no implementation at all. The model is a build target, and the catalog
  exists to offer systems a user can achieve building.

Evidence-phrased rules are inert in the generative direction. `spec/format.md`
requires a Journey to be *"established behavior only when repository evidence
supports a deliberate transition"*, then waives it: *"Planned Journeys may
record approved intent before implementation but must meet the same*
***structural*** *distinctions."* The waiver removes exactly the evidence test.
The shipped Content Feed Reader Blueprint has four Journeys and
`sourceAreas: []`.

## Decision

Both directions are first-class. **A rule that only works in one direction is a
defect.**

The remedy is to restate the rule structurally — what makes a Journey a Journey
must be sayable without reference to a repository — or to accept that the kind
is meaningful only in one direction and say so explicitly.

## Consequences

- Evidence phrasing is not a substitute for a definition.
- A rule cannot be defended on the grounds that `map` applies it correctly.
- Blueprint-direction authoring is a test case for every entity rule, not a
  degraded mode of it.
