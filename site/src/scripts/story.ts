/**
 * Plays each scene's card morph once, when the scene comes into view: data-step="n" plus
 * cumulative classes s1..sn (see StoryVisual.astro, Hero.astro and Finale.astro).
 * A [data-type] element is typed out at step 1, and the first gap starts once typing ends.
 * data-start sets the pause before step 1 and data-gaps="a,b,…" the pause after each step (ms): long enough
 * to read what is on screen (about 0.25 s a word), while each transition itself stays quick.
 * [data-scramble-at="n"] text scrambles at step n, like fazit.dev's wordmark in reverse: each character
 * cycles through glyphs, then settles on its character of data-cipher (how it reads without the key).
 * data-sv="scroll" waits for the person's first scroll before playing (the hero, which is in view on arrival).
 * With reduced motion the final state shows at once.
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
    const swap = now - last > 42;
    if (swap) last = now;
    let done = 0;
    chars.forEach((ch, i) => {
      const from = i * 18;
      if (ch.classList.contains('ct')) done += 1;
      else if (elapsed >= from + 260 && ch.dataset.g) {
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
  let at = Number(sv.dataset.start ?? START);
  for (let k = 1; k <= steps; k++) {
    later(sv, () => setStep(sv, k), at);
    at = k === 1 && typer ? type(sv, typer, at) + (gaps[0] || 300) : at + (gaps[k - 1] || interval);
  }
}

const heightOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).height) || 0;

/** A scene's height once it has played: its last step and typed text, measured without transitions. */
const finalHeight = (sv: HTMLElement): number => {
  const { hidden, className } = sv;
  const typer = sv.querySelector<HTMLElement>('[data-type]');
  const typed = typer?.textContent ?? '';
  sv.hidden = false;
  sv.classList.add('measuring');
  for (let k = 1; k <= Number(sv.dataset.steps ?? '0'); k++) sv.classList.add(`s${k}`);
  if (typer) typer.textContent = typer.dataset.type ?? '';
  const height = heightOf(sv);
  sv.className = `${className} measuring`;
  if (typer) typer.textContent = typed;
  sv.hidden = hidden;
  void sv.offsetHeight; // settle the current state before transitions return, so nothing animates back
  sv.classList.remove('measuring');
  return height;
};

/**
 * Reserves the space each scene needs once it has played, so the page around it never moves.
 * A scene inside a [data-frame] lets the frame hold the space and grows within it (the closer's window);
 * otherwise the scene holds its own finished height. Scenes that share a parent (the hero's tabs) all hold
 * the tallest one's height, so switching tabs doesn't move the page either.
 */
const reserve = () => {
  const groups = new Map<HTMLElement, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>('[data-steps]').forEach((sv) => {
    const key = sv.closest<HTMLElement>('[data-frame]') ?? sv.parentElement ?? sv;
    groups.set(key, [...(groups.get(key) ?? []), sv]);
  });
  groups.forEach((scenes, key) => {
    const framed = key.hasAttribute('data-frame');
    const holders = framed ? [key] : scenes;
    holders.forEach((el) => (el.style.minHeight = ''));
    const shown = scenes.find((sv) => !sv.hidden) ?? scenes[0];
    const around = framed ? heightOf(key) - heightOf(shown) : 0;
    const height = `${Math.ceil(around + Math.max(...scenes.map(finalHeight)))}px`;
    holders.forEach((el) => (el.style.minHeight = height));
  });
};

/** Plays every [data-sv] scene once, when it comes into view (and, for data-sv="scroll", once the page has scrolled). */
export function initStory(): void {
  reserve();
  document.fonts.ready.then(reserve);
  let width = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    reserve();
  }, { passive: true });
  const scenes = document.querySelectorAll<HTMLElement>('[data-sv]');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scenes.forEach(play);
    return;
  }
  scenes.forEach((sv) => sv.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = '')));
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
