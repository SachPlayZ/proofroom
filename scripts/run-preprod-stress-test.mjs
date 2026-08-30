import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const countArg = args.find((arg) => /^\d+$/.test(arg));
const count = Number(countArg ?? 50);
const execute = args.includes('--execute');
const faucetUrl = (process.env.MIDNIGHT_FAUCET_URL ?? 'https://faucet.preprod.midnight.network/api').replace(/\/+$/, '');
const amount = process.env.MIDNIGHT_FAUCET_AMOUNT ?? '1000';
const captchaToken = process.env.MIDNIGHT_CAPTCHA_TOKEN;
const captchaTokensPath = process.env.MIDNIGHT_CAPTCHA_TOKENS_FILE;
const inputPath = resolve(process.cwd(), 'docs/pilot-wallets.csv');
const resultPath = resolve(process.cwd(), 'docs/pilot-transaction-proof.csv');

if (!Number.isInteger(count) || count < 1 || count > 500) {
  throw new Error('Usage: npm run pilot:stress -- [count 1..500] [--execute]');
}

function parseCsvLine(line) {
  return line.split(',').map((value) => value.replace(/^"|"$/g, '').replaceAll('""', '"'));
}

function csv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

const lines = readFileSync(inputPath, 'utf8').trim().split('\n');
const headers = parseCsvLine(lines.shift());
const records = lines.map(parseCsvLine).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
const selected = records.slice(0, count);

if (selected.length !== count || selected.some((record) => !record.wallet_address.startsWith('mn_addr_preprod1'))) {
  throw new Error(`Expected ${count} Preprod stress-test addresses in ${inputPath}`);
}

const healthResponse = await fetch(`${faucetUrl}/health`);
const health = await healthResponse.json();
if (!healthResponse.ok || health.status !== 'SERVING') {
  throw new Error(`Preprod faucet is not healthy: ${JSON.stringify(health)}`);
}

console.log(`Preprod stress-test: ${selected.length} addresses`);
console.log(`Faucet: ${faucetUrl} (${health.status})`);
console.log(`Mode: ${execute ? 'execute faucet requests' : 'plan only (no submissions)'}`);

if (!execute) {
  console.log('To submit one request, set MIDNIGHT_CAPTCHA_TOKEN; for a batch, provide MIDNIGHT_CAPTCHA_TOKENS_FILE with one fresh token per address.');
  process.exit(0);
}

if (!captchaToken) {
  if (!captchaTokensPath) {
    throw new Error('Set MIDNIGHT_CAPTCHA_TOKEN for one request or MIDNIGHT_CAPTCHA_TOKENS_FILE with one fresh Turnstile token per request.');
  }
}

const captchaTokens = captchaTokensPath
  ? readFileSync(resolve(process.cwd(), captchaTokensPath), 'utf8').split(/\r?\n/).map((token) => token.trim()).filter(Boolean)
  : [captchaToken];
if (captchaTokens.length < selected.length) {
  throw new Error(`Need ${selected.length} fresh Turnstile tokens in ${captchaTokensPath ?? 'MIDNIGHT_CAPTCHA_TOKEN'}; tokens are not reusable across requests.`);
}

const resultRows = [
  ['slot', 'role', 'wallet_address', 'drip_id', 'transaction_reference', 'status', 'network', 'recorded_at_utc'],
];
let failures = 0;

for (const record of selected) {
  let dripId = '';
  let transactionReference = '';
  let status = 'FAILED';
  try {
    const response = await fetch(`${faucetUrl}/drips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Captcha-Token': captchaTokens[resultRows.length - 1] },
      body: JSON.stringify({ recipientAddress: record.wallet_address, amount }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.dripId) throw new Error(payload.error ?? `HTTP ${response.status}`);
    dripId = payload.dripId;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      await sleep(2000);
      const pollResponse = await fetch(`${faucetUrl}/drips/${dripId}`);
      const poll = await pollResponse.json();
      if (!pollResponse.ok) throw new Error(poll.error ?? `HTTP ${pollResponse.status}`);
      if (poll.status === 'CONFIRMED') {
        status = 'CONFIRMED';
        transactionReference = poll.transactionHash ?? '';
        break;
      }
      if (poll.status === 'FAILED') throw new Error(poll.error ?? 'Faucet drip failed');
    }
    if (status !== 'CONFIRMED') throw new Error('Timed out waiting for faucet confirmation');
  } catch (error) {
    failures += 1;
    console.error(`${record.slot}: ${error instanceof Error ? error.message : String(error)}`);
  }

  resultRows.push([
    record.slot,
    record.role,
    record.wallet_address,
    dripId,
    transactionReference,
    status,
    'preprod',
    new Date().toISOString(),
  ]);
}

writeFileSync(resultPath, `${resultRows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Wrote stress-test results to ${resultPath}`);
if (failures > 0) process.exitCode = 1;
