---
status: partial
method:
  - Static inspection of the repository's own instructions, documentation, CLI source, bundled agent skills, and Nuxt report-viewer layer.
  - Command behavior traced from `src/cli.ts` through each command implementation into the core parsing, portability, installation, and local-server modules.
  - Skill behavior traced from each `SKILL.md` and its references; the repository's docs and specs were used as leads and confirmed against implementation.
  - What each Step does to the things the product keeps, and who may, read from the format contract and the structural rules that enforce it.
  - No repository build, test, package script, or application was executed.
sourceAreas:
  - src/cli.ts
  - src/commands/
  - src/core/
  - skills/businesslens-map/
  - skills/businesslens-ideate/
  - skills/businesslens-verify/
  - layers/nuxt/report-viewer/
  - viewer/app/app/
  - docs/
  - spec/
unmapped:
  - The Nuxt layers and JavaScript entry points the package exports for third-party hosts (`businesslens/nuxt/report-viewer`, `businesslens/nuxt/theme`, `businesslens/nuxt/theme-lab`, `businesslens/report`, `businesslens/logo`). They are a supported package contract, but no inbound Product interaction was modeled for them.
  - The BusinessLens visual identity carried by the theme layer — palette, type, approved surfaces, logo and icon family — and the shared background experiments in the theme lab.
  - Installing the skills through the Claude Code plugin marketplace manifest instead of the `install` command.
  - The Blueprint catalog service itself. Browsing, listing, publication, and withdrawal all happen outside this product.
limitations:
  - The model describes established behavior found by reading source; it makes no claim that behavior is currently correct, released, or verified.
  - Provider detection paths and the harness invocation syntaxes are recorded as the product's own claims; no harness was run to confirm them.
  - Catalog and GitHub interactions were read from source only. No network call was made.
  - The things this product keeps are its own resource types, so the model reads its own vocabulary back at itself; the Product Model, the Blueprint, and the Skill installation are the three it changes, and the resource types are what it presents.
  - This model was produced by an independent mapping run and adopted after review, then re-mapped when the format changed. Two runs agreed on what the product does and differed only over whether serving and reading the local report, and verifying and resolving, are one durable ability each or two. Both were kept as one, because neither half is independently meaningful to an Actor.
---

# Coverage

The three interaction surfaces a person or agent actually uses — the terminal
command, the installed agent skills, and the local Product Report on localhost —
are modeled end to end, together with the Blueprint movement paths between
repositories. The two things that act on the Product, the Developer and the AI
agent, are Entities like the things they act on, and the one Rule that says who
may write product meaning names the Developer alone. The package's Nuxt layers,
its exported JavaScript entry points, and the BusinessLens visual identity they
carry are deliberately left unmapped: they are a library contract for other
applications rather than an interaction this product offers, and modeling them
would have required claiming a Product boundary the repository does not
establish. Status is `partial` because those areas are known, real, and absent
from the model.
