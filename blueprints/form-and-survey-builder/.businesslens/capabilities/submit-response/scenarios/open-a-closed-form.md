---
kind: edge
routes:
  web: Web
steps:
  - text: The Respondent opens the public link of a closed form
    kind: actor
    actor: respondent
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Product shows the form's title and says it is closed
    kind: product
    actor: respondent
    entities:
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: Nothing can be answered or submitted
    kind: condition
    actor: respondent
    entities: []
    contexts:
      web:
        place: forms-web::responding::public-form
---

# Open a closed form

## Trigger

Someone opens a form's public link after its Creator closed it.

## Outcome

The Respondent knows the form is closed, and no response is taken.

## Edge cases

- The form closes while the Respondent is answering → submitting is refused with the same message, and nothing is received.
