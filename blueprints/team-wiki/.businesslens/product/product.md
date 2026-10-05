---
id: team-wiki
summary: A shared wiki where a team keeps its knowledge in permissioned spaces of nested pages, with full revision history, and an AI agent a member connects that answers from the pages and suggests updates for editors to publish.
category: team-collaboration
tags: [multi-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Every page belongs to one space and is read only by that space's members; there is no public or guest access.
  - A space member's role is set when they are added. Changing it means removing them and adding them again.
  - Pages are not archived or deleted, and a page moves only within its own space. Restoring a revision is the way back from an unwanted change.
  - Two editors do not edit one page together live. The second save meets the first as a conflict to resolve, never a silent overwrite.
  - An AI agent only reads and suggests; it never edits, moves or restores a page. Which agent a Member connects, and how it proves it acts for them, are outside the model.
  - The wiki keeps no record of the questions a Member asks their AI agent; only suggestions are kept.
  - There are no comments, page watching or notifications.
  - Signing in and who belongs to the workspace are managed outside the wiki.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/team-wiki/references/assumptions.md
    title: Team wiki assumptions
---

# Team Wiki

A shared place where a team writes down what it knows. Knowledge lives in
spaces, each with its own members, and inside a space pages nest under other
pages. Editors write and reorganize pages, every save is kept as a revision
anyone in the space can read and an editor can restore, and members find pages
by search or by asking an AI agent they connect, which answers with citations
to the pages it used. The agent can also review a Member's spaces for pages
that look stale or disagree with each other and leave suggested updates, which
reach a page only when an Editor publishes them.

## Intent

Make shared team knowledge trustworthy. Everyone in a space can find the current
answer and see where it came from, every change is attributable and reversible,
and an AI agent helps keep pages current without ever changing one on its own.
