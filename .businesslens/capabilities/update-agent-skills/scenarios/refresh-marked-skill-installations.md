---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to update the BusinessLens skills
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product finds every installation carrying a valid BusinessLens marker, in the repository and in the Developer's own configuration
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product replaces the skills in each one and refreshes its marker while keeping the original installation date
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product names every installation it updated
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Refresh marked skill installations

## Trigger

The Developer has a newer BusinessLens command and wants the installed skills to
match it.

## Outcome

Every BusinessLens-marked installation holds the current skills. No unmarked
directory was discovered, adopted, or changed, and no Product Model was touched.

## Edge cases

- Asking for only some harnesses, or only one scope, narrows the search without changing what counts as eligible.
