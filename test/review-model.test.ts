import { describe, expect, it } from 'vitest'
const modulePath = '../layers/nuxt/report-viewer/app/utils/reviewModel.ts'
const { isReviewModelPath, reviewModelFiles, reviewFileResource } = await import(modulePath)

describe('Product Model review scope', () => {
  it('keeps the active nested model separate from project files and other models', () => {
    const modelPath = 'apps/shop/.businesslens'
    const paths = [`${modelPath}/config.yaml`, `${modelPath}/coverage.md`, `${modelPath}/build/report.json`, `${modelPath}/cache/file`, '.businesslens/product.md', 'apps/shop/.businesslens-other/file.md', 'apps/shop/src/a.ts']
    expect(paths.filter(path => isReviewModelPath({ modelPath }, path))).toEqual(paths.slice(0, 2))
    expect(reviewModelFiles({ modelPath, paths, files: paths.map(path => ({ path, change: 'modified' })) }).map((file: any) => file.path)).toEqual(paths.slice(0, 2))
  })

  it('opens compact, expanded and qualified resources without using their References', () => {
    const resources = [
      { kind: 'capability', id: 'checkout', key: 'capability:checkout' },
      { kind: 'capability-scenario', id: 'buy', key: 'capability-scenario:buy', capabilityId: 'checkout' },
      { kind: 'screen', id: 'web::account::profile', key: 'screen:web::account::profile' }
    ]
    const workspace = { byKey: new Map(resources.map(resource => [resource.key, resource])) }
    for (const path of ['capabilities/checkout.md', 'capabilities/checkout/capability.md']) expect(reviewFileResource(workspace, '.businesslens', `.businesslens/${path}`)).toBe(resources[0])
    expect(reviewFileResource(workspace, '.businesslens', '.businesslens/capabilities/checkout/scenarios/buy.md')).toBe(resources[1])
    expect(reviewFileResource(workspace, '.businesslens', '.businesslens/interfaces/web/experiences/account/screens/profile/screen.md')).toBe(resources[2])
    expect(reviewFileResource(workspace, '.businesslens', '.businesslens/capabilities/different/scenarios/buy.md')).toBeNull()
    expect(reviewFileResource(workspace, '.businesslens', '.businesslens/capabilities/checkout/notes.md')).toBeNull()
    expect(reviewFileResource(null, '.businesslens', '.businesslens/capabilities/checkout.md')).toBeNull()
  })
})
