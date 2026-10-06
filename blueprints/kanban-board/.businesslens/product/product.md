---
id: kanban-board
summary: Plan and track a small team's work on shared boards of columns and cards, with stalled work flagged and an AI agent proposing the next cards.
category: team-collaboration
tags: [multi-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Boards are private to their members. There is no public link or guest access.
  - A Teammate is added to a board by the email address of an existing account; there is no invitation for someone without one.
  - Deleted boards, cards and comments are gone for good; there is no trash to restore them from.
  - Cards are never archived. Finished work stays in the board's last column.
  - Comments are never edited.
  - Teammates sign in with an existing account; signing up and managing accounts are not part of this product.
  - Bring your own AI agent; the Product does not include one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/kanban-board/references/assumptions.md
    title: Team board assumptions
---

# Kanban Board

A shared board for a small team. Each board holds the columns its work moves
through and the cards that are that work: who is on it, when it is due, and
what the team has said about it. Members move cards from column to column as
work progresses, admins decide who belongs to the board and how its columns are
arranged, and the board flags cards that have stopped moving. An AI agent a
member connects can turn a stated goal into proposed cards, or suggest a next
step for a stalled card.

## Intent

A small team loses sight of who is doing what, and work that has quietly
stopped goes unnoticed until it is late. A board keeps all of the team's work in
one place where everyone agrees on where each piece stands, and points at the
cards nobody has moved. Every card on it was put there and moved by a member, so
it stays an honest picture of what the team has committed to: an AI agent saves
planning effort, but nothing it proposes reaches the board until a member
accepts it.
