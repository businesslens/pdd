---
id: polls-and-decisions
summary: Put a question to the team as a poll, vote and argue while it is open, and keep the outcome as a decision the team can look up.
category: team-collaboration
tags: [multi-user, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A poll's question, options and settings never change once it is open. Its owner can delete it, with its comments, until the first vote is cast, and never after.
  - A vote can be changed until its poll closes, but never withdrawn.
  - Comments are never edited, and are deleted only with their poll.
  - A decision is never deleted, and once recorded it is final. Revisiting a question means asking it again in a new poll.
  - A language model writes comment summaries and draft decisions and may be wrong; only the poll's owner sees them, and nothing is the team's decision until the owner records it. While the model is unavailable, everything else works and the owner writes the decision themselves.
  - The Product sends no reminders, notifications or messages outside the web application.
  - Members sign in with an existing account, and who belongs to the team is managed outside the product.
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
outcome as a decision the whole team can find again later. On request, a
language model summarizes the comments for the owner and drafts the decision
record.

## Intent

A team that settles questions in chat threads and meetings soon cannot say what
it decided, or why. Polls & Decisions gives every question a clear end and a
record the team can look up. Every poll is honest about what it shows and when:
an anonymous vote never reveals its voter, and hidden results stay hidden until
voting ends.
