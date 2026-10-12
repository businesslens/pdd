/**
 * Schedule non-critical browser work without making support for
 * requestIdleCallback a requirement. The timeout keeps delayed chrome such as
 * the header's star count from waiting indefinitely on a busy page.
 */
export function runWhenIdle(callback: () => void | Promise<void>) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void callback(), { timeout: 2_000 })
    return
  }

  globalThis.setTimeout(() => void callback(), 1)
}
