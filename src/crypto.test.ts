import { describe, expect, it } from 'vitest';
import { decryptDossier, encryptDossier, sha256Hex } from './crypto';

describe('local dossier cryptography', () => {
  it('hashes deterministically', async () => {
    expect(await sha256Hex('proofroom')).toBe(await sha256Hex('proofroom'));
    expect(await sha256Hex('proofroom')).not.toBe(await sha256Hex('ProofRoom'));
  });

  it('round-trips an encrypted dossier with the generated key', async () => {
    const payload = { company: 'Atlas Metrics, Inc.', ttmRevenue: '$2.4m' };
    const encrypted = await encryptDossier(payload);
    expect(encrypted.ciphertext).toContain('.');
    expect(encrypted.hash).toMatch(/^sha256:/);
    await expect(decryptDossier(encrypted.ciphertext, encrypted.key)).resolves.toEqual(payload);
  });
});
