---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the Product Model to be checked
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: A Step does something to a thing that a Business Rule forbids to everyone, or that no grant of the Rules governing it could permit the Step's actor
    kind: condition
    entities:
      - { entity: product-model, effect: reads }
      - { entity: business-rule, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reports the Step, the operation, and the Rule that closes it as an error, and says when the Step needs an actor before it can be judged at all
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Fail a Step no grant permits

## Trigger

A Scenario shows someone doing something the model's own Rules say they may not.

## Outcome

The check fails naming the contradiction, so the author decides which side is
wrong — the Scenario or the Rule — instead of shipping both.

## Edge cases

- A grant scoped to a state is judged against the state the Step leaves from, so a Rule that opens an operation only while a thing is unpaid still closes it once it is paid.
- Two Rules that select exactly the same operation are reported as a warning: written apart they combine as AND, and grants meant as alternatives belong in one Rule.
