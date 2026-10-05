---
entities:
  - { entity: quiz, shows: [Title, Question order, Share link] }
  - { entity: question, shows: [Prompt, Correct answer] }
  - { entity: attempt, shows: [Answers, Score, Submitted at] }
  - { entity: account, shows: [Display name] }
entryPoints:
  - quiz-web: /quizzes/:quizId/results
---

# Quiz results

The submitted attempts at one of a Creator's quizzes, read two ways: for each
question, how many attempts answered it right and which answers were given; for
each learner, their score and when they submitted. It opens any one attempt.
