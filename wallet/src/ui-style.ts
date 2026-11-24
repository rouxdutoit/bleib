export const css = `
:root {
  color-scheme: light dark;
  --label: #000;
  --secondary-label: rgb(60 60 67 / .6);
  --secondary-text: rgb(60 60 67 / .76);
  --separator: rgb(60 60 67 / .29);
  --fill: rgb(118 118 128 / .12);
  --grouped: #F2F2F7;
  --cell: #fff;
  --control: #74747a;
  --accent: #0059be;
  --on-accent: #fff;
  --destructive: #a42017;
  --radius: 24px;
  font: 400 17px/22px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
  color: var(--label);
  background: var(--grouped);
}
@media (prefers-color-scheme: dark) {
  :root {
    --label: #fff;
    --secondary-label: rgb(235 235 245 / .6);
    --secondary-text: var(--secondary-label);
    --separator: rgb(84 84 88 / .65);
    --fill: rgb(118 118 128 / .24);
    --grouped: #000;
    --cell: #1C1C1E;
    --control: #898990;
    --accent: #9dcbff;
    --on-accent: #00244d;
    --destructive: #ff9d93;
  }
}
* { box-sizing: border-box; }
body { margin: 0; }
header { background: var(--cell); border-bottom: .5px solid var(--separator); }
header > div, main { max-width: 736px; margin: auto; padding-inline: 16px; }
main { padding-block: 24px 48px; }
h1, .widget-count { font-size: 34px; line-height: 41px; font-weight: 700; letter-spacing: -.025em; }
h1 { margin: 0 0 16px; }
h2, .approval-alert h1 { font-size: 22px; line-height: 28px; font-weight: 700; letter-spacing: -.015em; }
h2 { margin: 24px 0 8px; }
h3, strong, label, button, .brand { font-size: 17px; line-height: 22px; font-weight: 600; }
h3, p { margin: 0 0 8px; }
p:last-child { margin-bottom: 0; }
h1, h2, h3, p, a, button, dd, label { overflow-wrap: anywhere; }

a { color: var(--accent); text-underline-offset: .17em; }
nav ul { display: flex; flex-wrap: wrap; gap: 0 8px; }
nav ul, .group { list-style: none; margin: 0; padding: 0; }
nav a, .brand, .action-link { display: inline-flex; align-items: center; min-height: 44px; padding: 0 8px; }
nav a { font-size: 15px; line-height: 20px; text-decoration: none; }
nav a:hover, .brand:hover { text-decoration: underline; }
.brand { color: var(--label); text-decoration: none; padding-inline: 0; }
:where(a, button, input, textarea, select):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.row:focus-visible { outline-offset: -3px; }
.skip { position: fixed; inset: auto auto auto 16px; top: -80px; z-index: 1; }
.skip:focus { top: 8px; background: var(--cell); }

.card, .group, .widget, .notice, .approval-alert {
  background: var(--cell);
  border-radius: var(--radius);
  margin-block: 0 16px;
}
.card, .widget, .notice, .approval-alert, .cell { padding: 16px; }
.group > li + li { border-top: .5px solid var(--separator); }
.group .row { border-radius: 0; }
.group li:first-child .row { border-radius: var(--radius) var(--radius) 0 0; }
.group li:last-child .row { border-radius: 0 0 var(--radius) var(--radius); }
.group li:only-child .row { border-radius: var(--radius); }
.row {
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
  gap: 4px; padding: 8px 16px; min-height: 44px; color: var(--label); text-decoration: none;
}
.row:hover { background: var(--fill); }
.row:hover strong { text-decoration: underline; text-underline-offset: .17em; }
.secondary, dd { color: var(--secondary-text); font-size: 15px; line-height: 20px; }
time, .foot { color: var(--secondary-text); font-size: 13px; line-height: 18px; }
dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px 16px; margin: 0 0 16px; }
dt { font-weight: 600; }
dd { margin: 0; }
pre {
  background: var(--fill); padding: 16px; border-radius: 8px;
  white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; margin: 0 0 16px;
}
.card > :first-child, .widget > :first-child, .notice > :first-child, .approval-alert > :first-child { margin-top: 0; }

input, textarea, select, button { font-family: inherit; color: inherit; }
input:not([type=checkbox]):not([type=hidden]), textarea, select {
  display: block; width: 100%; min-height: 44px; margin: 4px 0 16px;
  border: 1px solid var(--control); border-radius: 8px; padding: 8px;
  background: var(--cell); font-size: 17px; line-height: 22px;
}
input::placeholder { color: var(--secondary-text); opacity: 1; }
textarea { resize: vertical; }
.check { display: flex; align-items: center; gap: 8px; min-height: 44px; margin-bottom: 8px; }
.check input { width: 20px; height: 20px; flex: none; margin: 0; accent-color: var(--accent); }
button {
  min-height: 44px; min-width: 44px; padding: 8px 16px; border-radius: 999px; border: 0;
  background: var(--fill); color: var(--label); cursor: pointer; text-align: center;
}
button:hover { text-decoration: underline; text-underline-offset: .17em; }
button.primary { background: var(--accent); color: var(--on-accent); }
button.destructive { color: var(--destructive); }
.actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.actions form { display: contents; }
.actions .action-link { padding-inline: 16px; }
.approval-alert {
  max-width: 440px; padding: 24px; border-radius: 32px;
  margin: 16px auto 0; border: .5px solid var(--separator);
}
.approval-alert h1 { text-align: center; }
.approval-alert dl { grid-template-columns: minmax(104px, 1fr) minmax(0, 1.6fr); }
.approval-alert h2 { font-size: 17px; line-height: 22px; font-weight: 600; }
.approval-alert pre { border-radius: 16px; }
.approval-alert .actions { display: grid; }
.widget { max-width: 432px; }
.widget-count { margin-bottom: 8px; }
.widget-count span { font-size: 22px; line-height: 28px; color: var(--secondary-label); }

.filters { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }
.filters select { margin-bottom: 0; }
.receipt-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
.receipt-row strong { grid-column: 1; }
.receipt-row time { grid-column: 2; grid-row: 1; text-align: right; }
.receipt-row span { grid-column: 1 / -1; overflow-wrap: anywhere; }
@media (max-width: 420px) {
  .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filters button { justify-self: start; }
  .receipt-row { grid-template-columns: minmax(0, 1fr); }
  .receipt-row time { grid-column: 1; grid-row: auto; text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
}
`;
