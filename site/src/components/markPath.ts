/** The bleib mark: the speech-bubble box (with its edge line) and its two eyes, drawn in an 80 × 90 box. */
export const MARK_BODY =
  'M34.2 4.4C37.8 2.3 42.2 2.3 45.8 4.4L68.4 17.4C74.3 20.8 78 27.2 78 34V55.5C78 62.3 74.3 68.6 68.4 72L45 85.5C41.4 87.6 37 87.6 33.4 85.5L29 83 17 86.2C14.8 86.8 12.8 84.6 13.5 82.5L16 75.5 11.6 73C5.7 69.6 2 63.3 2 56.5V35C2 28.2 5.7 21.9 11.6 18.5ZM38.1 42.6 64 27.6C64.7 27.2 65.6 27.5 66 28.2S66.1 29.8 65.4 30.2L40.3 44.7V74C40.3 74.8 39.6 75.5 38.8 75.5S37.3 74.8 37.3 74V44C37.3 43.4 37.6 42.9 38.1 42.6Z';
/** The eyes are holes in the body; kept apart so the closer can make them blink (Finale.astro). */
export const MARK_EYES = [
  'M49.4 46.2C47.2 47.5 46 49.8 46 52.3V59.3C46 61.8 48.7 63.3 50.8 62.1 53 60.8 54.2 58.5 54.2 56V49C54.2 46.5 51.5 45 49.4 46.2Z',
  'M64.1 37.7C61.9 39 60.7 41.3 60.7 43.8V50.8C60.7 53.3 63.4 54.8 65.5 53.6 67.7 52.3 68.9 50 68.9 47.5V40.5C68.9 38 66.2 36.5 64.1 37.7Z',
] as const;
export const MARK_PATH = MARK_BODY + MARK_EYES.join('');
export const MARK_VIEWBOX = "0 0 80 90";
