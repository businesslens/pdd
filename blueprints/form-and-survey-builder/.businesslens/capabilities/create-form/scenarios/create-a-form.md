---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator creates a new form and gives it a title
    kind: actor
    actor: creator
    entities:
      - { entity: form, effect: creates, to: Draft, facts: [Title, Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::forms
  - text: The Product opens the new empty form, ready to build
    kind: product
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Create a form

## Trigger

The Creator wants to start asking people something.

## Outcome

The Creator has a new draft form with the chosen title and no public link, open to build.

## Edge cases

- The Creator gives no title → the form is created as Untitled form, which they can rename like any other title.
