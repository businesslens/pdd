---
relations:
  - entity: poll
    verb: settles
    cardinality: one-to-one
domain: decisions
---

# Decision

The record of what the team decided on a closed poll and why. Its poll's owner
writes it, in their own words or starting from a generated draft, and records it
for the whole team in one act; nothing of it is kept before then.

## Information kept

- **Outcome** — what was decided, in one statement
- **Rationale** — why: the reasons and arguments that carried it
- **Final results** — the poll's tally when voting ended, kept with the decision
- **Generated draft** — whether the owner started from a draft a language model wrote
- **Recorded at** — when the owner recorded it
