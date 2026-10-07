---
entities:
  - { entity: form, shows: [Title] }
  - { entity: choice-question, shows: [Prompt] }
  - { entity: entry-question, shows: [Prompt] }
  - { entity: response, shows: [Answers, Submitted at] }
entryPoints:
  - forms-web: /forms/:formId/responses/:responseId
---

# Response detail

One response the Creator picked from a form's responses: every answer it gave,
beside the question it answered, and when it was received. The Creator can
delete it from here.
