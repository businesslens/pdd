---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to install the BusinessLens skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reports which supported harnesses it found, and offers the two recommended ones when it found none
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer confirms the harnesses and chooses whether this is for the repository or for themselves
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product installs the three skills into each chosen harness and marks the installation as its own
    kind: product
    entities:
      - { entity: skill-installation, effect: creates }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product names where it installed, which skills it installed, and any retired BusinessLens skills it removed
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Install the skills for detected harnesses

## Trigger

The Developer wants a repository, or their own machine, to have the BusinessLens
skills available to a coding agent.

## Outcome

Each chosen harness holds the three current skills and a marker recording the
provider, scope, version, and skill names. No Product Model was created and
nothing was sent anywhere.

## Edge cases

- A session with no interactive terminal is asked to state the harnesses and scope explicitly instead of being prompted.
- A harness name the Product does not support stops the run and lists the ones it does.
