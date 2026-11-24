/**
 * Plays each scene's card morph once, when the scene comes into view, then offers Replay.
 * Steps are applied as data-step="n" plus cumulative classes s1..sn (see StoryVisual.astro).
 * With reduced motion, the final state is shown at once.
 */
const START = 500;
const STEP = 900;

export function initStory(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visuals = Array.from(document.querySelectorAll<HTMLElement>('[data-sv]'));

  visuals.forEach((sv) => {
    const steps = Number(sv.dataset.steps ?? '0');
    let timers: number[] = [];

    const setStep = (n: number) => {
      sv.dataset.step = String(n);
      for (let k = 1; k <= 6; k++) sv.classList.toggle(`s${k}`, k <= n);
    };
    const clear = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
    };
    const finish = () => {
      setStep(steps);
      sv.classList.add('done');
    };
    const play = () => {
      clear();
      sv.classList.remove('done');
      if (reduce.matches) {
        finish();
        return;
      }
      setStep(0);
      for (let k = 1; k <= steps; k++) {
        timers.push(window.setTimeout(() => setStep(k), START + (k - 1) * STEP));
      }
      timers.push(window.setTimeout(() => sv.classList.add('done'), START + steps * STEP));
    };

    sv.querySelector<HTMLButtonElement>('[data-replay]')?.addEventListener('click', play);

    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !played) {
            played = true;
            play();
            io.disconnect();
          }
        }
      },
      { threshold: 0.6 },
    );
    io.observe(sv);
  });
}
