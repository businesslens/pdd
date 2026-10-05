---
entities:
  - { entity: class, shows: [Name, Join code, Learners, Assigned quizzes] }
  - { entity: account, shows: [Display name] }
  - { entity: quiz, shows: [Title] }
entryPoints:
  - quiz-web: /classes/:classId
---

# Class

One class: its name, the join code learners use, who has joined by display
name, and the quizzes assigned to it.
