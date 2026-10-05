---
id: form-and-survey-builder
summary: Build a form or survey, share it through a public link, collect answers from people without accounts, and review, summarize and export what came back.
category: public-participation
tags: [public, ai-assisted, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Respondents have no accounts, so the Product cannot tell who answered or limit a person to one response.
  - Logic is limited to showing a question once an earlier choice question has a chosen answer. There is no scoring, calculation, or skipping between pages.
  - Each form has one Creator. There is no shared editing of a form.
  - Forms are closed, not deleted, and a received response cannot be edited or removed.
  - Drafting and summarizing depend on a language model service. When it is unavailable they produce nothing, while building, answering and reading forms work as usual.
  - Theme summaries are read from the answers each time the Creator asks; they are not kept, and they can miss or misjudge a theme.
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
respond without an account. The Creator reads the responses, exports them, and
closes the form when they have enough. When the Creator asks, the Product uses
a language model to draft questions from a stated goal and to summarize the
themes in written answers; drafts join a form only when the Creator accepts
them.

## Intent

Make asking many people a few clear questions quick for the person asking and
effortless for the people answering. The Creator stays the author of every
question and the only reader of the answers; drafting and summarizing shorten
the work without ever deciding what the form asks.
