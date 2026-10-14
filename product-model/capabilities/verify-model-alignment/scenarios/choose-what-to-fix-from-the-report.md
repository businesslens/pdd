---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer asks for the code to be checked against the model
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent inspects the scope and reports every finding, grouped by the decision it needs, with a recommendation for each
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads, facts: [Product, Coverage, Method] }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer chooses which findings to fix
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent resolves each chosen finding, then inspects the scope again from source
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Choose what to fix from the report

## Trigger

The Developer has implemented a change their own way, or wants to know where
the product stands, and asks for a check.

## Outcome

Every finding was reported before anything changed. Only the findings the
Developer chose were resolved, each re-inspected from source, and the rest
stay in the final report as they were found.

## Edge cases

- Choosing nothing ends the run with the report; nothing was written.
- A chosen fix that changes product meaning is still drafted as a delta and written only after the Developer approves it.
- A finding the fix uncovers is reported, and the Developer chooses again.
