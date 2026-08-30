import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { NetworkId, ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { createHash } from 'node:crypto';

const seed = createHash('sha256').update('proofroom-preprod-stress-test-wallet-1').digest();
const secretKey = ledger.DustSecretKey.fromSeed(seed);
const outputPath = resolve(process.cwd(), process.env.PROOFROOM_DUST_SNAPSHOT ?? '.proofroom-cache/slot-01-dust.json');
const batchSize = Number(process.env.PROOFROOM_DUST_BATCH ?? 5000);

if (!Number.isInteger(batchSize) || batchSize < 100 || batchSize > 50_000) {
  throw new Error('PROOFROOM_DUST_BATCH must be an integer from 100 to 50000');
}

const client = createClient({
  url: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
  webSocketImpl: WebSocket,
  lazy: false,
  retryAttempts: 5,
});
const query = `subscription DustLedgerEvents($id: Int) {
  dustLedgerEvents(id: $id) { type: __typename id raw maxId }
}`;
const params = ledger.LedgerParameters.initialParameters().dust;
let state = new ledger.DustLocalState(params);
let pending = [];
let targetMaxId = 0;
let applied = 0;
let startedAt = Date.now();
let closed = false;

function saveSnapshot() {
  const snapshot = {
    publicKey: { publicKey: secretKey.publicKey.toString() },
    state: Buffer.from(state.serialize()).toString('hex'),
    protocolVersion: ProtocolVersion.MinSupportedVersion.toString(),
    networkId: NetworkId.NetworkId.PreProd,
    offset: String(applied),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`);
}

function close() {
  if (closed) return;
  closed = true;
  client.terminate();
}

await new Promise((resolvePromise, reject) => {
  let dispose;
  dispose = client.subscribe({ query, variables: { id: 0 } }, {
    next: (payload) => {
      if (closed) return;
      const item = payload.data?.dustLedgerEvents;
      if (!item) return;
      if (targetMaxId === 0) {
        targetMaxId = item.maxId;
        console.log(`Syncing DUST events 1..${targetMaxId} for slot 01`);
      }
      pending.push(ledger.Event.deserialize(Buffer.from(item.raw, 'hex')));
      if (pending.length < batchSize && item.id < targetMaxId) return;
      try {
        state = state.replayEvents(secretKey, pending);
        applied = item.id;
        pending = [];
        if (applied % (batchSize * 5) < batchSize) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
          console.log(`applied ${applied}/${targetMaxId} (${elapsed}s)`);
        }
        if (applied >= targetMaxId) {
          closed = true;
          saveSnapshot();
          const owned = state.utxos.filter((utxo) => utxo.owner === secretKey.publicKey);
          console.log(`Snapshot: ${outputPath}`);
          console.log(`Owned DUST UTXOs: ${owned.length}; balance now: ${state.walletBalance(new Date())}`);
          dispose();
          client.terminate();
          resolvePromise();
        }
      } catch (error) {
        dispose();
        close();
        reject(error);
      }
    },
    error: (error) => {
      close();
      reject(error);
    },
    complete: resolvePromise,
  });
});

process.exit(0);
