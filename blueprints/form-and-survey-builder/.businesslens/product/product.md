---
id: form-and-survey-builder
summary: Build a form or survey, share it through a public link, collect answers from people without accounts, and review, summarize and export what came back.
category: public-participation
tags: [multi-user, public, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Respondents have no accounts, so the Product cannot tell who answered or limit a person to one response.
  - Logic is limited to showing a question once an earlier choice question has a chosen answer. There is no scoring, calculation, or skipping between pages.
  - Each form has one Creator. There is no shared editing of a form.
  - A choice question stays a choice question; asking for a written answer, a rating or a date instead means adding a new question.
  - A received response is never edited. Deleting a form deletes its responses with it.
  - A language model drafts proposed questions and summarizes written answers, and it can be wrong; a proposed question joins a form only when the Creator accepts it. While the model is unavailable, the Creator builds forms by hand and reads responses unsummarized.
  - Creators sign in with an existing account; signing up and managing accounts are not part of this product.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/form-and-survey-builder/references/assumptions.md
    title: Form builder assumptions
---

# Form & Survey Builder

A form and survey builder for anyone who needs answers from other people. A
Creator writes questions — short and long answers, single and multiple choice,
ratings and dates — marks which are required, and shows a question only after a
chosen answer. Publishing gives the form a public link; anyone holding it can
respond without an account. The Creator reads the responses, exports them,
closes the form when they have enough, and deletes what they no longer need.
When the Creator asks, the Product uses a language model to propose questions
from a stated goal and to summarize the themes in written answers.

## Intent

Asking many people a few questions should not mean chasing replies across
messages and copying them into a spreadsheet, and answering should not mean
creating yet another account. The Product makes asking quick for the person
asking and effortless for the people answering, while the Creator stays the
author of every question and the only reader of the answers.
