---
scope: The CLI source, the bundled agent skills, the local report viewer, and the portable Blueprint code.
method: Authored through static inspection of source and supporting documentation, without executing target code.
covered:
  - description: The CLI entry point and its command implementations.
    paths: [src/cli.ts, src/commands/]
  - description: The bundled agent skills and their references.
    paths: [skills/]
  - description: The report viewer layer and the local viewer host.
    paths: [layers/nuxt/report-viewer/, viewer/]
  - description: The Blueprint commands and the portable report code.
    paths: [src/commands/, src/core/portable.ts]
unmapped: []
exclusions:
  - description: The public Nuxt layers and package entry points that third-party hosts consume.
    paths:
      - layers/nuxt/report-viewer/
      - layers/nuxt/theme/
      - layers/nuxt/theme-lab/
      - src/report.ts
      - src/logo.ts
      - package.json
  - description: The visual identity and background-experiment layers.
    paths:
      - layers/nuxt/theme/
      - layers/nuxt/theme-lab/
  - description: The Claude plugin marketplace manifest.
    paths:
      - .claude-plugin/
limitations:
  - description: Provider detection and harness invocation behavior was inferred from the documented contracts and source; compatibility with the actual harnesses was not established.
    paths: [src/core/providers.ts, skills/]
  - description: Compatibility of catalog and GitHub interactions with the remote services was not established from source inspection.
    paths: [src/commands/pull.ts, src/commands/contribute.ts]
---

# Coverage
