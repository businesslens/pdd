---
experiences:
  - account-access
features:
  - account-access
scenarios:
  - create-an-account
  - register-with-an-address-already-in-use
  - return-to-a-shared-collection-after-signing-in
  - sign-in-to-an-existing-library
entryPoints:
  - web: /signin
  - web: /register
  - ios: content-reader://account
  - android: content-reader://account
---

# Account access

Lets a visitor establish a reader identity or resume the library that identity
owns.

## Intent

Make account access a short detour into the reading product rather than a
separate destination or profile-building exercise.

## Information presented

- Whether the reader is signing in or creating an account
- What information is required to continue
- Why account access is needed when arriving from a public collection
- Any validation or identity conflict that prevents completion

## Available actions

- Create a reader account
- Sign in to an existing library
- Leave without establishing a session

## Product states

### Sign in

A returning reader can resume the library associated with their identity.

### Create account

A visitor can establish the identity that will own a new library.

### Identity conflict

An address already in use is explained without replacing or exposing the
existing account.

### Return destination preserved

A visitor sent here from a public collection can see that the collection will
remain their destination after account access succeeds.

## Capability boundary

The Screen establishes or resumes a session. It does not expose library
content, manage a reader profile beyond the required identity, or change any
source, item, reading state, saved item, tag, or collection.
