# 0004 — The pull-request diff is the binding human surface

Status: **Accepted** — 2026-08-26

## Context

The human does not read `spec/format.md` and does not read the installed skill.
They work through the agent. Their entire contact with the model is: `docs/`,
the agent's proposed delta in chat, the **`git diff` of `.businesslens/`** on a
pull request, and the rendered report.

This creates a tension. The report viewer is the most pleasant reading of a
model — but a viewer that makes an illegible model comprehensible launders the
defect rather than fixing it.

## Decision

**The pull-request diff is the surface the encoding must satisfy.** A model
whose diff cannot be reviewed has failed at the format's own premise — a
Git-tracked, reviewable product contract.

The report viewer is explicitly **not** a legibility instrument for the format.
Its job is to make a complete model navigable. If a finding can only be seen in
the viewer, that is evidence against the encoding.

## Consequences

- Frontmatter density, key vocabularies, and relation encoding are judged as
  diff artifacts.
- "It reads well in the viewer" is not a defence of an encoding.
- Normalisation churn on round trip — reordered relation lists, reflowed
  frontmatter — is a real cost because it lands in review.
