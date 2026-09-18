---
scope: The terminal command, installed agent skills, local Product Report, and Blueprint movement between repositories.
method: Authored through static inspection of source and supporting documentation, without executing target code.
covered:
  - description: Terminal commands for skill installation, model linting and opening the local report.
    paths: [src/cli.ts, src/commands/]
  - description: Agent workflows for mapping established behavior, defining intended behavior and verifying model alignment.
    paths: [skills/]
  - description: Local Product Report navigation, resource readings and Git comparisons.
    paths: [layers/nuxt/report-viewer/, viewer/]
  - description: Blueprint export, opening, pulling and contribution between repositories.
    paths: [src/commands/, src/core/portable.ts]
unmapped: []
exclusions:
  - description: The public Nuxt layers and JavaScript entry points for third-party hosts are deliberately outside this model’s scope.
    paths:
      - layers/nuxt/report-viewer/
      - layers/nuxt/theme/
      - layers/nuxt/theme-lab/
      - src/report.ts
      - src/logo.ts
      - package.json
  - description: The visual identity — palette, type, approved surfaces, logo and icon family — and shared background experiments are deliberately outside this model’s scope.
    paths:
      - layers/nuxt/theme/
      - layers/nuxt/theme-lab/
  - description: Installing skills through the Claude plugin marketplace is deliberately outside this model’s scope.
    paths:
      - .claude-plugin/
limitations:
  - description: Provider detection and harness invocation behavior was inferred from the documented contracts and source; compatibility with the actual harnesses was not established.
    paths: [src/core/providers.ts, skills/]
  - description: Compatibility of catalog and GitHub interactions with the remote services was not established from source inspection.
    paths: [src/commands/pull.ts, src/commands/contribute.ts]
---

# Coverage
