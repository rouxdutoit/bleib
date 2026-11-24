import type { IncomingMessage, ServerResponse } from 'node:http';
import { equal, kindSchema, kinds, labels, secret, UserError } from './domain.js';
import { body, redirect, text, typeIs } from './http.js';
import type { Destination, Grant, Receipt } from './domain.js';
import { maxMemoryBytes } from './memory.js';
import { describeRule } from './policy.js';
import { css } from './ui-style.js';
import { proposalTitle, type Wallet } from './wallet.js';

export const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);


function page(res: ServerResponse, title: string, fragment: string, status = 200, alert = false) {
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
<header><div><a class="brand" href="/">bleib</a>
<nav aria-label="Wallet"><ul role="list">
<li><a href="/entries">Notes</a></li>
<li><a href="/approvals">Requests</a></li>
<li><a href="/grants">Access</a></li>
<li><a href="/rules">Rules</a></li>
<li><a href="/receipts">Receipts</a></li>
<li><a href="/proposals">Suggestions</a></li>
</ul></nav>
</div></header>
<main id="main" tabindex="-1">${alert ? `<section class="approval-alert" aria-labelledby="approval-title">
<h1 id="approval-title">${escape(title)}</h1>${fragment}</section>` : `<h1>${escape(title)}</h1>${fragment}`}</main>
</body>
</html>`);
}

const validId = '[0-9a-f-]{36}';
const approvalRoute = new RegExp(`^/approvals/(${validId})$`);
const entryRoute = new RegExp(`^/entries/(${validId})$`);
const proposalRoute = new RegExp(`^/proposals/(${validId})$`);
const receiptRoute = new RegExp(`^/receipts/(${validId})$`);
const sessionLife = 30 * 60 * 1000;
interface Session { valid: boolean; csrf: string; owner: boolean; expires: number }
function place(value: string) {
  if (value === 'local') return 'On this device';
  return value.startsWith('provider:') ? 'Agent provider' : 'Third party';
}

const detail = (label: string, value: string) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`;
const destinationDetails = (destination: Destination, basis = 'declared', host?: string) => [
  detail('Destination', `${place(destination.value)} (${basis})`),
  ...(host || destination.proxy ? [detail('Host', host ?? new URL(destination.proxy!.origin).host)] : []),
  detail('Provider', destination.provider ?? '—'),
  detail('Model', destination.model ?? '—'),
].join('');

const optionsForKind = (selected: string) => kinds.map(kind =>
  `<option value="${kind}" ${kind === selected ? 'selected' : ''}>${escape(labels[kind])}</option>`).join('');

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

    const query = new URL(req.url ?? '/', this.origin).searchParams;
    const approvalId = approvalRoute.exec(path)?.[1];
    const entryId = entryRoute.exec(path)?.[1];
    const receiptId = receiptRoute.exec(path)?.[1];
    const proposalId = proposalRoute.exec(path)?.[1];
    const exportPath = path === '/receipts/export';
    if (!['/', '/approvals', '/entries', '/grants', '/receipts', '/proposals', '/rules'].includes(path) &&
        !approvalId && !entryId && !receiptId && !proposalId && !exportPath) {
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
            ...(form.has('sharing-setting') ? { ownerOnly: form.get('share') !== 'yes' } : {}),
          }, () => session.valid);
          return redirect(res, path);
        }
        if (path === '/proposals' && form.get('action') === 'paste') {
          const app = form.get('app');
          if (app !== 'ChatGPT' && app !== 'Claude') throw new UserError('Choose where you copied the memory.');
          await this.wallet.pasteMemory(app, form.get('memory') ?? '', () => session.valid);
          return redirect(res, '/proposals');
        }
        if (proposalId) {
          const choice = form.get('action');
          if (choice !== 'save' && choice !== 'dismiss' && choice !== 'save-edit') return text(res, 405, 'Method not allowed.');
          let edit;
          if (choice === 'save-edit') {
            const kind = kindSchema.safeParse(form.get('kind'));
            if (!kind.success) throw new UserError('Choose a kind of information.');
            edit = { kind: kind.data, title: form.get('title') ?? '', content: (form.get('content') ?? '').replaceAll('\r\n', '\n') };
          }
          await this.wallet.decideProposal(proposalId, choice === 'dismiss' ? 'dismiss' : 'save', edit, () => session.valid);
          return redirect(res, '/proposals');
        }
        if (path === '/rules') {
          const action = form.get('action');
          const rule = form.get('rule') ?? '';
          if (action === 'preview-rule') {
            const preview = await this.wallet.previewRule(rule, () => session.valid);
            return page(res, 'Save this rule?', `<section class="card"><p>${escape(describeRule(preview.policy))}</p>
<form method="post">${field(session)}<input type="hidden" name="rule" value="${escape(preview.text)}">
<input type="hidden" name="fingerprint" value="${preview.fingerprint}">
<button class="primary" name="action" value="save-rule">Save Rule</button> <a class="action-link" href="/rules">Cancel</a></form></section>`);
          }
          if (action === 'save-rule') await this.wallet.saveRule(rule, form.get('fingerprint') ?? '', () => session.valid);
          else if (action === 'remove-rule') await this.wallet.removeRule(form.get('id') ?? '', () => session.valid);
          else return text(res, 405, 'Method not allowed.');
          return redirect(res, '/rules');
        }
        if (path === '/approvals' && form.get('action') === 'dismiss-destinations') {
          await this.wallet.clearDestinationAlerts(() => session.valid);
          return redirect(res, '/approvals');
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
        return page(res, 'Unlock your wallet', `<form class="card" method="post">${field(session)}
<input type="hidden" name="action" value="unlock"><label for="passphrase">Passphrase</label>
<input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required><button class="primary">Unlock</button></form>`);
      }

      if (path === '/' || path === '/entries' || entryId) return await this.notes(res, session, entryId, path === '/');
      if (path === '/rules') return await this.rules(res, session);
      if (path === '/grants') return await this.access(res, session);
      if (exportPath) {
        const value = await this.wallet.exportReceipts(query.get('id') ?? undefined, () => session.valid);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="bleib-receipts.json"',
        });
        return res.end(JSON.stringify(value, null, 2));
      }
      if (path === '/receipts' || receiptId) return await this.receipts(res, session, query, receiptId);
      if (path === '/proposals' || proposalId) return await this.proposals(res, session, proposalId);
      return await this.approvals(res, session, approvalId);
    } catch (error) {
      if (error instanceof UserError) return page(res, 'Could not complete that step',
        `<p class="notice" role="alert">${escape(error.message)}</p><p><a class="action-link" href="${path}">Try Again</a></p>`, 400);
      throw error;
    }
  }

  private async notes(res: ServerResponse, session: Session, id?: string, home = false) {
    if (!id) {
      const entries = await this.wallet.entries(() => session.valid);
      const alerts = home ? await this.wallet.destinationAlerts(() => session.valid) : [];
      const list = entries.length ? `<ul class="group" role="list">${entries.map(entry =>
        `<li><a class="row" href="/entries/${entry.id}"><strong>${escape(entry.title)}</strong><span class="secondary">
${escape(labels[entry.kind])}${entry.ownerOnly ? ' · Only you' : ''}</span></a></li>`).join('')}</ul>`
        : '<p>There are no notes yet. Import a workspace in the terminal to get started.</p>';
      const notice = alerts.length ? '<p class="notice"><a class="action-link" href="/approvals">Review blocked sharing</a></p>' : '';
      return page(res, 'Your notes', `${notice}${list}${home ? `<form action="/" method="post">${field(session)}
<button name="action" value="lock">Lock Wallet</button></form>` : ''}`);
    }
    const entry = await this.wallet.entry(id, () => session.valid);
    return page(res, 'Edit note', `<form class="card" method="post">${field(session)}
<input type="hidden" name="version" value="${entry.version}">
<label for="title">Title</label><input id="title" name="title" required maxlength="120" value="${escape(entry.title)}">
<label for="kind">Kind of information</label><select id="kind" name="kind">${optionsForKind(entry.kind)}</select>
<label for="note">Note</label><textarea name="body" id="note" rows="12">${'\n' + escape(entry.body)}</textarea>
<label class="check"><input type="checkbox" name="sensitive" value="yes" ${entry.sensitive ? 'checked' : ''}> Treat as sensitive</label>
<input type="hidden" name="sharing-setting" value="yes">
<label class="check"><input type="checkbox" name="share" value="yes" ${entry.ownerOnly ? '' : 'checked'}> Share when an agent has permission</label>
<button class="primary" name="action" value="edit">Save Note</button></form>`);
  }

  private async approvals(res: ServerResponse, session: Session, id?: string) {
    const pending = await this.wallet.approvals(() => session.valid);
    if (!id) {
      const alerts = await this.wallet.destinationAlerts(() => session.valid);
      const notice = alerts.length ? `<section class="notice"><h2>Sharing blocked</h2>
${alerts.map(item => `<p>bleib blocked ${escape(item.name)} because its model destination differed from the pairing.</p>`).join('')}
<form method="post">${field(session)}<button name="action" value="dismiss-destinations">Dismiss</button></form></section>` : '';
      return page(res, 'Sharing requests', notice + (pending.length ?
        `<ul class="group" role="list">${pending.map(item => `<li><a class="row" href="/approvals/${item.id}">${escape(item.agentName)} · ${escape(item.ask.purpose)}</a></li>`).join('')}</ul>`
        : '<p>No requests are waiting.</p>'));
    }
    const approval = pending.find(item => item.id === id);
    if (!approval) return page(res, 'Request unavailable', '<p>This request has expired or already has a decision.</p>', 404);
    const sensitive = approval.needed.some(kind => approval.sensitiveKinds.includes(kind));
    return page(res, `Share with ${approval.agentName}?`, `
<dl>${destinationDetails(approval.destination)}${detail('Purpose', approval.ask.purpose)}
${detail('Information', approval.needed.map(kind => labels[kind]).join(', '))}</dl>
<h2>What would be shared</h2>${approval.content ? `<pre>${escape(approval.content)}</pre>` : '<p>No matching excerpt.</p>'}
<form method="post">${field(session)}<input type="hidden" name="action" value="approve">
${sensitive ? '<label class="check"><input type="checkbox" name="confirmed" value="yes"> Confirm ongoing access to sensitive information</label>' : ''}
<div class="actions">
<button class="primary" name="choice" value="once">Allow Once</button>
<button name="choice" value="always">Always for ${escape(approval.agentName)}</button>
<button class="destructive" name="choice" value="no">Don't Allow</button>
</div></form>`, 200, true);
  }

  private async access(res: ServerResponse, session: Session) {
    const { agents, grants } = await this.wallet.grants(() => session.valid);
    const revoke = (id: string, label: string) => `<form method="post">${field(session)}
<input type="hidden" name="target" value="${id}"><button class="destructive" name="action" value="revoke">${label}</button></form>`;
    const duration: Record<Grant['duration'], string> = { once: 'One request', always: 'Ongoing', denied: 'Denied' };
    return page(res, 'Agent access', agents.length ? agents.map(agent =>
      `<section><h2>${escape(agent.name)}</h2><ul class="group" role="list"><li class="cell">
<dl>${destinationDetails(agent.destination)}${detail('Agent ID', agent.id)}</dl>${revoke(agent.id, 'Revoke Agent')}</li>
${grants.filter(grant => grant.agentId === agent.id).map(grant =>
    `<li class="cell"><h3>${escape(labels[grant.kind])}</h3>
<p class="secondary">${duration[grant.duration]}${grant.duration === 'denied' && grant.purpose ? ` · ${escape(grant.purpose)}` : ''}</p>
<dl>${detail('Permission ID', grant.id)}</dl>
${revoke(grant.id, grant.duration === 'denied' ? 'Remove Denial' : 'Revoke Permission')}</li>`).join('')}</ul></section>`).join('')
      : '<p>No agents are connected.</p>');
  }

  private async rules(res: ServerResponse, session: Session) {
    const rules = await this.wallet.rules(() => session.valid);
    return page(res, 'Sharing rules', `<form class="card" method="post">${field(session)}
<label for="rule">Write a rule in your own words</label>
<input id="rule" name="rule" placeholder="Never share health with hosted models" maxlength="240" required>
<button name="action" value="preview-rule">Review Rule</button></form>
${rules.length ? `<ul class="group" role="list">${rules.map(rule => `<li class="cell">
<p><strong>${escape(rule.text)}</strong></p><p class="secondary">${escape(describeRule(rule.policy))}</p>
<form method="post">${field(session)}<input type="hidden" name="id" value="${rule.id}">
<button name="action" value="remove-rule" aria-label="Remove rule: ${escape(rule.text)}">Remove</button></form></li>`).join('')}</ul>` : ''}`);
  }

  private async receipts(res: ServerResponse, session: Session, query: URLSearchParams, id?: string) {
    if (!id) {
      const { receipts, report } = await this.wallet.timeline(() => session.valid);
      const agent = query.get('agent') ?? '';
      const kind = kindSchema.safeParse(query.get('kind')).data;
      const agents = new Map(receipts.map(receipt => [receipt.agent_id, receipt.agent]));
      const visible = receipts.filter(receipt =>
        (!agent || receipt.agent_id === agent) && (!kind || receipt.kinds.includes(kind)));
      return page(res, 'What your AI saw', `<section class="widget" aria-labelledby="week">
<h2 id="week">This week</h2><div class="widget-count">${report.facts} <span>${report.facts === 1 ? 'fact shared' : 'facts shared'}</span></div>
<p class="secondary">${escape(report.summary)} ${escape(report.health)}</p></section>
<form class="filters" method="get">
<div><label for="filter-agent">Agent</label><select id="filter-agent" name="agent"><option value="">All agents</option>
${[...agents].map(([id, name]) => `<option value="${escape(id)}" ${agent === id ? 'selected' : ''}>${escape(name)}</option>`).join('')}</select></div>
<div><label for="filter-kind">Kind</label><select id="filter-kind" name="kind"><option value="">All kinds</option>
${kinds.map(item => `<option value="${item}" ${item === kind ? 'selected' : ''}>${escape(labels[item])}</option>`).join('')}</select></div>
<button>Filter</button></form>
<h2>Timeline</h2><p><a class="action-link" href="/receipts/export">Export Receipts</a></p>
${visible.length ? `<ul class="group" role="list">${visible.map(receipt =>
  `<li><a class="row receipt-row" href="/receipts/${receipt.receipt_id}"><strong>${escape(receipt.agent)}</strong>
<span>${escape(receipt.purpose)}</span><span class="secondary">${escape(receipt.kinds.map(item => labels[item]).join(', '))} · ${receipt.destination_basis}</span>
<time datetime="${receipt.time}">${escape(new Date(receipt.time).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }))}</time>
</a></li>`).join('')}</ul>` : '<p>No matching receipts.</p>'}`);
    }
    const [receipt] = await this.wallet.receipts(id, () => session.valid) as [Receipt];
    return page(res, 'Sharing receipt', `<section class="card"><dl>${detail('Agent', receipt.agent)}
${destinationDetails({ ...receipt, value: receipt.destination }, receipt.destination_basis, receipt.destination_host)}${detail('Purpose', receipt.purpose)}
${detail('Information', receipt.kinds.map(kind => labels[kind]).join(', '))}
${detail('Time (UTC)', receipt.time)}${detail('Receipt ID', receipt.receipt_id)}
${detail('Content fingerprint (SHA-256)', receipt.content_digest)}
${receipt.outbound_digest ? detail('Model request fingerprint (SHA-256)', receipt.outbound_digest) : ''}</dl>
<h2>Exactly what was shared</h2><pre>${escape(receipt.content)}</pre></section>`);
  }

  private async proposals(res: ServerResponse, session: Session, id?: string) {
    const proposals = await this.wallet.proposals(() => session.valid);
    if (id) {
      const item = proposals.find(proposal => proposal.id === id);
      if (!item) return page(res, 'Suggestion unavailable', '<p>This suggestion has already been reviewed.</p>', 404);
      return page(res, 'Edit suggestion', `<form class="card" method="post">${field(session)}
<p class="secondary">${escape(item.agent)} · ${escape(item.reason)}</p>
<label for="title">Title</label><input id="title" name="title" value="${escape(proposalTitle(item))}" maxlength="120" required>
<label for="kind">Kind of information</label><select id="kind" name="kind">${optionsForKind(item.kind)}</select>
<label for="content">Note</label><textarea id="content" name="content" rows="8" required>${'\n' + escape(item.content)}</textarea>
<div class="actions"><button class="primary" name="action" value="save-edit">Save</button>
<a class="action-link" href="/proposals">Cancel</a></div></form>`);
    }
    return page(res, 'Suggested notes', `<form class="card" method="post">${field(session)}
<h2>Paste memory</h2><label for="app">Copied from</label><select id="app" name="app"><option>ChatGPT</option><option>Claude</option></select>
<label for="memory">Memory text</label><textarea id="memory" name="memory" rows="4" required></textarea>
<button name="action" value="paste">Add to Review</button></form>
<h2>Review queue</h2>
${proposals.length ? `<p>Saved suggestions are visible only to you until you enable sharing in the note.</p>
<ul class="group" role="list">${proposals.map(item =>
      `<li class="cell"><h3>${escape(labels[item.kind])} · ${escape(item.agent)}</h3>
<p class="secondary">${escape(item.reason)}</p><pre>${escape(item.content)}</pre>
<div class="actions"><form action="/proposals/${item.id}" method="post">${field(session)}
<button class="primary" name="action" value="save">Save</button><a class="action-link"
href="/proposals/${item.id}">Edit</a><button name="action" value="dismiss">Not Now</button></form></div></li>`).join('')}</ul>`
      : '<p>There are no suggestions to review.</p>'}`);
  }
}
