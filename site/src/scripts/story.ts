/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro, Hero.astro and Finale.astro).
 * A [data-type] element is typed out at step 1 (or at step n with data-type-at="n"), and that step's gap starts
 * once typing ends.
 * data-start sets the pause before step 1 and data-gaps="a,b,…" the pause after each step (ms): long enough
 * to read what is on screen (about 0.25 s a word), while each transition itself stays quick.
 * data-sv="hero" waits for the visitor's first scroll (the hero is usually in view on arrival), then plays once a
 * third of it is in view; choosing one of its tabs plays it at once. The hero is served finished, so it reads without JavaScript; an inline
 * script in Hero.astro puts it back to step 0 before the first paint when motion is allowed.
 * Each headline symbol ([data-fx]) plays its effect once, as it comes into view (StoryScene.astro).
 * With reduced motion the final state shows at once, and if reduced motion is turned on while a scene is playing,
 * every scene jumps to its final state.
 */
const START = 500;
const STEP = 900;

const GLYPHS = '-_/\\|<>~^*+=:;!?#%&@0123456789';
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** Lets a character's space grow or shrink without shifting the rest of the line at once. */
const setChar = (ch: HTMLElement, className: string, text: string) => {
  const width = getComputedStyle(ch).width;
  ch.getAnimations().forEach((animation) => animation.cancel());
  ch.className = className;
  ch.textContent = text;
  const nextWidth = getComputedStyle(ch).width;
  if (width !== nextWidth) ch.animate({ width: [width, nextWidth] }, { duration: 140, easing: 'ease-out' });
};

/** Cycles each character of el through glyphs, left to right, until it settles on its data-cipher character. */
const scramble = (el: HTMLElement) => {
  const text = [...(el.dataset.text ??= el.textContent ?? '')];
  const cipher = [...(el.dataset.cipher ?? '')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chars = Array.from({ length: reduced ? cipher.length : Math.max(text.length, cipher.length) }, (_, i) =>
    Object.assign(document.createElement('span'), { className: reduced ? 'ch ct' : 'ch', textContent: (reduced ? cipher : text)[i] ?? '' }),
  );
  el.replaceChildren(...chars);
  if (reduced || !chars.length) return;
  let start = 0;
  let last = 0;
  const frame = (now: number) => {
    if (chars[0].parentElement !== el) return;
    start ||= now;
    const elapsed = now - start;
    const swap = now - last > 75;
    if (swap) last = now;
    let done = 0;
    chars.forEach((ch, i) => {
      const from = i * 45;
      if (ch.classList.contains('ct')) done += 1;
      else if (elapsed >= from + 700 && ch.dataset.g) {
        setChar(ch, 'ch ct', cipher[i] ?? '');
        done += 1;
      } else if (elapsed >= from && (swap || !ch.dataset.g)) {
        if (i < text.length) ch.classList.add('sg');
        else if (!ch.dataset.g) setChar(ch, 'ch sg', cipher[i] ?? '');
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
    } else if (el.dataset.text !== undefined) el.textContent = el.dataset.text;
  });
};

const timers = new WeakMap<HTMLElement, number[]>();
/** Scenes that have started playing, so a change to reduced motion can finish them. */
const started = new Set<HTMLElement>();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

/** Shows a scene in its final state at once and cancels anything still scheduled. */
export function finish(sv: HTMLElement): void {
  reset(sv);
  sv.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = el.dataset.type ?? ''));
  setStep(sv, Number(sv.dataset.steps ?? '0'));
}

/** Plays a scene from the start (or shows it finished, with reduced motion). */
export function play(sv: HTMLElement): void {
  started.add(sv);
  if (motion.matches) {
    finish(sv);
    return;
  }
  reset(sv);
  const steps = Number(sv.dataset.steps ?? '0');
  const interval = Number(sv.dataset.interval ?? STEP);
  const gaps = (sv.dataset.gaps ?? '').split(',').map(Number);
  const typer = sv.querySelector<HTMLElement>('[data-type]:not([data-type-at])');
  let at = Number(sv.dataset.start ?? START);
  for (let k = 1; k <= steps; k++) {
    later(sv, () => setStep(sv, k), at);
    const atStep = [...sv.querySelectorAll<HTMLElement>(`[data-type-at="${k}"]`)];
    if (k === 1 && typer) at = type(sv, typer, at) + (gaps[0] || 300);
    else if (atStep.length) at = Math.max(...atStep.map((el) => type(sv, el, at))) + (gaps[k - 1] || 600);
    else at += gaps[k - 1] || interval;
  }
}

// Reduced motion turned on mid-sequence: every scene that has started jumps to its end, and symbols stop where they end.
motion.addEventListener('change', () => {
  if (!motion.matches) return;
  started.forEach(finish);
  document.querySelectorAll<HTMLElement>('[data-fx]').forEach((el) => el.classList.add('on'));
});

/** Plays every [data-sv] scene once, when it comes into view (the hero, data-sv="hero", after the first scroll). */
export function initStory(): void {
  const scenes = document.querySelectorAll<HTMLElement>('[data-sv]');
  const symbols = document.querySelectorAll<HTMLElement>('[data-fx]');
  if (motion.matches) {
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
  const onView = (threshold: number) => new IntersectionObserver(
    (entries, io) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sv = e.target as HTMLElement;
        io.unobserve(sv);
        if (!started.has(sv)) play(sv);
      }
    },
    { threshold },
  );
  const io = onView(0.6);
  const hero = onView(0.33);
  scenes.forEach((sv) => {
    if (sv.dataset.sv !== 'hero') return io.observe(sv);
    // The hero waits for the first scroll, so it plays while the visitor is looking, not before.
    if (window.scrollY > 0) return hero.observe(sv);
    window.addEventListener('scroll', () => hero.observe(sv), { once: true, passive: true });
  });
}
