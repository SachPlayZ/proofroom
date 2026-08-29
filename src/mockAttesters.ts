import type { Criteria, SellerMetrics } from './domain';

const SELLER_ISSUER = 'stripe-fixture-attester';
const BANK_ISSUER = 'bank-fixture-attester';
const SELLER_SIGNING_SALT = 'proofroom-stripe-fixture';
const BANK_SIGNING_SALT = 'proofroom-bank-fixture';
const DEMO_NOW = new Date('2026-08-30T12:00:00Z');

export interface MockAttestation<T> {
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  payload: T;
  signature: string;
}

// Deliberately simple deterministic signature stand-in for the demo. Production
// attesters must replace this with real signature verification in Compact.
function mockSignature(issuer: string, payload: unknown, salt: string): string {
  const input = `${issuer}:${JSON.stringify(payload)}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sig_jubjub_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function isLive(attestation: MockAttestation<unknown>, now: Date): boolean {
  const issuedAt = Date.parse(attestation.issuedAt);
  const expiresAt = Date.parse(attestation.expiresAt);
  return Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && issuedAt <= now.getTime() && now.getTime() < expiresAt;
}

export function sellerAttestation(metrics: SellerMetrics): MockAttestation<SellerMetrics> {
  return {
    issuer: SELLER_ISSUER,
    issuedAt: '2026-08-29T08:00:00Z',
    expiresAt: '2026-09-06T08:00:00Z',
    payload: metrics,
    signature: mockSignature(SELLER_ISSUER, metrics, SELLER_SIGNING_SALT),
  };
}

export function bankAttestation(availableFunds: number): MockAttestation<{ availableFunds: number }> {
  return {
    issuer: BANK_ISSUER,
    issuedAt: '2026-08-29T08:00:00Z',
    expiresAt: '2026-08-31T08:00:00Z',
    payload: { availableFunds },
    signature: mockSignature(BANK_ISSUER, { availableFunds }, BANK_SIGNING_SALT),
  };
}

export function verifySellerAttestation(attestation: MockAttestation<SellerMetrics>, criteria: Criteria, now = DEMO_NOW): boolean {
  const { ttmRevenue, netRetention, customerConcentration, refundRate } = attestation.payload;
  return attestation.issuer === SELLER_ISSUER
    && attestation.signature === mockSignature(SELLER_ISSUER, attestation.payload, SELLER_SIGNING_SALT)
    && isLive(attestation, now)
    && ttmRevenue >= criteria.ttmRevenue
    && netRetention >= criteria.netRetention
    && customerConcentration <= criteria.customerConcentration
    && refundRate <= criteria.refundRate;
}

export function verifyBankAttestation(attestation: MockAttestation<{ availableFunds: number }>, askFloor: number, now = DEMO_NOW): boolean {
  return attestation.issuer === BANK_ISSUER
    && attestation.signature === mockSignature(BANK_ISSUER, attestation.payload, BANK_SIGNING_SALT)
    && isLive(attestation, now)
    && attestation.payload.availableFunds >= askFloor;
}
