// SPDX-License-Identifier: AGPL-3.0-or-later
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => new Response(`User-agent: *
Allow: /

User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Allow: /

Sitemap: ${new URL('/sitemap.xml', site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
