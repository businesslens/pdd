---
kind: edge
result: achieved
routes:
  catalog: Catalog
steps:
  - text: The Developer pulls a reviewed Blueprint into a new repository
    kind: actor
    actor: developer
    capability: pull-blueprint
    contexts:
      catalog:
        place: businesslens-cli
  - text: The Product expands it into a canonical Product Model with its orientation README
    kind: product
    capability: pull-blueprint
    contexts:
      catalog:
        place: businesslens-cli
  - text: The Developer checks the imported structure and reads what the contract commits to
    kind: actor
    actor: developer
    capability: lint-product-model
    contexts:
      catalog:
        place: businesslens-cli
---

# Open a catalog Blueprint

## Trigger

The Developer would rather start from a reviewed model of a familiar product
shape than write one.

## Outcome

The Journey goal is achieved: the new repository holds a structurally sound
model that records that its implementation alignment still has to be verified
here.
