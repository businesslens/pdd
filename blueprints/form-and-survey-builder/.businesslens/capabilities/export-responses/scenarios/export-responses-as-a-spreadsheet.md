---
kind: primary
routes:
  web: Web
steps:
  - text: The Creator exports a form's responses
    kind: actor
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
      - { entity: form, effect: reads, facts: [Title] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product prepares a spreadsheet file with one row for each response, one column for each question, and when each response was received
    kind: product
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [Answers, Submitted at] }
      - { entity: question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The file downloads, and the responses themselves are unchanged
    kind: condition
    actor: creator
    entities:
      - { entity: response, effect: reads, facts: [] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Export responses as a spreadsheet

## Trigger

The Creator wants the responses outside the Product.

## Outcome

The Creator has a file holding every response received so far, and the form is unchanged.

## Edge cases

- A question was removed after it was answered → its column stays in the file for the responses that answered it.
- No response has been received yet → the file holds only the column headings.
