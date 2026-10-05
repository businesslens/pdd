---
appliesTo:
  - type: entity
    id: page
    effect: changes
permits:
  - related: [{ verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
    when: [{ entity: space-membership, fact: Role, is: Editor }]
---

# Only an Editor changes a space's pages

A page's title, content and place in its space's tree are changed only by a
Member whose role in that space is Editor: by editing it, moving it, restoring
an earlier revision, or publishing a suggestion. An AI agent never changes a
page.

## Rationale

Every change to a page is a decision someone in the space answers for, so each
revision names the Editor who made it, including revisions whose content an
AI agent proposed.
