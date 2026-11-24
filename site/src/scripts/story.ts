/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro and Finale.astro). With reduced motion the final state shows at once.
 */
const START = 500;
const STEP = 900;

const setStep = (sv: HTMLElement, n: number) => {
  sv.dataset.step = String(n);
  for (let k = 1; k <= 6; k++) sv.classList.toggle(`s${k}`, k <= n);
};

export function initStory(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sv = e.target as HTMLElement;
        io.unobserve(sv);
        const steps = Number(sv.dataset.steps ?? '0');
        if (reduce) {
          setStep(sv, steps);
          continue;
        }
        const interval = Number(sv.dataset.interval ?? STEP);
        for (let k = 1; k <= steps; k++) window.setTimeout(() => setStep(sv, k), START + (k - 1) * interval);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll<HTMLElement>('[data-sv]').forEach((sv) => io.observe(sv));
}
