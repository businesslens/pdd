---
id: study-planner
summary: Set dated study goals with estimated topics, get a schedule built around your weekly hours, log what you study, and let your AI agent propose revisions.
category: learning-and-education
tags: [single-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - A plan belongs to one Student; there are no study groups, tutors, classes or shared schedules.
  - The planner does not read from or write to outside calendars, and sends no reminders.
  - Study plans are built from the Student's own topic estimates and weekly availability. The planner never judges what the Student has learned or how hard a topic is.
  - Logged study is never edited; a session logged by mistake is deleted and logged again.
  - Bring your own AI agent; the Product does not include one.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/study-planner/references/assumptions.md
    title: Student assumptions
---

# Study Planner

A personal planner for a student working toward a dated goal, such as an exam.
The student sets the goal, breaks it into topics with an estimate of the study
each one needs, and asks the planner for a study plan that spreads those topics
across their weekly availability before the date. They log the sessions they
complete and see how far each goal has come. An AI agent the student connects
proposes revised plans on top, for example after a missed session.

## Intent

A student with an exam on the 12th has more to study than time to study it,
and a schedule that goes stale the first time a session slips. The planner does
the arithmetic of fitting topics into the hours they really have, says plainly
what does not fit, and keeps the schedule honest when weeks go wrong. Every
plan, the planner's own or the agent's, waits for the student: nothing in the
schedule changes until they accept it.
