---
kind: primary
routes:
  web: Web
steps:
  - text: The Respondent opens the form's public link
    kind: actor
    actor: respondent
    entities:
      - { entity: form, effect: reads, facts: [Title, Description] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Product shows the form's title, introduction and questions in order, without the questions waiting on an answer
    kind: product
    actor: respondent
    entities:
      - { entity: form, effect: reads, facts: [Title, Description, Question order] }
      - { entity: question, effect: reads, facts: [Prompt, Answer type, Required, Show condition] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Respondent answers the questions shown
    kind: actor
    actor: respondent
    entities:
      - { entity: question, effect: reads, facts: [Prompt, Answer type, Required] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Respondent submits
    kind: actor
    actor: respondent
    entities:
      - { entity: response, effect: creates, facts: [Answers, Submitted at] }
    contexts:
      web:
        place: forms-web::responding::public-form
  - text: The Product confirms that the answers were received
    kind: product
    actor: respondent
    entities: []
    contexts:
      web:
        place: forms-web::responding::public-form
---

# Submit a response

## Trigger

Someone holding the public link of an open form wants to answer it.

## Decision points

### A conditional question

Does an answer the Respondent gives show another question?

- The answer is one a question's show condition names → that question appears and is answered like any other, including when it is required.
- No answer shows it → the question stays hidden, is never required, and the response holds no answer to it.

## Outcome

The form has one more response holding the Respondent's answers, and the Respondent knows it was received.

## Edge cases

- The Respondent leaves a question that is not required unanswered → the response is received without an answer to it.
