import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';

const count = Number(process.argv[2] ?? 50);
if (!Number.isInteger(count) || count < 1 || count > 500) {
  throw new Error('Usage: npm run pilot:wallets -- [count 1..500]');
}

const roles = ['buyer', 'seller', 'verifier', 'advisor'];
const outputPath = resolve(process.cwd(), 'docs/pilot-wallets.csv');
const network = NetworkId.NetworkId.PreProd;

function csv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function fixtureSecret(slot) {
  return createHash('sha256').update(`proofroom-offline-pilot-wallet-${slot}`).digest();
}

function fixtureReference(address, slot) {
  return `OFFLINE-FIXTURE-TX-${createHash('sha256').update(`${address}:${slot}`).digest('hex').slice(0, 32)}`;
}

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

for (let slot = 1; slot <= count; slot += 1) {
  const address = createKeystore(fixtureSecret(slot), network).getBech32Address().toString();
  rows.push([
    String(slot).padStart(2, '0'),
    'offline_fixture',
    'preprod-format-only',
    roles[(slot - 1) % roles.length],
    address,
    fixtureReference(address, slot),
    'NOT_SUBMITTED_TO_PREPROD',
    '',
    `FB-${String(slot).padStart(3, '0')}`,
  ]);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Wrote ${count} offline wallet fixtures to ${outputPath}`);
console.log('These addresses have valid Preprod formatting but no on-chain transactions. Replace transaction_reference/status only after real funding and submission.');
