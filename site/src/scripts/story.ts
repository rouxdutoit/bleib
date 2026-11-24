/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro, Hero.astro and Finale.astro).
 * A [data-type] element inside a scene is typed out at step 1, and later steps wait for it.
 * data-gaps="a,b,…" sets the pause after each step (ms), so a reader can finish before the next change.
 * With reduced motion the final state shows at once.
 */
const START = 500;
const STEP = 900;

const setStep = (sv: HTMLElement, n: number) => {
  sv.dataset.step = String(n);
  for (let k = 1; k <= 6; k++) sv.classList.toggle(`s${k}`, k <= n);
};

/** Types el's data-type text from `at` ms, with the rhythm of rouxdutoit.com; returns when it ends. */
const type = (el: HTMLElement, at: number): number => {
  const glyphs = [...(el.dataset.type ?? '')];
  el.textContent = '';
  let t = at;
  glyphs.forEach((_, i) => {
    t += 16 + ((i * 7) % 15) + (/[.,]/.test(glyphs[i - 1] ?? '') ? 35 : 0);
    const text = glyphs.slice(0, i + 1).join('');
    window.setTimeout(() => (el.textContent = text), t);
  });
  return t;
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
        const gaps = (sv.dataset.gaps ?? '').split(',').map(Number);
        const typer = sv.querySelector<HTMLElement>('[data-type]');
        let at = START;
        for (let k = 1; k <= steps; k++) {
          window.setTimeout(() => setStep(sv, k), at);
          at = k === 1 && typer ? type(typer, at) + 300 : at + (gaps[k - 1] || interval);
        }
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll<HTMLElement>('[data-sv]').forEach((sv) => io.observe(sv));
}
