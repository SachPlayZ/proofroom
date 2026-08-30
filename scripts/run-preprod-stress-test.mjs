import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ApiPromise, WsProvider } from '@polkadot/api';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { createKeystore, InMemoryTransactionHistoryStorage, PublicKey, UnshieldedWallet } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';

const args = process.argv.slice(2);
const countArg = args.find((arg) => /^\d+$/.test(arg));
const count = Number(countArg ?? 50);
const execute = args.includes('--execute');
const fundChildren = args.includes('--fund-children') || process.env.PROOFROOM_FUND_CHILDREN === '1';
const networkId = NetworkId.NetworkId.PreProd;
const inputPath = resolve(process.cwd(), 'docs/pilot-wallets.csv');
const resultPath = resolve(process.cwd(), 'docs/pilot-transaction-proof.csv');
const snapshotPath = resolve(process.cwd(), process.env.PROOFROOM_DUST_SNAPSHOT ?? '.proofroom-cache/slot-01-dust.json');
const indexerHttpUrl = process.env.MIDNIGHT_INDEXER_URL ?? 'https://indexer.preprod.midnight.network/api/v3/graphql';
const relayUrl = process.env.MIDNIGHT_RELAY_URL ?? 'wss://rpc.preprod.midnight.network';
const proofServerUrl = process.env.MIDNIGHT_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300';
const transferAmount = BigInt(process.env.PROOFROOM_TRANSFER_AMOUNT ?? '10000000');

if (!Number.isInteger(count) || count < 1 || count > 50) {
  throw new Error('Usage: npm run pilot:stress -- [count 1..50] [--execute] [--fund-children]');
}
if (transferAmount <= 0n) throw new Error('PROOFROOM_TRANSFER_AMOUNT must be positive');

function parseCsvLine(line) {
  return line.split(',').map((value) => value.replace(/^"|"$/g, '').replaceAll('""', '"'));
}

function csv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function loadRecords() {
  const walletLines = readFileSync(inputPath, 'utf8').trim().split('\n');
  const walletHeaders = parseCsvLine(walletLines.shift());
  const wallets = walletLines.map(parseCsvLine).map((values) => Object.fromEntries(walletHeaders.map((header, index) => [header, values[index] ?? ''])));
  const proofLines = readFileSync(resultPath, 'utf8').trim().split('\n');
  const proofHeaders = parseCsvLine(proofLines.shift());
  const proofBySlot = new Map(proofLines.map(parseCsvLine).map((values) => {
    const row = Object.fromEntries(proofHeaders.map((header, index) => [header, values[index] ?? '']));
    return [row.slot, row];
  }));
  const records = wallets.map((wallet) => {
    const proof = proofBySlot.get(wallet.slot) ?? {};
    return {
      ...wallet,
      plan_reference: proof.plan_reference || wallet.transaction_reference,
      drip_id: proof.drip_id || '',
      transaction_reference: proof.transaction_reference || (proof.status === 'CONFIRMED' ? wallet.transaction_reference : ''),
      status: proof.status || wallet.on_chain_status || 'ADDRESS_READY_TX_PENDING',
      recorded_at_utc: proof.recorded_at_utc || '',
    };
  });
  const selected = records.slice(0, count);
  if (selected.length !== count || selected.some((record) => !record.wallet_address.startsWith('mn_addr_preprod1'))) {
    throw new Error(`Expected ${count} Preprod stress-test addresses in ${inputPath}`);
  }
  return { records, selected };
}

function writeProofRecords(records) {
  const headers = ['slot', 'role', 'wallet_address', 'plan_reference', 'drip_id', 'transaction_reference', 'status', 'network', 'recorded_at_utc', 'block_height', 'block_hash', 'amount_raw'];
  const rows = [headers, ...records.map((record) => [
    record.slot,
    record.role,
    record.wallet_address,
    record.plan_reference,
    record.drip_id ?? '',
    record.transaction_reference ?? '',
    record.status ?? 'ADDRESS_READY_TX_PENDING',
    'preprod',
    record.recorded_at_utc ?? '',
    record.block_height ?? '',
    record.block_hash ?? '',
    record.amount_raw ?? '',
  ])];
  writeFileSync(resultPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
}

function writeWalletRecords(records) {
  const headers = ['slot', 'record_type', 'network', 'role', 'wallet_address', 'transaction_reference', 'on_chain_status', 'consent_timestamp_utc', 'feedback_id'];
  const rows = [headers, ...records.map((record) => [
    record.slot,
    'preprod_stress_test',
    'preprod',
    record.role,
    record.wallet_address,
    record.transaction_reference || record.plan_reference,
    record.status || 'ADDRESS_READY_TX_PENDING',
    record.consent_timestamp_utc ?? '',
    record.feedback_id ?? `FB-${String(record.slot).padStart(3, '0')}`,
  ])];
  writeFileSync(inputPath, `${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function stressTestSecret(slot) {
  return createHash('sha256').update(`proofroom-preprod-stress-test-wallet-${Number(slot)}`).digest();
}

async function latestBlock() {
  const response = await fetch(indexerHttpUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'query { block(offset: null) { height hash timestamp } }' }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length || !payload.data?.block) {
    throw new Error(`Indexer latest block failed: ${JSON.stringify(payload.errors ?? payload)}`);
  }
  return payload.data.block;
}

async function blockAt(height) {
  const response = await fetch(indexerHttpUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
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
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`Indexer block ${height} failed: ${JSON.stringify(payload.errors ?? payload)}`);
  return payload.data?.block;
}

async function waitForRecipientTx(recipient, startHeight, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let scannedThrough = startHeight;
  while (Date.now() < deadline) {
    const latest = await latestBlock();
    const first = Math.max(startHeight + 1, scannedThrough + 1, latest.height - 20);
    for (let height = first; height <= latest.height; height += 1) {
      const block = await blockAt(height);
      scannedThrough = Math.max(scannedThrough, height);
      for (const transaction of block?.transactions ?? []) {
        if (transaction.__typename !== 'RegularTransaction' || transaction.transactionResult?.status !== 'SUCCESS') continue;
        const output = (transaction.unshieldedCreatedOutputs ?? []).find((item) => item.owner === recipient);
        if (output) return { ...transaction, block, output };
      }
    }
    await sleep(4000);
  }
  throw new Error(`Timed out waiting for a SUCCESS transaction creating an output for ${recipient}`);
}

async function submitFinalized(api, finalized) {
  const serialized = Buffer.from(finalized.serialize()).toString('hex');
  const extrinsic = api.tx.midnight.sendMnTransaction(`0x${serialized}`);
  const hash = await api.rpc.author.submitExtrinsic(extrinsic);
  return hash.toString();
}

async function runWalletFunding(selected, records) {
  if (selected.length < 2) throw new Error('Wallet funding needs slot 01 plus at least one destination');
  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch {
    throw new Error(`Missing DUST snapshot ${snapshotPath}. Run: npm run pilot:dust-sync`);
  }
  const seed = stressTestSecret(1);
  const keystore = createKeystore(seed, networkId);
  const zswapSecretKeys = ledger.ZswapSecretKeys.fromSeed(seed);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(seed);
  const configuration = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl,
      indexerWsUrl: indexerHttpUrl.replace(/^https:/, 'wss:') + '/ws',
    },
    relayURL: new URL(relayUrl),
    provingServerUrl: new URL(proofServerUrl),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
  };
  const restoredDust = DustWallet(configuration).restore(JSON.stringify(snapshot));
  const facade = await WalletFacade.init({
    configuration,
    shielded: (config) => ShieldedWallet(config).startWithSecretKeys(zswapSecretKeys),
    unshielded: (config) => UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(keystore)),
    dust: () => restoredDust,
  });
  const api = await ApiPromise.create({ provider: new WsProvider(relayUrl), throwOnConnect: false, noInitWarn: true });
  try {
    await facade.start(zswapSecretKeys, dustSecretKey);
    const initial = await facade.unshielded.waitForSyncedState();
    const dustState = await new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out reading restored DUST state')), 15_000);
      const subscription = restoredDust.state.subscribe((state) => {
        if (state.progress.appliedIndex >= BigInt(snapshot.offset ?? 0) && state.availableCoins.length > 0) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolvePromise(state);
        }
      });
    });
    console.log(`Source ${keystore.getBech32Address().toString()} balance: ${initial.availableCoins.reduce((sum, item) => sum + item.utxo.value, 0n)} raw NIGHT`);
    console.log(`Spendable DUST coins: ${dustState.availableCoins.length}`);
    if (dustState.availableCoins.length === 0) throw new Error('Restored DUST snapshot has no spendable coins');

    for (const record of selected.filter((item) => item.slot !== '01' && item.status !== 'CONFIRMED')) {
      await new Promise((resolvePromise, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for source UTXO to become available')), 120_000);
        const subscription = facade.unshielded.state.subscribe((state) => {
          if (state.availableCoins.length > 0) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolvePromise();
          }
        });
      });
      const start = await latestBlock();
      const destination = MidnightBech32m.parse(record.wallet_address).decode(UnshieldedAddress, networkId);
      const recipe = await facade.transferTransaction([{
        type: 'unshielded',
        outputs: [{ type: ledger.nativeToken().raw, receiverAddress: destination, amount: transferAmount }],
      }], { shieldedSecretKeys: zswapSecretKeys, dustSecretKey }, { ttl: new Date(Date.now() + 60 * 60 * 1000), payFees: true });
      const signed = await facade.signRecipe(recipe, (data) => keystore.signData(data));
      const finalized = await facade.finalizeRecipe(signed);
      const extrinsicHash = await submitFinalized(api, finalized);
      const confirmed = await waitForRecipientTx(record.wallet_address, start.height);
      record.transaction_reference = confirmed.hash;
      record.status = 'CONFIRMED';
      record.recorded_at_utc = new Date(confirmed.block.timestamp).toISOString();
      writeProofRecords(records);
      writeWalletRecords(records);
      console.log(`${record.slot}: ${confirmed.hash} (block ${confirmed.block.height}; extrinsic ${extrinsicHash})`);
    }
  } finally {
    await facade.stop().catch(() => {});
    await api.disconnect();
  }
}

async function runFaucet(selected, records) {
  const faucetUrl = (process.env.MIDNIGHT_FAUCET_URL ?? 'https://faucet.preprod.midnight.network/api').replace(/\/+$/, '');
  const amount = process.env.MIDNIGHT_FAUCET_AMOUNT ?? '1000';
  const captchaToken = process.env.MIDNIGHT_CAPTCHA_TOKEN;
  const captchaTokensPath = process.env.MIDNIGHT_CAPTCHA_TOKENS_FILE;
  const healthResponse = await fetch(`${faucetUrl}/health`);
  const health = await healthResponse.json();
  if (!healthResponse.ok || health.status !== 'SERVING') throw new Error(`Preprod faucet is not healthy: ${JSON.stringify(health)}`);
  console.log(`Preprod faucet stress-test: ${selected.length} addresses (${health.status})`);
  if (!execute) {
    console.log('Plan only. Use --execute for faucet requests, or --execute --fund-children after DUST sync.');
    return;
  }
  if (!captchaToken && !captchaTokensPath) throw new Error('Set MIDNIGHT_CAPTCHA_TOKEN or MIDNIGHT_CAPTCHA_TOKENS_FILE for faucet execution.');
  const captchaTokens = captchaTokensPath
    ? readFileSync(resolve(process.cwd(), captchaTokensPath), 'utf8').split(/\r?\n/).map((token) => token.trim()).filter(Boolean)
    : [captchaToken];
  if (captchaTokens.length < selected.length) throw new Error(`Need ${selected.length} fresh Turnstile tokens.`);
  let failures = 0;
  for (let index = 0; index < selected.length; index += 1) {
    const record = selected[index];
    try {
      const response = await fetch(`${faucetUrl}/drips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Captcha-Token': captchaTokens[index] },
        body: JSON.stringify({ recipientAddress: record.wallet_address, amount }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.dripId) throw new Error(payload.error ?? `HTTP ${response.status}`);
      record.drip_id = payload.dripId;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await sleep(2000);
        const poll = await (await fetch(`${faucetUrl}/drips/${payload.dripId}`)).json();
        if (poll.status === 'CONFIRMED') {
          record.status = 'CONFIRMED';
          record.transaction_reference = poll.transactionHash ?? '';
          record.recorded_at_utc = new Date().toISOString();
          break;
        }
        if (poll.status === 'FAILED') throw new Error(poll.error ?? 'Faucet drip failed');
      }
      if (record.status !== 'CONFIRMED') throw new Error('Timed out waiting for faucet confirmation');
    } catch (error) {
      failures += 1;
      console.error(`${record.slot}: ${error instanceof Error ? error.message : String(error)}`);
    }
    writeProofRecords(records);
    writeWalletRecords(records);
  }
  if (failures > 0) process.exitCode = 1;
}

const { records, selected } = loadRecords();
console.log(`Mode: ${fundChildren ? 'wallet transfers from slot 01' : execute ? 'faucet execution' : 'plan only'}`);
if (fundChildren) {
  if (!execute) console.log('Plan only. Use --execute --fund-children after npm run pilot:dust-sync completes.');
  else await runWalletFunding(selected, records);
} else {
  await runFaucet(selected, records);
}
