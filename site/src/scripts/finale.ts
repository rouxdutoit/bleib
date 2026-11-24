/** "Put it all in your wallet": drag chips (mouse/touch) or press them (keyboard) to drop them in. */
export function initFinale(): void {
  const play = document.querySelector<HTMLElement>('[data-play]');
  if (!play) return;
  const area = play.querySelector<HTMLElement>('[data-area]');
  const wallet = play.querySelector<HTMLElement>('[data-wallet]');
  const countEl = play.querySelector<HTMLElement>('[data-count]');
  const prompt = play.querySelector<HTMLElement>('.prompt');
  const allIn = play.querySelector<HTMLButtonElement>('[data-all-in]');
  const reset = play.querySelector<HTMLButtonElement>('[data-reset]');
  const chips = Array.from(play.querySelectorAll<HTMLButtonElement>('[data-chip]'));
  if (!area || !wallet || !countEl || !prompt || !allIn || !reset) return;
  const total = chips.length;
  const tpl = play.dataset.countTpl ?? '{n}/{total}';

  const render = () => {
    const n = chips.filter((c) => c.classList.contains('in')).length;
    countEl.textContent = tpl.replace('{n}', String(n)).replace('{total}', String(total));
    reset.hidden = n === 0;
    allIn.hidden = n === total;
    prompt.textContent = n === total ? (prompt.dataset.doneText ?? '') : (prompt.dataset.promptText ?? '');
  };

  const putIn = (chip: HTMLButtonElement) => {
    if (chip.classList.contains('in')) return;
    const c = chip.getBoundingClientRect();
    const w = wallet.getBoundingClientRect();
    const dx = Number.parseFloat(chip.style.getPropertyValue('--dx')) || 0;
    const dy = Number.parseFloat(chip.style.getPropertyValue('--dy')) || 0;
    chip.style.setProperty('--tx', `${dx + w.left + w.width / 2 - (c.left + c.width / 2)}px`);
    chip.style.setProperty('--ty', `${dy + w.top + w.height / 2 - (c.top + c.height / 2)}px`);
    chip.classList.add('in');
    chip.tabIndex = -1;
    wallet.classList.add('hot');
    window.setTimeout(() => wallet.classList.remove('hot'), 250);
    render();
    const next = chips.find((x) => !x.classList.contains('in'));
    if (document.activeElement === chip) (next ?? reset).focus();
  };

  chips.forEach((chip) => {
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let moved = false;
    let pid = -1;

    chip.addEventListener('pointerdown', (e) => {
      if (chip.classList.contains('in')) return;
      pid = e.pointerId;
      chip.setPointerCapture(pid);
      startX = e.clientX;
      startY = e.clientY;
      baseX = Number.parseFloat(chip.style.getPropertyValue('--dx')) || 0;
      baseY = Number.parseFloat(chip.style.getPropertyValue('--dy')) || 0;
      moved = false;
      chip.classList.add('dragging');
    });
    chip.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      chip.style.setProperty('--dx', `${baseX + dx}px`);
      chip.style.setProperty('--dy', `${baseY + dy}px`);
      const w = wallet.getBoundingClientRect();
      wallet.classList.toggle('hot', e.clientX > w.left && e.clientX < w.right && e.clientY > w.top && e.clientY < w.bottom);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      chip.classList.remove('dragging');
      const w = wallet.getBoundingClientRect();
      const over = e.clientX > w.left && e.clientX < w.right && e.clientY > w.top && e.clientY < w.bottom;
      wallet.classList.remove('hot');
      if (over) putIn(chip);
      else if (!moved) putIn(chip); // a plain tap or click also puts it in
    };
    chip.addEventListener('pointerup', end);
    chip.addEventListener('pointercancel', (e) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      chip.classList.remove('dragging');
    });
    // Keyboard (Enter/Space) produces a click without pointer events.
    chip.addEventListener('click', (e) => {
      if ((e as MouseEvent).detail === 0) putIn(chip);
    });
  });

  allIn.addEventListener('click', () => {
    chips.forEach((c, i) => window.setTimeout(() => putIn(c), i * 60));
    window.setTimeout(() => reset.focus(), chips.length * 60 + 50);
  });

  reset.addEventListener('click', () => {
    chips.forEach((c) => {
      c.classList.remove('in');
      c.style.removeProperty('--dx');
      c.style.removeProperty('--dy');
      c.style.removeProperty('--tx');
      c.style.removeProperty('--ty');
      c.tabIndex = 0;
    });
    render();
    chips[0]?.focus();
  });

  render();
}
