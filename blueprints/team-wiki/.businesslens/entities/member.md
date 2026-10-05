---
kind: person
acts: external
relations:
  - entity: space-membership
    verb: holds
    cardinality: one-to-many
  - entity: revision
    verb: saves
    cardinality: one-to-many
---

# Member

A person in the team's workspace who reads, writes and searches the wiki. What
a Member may do in a space depends on the role their membership there gives
them: a Viewer reads, an Editor also writes.

## Information kept

- **Name** — the name the wiki shows beside the revisions they saved
