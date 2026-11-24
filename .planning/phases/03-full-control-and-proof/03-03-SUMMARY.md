# Plan 03-03 — Review queue and wallet interface

Implemented in `a28d242`.

- The owner can save, edit or dismiss a suggested note. Pasted ChatGPT and Claude memories use the same queue and retain provided provenance. All saved proposals start private, including when an agent already has a grant for that kind.
- The local wallet uses inset grouped lists, an approval alert with capsule actions, notification-style receipts and a weekly widget. Reduced motion and light and dark themes follow browser settings.
- Chromium exercised nine views at each of 360 and 1280 px in light and dark mode. It checked keyboard navigation, the theme colors, approval labels and target size, filters, export, editing, proposal review and revocation. All 36 axe scans passed with zero violations.
