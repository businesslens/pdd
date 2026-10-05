---
domain: plans
availability: [ { place: planner-agent } ]
---

# Study plan proposals

Lets the Student's AI agent leave a study plan for a goal: sessions that divide
the study still to do across the Student's weekly availability before the
target date, with an explanation of what it did. The agent prepares one when
the Student asks it to plan a goal, and a revised one when it finds a missed
session. The Product checks every plan against the availability and the
schedule before keeping it. A plan only proposes; the schedule changes when the
Student accepts it.

## Intent

Let an agent do the arithmetic of fitting topics into the time the Student has,
and keep doing it as plans meet real weeks, without taking the schedule out of
the Student's hands.
