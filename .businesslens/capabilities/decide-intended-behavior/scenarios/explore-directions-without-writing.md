---
kind: primary
routes:
  harness: Harness
steps:
  - text: The Developer brings an open product question, or a blank repository
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent offers a shortlist of genuinely different directions, each with who it serves, the job it does, why someone would choose it, and what it excludes
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent writes nothing and stops at the shortlist
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
---

# Explore directions without writing

## Trigger

The Developer wants to think about what the product should be, and has not
decided.

## Outcome

The Developer holds a shortlist they can reject entirely. The Product Model is
byte-identical to what it was before the conversation.

## Edge cases

- For a model that already exists, the directions offered are ones it does not take today, each with its cost elsewhere in the model.
