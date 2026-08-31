import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexerHttpUrl = process.env.MIDNIGHT_INDEXER_URL ?? 'https://indexer.preprod.midnight.network/api/v3/graphql';
const applicationPath = resolve(process.cwd(), 'docs/preprod-application-transactions.csv');
const deploymentPath = resolve(process.cwd(), 'docs/proofroom-preprod-deployment.json');
const contractAddress = process.env.PROOFROOM_CONTRACT_ADDRESS ?? (existsSync(deploymentPath)
  ? JSON.parse(readFileSync(deploymentPath, 'utf8')).contractAddress
  : '');

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values.map((item) => {
    let normalized = item;
    while (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) normalized = normalized.slice(1, -1);
    return normalized;
  });
}

function readCsv(path) {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const records = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
  return { headers, records };
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function query(queryText, variables = {}) {
  const response = await fetch(indexerHttpUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: queryText, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(JSON.stringify(payload.errors ?? payload));
  return payload.data;
}

const blockQuery = `query($o: BlockOffset) {
  block(offset: $o) {
    height hash timestamp
    transactions {
      __typename
      ... on RegularTransaction {
        hash id identifiers
        transactionResult { status }
        contractActions { address }
      }
    }
  }
}`;

const { headers, records } = readCsv(applicationPath);
if (records.length === 0) throw new Error('No application transactions to verify');
if (!contractAddress) throw new Error('No ProofRoom contract address found');

const verified = [];
for (const record of records) {
  if (record.contract_address !== contractAddress) throw new Error(`${record.slot}: contract address mismatch`);
  const height = Number(record.block_height);
  if (!Number.isInteger(height) || height <= 0) throw new Error(`${record.slot}: invalid block_height ${record.block_height}`);
  const data = await query(blockQuery, { o: { height } });
  const transaction = (data.block?.transactions ?? []).find((candidate) =>
    candidate.__typename === 'RegularTransaction'
      && candidate.transactionResult?.status === 'SUCCESS'
      && candidate.contractActions?.some((action) => action.address === contractAddress)
      && candidate.identifiers?.includes(record.tx_id));
  if (!transaction) throw new Error(`${record.slot}: no SUCCESS ProofRoom transaction with tx_id ${record.tx_id} in block ${height}`);
  record.tx_hash = transaction.hash;
  record.status = transaction.transactionResult.status;
  record.block_height = data.block.height;
  record.block_hash = data.block.hash;
  record.block_timestamp_utc = new Date(data.block.timestamp).toISOString();
  record.indexer_id = transaction.id;
  verified.push(record);
}

writeFileSync(applicationPath, `${[headers, ...verified.map((record) => headers.map((header) => record[header] ?? ''))]
  .map((row) => row.map(csv).join(','))
  .join('\n')}\n`);

if (existsSync(deploymentPath)) {
  const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8'));
  const deploymentHeight = Number(deployment.blockHeight);
  if (Number.isInteger(deploymentHeight) && deploymentHeight > 0 && deployment.transactionId) {
    const data = await query(blockQuery, { o: { height: deploymentHeight } });
    const transaction = (data.block?.transactions ?? []).find((candidate) =>
      candidate.__typename === 'RegularTransaction'
        && candidate.transactionResult?.status === 'SUCCESS'
        && candidate.contractActions?.some((action) => action.address === contractAddress)
        && candidate.identifiers?.includes(deployment.transactionId));
    if (!transaction) throw new Error(`Deployment ${deployment.transactionId} was not found in block ${deploymentHeight}`);
    Object.assign(deployment, {
      transactionHash: transaction.hash,
      indexerId: transaction.id,
      status: transaction.transactionResult.status,
      blockHash: data.block.hash,
      blockTimestampUtc: new Date(data.block.timestamp).toISOString(),
    });
    writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);
  }
}

console.log(`Verified ${verified.length} SUCCESS ProofRoom application transactions against ${indexerHttpUrl}`);
