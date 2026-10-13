---
colorSlot: 7
references:
  - kind: spec
    role: intent
    target: spec/report.md
    title: The Product Report wire contract
---

# Blueprint portability

Moving a Product Model out of the repository that authored it and into another
one, as a portable Product Report that carries product meaning and nothing that
only made sense where it came from.

## Boundary

Owns compiling a model into a report, expanding a report back into a model, the
projection that strips source-specific navigation, listing and pulling published
Blueprints, and proposing a model as a Blueprint by pull request. It does not
own the repository Blueprints are published from or its release, does not
decide what the model means, and never merges or publishes a Blueprint itself.
