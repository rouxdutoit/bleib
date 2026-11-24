import type { Receipt } from './domain.js';

export function summarize(receipts: Iterable<Receipt>, now: number) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const week = [...receipts].filter(receipt => {
    const time = Date.parse(receipt.time);
    return time >= start.getTime() && time <= now;
  });
  const agents = new Set(week.map(receipt => receipt.agent_id)).size;
  const facts = week.reduce((count, receipt) => count + receipt.entries.length, 0);
  const hostedHealth = week.some(receipt => receipt.kinds.includes('health') && receipt.destination !== 'local');
  const summary = agents ? `This week ${agents} ${agents === 1 ? 'AI' : 'AIs'} saw ${facts} ${facts === 1 ? 'fact' : 'facts'}.`
    : 'Your wallet hasn’t shared any facts this week.';
  const health = hostedHealth ? 'Your wallet shared health information with a hosted AI this week.'
    : 'Your wallet hasn’t shared health information with a hosted AI this week.';
  return { agents, facts, summary, health, since: start.toISOString() };
}
