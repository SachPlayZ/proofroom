import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';

const count = Number(process.argv[2] ?? 50);
if (!Number.isInteger(count) || count < 1 || count > 500) {
  throw new Error('Usage: npm run pilot:wallets -- [count 1..500]');
}

const roles = ['buyer', 'seller', 'verifier', 'advisor'];
const outputPath = resolve(process.cwd(), 'docs/pilot-wallets.csv');
const proofOutputPath = resolve(process.cwd(), 'docs/pilot-transaction-proof.csv');
const network = NetworkId.NetworkId.PreProd;

function csv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function stressTestSecret(slot) {
  return createHash('sha256').update(`proofroom-preprod-stress-test-wallet-${slot}`).digest();
}

function stressTestReference(address, slot) {
  return `PREPROD-STRESS-TEST-${createHash('sha256').update(`${address}:${slot}`).digest('hex').slice(0, 32)}`;
}

function loadExistingProof() {
  if (!existsSync(proofOutputPath)) return new Map();
  const [headerLine, ...lines] = readFileSync(proofOutputPath, 'utf8').trim().split('\n');
  const headers = headerLine.split(',').map((value) => value.replaceAll('"', ''));
  return new Map(lines.map((line) => {
    const values = line.split(',').map((value) => value.replace(/^"|"$/g, ''));
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    return [row.slot, row];
  }));
}

const existingProof = loadExistingProof();

const rows = [
  [
    'slot',
    'record_type',
    'network',
    'role',
    'wallet_address',
    'transaction_reference',
    'on_chain_status',
    'consent_timestamp_utc',
    'feedback_id',
  ],
];

const proofRows = [
  ['slot', 'role', 'wallet_address', 'plan_reference', 'drip_id', 'transaction_reference', 'status', 'network', 'recorded_at_utc', 'block_height', 'block_hash', 'amount_raw'],
];

for (let slot = 1; slot <= count; slot += 1) {
  const address = createKeystore(stressTestSecret(slot), network).getBech32Address().toString();
  const role = roles[(slot - 1) % roles.length];
  const reference = stressTestReference(address, slot);
  const previous = existingProof.get(String(slot).padStart(2, '0'));
  const confirmed = previous?.status === 'CONFIRMED' && previous.transaction_reference;
  rows.push([
    String(slot).padStart(2, '0'),
    'preprod_stress_test',
    'preprod',
    role,
    address,
    confirmed ? previous.transaction_reference : reference,
    confirmed ? 'CONFIRMED' : 'ADDRESS_READY_TX_PENDING',
    confirmed ? (previous.recorded_at_utc ?? '') : '',
    `FB-${String(slot).padStart(3, '0')}`,
  ]);
  proofRows.push([
    String(slot).padStart(2, '0'),
    role,
    address,
    reference,
    confirmed ? (previous.drip_id ?? '') : '',
    confirmed ? previous.transaction_reference : '',
    confirmed ? 'CONFIRMED' : 'ADDRESS_READY_TX_PENDING',
    'preprod',
    confirmed ? (previous.recorded_at_utc ?? '') : '',
    confirmed ? (previous.block_height ?? '') : '',
    confirmed ? (previous.block_hash ?? '') : '',
    confirmed ? (previous.amount_raw ?? '') : '',
  ]);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
writeFileSync(proofOutputPath, `${proofRows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Wrote ${count} Preprod stress-test addresses to ${outputPath}`);
console.log(`Wrote ${count} pending transaction-proof rows to ${proofOutputPath}`);
console.log('Plan references are deterministic IDs; existing confirmed transaction hashes are preserved and new rows remain pending until network confirmation.');
