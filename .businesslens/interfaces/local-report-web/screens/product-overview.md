---
entities:
  - product-model
  - element
capabilities: [view-product-model]
entryPoints:
  - local-report-web: /
---

# Product overview

Where the report opens. It answers "what is this product, and how much of it is
modeled" before the reader goes looking for anything in particular.

## Information presented

- The Product's name, logo, summary, and description
- Its category, tags, authors, and licence
- The authored Intent and any supporting sections the Product carries
- How many entities of each kind the model holds
- Coverage status, method, unmapped areas, and limitations
- The Product's own References

## Available actions

- Move to any entity kind's collection
- Search the whole model by name
- Open the Product Topology

## Capability boundary

Product identity and model breadth. It does not present any single entity's
detail, and it makes no claim about whether the implementation matches.
