---
entities:
  - { entity: suggestion, shows: [Suggested notebook, Suggested tags, Suggested links, Reason, Suggested at] }
  - { entity: note, shows: [Title, Body] }
  - { entity: notebook, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - notes-web: /suggestions
---

# Suggestions

The AI agent's pending suggestions, oldest first. Each shows the note it is
for, what it proposes and why, and lets the owner accept it, dismiss it, or
dismiss it and file the note themselves.

## Intent

Put every change an agent proposes in front of the owner, with its reason,
before anything happens to a note.
