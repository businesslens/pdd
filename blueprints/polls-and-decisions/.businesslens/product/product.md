---
id: polls-and-decisions
summary: Put an open question to the team as a poll, vote on it, reveal the results as the poll allows, and keep the outcome as a decision the team can look back on.
category: team-collaboration
tags: [multi-user, ai-assisted, beginner]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - The team and its members are given. Signing in, inviting and removing members are outside this model.
  - A recorded decision is final. Revisiting a question means asking it again in a new poll.
  - The Assistant works within one poll at a time, from its question, options, results and comments. It does not draw on earlier decisions or anything outside the Product.
  - The Product keeps its polls and decisions to itself. It sends no reminders, notifications or messages outside the web application.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/polls-and-decisions/references/assumptions.md
    title: Product assumptions
---

# Polls & Decisions

A small team tool for settling open questions. A member puts a question to the
team as a poll — single or multiple choice, with an optional deadline, anonymous
or named — members vote and argue their case in comments, the results are
revealed when the poll's own setting allows, and the poll's owner records the
outcome as a decision the whole team can find again later. A built-in Assistant
can summarize the discussion and draft the decision record for the owner to
edit and confirm.

## Intent

Turn "what did we decide, and why?" into something the team can look up. Every
poll is honest about what it shows and when: an anonymous vote never reveals
its voter, and hidden results stay hidden until voting ends. The decision is
always a person's: the Assistant prepares words, and the poll owner decides
whether they become the record.
