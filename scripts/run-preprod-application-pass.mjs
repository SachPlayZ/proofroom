import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runner = resolve(process.cwd(), 'scripts/deploy-proofroom-preprod.mjs');
const applicationCsv = resolve(process.cwd(), 'docs/preprod-application-transactions.csv');
const from = Number(process.env.PROOFROOM_APP_FROM ?? '1');
const to = Number(process.env.PROOFROOM_APP_TO ?? '50');

if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > 50 || from > to) {
  throw new Error('PROOFROOM_APP_FROM/TO must select slots in the range 1..50');
}

function recorded(slot) {
  if (!existsSync(applicationCsv)) return false;
  const prefix = `"${String(slot).padStart(2, '0')}",`;
  return readFileSync(applicationCsv, 'utf8').split(/\r?\n/).some((line) => line.startsWith(prefix) && (line.includes(',"SucceedEntirely",') || line.includes(',"SUCCESS",')));
}

for (let slot = from; slot <= to; slot += 1) {
  if (recorded(slot) && process.env.PROOFROOM_FORCE !== '1') {
    console.log(`slot ${String(slot).padStart(2, '0')} already has an application receipt; skipping`);
    continue;
  }
  console.log(`\n=== ProofRoom application slot ${String(slot).padStart(2, '0')} ===`);
  let completed = false;
  let lastError;
  for (let attempt = 1; attempt <= 3 && !completed; attempt += 1) {
    try {
      execFileSync(process.execPath, [runner, 'create-listing'], {
        stdio: 'inherit',
        timeout: 180_000,
        env: {
          ...process.env,
          PROOFROOM_SLOT: String(slot),
          PROOFROOM_DUST_SPONSOR_SLOT: process.env.PROOFROOM_DUST_SPONSOR_SLOT ?? '1',
        },
      });
      completed = true;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.log(`slot ${String(slot).padStart(2, '0')} attempt ${attempt} failed; retrying after 30s`);
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 30_000));
      }
    }
  }
  if (!completed) throw lastError;
}

console.log(`Application pass complete for slots ${from}..${to}`);
