---
entities:
  - { entity: poll, shows: [Question, Deadline, Closed at] }
  - { entity: vote, shows: [Cast at] }
entryPoints:
  - polls-web: /polls
---

# Poll list

Presents the team's polls: the open ones first, soonest deadline first, each
marked when the Member has not voted on it yet, then the closed ones, most
recently closed first.

## Intent

Let a Member see at a glance which questions still need their vote.
