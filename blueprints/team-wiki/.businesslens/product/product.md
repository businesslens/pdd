---
id: team-wiki
summary: A shared wiki where a team keeps its knowledge in permissioned spaces of nested pages, with full revision history and an Assistant that answers from the pages and suggests updates for editors to publish.
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
  - The Assistant answers only from wiki pages and keeps no record of the questions it was asked.
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
by search or by asking the Assistant, which answers with citations to the pages
it used. The Assistant also reviews spaces for pages that look stale or that
disagree with each other and drafts updates, which reach a page only when an
editor publishes them.

## Intent

Make shared team knowledge trustworthy. Everyone in a space can find the current
answer and see where it came from, every change is attributable and reversible,
and the Assistant helps keep pages current without ever changing one on its own.
