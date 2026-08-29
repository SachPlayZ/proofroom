import { describe, expect, it } from 'vitest';
import { initialCriteria, meetsCriteria, sellerFixture } from './domain';
import { bankAttestation, sellerAttestation, verifyBankAttestation, verifySellerAttestation } from './mockAttesters';

describe('ProofRoom qualification rules', () => {
  it('accepts the happy-path seller fixture', () => {
    expect(meetsCriteria(sellerFixture, initialCriteria)).toBe(true);
    expect(verifySellerAttestation(sellerAttestation(sellerFixture), initialCriteria)).toBe(true);
  });

  it('rejects a seller when any private metric misses the policy', () => {
    expect(meetsCriteria({ ...sellerFixture, netRetention: 109 }, initialCriteria)).toBe(false);
    expect(meetsCriteria({ ...sellerFixture, customerConcentration: 21 }, initialCriteria)).toBe(false);
    expect(meetsCriteria({ ...sellerFixture, refundRate: 5.1 }, initialCriteria)).toBe(false);
  });

  it('keeps the policy directional: higher revenue and retention help, lower risk helps', () => {
    expect(meetsCriteria({ ...sellerFixture, ttmRevenue: 3_000_000, netRetention: 130, customerConcentration: 5, refundRate: 1 }, initialCriteria)).toBe(true);
  });

  it('rejects tampered, expired, and wrong-issuer seller credentials', () => {
    const now = new Date('2026-08-30T12:00:00Z');
    const attestation = sellerAttestation(sellerFixture);
    expect(verifySellerAttestation(attestation, initialCriteria, now)).toBe(true);
    expect(verifySellerAttestation({ ...attestation, payload: { ...attestation.payload, ttmRevenue: 9_000_000 } }, initialCriteria, now)).toBe(false);
    expect(verifySellerAttestation({ ...attestation, issuer: 'not-stripe' }, initialCriteria, now)).toBe(false);
    expect(verifySellerAttestation({ ...attestation, expiresAt: '2026-08-30T11:59:59Z' }, initialCriteria, now)).toBe(false);
  });

  it('requires a live, intact bank attestation for the asking floor', () => {
    const now = new Date('2026-08-30T12:00:00Z');
    const attestation = bankAttestation(2_100_000);
    expect(verifyBankAttestation(attestation, 1_200_000, now)).toBe(true);
    expect(verifyBankAttestation({ ...attestation, payload: { availableFunds: 100 } }, 1_200_000, now)).toBe(false);
    expect(verifyBankAttestation({ ...attestation, expiresAt: '2026-08-30T11:59:59Z' }, 1_200_000, now)).toBe(false);
  });
});
