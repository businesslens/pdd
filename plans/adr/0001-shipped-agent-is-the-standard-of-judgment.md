# 0001 — The shipped agent, not the spec, is the standard a format rule must meet

Status: **Accepted** — 2026-08-26

## Context

The format's discrimination rules live in `spec/format.md` (1,112 lines). What
actually installs into a coding harness is `businesslens-map/SKILL.md` (106
lines) plus `references/format.md` (279) and `references/mapping-rubric.md`
(77) — **462 lines**, of which the entity-choice section is 45.

Models are authored by an agent working from those 462 lines against a
repository it has never seen. Almost no author reads the spec. A rule that is
correct only when the full spec is available is therefore correct nowhere that
matters.

## Decision

A format rule is judged by whether **the shipped 462 lines can decide it
correctly on an unfamiliar repository**. A rule that needs the spec's full
argument to be applied is a defect in the rule, not in the reader.

Where a rule is sound but its distillation into the rubric drops what made it
decidable, the defect is charged to the **skill**, and its fix is a rubric edit
rather than a format change. The two are diagnosed separately and never
conflated.

## Consequences

- New rules must be statable in the rubric's budget, or they do not ship.
- "The spec explains this" is not a defence of an ambiguous rule.
- Rubric distillation becomes a reviewed step, not a summarisation.
- Judgment required of the agent is a cost to be minimised, not a feature.
