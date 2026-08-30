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

function stressTestSecret(slot) {
  return createHash('sha256').update(`proofroom-preprod-stress-test-wallet-${slot}`).digest();
}

function stressTestReference(address, slot) {
  return `PREPROD-STRESS-TEST-${createHash('sha256').update(`${address}:${slot}`).digest('hex').slice(0, 32)}`;
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
  const address = createKeystore(stressTestSecret(slot), network).getBech32Address().toString();
  rows.push([
    String(slot).padStart(2, '0'),
    'preprod_stress_test',
    'preprod',
    roles[(slot - 1) % roles.length],
    address,
    stressTestReference(address, slot),
    'ADDRESS_READY_TX_PENDING',
    '',
    `FB-${String(slot).padStart(3, '0')}`,
  ]);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Wrote ${count} Preprod stress-test addresses to ${outputPath}`);
console.log('References are stress-test plan IDs. Replace them with confirmed transaction hashes after faucet funding and network submission.');
