import { canonical, kindSchema, labels, normalize, sha256, UserError } from './domain.js';
import type { Agent, Ask, Kind } from './domain.js';

type Policy =
  | { type: 'block'; kind: Kind; hosted: boolean }
  | { type: 'restrict'; kind: Kind; agentId: string; agentName: string }
  | { type: 'constraint'; topic: string; currency: 'EUR'; cents: number };

export interface Rule { id: string; text: string; policy: Policy }

export function parseRule(input: string, agents: Iterable<Agent>) {
  const text = input.trim();
  if (text.length > 240 || /[\p{Cc}\p{Cf}]/u.test(text)) throw new UserError('Enter one short rule.');
  const clean = normalize(text).replace(/\.$/, '');
  const block = /^never share ([a-z]+)( with hosted models)?$/.exec(clean);
  const restrict = /^only (.+) may see ([a-z]+)$/.exec(clean);
  const constraint = /^keep (.{1,80}) under €\s*([1-9]\d{0,5})(?:[.,](\d{1,2}))?$/.exec(clean);

  let policy: Policy;
  if (block) {
    policy = { type: 'block', kind: parseKind(block[1]), hosted: Boolean(block[2]) };
  } else if (restrict) {
    const kind = parseKind(restrict[2]);
    const matched = [...agents].filter(agent => !agent.revoked && normalize(agent.name) === restrict[1]);
    if (matched.length !== 1) throw new UserError('Use the unique name of a connected agent.');
    policy = { type: 'restrict', kind, agentId: matched[0]!.id, agentName: matched[0]!.name };
  } else if (constraint) {
    policy = {
      type: 'constraint', topic: constraint[1]!, currency: 'EUR',
      cents: Number(constraint[2]) * 100 + Number((constraint[3] ?? '').padEnd(2, '0')),
    };
  } else {
    throw new UserError('Try “never share finances”, “only Claude may see work”, or “keep dinner plans under €30”.');
  }
  return { text, policy, fingerprint: sha256(canonical({ text, policy })) };
}

function parseKind(input: string | undefined) {
  const kind = kindSchema.safeParse(input);
  if (!kind.success) throw new UserError('Use a wallet kind such as health, finances, or work.');
  return kind.data;
}

export function describeRule(policy: Policy) {
  if (policy.type === 'block') {
    return `Block ${labels[policy.kind].toLowerCase()} ${policy.hosted ? 'for hosted models' : 'for all agents'}.`;
  }
  if (policy.type === 'restrict') {
    return `Block ${labels[policy.kind].toLowerCase()} for every agent except ${policy.agentName}. That agent still needs permission.`;
  }
  return `Tell agents to keep ${policy.topic} under €${policy.cents / 100} when a permitted request mentions that topic.`;
}

export function blocked(rules: Iterable<Rule>, agent: Agent, ask: Ask) {
  for (const { policy } of rules) {
    if (policy.type === 'constraint' || !ask.kinds.includes(policy.kind)) continue;
    if (policy.type === 'block' ? !policy.hosted || agent.destination.value !== 'local' : agent.id !== policy.agentId) {
      return true;
    }
  }
  return false;
}

export function constraints(rules: Iterable<Rule>, ask: Ask) {
  const request = ` ${normalize(`${ask.purpose} ${ask.question ?? ''}`).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  const matched = [...rules].flatMap(({ policy }) =>
    policy.type === 'constraint' && request.includes(` ${policy.topic} `) ? [policy] : []);
  return matched.map(({ topic, cents }) => `Keep ${topic} under €${cents / 100}.`);
}
