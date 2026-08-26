---
actors: [developer, ai-agent]
---

# Keep the model and the code aligned

## Goal

A change ships with the Product Model and the implementation saying the same
thing, without anyone having to remember which workflow to invoke next.

## Success criterion

For the scope that was changed, the model states the intended behavior, the code
supports it, and the run ends with a structural check and an explicit statement
of what was inspected.
