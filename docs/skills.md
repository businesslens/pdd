---
title: Skills reference
description: The six BusinessLens agent skills — what each does and when to use it.
order: 5
---

# Skills reference

BusinessLens ships six agent skills. Each is self-contained, follows the open
Agent Skills folder format, and treats the target repository as untrusted:
skills inspect code statically and never execute it.

| Skill | Use it when |
| --- | --- |
| `businesslens-init` | Adopting BusinessLens or rebuilding an incomplete map |
| `businesslens-sync` | Code changes affected product behavior |
| `businesslens-deep-dive` | One journey or experience needs exhaustive coverage |
| `businesslens-validate` | The map needs a read-only deterministic check |
| `businesslens-doctor` | The map fails validation, looks stale, or needs a health report |
| `businesslens-publish` | You explicitly want to publish the map to the platform |

## businesslens-init

Initializes Product-Driven Design in a repository: inspects the codebase and
authors a complete, evidence-backed `.businesslens/` product map, installs the
managed `AGENTS.md` guidance, and validates the result. Use it for first-time
setup, replacing an incomplete scaffold, or rebuilding from scratch.

## businesslens-sync

Refreshes an existing map after code or behavior changes — corrects affected
entities and stale evidence without rebuilding unrelated areas. Invoke it
after implementing features, fixing behavior, or removing functionality.

## businesslens-deep-dive

Expands one named journey or experience to exhaustive fidelity by mining its
implementation and tests for scenarios, boundaries, and edge cases. Use it
when a specific product area needs deeper coverage without remapping the
repository.

## businesslens-validate

Runs the deterministic validator and explains every error, warning, and
entity count. Strictly read-only — it never modifies files. Use it to check a
map, verify initialization or synchronization, or confirm CI readiness.

## businesslens-doctor

Investigates the health of an installation and map: validation failures,
stale `codeRefs`, missing managed instructions, semantic drift, and
incomplete coverage. It diagnoses by default and repairs only when explicitly
asked. Reach for it when a simple validation report is not enough.

## businesslens-publish

Compiles the map and submits it to the platform as a commit-pinned snapshot
by running the CLI's `publish` command with preflight checks. It is the only
skill that contacts the platform, and it never runs without explicit user
intent. See the [CLI reference](./cli.md) for the underlying command.
