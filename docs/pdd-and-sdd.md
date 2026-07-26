# PDD ♥ SDD

BusinessLens deliberately does not compete with spec-driven development
frameworks. The borderline:

| | PDD (BusinessLens) | SDD (OpenSpec, spec-kit, freestyle) |
| --- | --- | --- |
| Answers | What IS the product, for whom, where is the proof | What WILL change, how it is built and verified |
| Tense | Present, descriptive | Future, prescriptive |
| Lifetime | Durable — the map lives as long as the product | Transient — proposals land and get archived |
| Artifact | `.businesslens/` product map with codeRefs | Specs, proposals, designs, task lists |
| Owner of change workflow | Never | Always |

## How they link

- **SDD → PDD**: change proposals cite the journeys and experiences they
  affect by ID (`journeys/compare-snapshots`). "This change affects journey
  X" becomes a reviewable claim.
- **PDD → SDD**: map entities point at specs and design docs with `links:`
  (`rel: spec|proposal|doc|adr`). The map never copies spec content.
- **The loop**: agents read the map before building (product context), build
  against the SDD change (intent), and update the map after the change lands
  (the `businesslens-sync` skill). An archived SDD change is the strongest
  signal that map entities need updating.

The `businesslens-init` skill detects SDD roots (`openspec/`, `specs/`,
`.kiro/`), records them in `.businesslens/config.yaml`, and includes the
coexistence rule in the managed `AGENTS.md` block only when one is present.
Bring your own SDD — or none at all.
