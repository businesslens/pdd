---
id: quiz-builder
summary: Build multiple-choice, true/false and short-answer quizzes, share them by link or with a class, score every attempt with feedback, and let learners practice what they missed.
category: learning-and-education
tags: [ai-assisted, multi-user, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Learners sign in to take a quiz; there are no anonymous attempts.
  - Each learner has one scored attempt at a quiz. Further tries are practice rounds, which never change the recorded score.
  - A short answer scores only when it matches one of the creator's accepted answers; anything else stays incorrect until the creator grades it.
  - The Quiz assistant drafts questions and assembles practice rounds. Nothing it writes reaches learners until the creator approves it, and it never grades an attempt.
  - Classes are rosters for sharing quizzes. There are no due dates, timers or gradebook.
  - The Product is a web application; there is no native mobile application.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/quiz-builder/references/assumptions.md
    title: Quiz assumptions
---

# Quiz Builder

A quiz tool for teachers and anyone else who wants to check what people have
learned. A creator writes a quiz of multiple-choice, true/false and short-answer
questions — or asks the Quiz assistant to draft them from source material —
and shares it by link or with a class. Learners take it once and are scored with
feedback, then practice the questions they missed. The creator reviews results
per question and per learner.

## Intent

Make checking understanding quick for the creator and useful for the learner.
The creator stays the author of record: every question learners see is one they
wrote or approved, and every score is one the Product calculated from their
answers or one they graded themselves. A learner's mistakes become their next
practice, without changing the result their creator sees.
