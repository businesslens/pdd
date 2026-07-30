---
kind: external-failure
---

# Following is refused when the address cannot be reached

## Trigger

A reader submits an address that does not respond, times out, or returns a server
error.

## Steps

1. The product attempts to fetch the address and fails
2. Following is refused with a message naming the failure as a connection problem
3. The reader is offered the option to try again
4. The submitted address is preserved

## Decision points

### Failure kind

What did the address do?

- did not respond, timed out, or returned a server error → refuse and offer to retry, because this is likely temporary
- returned "not found" or "gone" → refuse and suggest checking the address, because retrying will not help

## Outcome

No source is added and nothing is left half-created — a source the product has
never successfully read is not a source the reader follows.
