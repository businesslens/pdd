# Injected build handoff

Send one self-contained packet to the harness-supplied builder:

- **Expected behavior:** the exact approved model contract.
- **Affected model entities:** IDs of relevant features, rules, journeys, and
  scenarios.
- **Observed gap:** current behavior and why it differs.
- **Acceptance criteria:** observable trigger, steps, decisions, outcome, edge
  cases, and applicable invariants.
- **File leads:** inspected paths and symbols as leads, never mandatory design.
- **Constraints:** do not edit `.businesslens/`; preserve unrelated user work;
  follow repository instructions; surface uncertainty rather than changing
  product meaning.
- **Verification:** the builder may run the target's normal tests and checks
  under its separate permissions and reports files changed, checks run, results,
  and remaining uncertainty.
- **Return:** hand control directly back to this verification invocation.

If no injected builder exists, return this same packet to the user as the
blocker. Do not pretend implementation completed and do not substitute a
BusinessLens skill for the builder.
