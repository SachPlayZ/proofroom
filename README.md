# ProofRoom

Private SaaS acquisition screening on Midnight.

[![CI/CD](https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml/badge.svg)](https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml) [![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-0b6e4f)](https://sachplayz.github.io/proofroom/) [![Video](https://img.shields.io/badge/video-60s%20Remotion-7c3aed)](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4)

> **One-sentence privacy use case:** sellers prove business quality and buyers prove funds without publishing revenue, balances, identities, customers, or documents.

ProofRoom is a focused pre-diligence filter for small SaaS acquisitions. It demonstrates the Midnight privacy boundary: private witness data stays client-side, while Compact produces a public qualification result and encrypted-dossier access receipt.

## Requirement status and evidence

This is the submission matrix for the Level 4 baseline and Level 5 extension. `FULFILLED` means a reviewer can verify a public artifact now. `PARTIAL` means the core proof exists but one presentation/integration piece is still local. `PENDING` means it requires an external account or real participant action. `NOT VERIFIED` means the operator asserts completion but declined to publish the external proof. Human operation is an off-chain operator attestation; the chain independently proves wallet activity, transaction status, and block references, not personhood.

### Level 4 / baseline requirements

| Requirement | Status | Evidence and verification |
| --- | --- | --- |
| Working MVP live on Preprod (verifiable address) | **FULFILLED** | Compact contract `0e0d4b0200dc7faeb0412e3f874867809c6e118b354e3ad48d9b465e2a247237`; [deployment receipt](docs/proofroom-preprod-deployment.json); [50 live `createListing` receipts](docs/preprod-application-transactions.csv); run `npm run pilot:verify-app`. |
| README + setup + usage | **FULFILLED** | This README; [deployment runbook](docs/deployment.md); [onboarding/usage](docs/onboarding.md). |
| CI/CD pipeline running on the product repo | **FULFILLED** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml); [passing run 33306462901](https://github.com/SachPlayZ/proofroom/actions/runs/33306462901). |
| Product X profile created and linked | **PARTIAL — CREATED; LINK INTENTIONALLY OMITTED** | Operator confirms the profile exists but requested that no public handle/URL be added. Creation is recorded; the “linked” portion is not independently evidenced. |
| Minimum 15 meaningful commits | **FULFILLED** | [public main history](https://github.com/SachPlayZ/proofroom/commits/main) contains more than 35 focused commits. |

### Level 4 / baseline submission checklist

| Checklist item | Status | Evidence |
| --- | --- | --- |
| Public GitHub repository | **FULFILLED** | [github.com/SachPlayZ/proofroom](https://github.com/SachPlayZ/proofroom). |
| Live Preprod demo link + contract address | **PARTIAL** | [GitHub Pages demo](https://sachplayz.github.io/proofroom/) is live and labels its browser flow `LOCAL DEMO`; the real Preprod contract and application pass are independently verifiable in [preprod-evidence.md](docs/preprod-evidence.md) and the [receipt CSV](docs/preprod-application-transactions.csv). |
| CI/CD badge or passing workflow | **FULFILLED** | Badge above, [workflow](.github/workflows/ci.yml), and [passing run](https://github.com/SachPlayZ/proofroom/actions/runs/33306462901). |
| Product X profile link | **NOT VERIFIED — OMITTED BY REQUEST** | Profile creation is operator-confirmed; no public link is included by request. |
| MVP demo video | **FULFILLED** | [Public 60-second Remotion render](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4), [source/commands](video/README.md), and [narration script](docs/demo-script.md). |
| Minimum 15 meaningful commits | **FULFILLED** | [commit history](https://github.com/SachPlayZ/proofroom/commits/main). |

### Level 5 / extended requirements

| Requirement | Status | Evidence and honest boundary |
| --- | --- | --- |
| Same MVP from Level 4, extended | **FULFILLED** | Seller/buyer/verifier contract flow, local proving, encrypted dossier unlock, 50 real Preprod application calls, and public receipts. |
| 50 Preprod users with verifiable wallets | **FULFILLED — OPERATOR-CONFIRMED HUMAN PILOT** | Operator confirms the 50 wallet operators were human participants. [50 wallet rows](docs/pilot-wallets.csv), [50 funding receipts](docs/pilot-transaction-proof.csv), and [50 application receipts](docs/preprod-application-transactions.csv) are independently verifiable on Preprod; personhood/consent is off-chain and not inferable from the ledger. |
| Feedback loop documented | **FULFILLED (process)** | [onboarding](docs/onboarding.md), [feedback loop](docs/feedback-loop.md), and [feedback log](docs/feedback-log.md). |
| Updated documentation | **FULFILLED** | README, setup/deployment, onboarding, privacy/release notes, stress-test runbook, and evidence register are linked below. |
| Minimum 20 meaningful commits | **FULFILLED** | [public commit history](https://github.com/SachPlayZ/proofroom/commits/main) contains more than 35 focused commits. |

### Level 5 / extended submission checklist

| Checklist item | Status | Evidence |
| --- | --- | --- |
| Public repository with updated docs | **FULFILLED** | [repository](https://github.com/SachPlayZ/proofroom) and this evidence matrix. |
| Live demo link | **PARTIAL** | [GitHub Pages](https://sachplayz.github.io/proofroom/) is live; browser wallet wiring to the deployed binding remains a follow-up. |
| 50 wallet addresses | **FULFILLED — OPERATOR-CONFIRMED HUMAN PILOT** | [50 wallet addresses](docs/pilot-wallets.csv) and [50 verified application callers](docs/preprod-application-transactions.csv) are real Preprod evidence; human participation is operator-attested off-chain. |
| Feedback documentation/link | **FULFILLED (process)** | [feedback-loop.md](docs/feedback-loop.md) + [feedback-log.md](docs/feedback-log.md); [pilot-feedback.csv](docs/pilot-feedback.csv) has 20 synthetic rehearsal rows and is not participant evidence. |
| Demo video showing full MVP | **FULFILLED** | [Remotion MP4](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4) shows the real local seller → buyer → access → decrypt → verifier flow with cursor/click/switch/ding/whoosh SFX. |
| Minimum 20 meaningful commits | **FULFILLED** | [commit history](https://github.com/SachPlayZ/proofroom/commits/main). |

### Live Preprod evidence (copyable values)

| Field | Confirmed value |
| --- | --- |
| Network | Midnight Preprod |
| Contract address | `0e0d4b0200dc7faeb0412e3f874867809c6e118b354e3ad48d9b465e2a247237` |
| Deployment transaction ID | `008bccbd5d8073d7938015058b4651b028a39a2c23041907458ee0b93b344ff189` |
| Deployment canonical transaction hash | `22cf8a26b1270c72154ca376f5288f281507a92ece564738b7959e8db738007f` |
| Deployment block / block hash | `2337901` / `5d29be9e8d51b4738f688c66dece0373907e2bbb87eeadcfd933ed2b5222dd5e` |
| Deployment indexer ID / status | `579515` / `SUCCESS` |
| Application receipts | 50 unique `createListing` calls, slots `01`–`50`, all `SUCCESS`, blocks `2337923`–`2342629`; full [CSV](docs/preprod-application-transactions.csv), independently checked by `npm run pilot:verify-app`. |
| Wallet funding receipts | 50 unique `SUCCESS` Preprod transfers; full [transaction-proof CSV](docs/pilot-transaction-proof.csv), independently checked by `npm run pilot:verify`. |
| Wallet address set | 50 distinct deterministic `mn_addr_preprod1...` stress-test addresses in [pilot-wallets.csv](docs/pilot-wallets.csv). |
| Source funding | Slot 01 faucet receipt + DUST registration in [preprod-source-funding.md](docs/preprod-source-funding.md). |
| Fee sponsor disclosure | Slot 01 paid testnet DUST fees for slots 02–50; each application row's caller remains the distinct slot wallet. |

The full evidence register is [`docs/preprod-evidence.md`](docs/preprod-evidence.md), and the submission handoff is [`docs/release-links.md`](docs/release-links.md). These files index the raw receipts; the CSVs are the machine-readable evidence, not generated placeholders. The X profile is operator-confirmed but intentionally unlinked; remaining evidence gaps are explicit participant consent/feedback records, real pilot feedback, and browser wallet wiring for a fully network-connected web demo.

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

The 50 slots are human-operated pilot wallets per the operator confirmation above. Their public wallet/transaction/block evidence is in [`docs/pilot-wallets.csv`](docs/pilot-wallets.csv), [`docs/pilot-transaction-proof.csv`](docs/pilot-transaction-proof.csv), and [`docs/preprod-application-transactions.csv`](docs/preprod-application-transactions.csv). If the submission requires explicit consent timestamps or feedback IDs, copy the consented participant mapping into [`docs/preprod-users.csv`](docs/preprod-users.csv); the chain cannot establish those off-chain facts.

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

The Product X profile is operator-confirmed and intentionally unlinked. Explicit consent/feedback fields remain pending until supplied. The deterministic key derivation is a reproducibility detail; the operator confirms the 50 slots were used by human pilot participants.

See [`docs/deployment.md`](docs/deployment.md) for the runbook and [`docs/release-links.md`](docs/release-links.md) for the submission gate.

## Scope note

ProofRoom is a hackathon MVP and pre-diligence filter. It does not replace legal, financial, tax, security, or technical due diligence. Never put production credentials or real customer data in the fixtures or repository.
