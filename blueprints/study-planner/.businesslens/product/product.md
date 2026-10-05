---
id: study-planner
summary: Set study goals with a date, break them into topics, schedule and log study sessions, and see progress toward each goal, with an assistant that proposes a schedule you accept.
category: learning-and-education
tags: [single-user, agentic]
authors:
  - name: BusinessLens
license: MIT
languages: [en]
limitations:
  - Personal and single-user. There are no study groups, tutors, classes or shared schedules.
  - The planner is a web application; it does not read from or write to outside calendars, and it sends no reminders outside the planner.
  - The planning assistant plans from the student's own topic estimates and weekly availability. It does not judge what the student has learned or how difficult a topic is.
references:
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/study-planner/references/assumptions.md
    title: Student assumptions
---

# Study Planner

A personal planner for a student working toward a dated goal, such as an exam.
The student sets the goal, breaks it into topics with an estimate of the study
each one needs, schedules study sessions, logs the sessions they complete, and
sees how far each goal has come. A planning assistant proposes a schedule that
fits the student's weekly availability and the goal's date, and proposes a
revision when sessions are missed.

## Intent

Turn "I have an exam on the 12th" into a week-by-week schedule the student can
keep, and keep it honest when life gets in the way. The assistant does the
arithmetic of fitting topics into available time; the student stays the only
one who changes the schedule, and nothing the assistant prepares takes effect
until the student accepts it.
