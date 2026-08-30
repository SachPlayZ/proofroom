# ProofRoom

Private pre-diligence screening for small SaaS acquisitions.

> Local demo release. [Public GitHub repository](https://github.com/SachPlayZ/proofroom). Preprod, X, and pilot evidence links are tracked in [`docs/release-links.md`](docs/release-links.md) and are intentionally not fabricated.

**Live demo:** <https://sachplayz.github.io/proofroom/>

ProofRoom lets a seller prove that a business meets a buyer's screening policy and lets the buyer prove available funds. The exact metrics, balance, identities, and data-room contents remain private; the public receipt contains only commitments, qualification outcomes, and an encrypted dossier hash.

## Run the demo

```bash
npm install
npm run dev
```

Open the Vite URL, then use **View as Seller** to prove the private Stripe fixture, **View as Buyer** to prove the private bank fixture, and return to Seller to grant the encrypted dossier. Switch to **Public verifier** to inspect the public-only view.

The dossier uses browser-native AES-GCM. Its ciphertext is stored only in memory for this prototype.

The UI is marked **LOCAL DEMO** on purpose: it does not claim a live Preprod deployment. A wallet, Midnight.js runtime, proof server, and funded Preprod account are required before wiring the generated contract bindings to a network.

## Pilot operations

- [Setup and deployment runbook](docs/deployment.md)
- [Five-minute onboarding flow](docs/onboarding.md)
- [Structured feedback loop and prioritization](docs/feedback-loop.md)
- [Redacted feedback log](docs/feedback-log.md)
- [50-wallet evidence template](docs/preprod-users.csv)
- [Preprod stress-test addresses](docs/pilot-wallets.csv) (`npm run pilot:wallets`)
- [Preprod stress-test runner](docs/preprod-stress-test.md) (`npm run pilot:stress`)
- [Pilot feedback CSV](docs/pilot-feedback.csv) — synthetic rehearsal data only
- [Preprod evidence register](docs/preprod-evidence.md)
- [Release links and submission gate](docs/release-links.md)
- [Two-minute demo script](docs/demo-script.md)
- [Rendered one-minute Remotion video](https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4) (real app recording + interaction SFX)

## Compile the Compact contract

The contract targets Compact `0.31.1` and lives at `compact/proofroom.compact`:

```bash
npm run compact
```

The generated artifacts are written to `compact/managed/` (ignored by git). The contract implements the single-contract lifecycle:

`registerAttester → createListing → createMatchRequest → proveSellerQualification → proveBuyerFunds → grantDossierAccess → closeListing`

`usedNullifiers` is a public one-time receipt map. The nullifier is the only replay-prevention value disclosed; metric witnesses, attestation payloads, and wallet secrets are not ledger fields.

Buyer requests are bound to a wallet-derived buyer commitment before the funds circuit can pass; seller proofs are similarly bound to the listing commitment.

The UI is intentionally a deterministic demo shell around the contract boundary. Attestation signatures are mock fixtures, not live Stripe or bank integrations, and the Compact prototype models attester registration without verifying a production signature scheme. Wire the generated contract bindings to Midnight.js and a local proof server before using real funds or production data.

## Verify

```bash
npm test
npm run build
npm run compact
```

The current MVP does not implement escrow, acquisition settlement, custom shielded tokens, cross-chain execution, or legal NDA enforcement.

## CI/CD

`.github/workflows/ci.yml` runs `npm ci`, tests, the production build, Compact compilation, stress-test address generation, and Remotion lint/bundling before publishing a Pages artifact. A push to `main` deploys the frontend to GitHub Pages after verification. Enable GitHub Pages with **GitHub Actions** as its source, then copy the generated URL to `docs/release-links.md`.

[View the CI/CD workflow](https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml)

## Preprod handoff

Not performed in this repository because no wallet credentials or funded account are present. Before submission, pin the Midnight.js/proof-server versions from the compatibility matrix, deploy `compact/managed/`, replace the demo network/contract labels, and record the contract address, transaction hashes, block references, and a reproducible wallet-flow video in the submission notes.
