---
kind: primary
---

# A returning reader signs in

## Trigger

A reader submits the email address and password of an existing account.

## Steps

1. The product verifies the credentials
2. A session is established
3. The reading application opens on the unread backlog

## Decision points

### Credential result

Do the submitted credentials match an existing account?

- match → establish a session and open the reading application
- no match → keep the reader on the sign-in surface with one message that does not reveal whether the address is registered

## Outcome

The reader holds a session and sees their library exactly as they left it —
same sources, same reading state, same saved items and collections.
