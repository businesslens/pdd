---
entities:
  - { entity: quiz, shows: [Title] }
  - { entity: choice-question, shows: [Prompt, Answer options, Correct answer, Explanation] }
  - { entity: short-answer-question, shows: [Prompt, Accepted answers, Explanation] }
  - { entity: practice-round, shows: [Questions, Answers, Correct count], collects: [Answers] }
entryPoints:
  - quiz-web: /practice/:practiceRoundId
---

# Practice

One practice round, worked through a question at a time. After each answer the
Learner learns whether it was right, and at the end how many they got right
this time; from there they can practice again.
