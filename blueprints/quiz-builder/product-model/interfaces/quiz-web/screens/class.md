---
entities:
  - { entity: class, shows: [Name, Join code, Assigned quizzes], collects: [Name] }
  - { entity: enrollment, shows: [Joined at] }
  - { entity: account, shows: [Display name] }
  - { entity: quiz, shows: [Title] }
entryPoints:
  - quiz-web: /classes/:classId
---

# Class

One class: its name, the join code learners use, who has joined by display
name, and the quizzes assigned to it, each of which a Learner in the class opens
to take. Its Creator renames it, removes a learner from it or deletes it here.
