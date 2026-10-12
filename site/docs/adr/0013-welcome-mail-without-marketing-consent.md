# Welcome mail without implied marketing consent

BusinessLens now sends two welcome messages through Resend: one transactional
message after Better Auth creates an account, and one marketing message after a
visitor explicitly subscribes in the public footer. This reverses the mail-free
consequence recorded by ADR-0001 without reversing its OAuth-only production
authentication decision.

Account creation and mailing-list consent are separate lifecycle events. The
account hook sends a published transactional template and never creates a
Contact, joins a Segment, or changes a Topic. The footer endpoint creates or
updates a Resend Contact, explicitly opts it into the updates Topic, and emits a
Resend Automation event only when that Contact is newly created or transitions
from not subscribed to subscribed.

Resend is the source of truth for subscriber addresses and preferences. The
application stores no separate subscriber or welcome-delivery state. Account
welcome retries use the immutable user ID as Resend's short-lived idempotency
key; updates welcomes use the current Topic state to avoid sequential duplicate
events.

## Consequences

- OAuth remains the only production sign-in mechanism. There is still no
  password reset or address-verification mail.
- Provider failure never rolls back account creation. Account sends use Resend's
  idempotency key, while an updates Event is a best-effort consequence of the
  subscription transition and is not automatically repeated.
- The application still builds and boots with no mail credentials. Only an
  explicitly enabled mail action requires Resend.
- Templates and provider resources remain source controlled and change only
  through the explicit Resend plan/apply workflow. Application builds never
  mutate provider state.
- Marketing messages carry Resend's unsubscribe link, and duplicate or existing
  subscriptions return the same public response so the endpoint cannot be used
  to enumerate addresses.

## Related

- [ADR-0001](./0001-oauth-from-day-one.md) — the OAuth-only authentication decision
- [Email operations](../deployment/email-operations.md) — planning, applying, verification, and rollback
