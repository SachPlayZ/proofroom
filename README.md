# ProofRoom

Private SaaS acquisition screening on Midnight.

[![CI/CD](https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml/badge.svg)](https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml) [![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-0b6e4f)](https://sachplayz.github.io/proofroom/) [![Video](https://img.shields.io/badge/video-60s%20Remotion-7c3aed)](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4)

> **One-sentence privacy use case:** sellers prove business quality and buyers prove funds without publishing revenue, balances, identities, customers, or documents.

ProofRoom is a focused pre-diligence filter for small SaaS acquisitions. It demonstrates the Midnight privacy boundary: private witness data stays client-side, while Compact produces a public qualification result and encrypted-dossier access receipt.

## Submission evidence

This table is the source of truth for the Level 4/5 submission checklist. Values marked pending are deliberately not fabricated; they require a live wallet, participant, or external account action.

| Requirement | Evidence | Status |
| --- | --- | --- |
| Public repository | [github.com/SachPlayZ/proofroom](https://github.com/SachPlayZ/proofroom) | live |
| Live demo | [sachplayz.github.io/proofroom](https://sachplayz.github.io/proofroom/) | live GitHub Pages demo |
| Working Preprod contract | [Preprod evidence register](docs/preprod-evidence.md) | deployed and verified on Midnight Preprod |
| Contract/transaction references | [deployment](docs/proofroom-preprod-deployment.json), [application calls](docs/preprod-application-transactions.csv), [funding register](docs/pilot-transaction-proof.csv) | deployment + confirmed application/funding receipts |
| 50 Preprod user addresses | [Participant evidence template](docs/preprod-users.csv) | 0/50 verified participant rows; do not confuse with stress-test addresses |
| 50 separate stress-test wallets | [Pilot wallet set](docs/pilot-wallets.csv) | 50 distinct valid `mn_addr_preprod1...` callers; funding + application receipts confirmed |
| Feedback loop | [Feedback loop](docs/feedback-loop.md) + [feedback log](docs/feedback-log.md) | documented; pilot collection pending |
| Structured feedback CSV | [Pilot feedback](docs/pilot-feedback.csv) | 20 synthetic rehearsal rows, explicitly not participant evidence |
| Updated documentation | this README + [setup/deployment](docs/deployment.md) + [onboarding](docs/onboarding.md) | included |
| CI/CD | [workflow](.github/workflows/ci.yml) | tests, build, Compact compile, wallet generation, Remotion bundle, Pages deploy |
| Latest passing CI run | [run 33306462901](https://github.com/SachPlayZ/proofroom/actions/runs/33306462901) | passed on the evidence implementation commit |
| Product X profile | [release links](docs/release-links.md) | pending account creation, per request |
| Demo video | [60-second Remotion MP4](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4) | public release asset; real app flow + cursor/click SFX |
| Demo script | [demo script](docs/demo-script.md) | ready |
| Commit threshold | [public commit history](https://github.com/SachPlayZ/proofroom/commits/main) | more than 20 focused commits |

The machine-readable handoff is also maintained in [`docs/release-links.md`](docs/release-links.md). It lists every URL/value that must be replaced before claiming a completed Preprod deployment.

## What is implemented

1. A seller publishes an anonymous listing with an asking-price floor, dossier ciphertext hash, and listing-scoped commitment.
2. A buyer publishes screening thresholds and a buyer commitment.
3. The seller proves signed mock Stripe metrics satisfy every threshold. Only `qualified=true` is public.
4. The buyer proves signed mock bank funds meet the asking-price floor. Exact balance stays private.
5. After both proofs pass, the seller grants that buyer access to an AES-GCM encrypted dossier. The demo decrypts locally.
6. A public verifier sees commitments, thresholds, outcomes, nullifiers, ciphertext hashes, and access status—never the private witnesses.

The Compact lifecycle is:

`registerAttester → createListing → createMatchRequest → proveSellerQualification → proveBuyerFunds → grantDossierAccess → closeListing`

The repository intentionally excludes escrow, acquisition settlement, real Stripe/open-banking integrations, AI, custom tokens, cross-chain execution, and legal NDA enforcement. Attesters are deterministic mock services for a reproducible hackathon demo, not claims of production financial trustlessness.

## Run the application

Requirements: Node.js 22+, npm, and the Compact toolchain used by the CI workflow.

```bash
git clone https://github.com/SachPlayZ/proofroom.git
cd proofroom
npm ci
npm run dev
```

Open the Vite URL. Use the three role modes in this order:

- **Seller:** create the listing and prove the private Stripe fixture.
- **Buyer:** set thresholds, submit a match request, and prove the private bank fixture.
- **Seller:** grant dossier access after both proofs pass; unlock the encrypted dossier.
- **Public verifier:** inspect the public receipt and privacy boundary.

The UI is marked **LOCAL DEMO** on purpose. It is a working product flow around the contract boundary, not a claim that the generated bindings are already connected to a deployed network. Dossier ciphertext/key storage is memory-only in this prototype.

## Compact contract and privacy model

The source contract is [`compact/proofroom.compact`](compact/proofroom.compact), targeting Compact `0.31.1`. Compile it with:

```bash
npm run compact
```

Generated managed artifacts are written to `compact/managed/` (ignored by git). Public state contains listing/request IDs, thresholds, asking-price floors, attester keys/expiry, commitments, one-time nullifiers, qualification booleans, dossier ciphertext hashes, and access status. Private state contains company identity, revenue, retention, refunds, customer data, buyer identity, exact funds, signed payloads, salts, secrets, and encryption keys.

Fresh salted commitments, listing-scoped pseudonyms, and one-time nullifiers prevent replay and reduce cross-listing correlation. The buyer request is bound to the buyer commitment before the funds proof can pass; the seller proof is bound to the listing commitment. Proof generation belongs on the user device/local proof boundary because witness data must not be sent to an untrusted server.

## Preprod stress test and transaction proof CSV

Generate the 50-address testnet set and refresh both CSVs:

```bash
npm run pilot:wallets -- 50
npm run pilot:stress -- 50
```

This creates [`docs/pilot-wallets.csv`](docs/pilot-wallets.csv) and [`docs/pilot-transaction-proof.csv`](docs/pilot-transaction-proof.csv). Every address is a distinct valid Preprod address. In the proof register, `plan_reference` is a deterministic stress-test ID; `transaction_reference` is populated only with a real indexer-confirmed hash. Slot 01's confirmed funding and DUST registration are documented in [`docs/preprod-source-funding.md`](docs/preprod-source-funding.md).

The Preprod faucet requires a fresh Cloudflare Turnstile token for every request. Execute one request after completing the live faucet challenge:

```bash
export MIDNIGHT_CAPTCHA_TOKEN='<fresh token from the faucet widget>'
npm run pilot:stress -- 1 --execute
```

For all 50 addresses, place 50 fresh single-use tokens in an untracked file and run:

```bash
MIDNIGHT_CAPTCHA_TOKENS_FILE=/path/to/tokens.txt npm run pilot:stress -- 50 --execute
```

The runner submits to the [Midnight Preprod faucet](https://faucet.preprod.midnight.network/), polls each drip, and overwrites the proof register with confirmed faucet transaction hashes. It refuses to run without fresh tokens, so this repository never invents on-chain evidence.

To use the funded slot 01 source wallet instead of the faucet, first replay the public DUST ledger into a local cache, then execute one fee-paying transfer per destination:

```bash
npm run pilot:dust-sync
npm run pilot:stress -- 50 --execute --fund-children
npm run pilot:verify
```

The transfer runner submits finalized transactions through the Preprod RPC and polls the indexer for a `SUCCESS` output to each destination before writing its hash. `pilot:verify` independently resolves every hash to a `SUCCESS` output and adds block height/hash and amount evidence. It is resumable: already-confirmed rows remain in the CSV and each successful row is written immediately.

Slot 01's faucet funding (`55847e8cf1b4ab68596759cee6f847ee088b87c832d0caedbdb3dd1bd193718d`) and DUST registration (`e29d76daa081f9991bd4235e6131378c54020d2593da5432cffdea1124e65b98`) are independently recorded in [`docs/preprod-source-funding.md`](docs/preprod-source-funding.md).

These 50 receipts are genuine Preprod wallet/RPC/indexer stress-test transactions. They are the source-to-child funding layer, not ProofRoom application calls. The deployed Compact contract and its application receipts are tracked separately in [`docs/proofroom-preprod-deployment.json`](docs/proofroom-preprod-deployment.json) and [`docs/preprod-application-transactions.csv`](docs/preprod-application-transactions.csv).

### Live ProofRoom application pass

The managed binding is deployed at `0e0d4b0200dc7faeb0412e3f874867809c6e118b354e3ad48d9b465e2a247237` on Preprod. `npm run pilot:app` submits the real `createListing` circuit, proves locally through the pinned proof server, waits for indexer confirmation, and appends a receipt. Use a distinct caller with the deterministic stress-test slot while slot 01 is the disclosed DUST fee sponsor for this testnet batch:

```bash
PROOFROOM_SLOT=3 PROOFROOM_DUST_SPONSOR_SLOT=1 npm run pilot:app
npm run pilot:verify-app
```

The application CSV records only public transaction identifiers, caller addresses, contract address, status, block, timestamp, and indexer ID. It does not contain the private witness values. The fee-sponsor arrangement is a testnet operational detail: the circuit caller remains the slot wallet shown in the row, while DUST fees are paid by slot 01.

For the required 50 *participant* wallets, collect consent and real wallet/transaction/block references in [`docs/preprod-users.csv`](docs/preprod-users.csv). The deterministic stress-test set is not a substitute for those participant rows.

Full operating details: [`docs/preprod-stress-test.md`](docs/preprod-stress-test.md) and [`docs/preprod-evidence.md`](docs/preprod-evidence.md).

## Feedback and onboarding evidence

- [`docs/onboarding.md`](docs/onboarding.md): five-minute role-based onboarding and consent capture.
- [`docs/feedback-loop.md`](docs/feedback-loop.md): collection method, severity rubric, weekly prioritization, and documentation-sync rule.
- [`docs/feedback-log.md`](docs/feedback-log.md): redacted structured log and change decisions.
- [`docs/pilot-feedback.csv`](docs/pilot-feedback.csv): 20 clearly labeled rehearsal records used to exercise the import/reporting path.

Do not present rehearsal rows as feedback from 50 real Preprod users. Replace/add rows only after participants opt in and their wallet transactions are independently verifiable.

## Verification

```bash
npm test
npm run build
npm run compact
npm run pilot:wallets -- 50
npm run pilot:stress -- 50

cd video
npm ci
npm run lint
npm run build
```

The CI workflow repeats the deterministic checks, uploads the production artifact, bundles the Remotion composition, and deploys GitHub Pages on `main`. The one-minute video is rendered from a Playwright recording of the real local app flow (seller proof → buyer funds proof → access grant → local decrypt → public verifier), with a visible cursor, click ripples, and local click/switch/ding/whoosh effects.

Video source and reproducible commands: [`video/README.md`](video/README.md). Submission/demo narration: [`docs/demo-script.md`](docs/demo-script.md).

## Deployment and reproducibility

The repository pins the working Preprod stack (Midnight.js 4.1.1, ledger-v8 8.1.0, Compact runtime 0.16.0, and `midnightntwrk/proof-server:8.1.0`). Re-run the deployment or attach to the recorded contract with:

```bash
npm run compact
npm run pilot:dust-sync
npm run pilot:deploy
PROOFROOM_CONTRACT_ADDRESS=0e0d4b0200dc7faeb0412e3f874867809c6e118b354e3ad48d9b465e2a247237 npm run pilot:deploy
```

`pilot:verify-app` independently checks every application row against the Preprod GraphQL indexer and refreshes the canonical regular transaction hash, block hash, timestamp, and indexer ID. Never add a receipt manually.

The runner keeps the public-ledger replay snapshot (`.proofroom-cache/slot-01-dust.json`) separate from the mutable fee-sponsor snapshot (`.proofroom-cache/slot-01-dust-app.json`, both ignored). This prevents replaying a locally spent DUST coin twice; if rebuilding after a run, use `PROOFROOM_DUST_FROM_START=1` with a fresh output file.

Product X and the 50 consented human participant rows remain intentionally pending until those external accounts/participants exist; the deterministic slots are explicitly a reproducible stress-test set.

See [`docs/deployment.md`](docs/deployment.md) for the runbook and [`docs/release-links.md`](docs/release-links.md) for the submission gate.

## Scope note

ProofRoom is a hackathon MVP and pre-diligence filter. It does not replace legal, financial, tax, security, or technical due diligence. Never put production credentials or real customer data in the fixtures or repository.
