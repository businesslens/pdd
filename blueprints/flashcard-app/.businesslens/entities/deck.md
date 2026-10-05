---
domain: decks
relations:
  - entity: card
    verb: holds
    cardinality: one-to-many
  - entity: card-proposal
    verb: holds
    cardinality: one-to-many
---

# Deck

A named set of cards a Learner studies together, such as one subject or one
exam.

## Information kept

- **Name** — the name its owner gave it
- **Share link** — the address other Learners open it at while it is shared
- **Copied from** — the shared deck it was copied from, if it is a copy

## States

### Private

Seen only by its owner. No share link opens it.

### Shared

Its share link opens it read-only for any signed-in Learner, who may copy it.
