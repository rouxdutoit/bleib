/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro, Hero.astro and Finale.astro).
 * A [data-type] element is typed out at step 1, and the first gap starts once typing ends.
 * data-start sets the pause before step 1 and data-gaps="a,b,…" the pause after each step (ms): long enough
 * to read what is on screen (about 0.25 s a word), while each transition itself stays quick.
 * data-sv="scroll" waits for the person's first scroll before playing (the hero, which is in view on arrival).
 * Each headline symbol ([data-fx]) plays its effect once, as it comes into view (StoryScene.astro).
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
    sv.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = el.dataset.type ?? ''));
    setStep(sv, steps);
    return;
  }
  const interval = Number(sv.dataset.interval ?? STEP);
  const gaps = (sv.dataset.gaps ?? '').split(',').map(Number);
  const typer = sv.querySelector<HTMLElement>('[data-type]');
  let at = Number(sv.dataset.start ?? START);
  for (let k = 1; k <= steps; k++) {
    later(sv, () => setStep(sv, k), at);
    at = k === 1 && typer ? type(sv, typer, at) + (gaps[0] || 300) : at + (gaps[k - 1] || interval);
  }
}

/** Plays every [data-sv] scene once, when it comes into view (and, for data-sv="scroll", once the page has scrolled). */
export function initStory(): void {
  const scenes = document.querySelectorAll<HTMLElement>('[data-sv]');
  const symbols = document.querySelectorAll<HTMLElement>('[data-fx]');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scenes.forEach(play);
    symbols.forEach((el) => el.classList.add('on'));
    return;
  }
  const seen = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      seen.unobserve(e.target);
    }),
    { rootMargin: '0px 0px -12% 0px', threshold: 1 },
  );
  symbols.forEach((el) => seen.observe(el));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sv = e.target as HTMLElement;
        io.unobserve(sv);
        if (timers.has(sv)) continue;
        if (sv.dataset.sv !== 'scroll' || window.scrollY > 0) play(sv);
        else window.addEventListener('scroll', () => !sv.hidden && !timers.has(sv) && play(sv), { once: true, passive: true });
      }
    },
    { threshold: 0.6 },
  );
  scenes.forEach((sv) => io.observe(sv));
}
