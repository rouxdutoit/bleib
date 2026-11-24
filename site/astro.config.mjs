// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bleib.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  image: { responsiveStyles: false },
});
