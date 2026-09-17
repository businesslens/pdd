---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The AI agent requests a repository worklist with any explicitly included ignored inputs
    kind: actor
    actor: ai-agent
    entities: []
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product captures the selected files and their content identities in a Coverage review
    kind: product
    entities: [{ entity: coverage-review, effect: creates, to: Pending }]
    contexts: { terminal: { place: businesslens-cli } }
---

# Capture repository inputs

## Trigger

An agent begins accounting for an existing repository, including when the
repository has no Product Model yet.

## Outcome

The agent has an identified, exact worklist. A previously completed review
is preserved, and no source code or Product Model meaning was changed.

## Edge cases

- An existing pending review must be resumed or explicitly cancelled before another can be captured.
- Inventory includes tracked and nonignored untracked files and explicitly selected ignored inputs; model files are compared separately and generated model material is excluded.
- Symlink targets are never traversed. Submodules and unreadable inputs remain explicit uncertainty, not absent files.
- A fresh clone reads the committed completed review. Pending work remains separate for each model and worktree.
