---
kind: person
acts: external
relations:
  - entity: snippet
    verb: owns
    cardinality: one-to-many
  - entity: suggestion
    verb: requests
    cardinality: one-to-many
---

# Developer

A person with an account who writes, revises and shares snippets, and forks
public snippets other Developers have made. Every snippet has exactly one
Developer as its owner.

## Information kept

- **Username** — the name shown as the owner of their snippets
