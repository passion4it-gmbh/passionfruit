/**
 * Props for the Motion primitive.
 *
 * Defaults:
 *   effect    — 'fade-up'
 *   duration  — 'base'   (240ms via --duration-base)
 *   threshold — 0.15     (15% of element must be in view to trigger)
 *   once      — true     (animate once; re-entering the viewport does nothing)
 */
export interface MotionProps {
  /** Visual entrance effect. Defaults to 'fade-up'. */
  effect?: "fade" | "fade-up" | "fade-down" | "scale-in";
  /** Optional delay in milliseconds before the animation begins. */
  delay?: number;
  /** Duration tier, resolved to the matching CSS duration token. Defaults to 'base'. */
  duration?: "instant" | "quick" | "base" | "slow";
  /**
   * IntersectionObserver threshold (0–1). Fraction of the element that must be
   * visible before the animation fires. Defaults to 0.15.
   */
  threshold?: number;
  /** Whether to animate only once (true) or every time the element enters the viewport. Defaults to true. */
  once?: boolean;
}
