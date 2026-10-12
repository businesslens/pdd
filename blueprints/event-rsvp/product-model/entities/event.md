---
relations:
  - entity: rsvp
    verb: has
    cardinality: one-to-many
  - entity: message
    verb: has
    cardinality: one-to-many
domain: events
---

# Event

A gathering a Host is holding at a set time, in a place, online or both, which
people are invited to through one public link.

## Information kept

- **Title** — what the event is called
- **Description** — what the host tells guests about it
- **Starts at** — when it begins, in the time zone where it is held
- **Ends at** — when it is over
- **Place** — the address where it happens, when it is held in person
- **Online link** — where guests join, when it is held online
- **Capacity** — how many people, plus-ones included, may be going; none means no limit
- **Plus-ones allowed** — whether a guest may bring one more person
- **Invitation link** — the public address where anyone holding it sees the invitation and answers
- **Spots left** — how many more people may be going before a new yes answer joins the waitlist, worked out from the capacity and who is going

## States

### Scheduled

Taking answers until it starts, and open to changes by its host.

### Cancelled

Called off by its host. Its invitation says so and takes no more answers, and
it can neither be changed nor scheduled again. Its guest list stays for the
host to read.
