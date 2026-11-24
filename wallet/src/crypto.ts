import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { Decrypter, Encrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import { z } from 'zod';
import { UserError } from './domain.js';

export { generateX25519Identity, identityToRecipient };

const envelopeSchema = z.object({
  version: z.literal(1),
  recipient: z.string().regex(/^age1[0-9a-z]{58}$/),
  salt: z.string().regex(/^[0-9a-f]{32}$/),
  nonce: z.string().regex(/^[0-9a-f]{24}$/),
  tag: z.string().regex(/^[0-9a-f]{32}$/),
  identity: z.string().regex(/^[0-9a-f]{148}$/),
});

type Envelope = z.infer<typeof envelopeSchema>;
const derive = promisify<Buffer, Buffer, number, Parameters<typeof scrypt>[3], Buffer>(scrypt);
const parameters = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 ** 2 };
const binding = (recipient: string) => Buffer.from(`bleib wallet identity v1\0${recipient}`);

export function checkPassphrase(passphrase: string) {
  if (passphrase.length < 12 || Buffer.byteLength(passphrase) > 1024) {
    throw new UserError('Use a passphrase of at least 12 characters and at most 1,024 bytes.');
  }
}

async function deriveKey(passphrase: string, salt: Buffer) {
  const bytes = Buffer.from(passphrase);
  try {
    return await derive(bytes, salt, 32, parameters);
  } finally {
    bytes.fill(0);
  }
}

export async function wrapIdentity(identity: string, passphrase: string): Promise<Envelope> {
  checkPassphrase(passphrase);
  const recipient = await identityToRecipient(identity);
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  try {
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(binding(recipient));
    const encrypted = Buffer.concat([cipher.update(identity, 'utf8'), cipher.final()]);
    return {
      version: 1, recipient, salt: salt.toString('hex'), nonce: nonce.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'), identity: encrypted.toString('hex'),
    };
  } finally {
    key.fill(0);
  }
}

export const parseEnvelope = (json: string) => envelopeSchema.parse(JSON.parse(json));

export async function unwrapIdentity(envelope: Envelope, passphrase: string) {
  checkPassphrase(passphrase);
  const key = await deriveKey(passphrase, Buffer.from(envelope.salt, 'hex'));
  try {
    const cipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.nonce, 'hex'));
    cipher.setAAD(binding(envelope.recipient));
    cipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
    const plaintext = Buffer.concat([cipher.update(Buffer.from(envelope.identity, 'hex')), cipher.final()]);
    try {
      return plaintext.toString('utf8');
    } finally {
      plaintext.fill(0);
    }
  } catch {
    throw new UserError('The passphrase could not unlock this wallet.');
  } finally {
    key.fill(0);
  }
}

export async function seal(recipient: string, plaintext: string) {
  const encrypt = new Encrypter();
  encrypt.addRecipient(recipient);
  return encrypt.encrypt(plaintext);
}

export async function unseal(identity: string, ciphertext: Uint8Array) {
  const decrypt = new Decrypter();
  decrypt.addIdentity(identity);
  return decrypt.decrypt(ciphertext, 'text');
}

export function journalKey(identity: string) {
  return createHmac('sha256', identity).update('bleib journal authentication v1').digest();
}
