---
domain: agent-enablement
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#findManagedInstallations
    title: Managed installation discovery
---

# Update the agent skills

Refreshes skill installations that BusinessLens already owns, bringing them to
the skills that ship with the current command, without discovering or adopting
anything unmarked.

## Intent

Refreshing should be safe to run blind. The ownership marker is what makes an
installation eligible, so nothing that BusinessLens did not install can be
changed by asking for an update.
