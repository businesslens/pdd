---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator chooses to delete the response they are reading
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Submitted at] }
    contexts:
      web:
        place: forms-web::form-workspace::response-detail
  - text: The Product asks the Creator to confirm that the response is deleted for good
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Submitted at] }
    contexts:
      web:
        place: forms-web::form-workspace::response-detail
  - text: The Creator confirms
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: removes }
    contexts:
      web:
        place: forms-web::form-workspace::response-detail
  - text: The form's responses, their count, the export and any summary no longer include it
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers] }
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Delete a response

## Trigger

A response should not count — a test the Creator sent themselves, or an answer that is plainly not genuine.

## Outcome

The response is gone for good, and every other response is unchanged.

## Edge cases

- The Creator declines to confirm → the response stays as it was.
