/**
 * Sticky story stage: the frame nearest the viewport centre picks the active scene.
 * The stage card swaps sides, crossfades to the scene's visual and plays its small animation.
 */
export function initStory(): void {
  const story = document.querySelector<HTMLElement>('[data-story]');
  if (!story) return;
  const stageCard = story.querySelector<HTMLElement>('.stage-card');
  const slots = Array.from(story.querySelectorAll<HTMLElement>('[data-slot]'));
  const frames = Array.from(story.querySelectorAll<HTMLElement>('[data-frame]'));
  const pauseBtn = story.querySelector<HTMLButtonElement>('[data-pause]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let paused = reduce.matches;
  let provTimer = 0;

  const stopProviders = () => {
    if (provTimer) window.clearInterval(provTimer);
    provTimer = 0;
  };

  const startProviders = (slot: HTMLElement) => {
    stopProviders();
    const provs = Array.from(slot.querySelectorAll<HTMLElement>('[data-prov]'));
    if (provs.length === 0) return;
    let i = 0;
    provs.forEach((p, n) => p.classList.toggle('on', n === 0));
    if (paused) return;
    provTimer = window.setInterval(() => {
      provs[i].classList.remove('on');
      i = (i + 1) % provs.length;
      provs[i].classList.add('on');
    }, 1600);
  };

  const play = (slot: HTMLElement) => {
    slot.classList.remove('is-playing', 'is-final');
    if (paused) {
      slot.classList.add('is-final');
    } else {
      // Restart the transition sequence.
      void slot.offsetWidth;
      slot.classList.add('is-playing');
    }
    startProviders(slot);
  };

  const activate = (i: number) => {
    if (i === active || i < 0) return;
    active = i;
    slots.forEach((s, n) => {
      s.classList.toggle('active', n === i);
      if (n !== i) s.classList.remove('is-playing', 'is-final');
    });
    if (stageCard) stageCard.dataset.side = i % 2 === 0 ? 'right' : 'left';
    play(slots[i]);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activate(Number((e.target as HTMLElement).dataset.frame));
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  frames.forEach((f) => io.observe(f));

  const visible = new IntersectionObserver(
    (entries) => {
      for (const e of entries) story.classList.toggle('in-view', e.isIntersecting);
    },
    { rootMargin: '-40% 0px -40% 0px' },
  );
  visible.observe(story);

  const setPaused = (p: boolean) => {
    paused = p;
    story.classList.toggle('is-paused', p);
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-label', (p ? pauseBtn.dataset.labelPlay : pauseBtn.dataset.labelPause) ?? '');
    }
    if (active >= 0) play(slots[active]);
  };
  pauseBtn?.addEventListener('click', () => setPaused(!paused));
  reduce.addEventListener('change', () => setPaused(reduce.matches));
  if (paused) story.classList.add('is-paused');

  activate(0);
}
