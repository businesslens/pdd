---
entities:
  - { entity: quiz, shows: [Title, Question order, Answer reveal, Source material, Share link], collects: [Title, Answer reveal, Source material] }
  - { entity: choice-question, shows: [Prompt, Format, Answer options, Correct answer, Explanation, Points], collects: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
  - { entity: short-answer-question, shows: [Prompt, Accepted answers, Explanation, Points], collects: [Prompt, Accepted answers, Explanation, Points] }
  - { entity: class, shows: [Name] }
entryPoints:
  - quiz-web: /quizzes/:quizId
---

# Quiz editor

One quiz a Creator owns, opened to work on. It presents the questions in the
order learners are asked them and lets the Creator add, edit, move or remove
one. It holds the source material the Creator gave and the questions the
Product proposed from it, kept apart from the quiz until the Creator accepts or
dismisses each. It shows whether the quiz is a draft, open or closed, its share
link and the classes it is assigned to, and lets the Creator change its title
and answer reveal, share, close, reopen or delete it.
