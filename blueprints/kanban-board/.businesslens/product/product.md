---
id: kanban-board
summary: Plan and track a small team's work on shared boards of columns and cards, with an AI agent that proposes cards and flags stalled work for members to accept or act on.
category: team-collaboration
tags: [multi-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - The AI agent proposes cards and flags stalled ones. It never creates, edits, moves or accepts a card itself.
  - Boards are private to their members. There is no public link, guest access or read-only sharing.
  - A Teammate is added to a board by the email address of an existing account; there is no invitation for someone without one.
  - Cards are not archived or deleted. Finished work stays in the board's last column.
  - Comments cannot be edited or deleted once posted.
  - The product is used in a web browser. There is no mobile application, and there are no notifications, attachments, labels or checklists.
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
work progresses, and admins decide who belongs to the board and how its columns
are arranged. An AI agent a member connects can turn a stated goal into
proposed cards and watch for cards that have stopped moving; members decide
what happens to both.

## Intent

Let a small team see all of its work in one place and agree on where each piece
stands. Every card on a board was put there and moved by a member, so the board
stays an honest picture of what the team has committed to. The AI agent saves
planning and watching effort without ever deciding on the team's behalf.
