---
domain: incidents
availability: [{ place: status-web::operator-console }]
---

# Update drafting

When an Operator asks for a draft, the Product sends the Operator's rough notes
and the incident's title, impact and affected components to a language model,
and keeps the message it returns as a draft of the next incident update. The
draft is the Operator's to edit, post or throw away; the Product sends nothing
to the language model unless an Operator asks.

## Intent

Spare operators the writing while they are busy fixing the problem, without
letting anything reach visitors that an Operator has not read and posted.
