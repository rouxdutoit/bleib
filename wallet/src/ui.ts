import type { IncomingMessage, ServerResponse } from 'node:http';
import { equal, kindSchema, kinds, labels, secret, UserError } from './domain.js';
import { body, redirect, text, typeIs } from './http.js';
import type { Destination, Grant, Receipt } from './domain.js';
import { maxMemoryBytes } from './memory.js';
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
li{margin:.35rem 0}textarea{min-height:12rem;resize:vertical}fieldset{border:1px solid #9a8a5d;margin:1rem 0;padding:1rem}
fieldset label{display:block;margin:.45rem 0}.notice{border-left:4px solid #825630;padding:.3rem .8rem}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem}dd{margin:0;overflow-wrap:anywhere}
article{border-bottom:1px solid #9a8a5d;padding:0 0 1rem;margin-bottom:1rem}label{font-weight:600}
@media(max-width:30rem){dl{display:block}dd{margin-bottom:.5rem}}
.skip{position:absolute;top:-5rem}.skip:focus{top:0;background:#fffdf7;padding:.5rem;z-index:1}
`;

function page(res: ServerResponse, title: string, fragment: string, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · bleib</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header><a href="/">bleib</a>
<nav aria-label="Wallet"><ul>
<li><a href="/entries">Notes</a></li>
<li><a href="/approvals">Requests</a></li>
<li><a href="/grants">Access</a></li>
<li><a href="/receipts">Receipts</a></li>
<li><a href="/proposals">Suggestions</a></li>
</ul></nav>
</header>
<main id="main" tabindex="-1"><h1>${escape(title)}</h1>${fragment}</main>
</body>
</html>`);
}

const validId = '[0-9a-f-]{36}';
const approvalRoute = new RegExp(`^/approvals/(${validId})$`);
const entryRoute = new RegExp(`^/entries/(${validId})$`);
const receiptRoute = new RegExp(`^/receipts/(${validId})$`);
const sessionLife = 30 * 60 * 1000;
interface Session { valid: boolean; csrf: string; owner: boolean; expires: number }
function place(value: string) {
  if (value === 'local') return 'On this device';
  return value.startsWith('provider:') ? 'Agent provider' : 'Third party';
}

const detail = (label: string, value: string) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`;
const destinationDetails = (destination: Destination) => [
  detail('Destination', `${place(destination.value)} (declared)`),
  detail('Provider', destination.provider ?? '—'),
  detail('Model', destination.model ?? '—'),
].join('');

const field = (session: Session) => `<input type="hidden" name="csrf" value="${session.csrf}">`;

export class Browser {
  private sessions = new Map<string, Session>();
  private tickets = new Map<string, number>();
  private cookieName: string;

  constructor(private wallet: Wallet, private origin: string) {
    this.cookieName = `bleib_session_${new URL(origin).port}`;
  }

  async openFromCli() {
    if (!(await this.wallet.ownerStatus()).unlocked) return '/';
    const now = Date.now();
    for (const [id, expires] of this.tickets) {
      if (expires <= now) this.tickets.delete(id);
    }
    if (this.tickets.size >= 16) throw new UserError('Too many browser windows are opening. Try again in a minute.');
    const ticket = secret();
    this.tickets.set(ticket, now + 60_000);
    return `/open/${ticket}`;
  }

  clear() {
    for (const session of this.sessions.values()) session.valid = false;
    this.sessions.clear();
    this.tickets.clear();
  }

  private getSession(req: IncomingMessage) {
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value =>
      value.startsWith(`${this.cookieName}=`))?.slice(this.cookieName.length + 1);
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
    const session = { valid: true, csrf: secret(), owner, expires: owner ? Infinity : Date.now() + sessionLife };
    this.sessions.set(id, session);
    res.setHeader('Set-Cookie', `${this.cookieName}=${id}; Path=/; HttpOnly; SameSite=Strict`);
    return session;
  }

  async handle(req: IncomingMessage, res: ServerResponse, path: string) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    res.setHeader('Referrer-Policy', 'strict-origin');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (req.method === 'GET' && path === '/style.css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      return res.end(css);
    }
    if (req.method !== 'GET' && req.method !== 'POST') return text(res, 405, 'Method not allowed.');

    const ticket = /^\/open\/([A-Za-z0-9_-]{43})$/.exec(path)?.[1];
    if (req.method === 'GET' && ticket) {
      const expires = this.tickets.get(ticket);
      this.tickets.delete(ticket);
      if (expires && expires > Date.now() && (await this.wallet.ownerStatus()).unlocked) {
        this.createSession(res, true);
      }
      return redirect(res, '/');
    }

    const approvalId = approvalRoute.exec(path)?.[1];
    const entryId = entryRoute.exec(path)?.[1];
    const receiptId = receiptRoute.exec(path)?.[1];
    if (!['/', '/approvals', '/entries', '/grants', '/receipts', '/proposals'].includes(path) &&
        !approvalId && !entryId && !receiptId) {
      return page(res, 'Page not found', '<p>Choose a page from the menu.</p>', 404);
    }

    try {
      if (req.method === 'POST') {
        if (req.headers.origin !== this.origin || !typeIs(req, 'application/x-www-form-urlencoded')) {
          return text(res, 403, 'This request was blocked.');
        }
        const form = new URLSearchParams(await body(req, 6 * maxMemoryBytes + 8192));
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
          await this.wallet.approve(approvalId, choice, form.get('confirmed') === 'yes', () => session.valid);
          return redirect(res, '/approvals');
        }
        if (entryId && form.get('action') === 'edit') {
          const kind = kindSchema.safeParse(form.get('kind'));
          if (!kind.success) throw new UserError('Choose a kind of information.');
          await this.wallet.edit(entryId, Number(form.get('version')), {
            kind: kind.data, title: form.get('title') ?? '', body: (form.get('body') ?? '').replaceAll('\r\n', '\n'),
            sensitive: form.get('sensitive') === 'yes',
          }, () => session.valid);
          return redirect(res, path);
        }
        if (path === '/grants' && form.get('action') === 'revoke') {
          await this.wallet.revoke(form.get('target') ?? '', () => session.valid);
          return redirect(res, '/grants');
        }
        if (path === '/' && form.get('action') === 'lock') {
          await this.wallet.lock(() => session.valid);
          return redirect(res, '/');
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

      if (path === '/' || path === '/entries' || entryId) return await this.notes(res, session, entryId, path === '/');
      if (path === '/grants') return await this.access(res, session);
      if (path === '/receipts' || receiptId) return await this.receipts(res, session, receiptId);
      if (path === '/proposals') return await this.proposals(res, session);
      return await this.approvals(res, session, approvalId);
    } catch (error) {
      if (error instanceof UserError) return page(res, 'Could not complete that step',
        `<p class="notice" role="alert">${escape(error.message)}</p><p><a href="${path}">Try again</a></p>`, 400);
      throw error;
    }
  }

  private async notes(res: ServerResponse, session: Session, id?: string, home = false) {
    if (!id) {
      const entries = await this.wallet.entries(() => session.valid);
      const list = entries.length ? `<ul>${entries.map(entry => `<li><a href="/entries/${entry.id}">${escape(entry.title)}</a> · ${escape(labels[entry.kind])}</li>`).join('')}</ul>`
        : '<p>There are no notes yet. Import a workspace in the terminal to get started.</p>';
      return page(res, 'Your notes', `${list}${home ? `<form action="/" method="post">${field(session)}<button name="action" value="lock">Lock wallet</button></form>` : ''}`);
    }
    const entry = await this.wallet.entry(id, () => session.valid);
    return page(res, 'Edit note', `<form method="post">${field(session)}
<input type="hidden" name="version" value="${entry.version}">
<label for="title">Title</label><input id="title" name="title" required maxlength="120" value="${escape(entry.title)}">
<label for="kind">Kind of information</label><select id="kind" name="kind">
${kinds.map(kind => `<option value="${kind}" ${kind === entry.kind ? 'selected' : ''}>${escape(labels[kind])}</option>`).join('')}</select>
<label for="note">Note</label><textarea name="body" id="note" rows="12">${'\n' + escape(entry.body)}</textarea>
<p><label><input type="checkbox" name="sensitive" value="yes" ${entry.sensitive ? 'checked' : ''}> Treat as sensitive</label></p>
<button name="action" value="edit">Save note</button></form>`);
  }

  private async approvals(res: ServerResponse, session: Session, id?: string) {
    const pending = await this.wallet.approvals(() => session.valid);
    if (!id) {
      return page(res, 'Sharing requests', pending.length ?
        `<ul>${pending.map(item => `<li><a href="/approvals/${item.id}">${escape(item.agentName)} · ${escape(item.ask.purpose)}</a></li>`).join('')}</ul>`
        : '<p>No requests are waiting.</p>');
    }
    const approval = pending.find(item => item.id === id);
    if (!approval) return page(res, 'Request unavailable', '<p>This request has expired or already has a decision.</p>', 404);
    const sensitive = approval.needed.some(kind => approval.sensitiveKinds.includes(kind));
    return page(res, 'Review a sharing request', `
<dl>${detail('Agent', approval.agentName)}${destinationDetails(approval.destination)}${detail('Purpose', approval.ask.purpose)}${detail('New permission for', approval.needed.map(kind => labels[kind]).join(', '))}</dl>
<h2>What the agent would receive</h2>${approval.content ? `<pre>${escape(approval.content)}</pre>` : '<p>No matching excerpt.</p>'}
<form method="post">${field(session)}<input type="hidden" name="action" value="approve">
<fieldset><legend>Choose access</legend>
<label><input type="radio" name="choice" value="once" ${sensitive ? 'checked' : ''} required> Allow once</label>
<label><input type="radio" name="choice" value="always"> Always for this agent</label>
<label><input type="radio" name="choice" value="no"> No</label>
${sensitive ? '<label><input type="checkbox" name="confirmed" value="yes"> I confirm ongoing access to sensitive information for this purpose and destination.</label>' : ''}
</fieldset><button>Save decision</button></form>`);
  }

  private async access(res: ServerResponse, session: Session) {
    const { agents, grants } = await this.wallet.grants(() => session.valid);
    const revoke = (id: string, label: string) => `<form method="post">${field(session)}
<input type="hidden" name="target" value="${id}"><button name="action" value="revoke">${label}</button></form>`;
    const duration: Record<Grant['duration'], string> = { once: 'One request', always: 'Ongoing', denied: 'Denied' };
    return page(res, 'Agent access', agents.length ? agents.map(agent =>
      `<article><h2>${escape(agent.name)}</h2><dl>${destinationDetails(agent.destination)}${detail('Agent ID', agent.id)}</dl>
${revoke(agent.id, 'Revoke agent')}${grants.filter(grant => grant.agentId === agent.id).map(grant =>
    `<section><h3>${escape(labels[grant.kind])} · ${duration[grant.duration]}</h3>
<dl>${detail('Purpose', grant.purpose)}${detail('Permission ID', grant.id)}</dl>
${revoke(grant.id, grant.duration === 'denied' ? 'Remove denial' : 'Revoke permission')}</section>`).join('')}</article>`).join('')
      : '<p>No agents are connected.</p>');
  }

  private async receipts(res: ServerResponse, session: Session, id?: string) {
    const receipts = await this.wallet.receipts(id, () => session.valid);
    if (!id) {
      return page(res, 'What your AI saw', receipts.length ? `<ul>${receipts.map(receipt =>
        `<li><a href="/receipts/${receipt.receipt_id}">${escape(receipt.agent)} · ${escape(receipt.purpose)}</a>
<time datetime="${receipt.time}">${receipt.time}</time></li>`).join('')}</ul>` : '<p>No notes have been shared.</p>');
    }
    const receipt = receipts[0] as Receipt;
    return page(res, 'Sharing receipt', `<dl>${detail('Agent', receipt.agent)}
${destinationDetails({ ...receipt, value: receipt.destination })}${detail('Purpose', receipt.purpose)}
${detail('Information', receipt.kinds.map(kind => labels[kind]).join(', '))}
${detail('Time (UTC)', receipt.time)}${detail('Receipt ID', receipt.receipt_id)}
${detail('Content fingerprint (SHA-256)', receipt.content_digest)}</dl>
<h2>Exactly what was shared</h2><pre>${escape(receipt.content)}</pre>`);
  }

  private async proposals(res: ServerResponse, session: Session) {
    const proposals = await this.wallet.proposals(() => session.valid);
    return page(res, 'Suggested notes', proposals.length ? proposals.map(item =>
      `<article><h2>${escape(labels[item.kind])}</h2><dl>${detail('Agent', item.agent)}${detail('Reason', item.reason)}
${detail('Time (UTC)', item.time)}</dl><pre>${escape(item.content)}</pre></article>`).join('')
      : '<p>No agents have suggested a note.</p>');
  }
}
