// SPDX-License-Identifier: AGPL-3.0-or-later
import type { APIRoute } from 'astro';
import { renderFullText } from '../../scripts/llms';

// Bunny serves .txt as text/plain without a charset, so a byte-order mark tells browsers this is UTF-8.
export const GET: APIRoute = ({ site, url }) => new Response('\uFEFF' + renderFullText(site ?? url), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
