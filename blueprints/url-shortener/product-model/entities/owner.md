---
kind: person
acts: external
relations:
  - entity: link
    verb: owns
    cardinality: one-to-many
  - entity: api-key
    verb: owns
    cardinality: one-to-many
---

# Owner

A person with an account who creates short links, manages them and reads how
they are followed. Every link and every API key belongs to exactly one Owner.
