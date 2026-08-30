---
kind: conflict
routes:
  terminal: Terminal
steps:
  - text: The target directory already holds a Product Model
    kind: condition
    reads:
      - product-model
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer asks for a Blueprint to be opened there
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product stops and explains that it will either need an empty target or an explicit instruction to back up what is there
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse a non-empty model directory

## Trigger

Opening would land on top of a model someone is already using.

## Outcome

The existing model is untouched and the Developer chooses what happens to it.

## Edge cases

- A `.businesslens` that is a symbolic link or not a directory is always refused, whatever else was asked for.
