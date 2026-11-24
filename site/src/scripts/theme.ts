const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

function isDark(): boolean {
  const set = root.getAttribute('data-theme');
  if (set === 'dark') return true;
  if (set === 'light') return false;
  return media.matches;
}

function sync(): void {
  const dark = isDark();
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', (dark ? btn.dataset.labelLight : btn.dataset.labelDark) ?? '');
  });
}

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('bleib-theme', next);
    } catch {
      /* storage unavailable: the choice lasts for this page only */
    }
    sync();
  });
});

media.addEventListener('change', sync);
sync();
