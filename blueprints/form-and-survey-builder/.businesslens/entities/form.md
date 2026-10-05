---
relations:
  - entity: question
    verb: holds
    cardinality: one-to-many
  - entity: response
    verb: receives
    cardinality: one-to-many
  - entity: suggested-question
    verb: offers
    cardinality: one-to-many
---

# Form

A form or survey a Creator builds: a titled, ordered set of questions that
people answer through one public link.

## Information kept

- **Title** — the name Respondents see at the top of the form
- **Description** — the introduction Respondents read before the questions
- **Goal** — what the Creator says the form should find out, which suggested questions are drafted from
- **Question order** — the order its questions are asked in
- **Public link** — the address Respondents answer it at, given when it is first published

## States

### Draft

Being built. It has no public link and takes no responses.

### Open

Published. Its public link shows the form and takes responses.

### Closed

No longer taking responses. Its public link says so, and every response
received stays with the form.
