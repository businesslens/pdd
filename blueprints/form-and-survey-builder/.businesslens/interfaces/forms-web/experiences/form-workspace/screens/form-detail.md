---
entities:
  - { entity: form, shows: [Title, Description, Goal, Question order, Public link], collects: [Title, Description, Goal] }
  - { entity: question, shows: [Prompt, Answer type, Required, Show condition], collects: [Prompt, Answer type, Required, Show condition] }
  - { entity: suggested-question, shows: [Prompt, Answer type] }
  - { entity: response, shows: [Answers, Submitted at] }
entryPoints:
  - forms-web: /forms/:formId
---

# Form detail

One form the Creator owns, opened to work on. It presents the form's title,
introduction and questions in order, and lets the Creator edit them, add,
change, move and remove questions, and ask the Assistant to draft questions
from a stated goal, with each suggested question shown apart from the form
until the Creator accepts or dismisses it. It shows whether the form is a
draft, open or closed and its public link, and lets the Creator publish it,
close it and open it again. It presents the responses received — how many, and
the answers to each question — lets the Creator open one, export them all, and
ask the Assistant to summarize their themes.
