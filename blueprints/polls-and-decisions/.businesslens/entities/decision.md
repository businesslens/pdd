---
relations:
  - entity: poll
    verb: settles
    cardinality: one-to-one
domain: decisions
---

# Decision

The record of what the team decided on a closed poll and why. Its poll's owner
prepares it as a draft, written themselves or generated for them, and records
it for the whole team.

## Information kept

- **Outcome** — what was decided, in one statement
- **Rationale** — why: the reasons and arguments that carried it
- **Final results** — the poll's tally when voting ended, kept with the decision
- **Generated draft** — whether the decision began as a draft a language model wrote
- **Recorded at** — when the owner recorded it

## States

### Draft

Being prepared. Only the poll's owner can read and edit it, and the team does
not see it in the decision log.

### Recorded

Confirmed by the poll's owner. Every Member can read it in the decision log, and
nothing about it changes again.
