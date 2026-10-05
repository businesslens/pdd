---
entities:
  - { entity: quiz, shows: [Title, Question order, Answer reveal, Source material, Share link], collects: [Source material] }
  - { entity: question, shows: [Prompt, Format, Answer options, Correct answer, Explanation, Points], collects: [Prompt, Format, Answer options, Correct answer, Explanation, Points] }
  - { entity: class, shows: [Name] }
entryPoints:
  - quiz-web: /quizzes/:quizId
---

# Quiz editor

One quiz a Creator owns, opened to work on. It presents the questions in the
order learners are asked them and lets the Creator add, edit or remove one. It
holds the source material given to the Quiz assistant and the questions it
drafted, kept apart from the quiz until the Creator adds or discards each. It
shows whether the quiz is a draft, open or closed, its share link and the
classes it is assigned to, and lets the Creator share or close it.
