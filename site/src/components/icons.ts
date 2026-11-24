/**
 * Google Material Symbols (Rounded, weight 400), bundled as inline SVG so the site makes no
 * third-party requests. Source: @material-symbols/svg-400, Apache-2.0. Only these icons ship.
 */
import person from '@material-symbols/svg-400/rounded/person-fill.svg?raw';
import flight from '@material-symbols/svg-400/rounded/flight-fill.svg?raw';
import work from '@material-symbols/svg-400/rounded/work-fill.svg?raw';
import favorite from '@material-symbols/svg-400/rounded/favorite-fill.svg?raw';
import lock from '@material-symbols/svg-400/rounded/lock-fill.svg?raw';
// The check uses weight 700 so it stays legible inside small filled circles.
import check from '@material-symbols/svg-700/rounded/check.svg?raw';
import verifiedUser from '@material-symbols/svg-400/rounded/verified_user-fill.svg?raw';
import code from '@material-symbols/svg-400/rounded/code.svg?raw';
import redeem from '@material-symbols/svg-400/rounded/redeem-fill.svg?raw';
import arrowOutward from '@material-symbols/svg-400/rounded/arrow_outward.svg?raw';
import darkMode from '@material-symbols/svg-400/rounded/dark_mode-fill.svg?raw';
import lightMode from '@material-symbols/svg-400/rounded/light_mode-fill.svg?raw';
import fingerprint from '@material-symbols/svg-400/rounded/fingerprint.svg?raw';
import chevronRight from '@material-symbols/svg-400/rounded/chevron_right.svg?raw';
import verified from '@material-symbols/svg-400/rounded/verified-fill.svg?raw';
import restaurant from '@material-symbols/svg-400/rounded/restaurant.svg?raw';

const raw = {
  person,
  flight,
  work,
  favorite,
  lock,
  check,
  verified_user: verifiedUser,
  code,
  redeem,
  arrow_outward: arrowOutward,
  dark_mode: darkMode,
  light_mode: lightMode,
  fingerprint,
  chevron_right: chevronRight,
  verified,
  restaurant,
} as const;

export type IconName = keyof typeof raw;

/** Returns the symbol as an inline SVG string that inherits colour and takes its size from CSS. */
export function icon(name: IconName, cls = 'g'): string {
  return raw[name]
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace('<svg ', `<svg class="${cls}" aria-hidden="true" focusable="false" fill="currentColor" `);
}
