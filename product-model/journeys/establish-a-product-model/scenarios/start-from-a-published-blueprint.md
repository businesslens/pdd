---
kind: edge
result: achieved
routes:
  blueprint: Blueprint
steps:
  - text: The Developer lists the published Blueprints and picks one
    kind: actor
    actor: developer
    capability: list-blueprints
    entities:
      - { entity: blueprint, effect: reads, facts: [Product identity] }
    contexts:
      blueprint:
        place: pdd-kit-cli
  - text: The Developer pulls the chosen Blueprint into a new repository
    kind: actor
    actor: developer
    capability: pull-blueprint
    entities:
      - { entity: blueprint, effect: reads, facts: [] }
    contexts:
      blueprint:
        place: pdd-kit-cli
  - text: The Product expands it into a canonical Product Model with its orientation README
    kind: product
    actor: developer
    capability: pull-blueprint
    entities:
      - { entity: blueprint, effect: reads, facts: [Schema version, Product identity, Product meaning] }
      - { entity: product-model, effect: creates, facts: [Product, Coverage, Method] }
    contexts:
      blueprint:
        place: pdd-kit-cli
  - text: The Developer checks the imported structure and reads what the contract commits to
    kind: actor
    actor: developer
    capability: lint-product-model
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      blueprint:
        place: pdd-kit-cli
---

# Start from a published Blueprint

## Trigger

The Developer would rather start from a reviewed model of a familiar product
shape than write one.

## Outcome

The Journey goal is achieved: the new repository holds a structurally sound
model that records that its implementation alignment still has to be verified
here.
