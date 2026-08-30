# Todo

## Release requirements plan

- [x] Add reproducible setup/usage docs, feedback loop, onboarding log, and submission evidence templates
- [x] Add CI/CD workflow, deployment configuration, profile/readme links, and release checklist
- [x] Initialize a focused git history with meaningful commits and verify the release locally
- [ ] Collect real Preprod wallet addresses, deploy the contract/demo, publish GitHub/live/X/video links

## Release verification

- [x] CI workflow passes tests/build/Compact compilation
- [x] README contains setup, usage, privacy, feedback, live links, and evidence links
- [ ] Evidence files have verifiable on-chain wallet/transaction fields (no fabricated data)

## Plan

- [x] Create project scaffold, Compact contract, and typed domain model
- [x] Build role-based ProofRoom frontend with mock attestations and encrypted dossier flow
- [x] Add tests/docs and run compile, build, and behavior checks

## Verification

- [x] Compact contract compiles with Compact 0.31.1
- [x] Frontend production build succeeds
- [x] Core proof and encryption flows pass automated tests
- [x] Browser smoke test covers seller proof, buyer funds proof, access grant, local decrypt, and verifier privacy boundary

## Review

### Changed

- Added the Compact contract, typed fixtures, deterministic mock attesters, AES-GCM dossier encryption, role-based React UI, tests, and README.
- Added attester registration and public one-time nullifiers to the contract.
- Marked the UI as a local demo so it does not imply a completed Preprod deployment.

### Verified

- `npm test` — 7 tests passed.
- `npm run build` — production bundle built.
- `npm run compact` — 7 circuits compiled with Compact 0.31.1.
- In-app browser smoke test — end-to-end happy path passed; verifier cannot see the decrypted dossier.

### Risks

- Preprod deployment, wallet integration, generated Midnight.js bindings, and transaction/block evidence remain outstanding because no funded wallet or deployment credentials are present.
- Attester signatures are deterministic mock fixtures; production signature verification still needs to be implemented inside the circuit.
- Dossier ciphertext and key are memory-only in the demo.

### Follow-ups

- Pin compatible Midnight.js/proof-server versions, wire managed bindings, deploy to Preprod, and record transaction/block evidence.
