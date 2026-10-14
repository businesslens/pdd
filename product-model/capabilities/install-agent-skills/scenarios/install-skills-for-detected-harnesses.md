---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to install the pdd-kit skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product reports which supported harnesses it found, and offers the two recommended ones when it found none
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Developer confirms the harnesses, chooses whether this is for the repository or for themselves, and whether pdd-kit should orchestrate implementation
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product installs the three skills into each chosen harness and marks the installation as its own
    kind: product
    entities:
      - { entity: skill-installation, effect: creates, facts: [Provider, Scope, Version, Skills, Installed at, Orchestration] }
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product names where it installed, which skills it installed, the chosen scope, and whether orchestration is on with the command that changes it
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Install the skills for detected harnesses

## Trigger

The Developer wants a repository, or their own machine, to have the pdd-kit
skills available to a coding agent.

## Outcome

Each chosen harness holds the three current skills and a marker recording the
provider, scope, version, skill names, and orchestration setting. No Product
Model was created and nothing was sent anywhere.

## Edge cases

- A session with no interactive terminal supplies harnesses and scope explicitly, or uses `--yes` to accept detected harnesses and project scope.
- Without an explicit setting and no terminal to ask in, each installation keeps its orchestration setting; a new one starts off.
- Orchestration changes only the installed verify skill and the marker; no file the repository owns is written.
- A managed installation's retired pdd-kit skills are removed during replacement; unrelated skills remain.
- A harness name the Product does not support stops the run and lists the ones it does.
