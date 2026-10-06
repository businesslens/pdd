---
id: team-wiki
summary: Keep a team's knowledge in permissioned spaces of nested pages with revision history, find it by search, and let members' AI agents answer from it and suggest updates.
category: team-collaboration
tags: [multi-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Every page belongs to one space and is read only by that space's members; there is no public or guest access.
  - A page moves only within its own space.
  - A space keeps the description it was created with, and is never deleted.
  - Two editors do not edit one page together live. The second save meets the first as a conflict to resolve, never a silent overwrite.
  - There are no comments, page watching or notifications.
  - The wiki keeps no record of the questions a Member asks their AI agent; only suggestions are kept.
  - Bring your own AI agent; the Product does not include one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/team-wiki/references/assumptions.md
    title: Team wiki assumptions
---

# Team Wiki

A shared place where a team writes down what it knows. Knowledge lives in
spaces, each with its own members, and inside a space pages nest under other
pages. Editors write, reorganize and delete pages, every save is kept as a
revision anyone in the space can read and an Editor can restore, and members
find pages by search or by asking an AI agent they connect, which answers with
citations to the pages it used. The agent can also review a Member's spaces for
pages that look stale or disagree with each other and leave suggested updates.
A suggestion changes nothing until an Editor accepts it.

## Intent

A team's knowledge goes stale where nobody looks, and people cannot tell whether
a page is current, who changed it, or where an answer came from. Make that
knowledge trustworthy: everyone in a space can find the current answer and see
where it came from, every change is attributable and reversible, and the
agents Members already use help keep pages current.
