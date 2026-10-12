---
domain: incidents
availability: [{ place: status-web::operator-console }]
---

# Update drafting

When an Operator asks for a draft, the Product sends the Operator's rough notes
and the incident's title, impact and affected components to a language model,
and fills the message of the update being written with the text it returns.
The draft is kept only if the Operator posts the update; the Product sends
nothing to the language model unless an Operator asks.

## Intent

Spare operators the writing while they are busy fixing the problem.
