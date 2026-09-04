---
kind: person
acts: external
relations:
  - entity: collection
    verb: owns
    cardinality: one-to-many
  - entity: item
    verb: keeps
    cardinality: one-to-many
  - entity: source
    verb: follows
    cardinality: one-to-many
---

# Reader

A person who follows feeds, works through unread items, saves worthwhile
reading, and curates collections. Each Reader has one private library.
