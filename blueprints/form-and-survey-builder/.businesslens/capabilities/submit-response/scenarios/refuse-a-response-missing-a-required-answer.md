---
kind: validation
routes:
  web: Web
steps:
  - text: The Respondent submits without answering a required question shown to them
    kind: actor
    actor: respondent
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Required] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Product points to each required question still unanswered
    kind: product
    actor: respondent
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Required] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: Nothing is received, and the answers given so far are kept to finish
    kind: condition
    actor: respondent
    entities: []
    contexts:
      web:
        place: forms-web::responding::public-form
---

# Refuse a response missing a required answer

## Trigger

The Respondent submits before answering every required question shown to them.

## Outcome

No response is received yet, the Respondent knows what is missing, and nothing they answered is lost.
