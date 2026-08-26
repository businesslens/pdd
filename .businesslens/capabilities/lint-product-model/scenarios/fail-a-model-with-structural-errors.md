---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the Product Model to be checked
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The model breaks a structural rule, such as a Capability availability place with no Scenario covering it in a complete model
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product lists every error and every warning it found, then reports how many errors failed the check
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Fail a model with structural errors

## Trigger

A model is checked while a required file, field, relationship, Scenario shape,
or Reference is wrong.

## Outcome

The check fails with the complete list of findings, so every problem can be
fixed in one pass rather than one run per error.
