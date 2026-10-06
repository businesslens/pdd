---
id: quiz-builder
summary: Build quizzes of multiple-choice, true/false and short-answer questions, share them by link or with a class, score each learner's one attempt, and practice what was missed.
category: learning-and-education
tags: [multi-user, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Every attempt belongs to a learner's account; there are no anonymous attempts.
  - Each learner has one scored attempt at a quiz. Further tries are practice rounds, which never change the recorded score.
  - A short answer scores only when it matches one of the creator's accepted answers; anything else stays incorrect until the creator grades it.
  - A language model drafts questions from source material and may be wrong. The creator accepts or dismisses each draft, and everything else works while the model is unavailable.
  - Classes are rosters for sharing quizzes, with no due dates, timers or gradebook. A learner leaves a class only when its creator removes them, and a quiz stays assigned to a class once shared with it.
  - Creators and learners sign in with an existing account; signing up and managing accounts are not part of this product.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/quiz-builder/references/assumptions.md
    title: Quiz assumptions
---

# Quiz Builder

A quiz tool for teachers and anyone else who wants to check what people have
learned. A creator writes a quiz of multiple-choice, true/false and short-answer
questions — or accepts questions the Product drafts from source material — and
shares it by link or with a class. Learners take it once and are scored with
feedback, then practice the questions they missed. The creator reviews results
per question and per learner.

## Intent

Checking what people have learned costs a creator hours of writing questions and
marking answers, and a learner's mistakes are usually forgotten once the score
is given. Make writing quick and scoring immediate while the creator stays
accountable: every score is one the Product calculated from the creator's
answers or one they graded themselves. A learner's mistakes become their next
practice, without changing the result their creator sees.
