const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initEarlyAccess(): void {
  document.querySelectorAll<HTMLFormElement>('[data-early-access]').forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    const input = form.querySelector<HTMLInputElement>('input[name="email"]');
    const status = form.querySelector<HTMLElement>('.ea-status');
    const message = status?.querySelector<HTMLElement>('.ea-msg');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const buttonLabel = button?.querySelector<HTMLElement>('.ea-label');
    if (!input || !status || !message || !button || !buttonLabel) return;
    const label = buttonLabel.textContent ?? '';

    const say = (msg: string, ok = false) => {
      message.textContent = msg;
      status.classList.toggle('ok', ok);
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = input.value.trim();
      if (!EMAIL.test(email) || email.length > 254) {
        input.setAttribute('aria-invalid', 'true');
        say(form.dataset.msgInvalid ?? '');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      button.disabled = true;
      buttonLabel.textContent = form.dataset.msgSending ?? label;
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          form.classList.add('is-done');
          say(form.dataset.msgSuccess ?? '', true);
        } else if (res.status === 429) {
          say(form.dataset.msgRate ?? '');
        } else if (res.status === 400) {
          input.setAttribute('aria-invalid', 'true');
          say(form.dataset.msgInvalid ?? '');
        } else {
          say(form.dataset.msgError ?? '');
        }
      } catch {
        say(form.dataset.msgError ?? '');
      } finally {
        button.disabled = false;
        buttonLabel.textContent = label;
      }
    });
  });
}
