---
entities:
  - { entity: form, shows: [Title, Description] }
  - { entity: question, shows: [Prompt, Answer type, Required] }
  - { entity: response, collects: [Answers] }
entryPoints:
  - forms-web: /f/:publicLink
---

# Public form

One published form, answered by anyone holding its public link: its title and
introduction, then its questions in order, each conditional question appearing
once the answer it depends on is given. It confirms a submitted response, and
says the form is not taking responses once its Creator has closed it.
