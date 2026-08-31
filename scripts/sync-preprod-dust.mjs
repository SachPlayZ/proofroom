import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { NetworkId, ProtocolVersion } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { createHash } from 'node:crypto';

const dustSlot = Number(process.env.PROOFROOM_DUST_SLOT ?? '1');
const seed = createHash('sha256').update(`proofroom-preprod-stress-test-wallet-${dustSlot}`).digest();
const secretKey = ledger.DustSecretKey.fromSeed(seed);
const outputPath = resolve(process.cwd(), process.env.PROOFROOM_DUST_OUTPUT ?? process.env.PROOFROOM_DUST_SNAPSHOT ?? '.proofroom-cache/slot-01-dust.json');
const inputPath = resolve(process.cwd(), process.env.PROOFROOM_DUST_INPUT ?? outputPath);
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
if (existsSync(inputPath) && process.env.PROOFROOM_DUST_FROM_START !== '1') {
  const previous = JSON.parse(readFileSync(inputPath, 'utf8'));
  state = ledger.DustLocalState.deserialize(Buffer.from(previous.state, 'hex'));
  applied = Number(previous.offset ?? 0);
  console.log(`Resuming DUST replay at event ${applied + 1}`);
}
let startedAt = Date.now();
let closed = false;
const resumeOffset = applied;

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
  dispose = client.subscribe({ query, variables: { id: applied } }, {
    next: (payload) => {
      if (closed) return;
      const item = payload.data?.dustLedgerEvents;
      if (!item) return;
      if (targetMaxId === 0) {
        targetMaxId = Math.max(item.maxId ?? 0, item.id);
        console.log(`Syncing DUST events ${resumeOffset + 1}..${targetMaxId} for slot ${String(dustSlot).padStart(2, '0')}`);
      }
      targetMaxId = Math.max(targetMaxId, item.maxId ?? 0, item.id);
      if (item.id <= resumeOffset) {
        // The subscription replays from event 1. Skip the already-applied
        // prefix, but finish cleanly when the stream reaches the saved cursor.
        if (item.id >= targetMaxId && pending.length === 0) {
          closed = true;
          saveSnapshot();
          dispose();
          client.terminate();
          resolvePromise();
        }
        return;
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
