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

const timers = new WeakMap<HTMLElement, number[]>();
const later = (sv: HTMLElement, fn: () => void, ms: number) => timers.get(sv)?.push(window.setTimeout(fn, ms));

/** Types el's data-type text from `at` ms, with the rhythm of rouxdutoit.com; returns when it ends. */
const type = (sv: HTMLElement, el: HTMLElement, at: number): number => {
  const glyphs = [...(el.dataset.type ?? '')];
  el.textContent = '';
  let t = at;
  glyphs.forEach((_, i) => {
    t += 16 + ((i * 7) % 15) + (/[.,]/.test(glyphs[i - 1] ?? '') ? 35 : 0);
    const text = glyphs.slice(0, i + 1).join('');
    later(sv, () => (el.textContent = text), t);
  });
  return t;
};

/** Puts a scene back to its start and cancels anything still scheduled. */
export function reset(sv: HTMLElement): void {
  timers.get(sv)?.forEach((id) => window.clearTimeout(id));
  timers.set(sv, []);
  setStep(sv, 0);
}

/** Plays a scene from the start (or shows it finished, with reduced motion). */
export function play(sv: HTMLElement): void {
  reset(sv);
  const steps = Number(sv.dataset.steps ?? '0');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setStep(sv, steps);
    return;
  }
  const interval = Number(sv.dataset.interval ?? STEP);
  const gaps = (sv.dataset.gaps ?? '').split(',').map(Number);
  const typer = sv.querySelector<HTMLElement>('[data-type]');
  let at = START;
  for (let k = 1; k <= steps; k++) {
    later(sv, () => setStep(sv, k), at);
    at = k === 1 && typer ? type(sv, typer, at) + 300 : at + (gaps[k - 1] || interval);
  }
}

/** Plays every [data-sv] scene once, when it comes into view. */
export function initStory(): void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        play(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll<HTMLElement>('[data-sv]').forEach((sv) => io.observe(sv));
}
