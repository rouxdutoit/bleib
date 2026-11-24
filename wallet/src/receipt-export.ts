import type { Kind, Receipt } from './domain.js';

const dpv = 'https://w3id.org/dpv#';
const pd = 'https://w3id.org/dpv/pd#';
const categories: Record<Kind, string> = {
  identity: pd + 'Identifying',
  contact: pd + 'Contact',
  preferences: pd + 'Preference',
  work: pd + 'Professional',
  education: pd + 'Education',
  location: pd + 'Location',
  schedule: pd + 'Behavioural',
  activities: pd + 'Behavioural',
  health: pd + 'Health',
  finances: pd + 'Financial',
  relationships: pd + 'Relationship',
  credentials: pd + 'Authenticating',
  private: dpv + 'PersonalData',
};

export function exportReceipts(receipts: Iterable<Receipt>, chain: { count: number; head: string | null }) {
  return {
    format: 'bleib-consent-disclosure/1',
    references: {
      consent_record: 'ISO/IEC TS 27560:2023',
      consent_receipt_draft: 'draft-zeng-osap-consent-receipts-00',
      projection_digest_draft: 'draft-ferro-schrock-memory-projection-record-00',
      vocabulary: 'https://w3id.org/dpv/2.3',
    },
    chain,
    receipts: [...receipts].map(receipt => ({
      receipt_id: receipt.receipt_id,
      record_type: dpv + 'ConsentReceipt',
      user: { role: dpv + 'DataSubject', id: 'wallet-owner' },
      agent: { id: receipt.agent_id, name: receipt.agent },
      audience: {
        destination: receipt.destination, basis: receipt.destination_basis,
        provider: receipt.provider, model: receipt.model, host: receipt.destination_host,
      },
      purpose: receipt.purpose,
      actions: [dpv + 'Disclose'],
      resources: receipt.entries.map((entry, index) => ({
        id: entry.id, version: entry.version, category: categories[receipt.kinds[index]!],
      })),
      decision: 'allow',
      consent: {
        grant_ids: receipt.grant_ids, decisions: receipt.decisions,
      },
      disclosed_at: receipt.time,
      evidence: {
        projection: {
          encoding: 'utf-8', byte_length: Buffer.byteLength(receipt.content),
          digest: { algorithm: 'sha-256', hex: receipt.content_digest },
        },
        outbound_payload_digest: receipt.outbound_digest ? { algorithm: 'sha-256', hex: receipt.outbound_digest } : undefined,
        previous_hash: receipt.prev_hash, receipt_hash: receipt.hash,
      },
    })),
  };
}
