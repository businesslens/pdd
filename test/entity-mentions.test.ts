import { expect, it } from 'vitest'
import { undeclaredEntityMentions } from '../src/core/entity-mentions.js'

const entities = [
  { id: 'product', title: 'Product' },
  { id: 'model', title: 'Product Model' },
  { id: 'user', title: 'User' },
  { id: 'admin', title: 'Admin User' },
  { id: 'refund', title: 'Refund' },
  { id: 'special', title: 'Balance (USD)' },
  { id: 'invitation', title: 'Invitation' },
  { id: 'invitation-link', title: 'Invitation link' }
]

it.each([
  ['The Product updates the Product Model.', ['model'], null, []],
  ['The Admin User updates the Product Model.', ['model'], 'admin', []],
  ['The Admin User updates a User.', [], 'admin', ['user']],
  ["REFUNDS and a Refund's status are displayed.", [], null, ['refund']],
  ['The Balance (USD) is shown.', [], null, ['special']],
  ['Refundable purchases remain available.', [], null, []],
  // The longest title wins, declared or not: an Invitation link is not also an Invitation.
  ['The invitation link is revoked.', [], null, ['invitation-link']],
  ['The invitation link is revoked.', ['invitation-link'], null, []],
  ['The invitation and its invitation link expire.', ['invitation-link'], null, ['invitation']]
] as const)('checks Entity mentions in %s', (text, declared, actor, expected) => {
  expect(undeclaredEntityMentions(text, entities, [...declared], actor).map(entity => entity.id)).toEqual(expected)
})
