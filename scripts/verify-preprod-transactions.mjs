import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexerHttpUrl = process.env.MIDNIGHT_INDEXER_URL ?? 'https://indexer.preprod.midnight.network/api/v3/graphql';
const proofPath = resolve(process.cwd(), 'docs/pilot-transaction-proof.csv');
const startHeight = Number(process.env.PROOFROOM_VERIFY_FROM ?? '2332287');
const endHeight = Number(process.env.PROOFROOM_VERIFY_TO ?? '0');
const concurrency = 12;

function parseCsvLine(line) {
  return line.split(',').map((value) => value.replace(/^"|"$/g, '').replaceAll('""', '"'));
}

function csv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function query(body) {
  const response = await fetch(indexerHttpUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: body.query, variables: body.variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(JSON.stringify(payload.errors ?? payload));
  return payload.data;
}

const lines = readFileSync(proofPath, 'utf8').trim().split('\n');
const originalHeaders = parseCsvLine(lines.shift());
const records = lines.map(parseCsvLine).map((values) => Object.fromEntries(originalHeaders.map((header, index) => [header, values[index] ?? ''])));
const targets = new Map(records.filter((record) => record.transaction_reference).map((record) => [record.transaction_reference, record]));
if (targets.size !== records.length) throw new Error('Every proof row must have a unique transaction_reference before verification');

const latest = await query({ query: 'query { block(offset: null) { height } }' });
const finalHeight = endHeight || latest.block.height;
if (finalHeight < startHeight) throw new Error(`Invalid block range ${startHeight}..${finalHeight}`);

let nextHeight = startHeight;
async function worker() {
  while (true) {
    const height = nextHeight;
    nextHeight += 1;
    if (height > finalHeight) return;
    const data = await query({
      query: `query($o: BlockOffset) {
        block(offset: $o) {
          height hash timestamp
          transactions {
            __typename
            ... on RegularTransaction {
              hash
              transactionResult { status }
              unshieldedCreatedOutputs { owner value outputIndex intentHash registeredForDustGeneration }
            }
          }
        }
      }`,
      variables: { o: { height } },
    });
    for (const transaction of data.block?.transactions ?? []) {
      const record = targets.get(transaction.hash);
      if (!record) continue;
      const output = (transaction.unshieldedCreatedOutputs ?? []).find((item) => item.owner === record.wallet_address);
      if (transaction.transactionResult?.status !== 'SUCCESS' || !output) {
        throw new Error(`${record.slot}: ${transaction.hash} is not a SUCCESS output for ${record.wallet_address}`);
      }
      record.block_height = data.block.height;
      record.block_hash = data.block.hash;
      record.amount_raw = output.value;
      record.recorded_at_utc = new Date(data.block.timestamp).toISOString();
      targets.delete(transaction.hash);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
if (targets.size > 0) throw new Error(`Could not locate ${targets.size} transaction(s) between blocks ${startHeight} and ${finalHeight}`);

const headers = [
  'slot', 'role', 'wallet_address', 'plan_reference', 'drip_id', 'transaction_reference', 'status', 'network', 'recorded_at_utc',
  'block_height', 'block_hash', 'amount_raw',
];
const rows = [headers, ...records.map((record) => headers.map((header) => record[header] ?? ''))];
writeFileSync(proofPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Verified ${records.length} SUCCESS transactions and wrote block evidence to ${proofPath}`);

