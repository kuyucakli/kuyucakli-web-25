// src/utils/scroll.ts
type CB = (progress: number) => void;

let started = false;
let rafId: number | null = null;
const elements = new Map<HTMLElement, CB>();

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);

/**
 * Start the tracker (idempotent).
 * It runs a requestAnimationFrame loop that reads each element's getBoundingClientRect()
 * and calls the registered callback with a 0..1 progress value.
 */
export function initScrollTracker() {
  console.log(started);
  if (started) return;
  started = true;

  // passive listeners to avoid blocking
  window.addEventListener("scroll", () => {}, { passive: true });
  window.addEventListener("resize", () => {}, { passive: true });

  const loop = () => {
    elements.forEach((cb, el) => {
      const rect = el.getBoundingClientRect();

      const progress = clamp(
        //(window.innerHeight - rect.top) / (window.innerHeight + rect.height)
        rect.top / (window.innerHeight - rect.height)
      );

      cb(progress);
    });

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
}

/** Register an element and its per-frame callback. */
export function registerElement(el: HTMLElement, cb: CB) {
  if (!el) throw new Error("registerElement: el is required");
  elements.set(el, cb);
}

/** Unregister when element is removed or no longer needed. */
export function unregisterElement(el: HTMLElement) {
  elements.delete(el);
}

/** Stop loop and cleanup (optional). */
export function destroyScrollTracker() {
  if (!started) return;
  if (rafId != null) cancelAnimationFrame(rafId);
  elements.clear();
  started = false;
  rafId = null;
}

export function getElementProgress(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return clamp(rect.top / (window.innerHeight - rect.height));
}
