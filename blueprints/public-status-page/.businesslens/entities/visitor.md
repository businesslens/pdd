---
kind: person
acts: external
relations:
  - entity: subscription
    verb: owns
    cardinality: one-to-many
---

# Visitor

Anyone who opens the public status page, without an account. A Visitor reads
the page and its history and may subscribe an email address to updates; the
Visitor who receives a subscription's mail owns it.
