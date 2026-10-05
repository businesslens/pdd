---
entities:
  - { entity: quiz, shows: [Title, Question order] }
  - { entity: question, shows: [Prompt, Answer options, Correct answer, Explanation, Points] }
  - { entity: attempt, shows: [Answers, Score, Submitted at], collects: [Answers] }
  - { entity: account, shows: [Display name] }
entryPoints:
  - quiz-web: /q/:shareCode
  - quiz-web: /attempts/:attemptId
---

# Attempt

One learner's attempt at a quiz. While it is in progress, the Learner answers
the questions here and submits. Once submitted, it shows the score and which
answers scored — with each question's correct answer and explanation when the
quiz reveals them — and offers a practice round of what was missed. The quiz's
Creator opens the same attempt from the results to read it and grade answers.
