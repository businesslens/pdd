---
kind: primary
---

# A visitor creates a reader account

## Trigger

A visitor chooses to register and submits an email address, a password, and a
display name.

## Steps

1. The product checks that the email address is not already registered
2. The account is created with an empty library
3. The visitor is signed in
4. The reading application opens on an empty state that explains following a first source

## Outcome

The visitor is now a reader with a session and an empty library, looking at
guidance on how to fill it.

## Edge cases

- Display name left blank → the product uses the part of the email address before the `@`, and the reader can change it later
