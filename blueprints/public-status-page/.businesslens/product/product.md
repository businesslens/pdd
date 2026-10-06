---
id: public-status-page
summary: Publish a public page of your components and their current status, keep visitors informed through incidents and scheduled maintenance, and email confirmed subscribers every update an operator posts.
category: developer-tools
tags: [multi-user, public, ai-assisted]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Component status is what an Operator sets; the Product does not monitor components or measure uptime itself.
  - Subscribers are notified by email only.
  - The Product keeps one status page for one operator team, and anyone can read it; there are no private or audience-restricted pages.
  - Components are one flat list; they are not grouped or nested.
  - Incidents, their updates and maintenance windows are never deleted, and a posted update is never edited; a correction is a later update.
  - A maintenance window's times and components are never edited; a changed plan is a cancelled window and a new one.
  - A language model drafts an update's message from the Operator's notes and can get it wrong; the Operator edits it and decides whether to post it. While the language model is unavailable, Operators write every update themselves.
  - Operators sign in with an existing account, and who belongs to the operator team is managed outside the product; Visitors read the page without one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/public-status-page/references/assumptions.md
    title: Status page assumptions
---

# Public Status Page

A public page where an operator team tells the people who depend on its service
what is working right now. Operators list the components of their service and
set each one's status, declare incidents and post updates on a timeline until
they are resolved, and schedule maintenance ahead of time. Visitors read the
page without an account and can subscribe by email to hear about every update.
During an incident an operator can ask for a draft: from the operator's rough
notes, the Product fills in the text of the next update with a language model.

## Intent

When a service breaks, the people who depend on it cannot tell whether the
problem is theirs, and the operators who could tell them are busy fixing it.
The page gives them one honest, timely place to learn what is wrong, what is
being done, and when it is over — and spares the operators the writing.
