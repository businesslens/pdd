---
domain: agent-enablement
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/core/skill-installation.ts#installSkillsToTarget
    title: Ownership-safe installation
  - kind: code
    role: implementation
    target: src/core/providers.ts#PROVIDERS
    title: Supported harnesses
---

# Install the agent skills

Puts the three BusinessLens skills where a supported coding-agent harness will
load them, either inside the current repository or in the Developer's own
configuration, and marks the installation as BusinessLens-owned so it can be
recognized again later.

## Intent

Adoption should cost one command and should never surprise anyone. The installer
distributes skills and nothing else: it creates no Product Model, connects no
account, and submits nothing.
