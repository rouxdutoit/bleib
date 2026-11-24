/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro, Hero.astro and Finale.astro).
 * A [data-type] element inside a scene is typed out at step 1, and later steps wait for it.
 * data-gaps="a,b,…" sets the pause after each step (ms), so a reader can finish before the next change.
 * [data-scramble-at="n"] text scrambles at step n, like fazit.dev's wordmark in reverse: each character
 * cycles through glyphs, then settles on its character of data-cipher (the same text, encrypted).
 * data-sv="scroll" waits for the person's first scroll before playing (the hero, which is in view on arrival).
 * With reduced motion the final state shows at once.
 */
const START = 500;
const STEP = 900;

const GLYPHS = '-_/\\|<>~^*+=:;!?#%&@0123456789';
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** Cycles each character of el through glyphs, left to right, until it settles on its ciphertext character. */
const scramble = (el: HTMLElement) => {
  const text = (el.dataset.text ??= el.textContent ?? '');
  const cipher = [...(el.dataset.cipher ?? '')];
  const chars = [...text].map((c) => Object.assign(document.createElement('span'), { className: 'ch', textContent: c }));
  el.replaceChildren(...chars);
  const settle = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
  let start = 0;
  let last = 0;
  const frame = (now: number) => {
    start ||= now;
    const swap = now - last > 42;
    if (swap) last = now;
    let done = 0;
    chars.forEach((ch, i) => {
      const from = i * 18 * settle;
      if (ch.classList.contains('ct')) done += 1;
      else if (now - start >= from + 260 * settle && ch.dataset.g) {
        ch.className = 'ch ct';
        ch.textContent = cipher[i] ?? '';
        done += 1;
      } else if (now - start >= from && (swap || !ch.dataset.g)) {
        ch.classList.add('sg');
        ch.dataset.g = glyph();
      }
    });
    if (done < chars.length) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

const setStep = (sv: HTMLElement, n: number) => {
  sv.dataset.step = String(n);
  for (let k = 1; k <= 6; k++) sv.classList.toggle(`s${k}`, k <= n);
  sv.querySelectorAll<HTMLElement>('[data-scramble-at]').forEach((el) => {
    if (Number(el.dataset.scrambleAt) <= n) {
      if (!el.querySelector('.ch')) scramble(el);
    } else if (el.dataset.text) el.textContent = el.dataset.text;
  });
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

/** Plays every [data-sv] scene once, when it comes into view (and, for data-sv="scroll", once the page has scrolled). */
export function initStory(): void {
  const scenes = document.querySelectorAll<HTMLElement>('[data-sv]');
  scenes.forEach((sv) => sv.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = '')));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sv = e.target as HTMLElement;
        io.unobserve(sv);
        if (sv.dataset.sv !== 'scroll' || window.scrollY > 0) play(sv);
        else window.addEventListener('scroll', () => !sv.hidden && sv.dataset.step === '0' && play(sv), { once: true, passive: true });
      }
    },
    { threshold: 0.6 },
  );
  scenes.forEach((sv) => io.observe(sv));
}
