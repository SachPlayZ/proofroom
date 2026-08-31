import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebSocket } from 'ws';
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import * as runtime from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js/contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import * as ProofRoom from '../compact/managed/contract/index.js';

globalThis.WebSocket = WebSocket;
setNetworkId(NetworkId.NetworkId.PreProd);

const networkId = NetworkId.NetworkId.PreProd;
const indexerHttpUrl = process.env.MIDNIGHT_INDEXER_URL ?? 'https://indexer.preprod.midnight.network/api/v3/graphql';
const indexerWsUrl = process.env.MIDNIGHT_INDEXER_WS_URL ?? 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws';
const relayUrl = process.env.MIDNIGHT_RELAY_URL ?? 'wss://rpc.preprod.midnight.network';
const proofServerUrl = process.env.MIDNIGHT_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300';
const zkConfigPath = resolve(process.cwd(), 'compact/managed');
const cacheDir = resolve(process.cwd(), '.proofroom-cache');
const deploymentPath = resolve(process.cwd(), 'docs/proofroom-preprod-deployment.json');
const sourceSnapshotPath = resolve(process.cwd(), '.proofroom-cache/slot-01-dust.json');
const appSnapshotPath = resolve(process.cwd(), '.proofroom-cache/slot-01-dust-app.json');
const privateStateId = 'proofroomPrivateState';

function stressTestSecret(slot) {
  return createHash('sha256').update(`proofroom-preprod-stress-test-wallet-${Number(slot)}`).digest();
}

function bytes32(value) {
  const bytes = new Uint8Array(32);
  bytes.set(new TextEncoder().encode(value).slice(0, 32));
  return bytes;
}

function commitment(prefix, secret) {
  const descriptor = new runtime.CompactTypeVector(2, new runtime.CompactTypeBytes(32));
  return runtime.persistentHash(descriptor, [bytes32(prefix), new Uint8Array(secret)]);
}

function privateState(slot) {
  const slotNumber = Number(slot);
  return {
    localSecret: new Uint8Array(stressTestSecret(slotNumber)),
    privateTtmRevenue: 1_250_000n,
    privateNetRetention: 112n,
    privateCustomerConcentration: 1_800n,
    privateRefundRate: 200n,
    privateAvailableFunds: 10_000_000_000n,
    privateProofNullifier: new Uint8Array(
      createHash('sha256').update(`proofroom-proof-nullifier-${slotNumber}`).digest(),
    ),
  };
}

const witnesses = {
  localSecret: (context) => [context.privateState, context.privateState.localSecret],
  privateTtmRevenue: (context) => [context.privateState, context.privateState.privateTtmRevenue],
  privateNetRetention: (context) => [context.privateState, context.privateState.privateNetRetention],
  privateCustomerConcentration: (context) => [context.privateState, context.privateState.privateCustomerConcentration],
  privateRefundRate: (context) => [context.privateState, context.privateState.privateRefundRate],
  privateAvailableFunds: (context) => [context.privateState, context.privateState.privateAvailableFunds],
  privateProofNullifier: (context) => [context.privateState, context.privateState.privateProofNullifier],
};

const compiledContract = CompiledContract.make('proofroom', ProofRoom.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

function buildWalletConfiguration() {
  return {
    networkId,
    indexerClientConnection: { indexerHttpUrl, indexerWsUrl },
    relayURL: new URL(relayUrl),
    provingServerUrl: new URL(proofServerUrl),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };
}

function sourceWallet() {
  const walletSlot = Number(process.env.PROOFROOM_SLOT ?? '1');
  const dustSlot = Number(process.env.PROOFROOM_DUST_SPONSOR_SLOT ?? walletSlot);
  const seed = stressTestSecret(walletSlot);
  const dustSeed = stressTestSecret(dustSlot);
  const keystore = createKeystore(seed, networkId);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(seed);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(dustSeed);
  const snapshotPath = process.env.PROOFROOM_DUST_SNAPSHOT
    ? resolve(process.cwd(), process.env.PROOFROOM_DUST_SNAPSHOT)
    : dustSlot === 1 && existsSync(appSnapshotPath)
      ? appSnapshotPath
      : dustSlot === 1
      ? sourceSnapshotPath
      : resolve(process.cwd(), `.proofroom-cache/slot-${String(dustSlot).padStart(2, '0')}-dust.json`);
  if (!existsSync(snapshotPath)) throw new Error(`Missing DUST snapshot ${snapshotPath}; sync this wallet first.`);
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  // The serialized local state is global, while the public key selects which
  // DUST UTXOs this wallet owns. Re-key the shared snapshot for the requested
  // deterministic stress-test wallet.
  snapshot.publicKey = { publicKey: String(dustSecretKey.publicKey) };
  const configuration = buildWalletConfiguration();
  const dust = DustWallet(configuration).restore(JSON.stringify(snapshot));
  return { seed, keystore, shieldedSecretKeys, dustSecretKey, dust, configuration };
}

async function buildWalletContext() {
  const { seed, keystore, shieldedSecretKeys, dustSecretKey, dust, configuration } = sourceWallet();
  const wallet = await WalletFacade.init({
    configuration,
    shielded: (config) => ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config) => UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: () => dust,
  });
  console.log('wallet initialized; starting sync');
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  // The restored DUST stream can remain "catching up" while the shielded and
  // unshielded views are already usable. Midnight-js only needs those two
  // public keys to build a contract transaction, so do not block on the
  // aggregate facade state here.
  console.log('waiting for unshielded sync');
  await withTimeout(wallet.unshielded.waitForSyncedState(), 120_000, 'unshielded wallet sync');
  console.log('wallet sync ready');
  return { wallet, seed, keystore, shieldedSecretKeys, dustSecretKey };
}

async function withTimeout(promise, milliseconds, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${milliseconds}ms`)), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function signTransactionIntents(tx, signFn, proofMarker) {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize('signature', proofMarker, 'pre-binding', intent.serialize());
    const signature = signFn(cloned.signatureData(segment));
    if (cloned.fallibleUnshieldedOffer) {
      const signatures = cloned.fallibleUnshieldedOffer.inputs.map(
        (_input, index) => cloned.fallibleUnshieldedOffer.signatures.at(index) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(signatures);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const signatures = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_input, index) => cloned.guaranteedUnshieldedOffer.signatures.at(index) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(signatures);
    }
    tx.intents.set(segment, cloned);
  }
}

async function submitFinalizedViaRpc(finalized) {
  const api = await ApiPromise.create({ provider: new WsProvider(relayUrl), throwOnConnect: false, noInitWarn: true });
  try {
    const serialized = Buffer.from(finalized.serialize()).toString('hex');
    const extrinsic = api.tx.midnight.sendMnTransaction(`0x${serialized}`);
    return (await api.rpc.author.submitExtrinsic(extrinsic)).toString();
  } finally {
    await api.disconnect();
  }
}

async function makeProviders(context, accountId) {
  const walletProvider = {
    getCoinPublicKey: () => context.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => context.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx, ttl) {
      const recipe = await context.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: context.shieldedSecretKeys, dustSecretKey: context.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload) => context.keystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      return context.wallet.finalizeRecipe(recipe);
    },
  };
  const midnightProvider = {
    submitTx: (tx) => context.wallet.submitTransaction(tx),
  };
  // The provider rejects passwords containing sequential patterns. This
  // deliberately non-sequential value is only a local encryption key for the
  // ignored private-state database; callers can override it for a deployment.
  const storagePassword = process.env.PROOFROOM_PRIVATE_STATE_PASSWORD ?? 'Pr0ofRoom!v7KxQ9Lm2Hj6#';
  const privateStateProvider = levelPrivateStateProvider({
    midnightDbName: resolve(cacheDir, 'midnight-js-v2'),
    privateStateStoreName: 'proofroom-private-state-v2',
    accountId,
    privateStoragePasswordProvider: () => storagePassword,
  });
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  return {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(indexerHttpUrl, indexerWsUrl),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServerUrl, zkConfigProvider),
    walletProvider,
    midnightProvider,
  };
}

function deploymentRecord(contract) {
  const publicData = contract.deployTxData.public;
  return {
    network: 'preprod',
    contractAddress: publicData.contractAddress,
    transactionId: publicData.txId,
    blockHeight: publicData.blockHeight,
    recordedAtUtc: new Date().toISOString(),
    compiledContract: 'proofroom',
  };
}

async function submitDeployment() {
  if (!existsSync(sourceSnapshotPath)) {
    throw new Error('Missing .proofroom-cache/slot-01-dust.json; run npm run pilot:dust-sync first.');
  }
  mkdirSync(cacheDir, { recursive: true });
  const context = await buildWalletContext();
  try {
    const providers = await makeProviders(context, context.keystore.getBech32Address().toString());
    const existing = process.env.PROOFROOM_CONTRACT_ADDRESS;
    const contract = existing
      ? await findDeployedContract(providers, {
          contractAddress: existing,
          compiledContract,
          privateStateId,
          initialPrivateState: privateState(1),
        })
      : await deployContract(providers, {
          compiledContract,
          privateStateId,
          initialPrivateState: privateState(1),
        });
    const previous = existing && existsSync(deploymentPath) ? JSON.parse(readFileSync(deploymentPath, 'utf8')) : {};
    const record = existing
      ? { ...deploymentRecord(contract), ...previous, contractAddress: contract.deployTxData.public.contractAddress }
      : deploymentRecord(contract);
    writeFileSync(deploymentPath, `${JSON.stringify(record, null, 2)}\n`);
    console.log(JSON.stringify(record, null, 2));
  } finally {
    await context.wallet.stop().catch(() => {});
  }
}

function loadDeployment() {
  if (!existsSync(deploymentPath)) throw new Error(`Missing ${deploymentPath}; run npm run pilot:deploy first.`);
  const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8'));
  if (!deployment.contractAddress) throw new Error(`Deployment record has no contractAddress: ${deploymentPath}`);
  return deployment;
}

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
    while (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) {
      normalized = normalized.slice(1, -1);
    }
    return normalized;
  });
}

function readApplicationRecords(path) {
  if (!existsSync(path)) return { headers: [], records: [] };
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], records: [] };
  const headers = parseCsvLine(lines[0]);
  const records = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
  return { headers, records };
}

function applicationAlreadyRecorded(slot, operation) {
  const path = resolve(process.cwd(), 'docs/preprod-application-transactions.csv');
  const { records } = readApplicationRecords(path);
  return records.some((record) => record.slot === String(slot).padStart(2, '0') && record.operation === operation && ['SucceedEntirely', 'SUCCESS'].includes(record.status));
}

function writeApplicationEvidence(publicData, slot, operation) {
  const outputPath = resolve(process.cwd(), 'docs/preprod-application-transactions.csv');
  const headers = [
    'slot',
    'wallet_address',
    'operation',
    'contract_address',
    'tx_id',
    'tx_hash',
    'status',
    'block_height',
    'block_hash',
    'block_timestamp_utc',
    'indexer_id',
  ];
  const { records: existing } = readApplicationRecords(outputPath);
  const row = {
    slot: String(slot).padStart(2, '0'),
    wallet_address: createKeystore(stressTestSecret(slot), networkId).getBech32Address().toString(),
    operation,
    contract_address: loadDeployment().contractAddress,
    tx_id: publicData.txId,
    tx_hash: publicData.txHash,
    status: publicData.status,
    block_height: publicData.blockHeight,
    block_hash: publicData.blockHash,
    block_timestamp_utc: new Date(publicData.blockTimestamp).toISOString(),
    indexer_id: publicData.indexerId,
  };
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = [...existing, row].map((record) => headers.map((header) => record[header] ?? ''));
  writeFileSync(outputPath, `${[headers, ...rows].map((line) => line.map(quote).join(',')).join('\n')}\n`);
  return outputPath;
}

async function persistSponsorDustSnapshot(context) {
  const sponsorSlot = Number(process.env.PROOFROOM_DUST_SPONSOR_SLOT ?? process.env.PROOFROOM_SLOT ?? '1');
  if (sponsorSlot !== 1) return;
  const serialized = await context.wallet.dust.serializeState();
  const snapshot = JSON.parse(serialized);
  // Keep the replay cursor alongside the mutable app state for auditability;
  // the synchronizer always reads the separate public-ledger snapshot.
  if (snapshot.offset === undefined) {
    const previous = existsSync(sourceSnapshotPath) ? JSON.parse(readFileSync(sourceSnapshotPath, 'utf8')) : {};
    snapshot.offset = previous.offset ?? '0';
  }
  writeFileSync(appSnapshotPath, `${JSON.stringify(snapshot)}\n`);
}

async function submitCreateListing() {
  const deployment = loadDeployment();
  const slot = Number(process.env.PROOFROOM_SLOT ?? '1');
  if (applicationAlreadyRecorded(slot, 'createListing') && process.env.PROOFROOM_FORCE !== '1') {
    console.log(`slot ${String(slot).padStart(2, '0')} createListing is already recorded; nothing to resubmit`);
    return;
  }
  if (!existsSync(sourceSnapshotPath) && !existsSync(appSnapshotPath)) throw new Error('Missing DUST snapshot; run npm run pilot:dust-sync first.');
  const context = await buildWalletContext();
  try {
    const providers = await makeProviders(context, context.keystore.getBech32Address().toString());
    const contract = await findDeployedContract(providers, {
      contractAddress: deployment.contractAddress,
      compiledContract,
      privateStateId,
      initialPrivateState: privateState(slot),
    });
    const dossierHash = new Uint8Array(createHash('sha256').update(`proofroom-demo-dossier-${slot}`).digest());
    const sellerCommitment = commitment('proofroom:seller:', stressTestSecret(slot));
    console.log(`Submitting createListing from slot ${String(slot).padStart(2, '0')}...`);
    const result = await contract.callTx.createListing(1_000_000n, dossierHash, sellerCommitment);
    const evidencePath = writeApplicationEvidence(result.public, slot, 'createListing');
    await persistSponsorDustSnapshot(context);
    console.log(JSON.stringify({
      contractAddress: deployment.contractAddress,
      slot,
      operation: 'createListing',
      txId: result.public.txId,
      txHash: result.public.txHash,
      blockHeight: result.public.blockHeight,
      status: result.public.status,
      evidencePath,
    }, null, 2));
  } finally {
    await context.wallet.stop().catch(() => {});
  }
}

async function submitDustRegistration() {
  const slot = Number(process.env.PROOFROOM_SLOT ?? '2');
  if (!Number.isInteger(slot) || slot < 2 || slot > 50) throw new Error('PROOFROOM_SLOT must be 2..50 for registration');
  const context = await buildWalletContext();
  try {
    const state = await context.wallet.unshielded.waitForSyncedState();
    const candidates = state.availableCoins.filter((coin) => coin.meta?.registeredForDustGeneration !== true);
    if (candidates.length === 0) {
      console.log(`slot ${String(slot).padStart(2, '0')} already has all NIGHT UTXOs registered`);
      return;
    }
    const recipe = await context.wallet.registerNightUtxosForDustGeneration(
      candidates,
      context.keystore.getPublicKey(),
      (payload) => context.keystore.signData(payload),
    );
    const finalized = await context.wallet.finalizeRecipe(recipe);
    const extrinsicHash = await submitFinalizedViaRpc(finalized);
    console.log(JSON.stringify({ slot, operation: 'registerNightUtxosForDustGeneration', extrinsicHash }, null, 2));
  } finally {
    await context.wallet.stop().catch(() => {});
  }
}

const command = process.argv[2] ?? 'deploy';
if (command === 'deploy') await submitDeployment();
else if (command === 'create-listing') await submitCreateListing();
else if (command === 'register-dust') await submitDustRegistration();
else throw new Error(`Unknown command ${command}; use deploy or create-listing.`);
