---
domain: model-authoring
relations:
  - entity: element
    verb: relates to
    cardinality: many
---

# Element

One thing a Product Model holds — an Actor, an Interface, a Capability, a
Scenario, a Business Rule. Every workflow reads, writes, checks and renders
Elements without caring which kind it has in hand, which is why the Product
treats them as one thing.

## Information kept

- Which kind of thing it is, and the id its path gives it
- The authored meaning its file carries
- The Elements it names, and the ones that name it
- The external material attached to it as References
