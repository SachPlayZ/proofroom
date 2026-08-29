export type Role = 'seller' | 'buyer' | 'auditor';

export type ProofState = 'private' | 'proving' | 'verified' | 'failed';

export interface Criteria {
  ttmRevenue: number;
  netRetention: number;
  customerConcentration: number;
  refundRate: number;
}

export interface SellerMetrics {
  ttmRevenue: number;
  netRetention: number;
  customerConcentration: number;
  refundRate: number;
}

export interface Listing {
  id: string;
  alias: string;
  category: string;
  askFloor: number;
  sellerCommitment: string;
  dossierHash: string;
  active: boolean;
}

export interface MatchRequest {
  id: string;
  listingId: string;
  buyerAlias: string;
  criteria: Criteria;
  buyerCommitment: string;
  sellerProof: ProofState;
  buyerProof: ProofState;
  accessGranted: boolean;
  ciphertextHash?: string;
}

export interface ProofEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  kind: 'private' | 'proof' | 'public' | 'access';
}

export interface Dossier {
  company: string;
  url: string;
  ttmRevenue: string;
  netRetention: string;
  customers: string;
  note: string;
}

export const sellerFixture: SellerMetrics = {
  ttmRevenue: 2400000,
  netRetention: 118,
  customerConcentration: 14,
  refundRate: 2.1,
};

export const buyerFundsFixture = 2100000;

export const initialCriteria: Criteria = {
  ttmRevenue: 2000000,
  netRetention: 110,
  customerConcentration: 20,
  refundRate: 5,
};

export const initialListing: Listing = {
  id: 'PR-8F29',
  alias: 'Atlas / B2B analytics',
  category: 'B2B SaaS · anonymous listing',
  askFloor: 1200000,
  sellerCommitment: 'mn_commit_4e9a…71b2',
  dossierHash: 'sha256:7cc4…c22a',
  active: true,
};

export const initialRequest: MatchRequest = {
  id: 'REQ-042',
  listingId: initialListing.id,
  buyerAlias: 'buyer / 0x…a91f',
  criteria: initialCriteria,
  buyerCommitment: 'mn_commit_9bd1…0e42',
  sellerProof: 'private',
  buyerProof: 'private',
  accessGranted: false,
};

export const demoDossier: Dossier = {
  company: 'Atlas Metrics, Inc.',
  url: 'atlasmetrics.example',
  ttmRevenue: '$2.4m',
  netRetention: '118%',
  customers: 'Top customer = 14% of revenue',
  note: 'The full data room is released only after mutual qualification.',
};

export function meetsCriteria(metrics: SellerMetrics, criteria: Criteria): boolean {
  return metrics.ttmRevenue >= criteria.ttmRevenue
    && metrics.netRetention >= criteria.netRetention
    && metrics.customerConcentration <= criteria.customerConcentration
    && metrics.refundRate <= criteria.refundRate;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortHash(value: string): string {
  if (value.length < 13) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}
