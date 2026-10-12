import { usePreferredReducedMotion } from '@vueuse/core'

export function useLandingMotion() {
  const prefersReducedMotion = usePreferredReducedMotion()

  // Below-the-fold motion starts from `opacity: 0`, which SSR writes inline.
  // With reduced motion we still run a zero-duration animation to the resting
  // state so that style is actively cleared instead of leaving it invisible.
  const instant = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0 }
  }

  /**
   * For the first screen: a CSS keyframe entrance (`.landing-enter` in
   * `landing.css`), not a motion-v animation.
   *
   * motion-v renders its starting state inline and only the hydrated client
   * clears it, so the heading a reader came for — and the page's largest paint —
   * stayed invisible until every script had downloaded and run. On a slow phone
   * that was ten seconds of an empty hero. The keyframes start with the first
   * paint instead, and `prefers-reduced-motion` turns them off in CSS, which
   * the server could never know about.
   */
  function enterMotion(delay = 0) {
    return {
      class: 'landing-enter',
      style: { '--landing-enter-delay': `${delay}s` }
    }
  }

  /**
   * For whole sections, whose height is not bounded by anything.
   *
   * **`amount` must stay `'some'`.** SSR writes `opacity: 0` inline and only
   * this trigger clears it, so a threshold the element cannot reach does not
   * degrade the animation — it leaves the section permanently invisible. An
   * IntersectionObserver ratio is capped at `viewport height / element height`,
   * so any fraction is a bet that no section is ever taller than that share of
   * a phone screen.
   *
   * It was `0.35`, and the comparison lost that bet: six stacked rows measure
   * about 2250px on a phone, which caps the ratio at 0.30 on a 667px iPhone SE
   * and 0.24 at 320×568. The observer never fired and the section never
   * appeared — on those devices the page simply had no comparison in it. Taller
   * handsets cleared 0.35 and looked fine, which is what made it a device bug
   * rather than an obvious one, and every mobile E2E suite runs with reduced
   * motion, which takes the `instant` branch above and never exercises this one.
   *
   * `'some'` is threshold 0: it fires as the leading edge arrives, at any
   * height, on any viewport. `staggerMotion` below keeps a real fraction
   * because it is only ever applied to bounded items — a row, a card — that
   * cannot outgrow the screen.
   */
  function scrollMotion(delay = 0) {
    if (prefersReducedMotion.value === 'reduce') return instant
    return {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      inViewOptions: { once: true, amount: 'some' as const },
      transition: { duration: 0.6, delay }
    }
  }

  function staggerMotion(index = 0) {
    if (prefersReducedMotion.value === 'reduce') return instant
    return {
      initial: { opacity: 0, y: 10 },
      whileInView: { opacity: 1, y: 0 },
      inViewOptions: { once: true, amount: 0.3 },
      transition: { duration: 0.5, delay: index * 0.08 }
    }
  }

  return { enterMotion, scrollMotion, staggerMotion }
}
