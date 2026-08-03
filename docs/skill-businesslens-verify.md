---
title: verify
description: Inspect model/code alignment and automatically resolve every scoped gap until aligned or explicitly blocked.
section: open-source
group: Skills
order: 25
---

# `businesslens-verify`

Use verify after implementation, after a refactor, when drift is suspected,
before release, or for a named/full current-state audit.

```text
/businesslens-verify this branch
/businesslens-verify current
/businesslens-verify checkout
/businesslens-verify report only
```

Verify lints structure, independently traces each declared
Interface–Experience pair without executing target code, and classifies
aligned, model-right, code-right, neither-right, unmapped, and unverifiable
cases. It groups root decisions and recommends an authority.

In resolution mode it automatically runs the next bounded phase:

- approved code correction through the builder injected by your harness;
- an approved narrow model delta;
- intent negotiation followed by model and code changes;
- scoped mapping of established absent behavior.

It re-derives findings after every change. An unchanged recurring gap stops the
loop, and a missing builder produces a complete handoff packet. The user never
has to manually invoke map or ideate to continue verification.

`report only` disables writes, delegation, and Reference refresh.
