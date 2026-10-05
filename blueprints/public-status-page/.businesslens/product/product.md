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
  - Component status is what an operator sets; the Product does not monitor components or measure uptime itself.
  - Subscribers are notified by email only.
  - There is one public page per operator team, readable by anyone; there are no private or audience-restricted pages.
  - Components are one flat list; they are not grouped or nested.
  - The drafting assistant drafts incident updates only; it never posts, changes a status or contacts subscribers.
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

A drafting assistant helps operators write during an incident: from the
operator's rough notes it drafts the text of the next update, which the operator
edits and posts. Nothing reaches the page or a subscriber until an operator
posts it.

## Intent

Give the people affected by an outage one honest, timely place to learn what is
wrong, what is being done, and when it is over — without asking the operators to
stop fixing the problem to write prose. Speed in writing comes from the
assistant; every word that is published remains an operator's decision.
