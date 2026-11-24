// SPDX-License-Identifier: AGPL-3.0-or-later
import type { APIRoute } from 'astro';
import { renderIndex } from '../../scripts/llms';

export const GET: APIRoute = ({ site, url }) => new Response(renderIndex(site ?? url), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
