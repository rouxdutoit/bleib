import type { IncomingMessage, ServerResponse } from 'node:http';
import { equal, labels, secret, UserError } from './domain.js';
import { body, redirect, text, typeIs } from './http.js';
import type { Wallet } from './wallet.js';

export const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const css = `
:root{font:100%/1.6 system-ui,sans-serif;color:#242018;background:#f7f4ea}
*{box-sizing:border-box}body{margin:auto;max-width:54rem;padding:1rem 1.3rem 3rem}
header{border-bottom:1px solid #9a8a5d;padding:.7rem 0}a{color:#264d37}
a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #285d45;outline-offset:4px}
button,input,textarea,select{font:inherit;color:inherit}button{background:#f6e79a;border:1px solid #594c24;border-radius:.3rem;padding:.35rem .75rem;cursor:pointer}
button:hover{background:#f5db73}input:not([type=checkbox]):not([type=radio]),textarea,select{display:block;background:#fffdf7;border:1px solid #73664a;border-radius:.25rem;padding:.45rem;width:100%;margin-bottom:1rem}
pre{background:#fffdf7;border:1px solid #9a8a5d;border-radius:.3rem;padding:1rem;white-space:pre-wrap;overflow-wrap:anywhere}
nav ul{display:flex;gap:.5rem 1rem;flex-wrap:wrap;list-style:none;padding:0;margin:.3rem 0}
li{margin:.35rem 0}fieldset{border:1px solid #9a8a5d;margin:1rem 0;padding:1rem}
fieldset label{display:block;margin:.45rem 0}.notice{border-left:4px solid #825630;padding:.3rem .8rem}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem}dd{margin:0;overflow-wrap:anywhere}
.skip{position:absolute;top:-5rem}.skip:focus{top:0;background:#fffdf7;padding:.5rem;z-index:1}
`;

function page(res: ServerResponse, title: string, fragment: string, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · bleib</title><link rel="stylesheet" href="/style.css"><a class="skip" href="#main">Skip to content</a><header><a href="/">bleib</a><nav aria-label="Wallet"><ul><li><a href="/approvals">Requests</a></li></ul></nav></header><main id="main" tabindex="-1"><h1>${escape(title)}</h1>${fragment}</main></html>`);
}

const sessionCookie = 'bleib_session';
const sessionLife = 30 * 60 * 1000;
interface Session { csrf: string; owner: boolean; expires: number }
const field = (session: Session) => `<input type="hidden" name="csrf" value="${session.csrf}">`;

export class Browser {
  private sessions = new Map<string, Session>();

  constructor(private wallet: Wallet, private origin: string) {}

  clear() {
    this.sessions.clear();
  }

  private getSession(req: IncomingMessage) {
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value =>
      value.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
    const session = cookie && this.sessions.get(cookie);
    if (!session || session.expires <= Date.now()) return undefined;
    return session;
  }

  private createSession(res: ServerResponse, owner: boolean) {
    for (const [id, session] of this.sessions) {
      if (session.expires <= Date.now()) this.sessions.delete(id);
    }
    if (this.sessions.size >= 128) {
      const guest = [...this.sessions].find(([, session]) => !session.owner);
      if (guest) this.sessions.delete(guest[0]);
      else throw new UserError('Close an unused browser session and try again.');
    }
    const id = secret();
    const session = { csrf: secret(), owner, expires: Date.now() + sessionLife };
    this.sessions.set(id, session);
    res.setHeader('Set-Cookie', `${sessionCookie}=${id}; Path=/; HttpOnly; SameSite=Strict`);
    return session;
  }

  async handle(req: IncomingMessage, res: ServerResponse, path: string) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'GET' && path === '/style.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      return res.end(css);
    }
    if (req.method !== 'GET' && req.method !== 'POST') return text(res, 405, 'Method not allowed.');

    const approvalId = /^\/approvals\/([0-9a-f-]{36})$/.exec(path)?.[1];
    if (path !== '/' && path !== '/approvals' && !approvalId) {
      return page(res, 'Page not found', '<p>Choose a page from the menu.</p>', 404);
    }

    try {
      if (req.method === 'POST') {
        if (req.headers.origin !== this.origin || !typeIs(req, 'application/x-www-form-urlencoded')) {
          return text(res, 403, 'This request was blocked.');
        }
        const form = new URLSearchParams(await body(req));
        const session = this.getSession(req);
        if (!session || !equal(form.get('csrf') ?? '', session.csrf)) return text(res, 403, 'This request was blocked.');
        if (form.get('action') === 'unlock') {
          await this.wallet.unlock(form.get('passphrase') ?? '');
          this.createSession(res, true);
          return redirect(res, path);
        }
        if (!session.owner) return text(res, 403, 'Unlock the wallet first.');
        if (approvalId && form.get('action') === 'approve') {
          const choice = form.get('choice');
          if (choice !== 'once' && choice !== 'always' && choice !== 'no') throw new UserError('Choose a decision.');
          await this.wallet.approve(approvalId, choice, form.get('confirmed') === 'yes');
          return redirect(res, '/approvals');
        }
        return text(res, 405, 'Method not allowed.');
      }

      let session = this.getSession(req);
      if (!session?.owner || !(await this.wallet.ownerStatus()).unlocked) {
        session = !session || session.owner ? this.createSession(res, false) : session;
        return page(res, 'Unlock your wallet', `<form method="post">${field(session)}
<input type="hidden" name="action" value="unlock"><label for="passphrase">Passphrase</label>
<input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required><button>Unlock</button></form>`);
      }

      const pending = await this.wallet.approvals();
      if (approvalId) {
        const approval = pending.find(item => item.id === approvalId);
        if (!approval) return page(res, 'Request unavailable', '<p>This request has expired or already has a decision.</p>', 404);
        const sensitive = approval.needed.some(kind => approval.sensitiveKinds.includes(kind));
        return page(res, 'Review a sharing request', `
<dl><dt>Agent</dt><dd>${escape(approval.agentName)}</dd><dt>Destination</dt><dd>${escape(approval.destination.value)} (declared)${approval.destination.model ? ` · ${escape(approval.destination.model)}` : ''}</dd><dt>Purpose</dt><dd>${escape(approval.ask.purpose)}</dd><dt>Information</dt><dd>${approval.ask.kinds.map(kind => escape(labels[kind])).join(', ')}</dd></dl>
<h2>What the agent would receive</h2>${approval.content ? `<pre>${escape(approval.content)}</pre>` : '<p>No matching excerpt.</p>'}
<form method="post">${field(session)}<input type="hidden" name="action" value="approve">
<fieldset><legend>Choose access</legend>
<label><input type="radio" name="choice" value="once" ${sensitive ? 'checked' : ''} required> Allow once</label>
<label><input type="radio" name="choice" value="always"> Always for this agent</label>
<label><input type="radio" name="choice" value="no"> No</label>
${sensitive ? '<label><input type="checkbox" name="confirmed" value="yes"> I confirm ongoing access to sensitive information for this purpose and destination.</label>' : ''}
</fieldset><button>Save decision</button></form>`);
      }
      return page(res, 'Sharing requests', pending.length ?
        `<ul>${pending.map(item => `<li><a href="/approvals/${item.id}">${escape(item.agentName)} · ${escape(item.ask.purpose)}</a></li>`).join('')}</ul>`
        : '<p>No requests are waiting.</p>');
    } catch (error) {
      if (error instanceof UserError) return page(res, 'Could not complete that step',
        `<p class="notice" role="alert">${escape(error.message)}</p><p><a href="${path}">Try again</a></p>`, 400);
      throw error;
    }
  }
}
