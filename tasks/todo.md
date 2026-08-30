# Todo

## Release requirements plan

- [x] Add reproducible setup/usage docs, feedback loop, onboarding log, and submission evidence templates
- [x] Add CI/CD workflow, deployment configuration, profile/readme links, and release checklist
- [x] Initialize a focused git history with meaningful commits and verify the release locally
- [x] Generate 50 format-valid offline wallet fixtures, 20 synthetic pilot-feedback records, and a one-minute Remotion demo
- [x] Publish the GitHub repository, live demo, and public demo-video link
- [ ] Collect real Preprod wallet addresses, deploy the contract/demo, and create the Product X profile

## Release verification

- [x] CI workflow passes tests/build/Compact compilation
- [x] README contains setup, usage, privacy, feedback, live links, and evidence links
- [ ] Evidence files have verifiable on-chain wallet/transaction fields (no fabricated data)
- [x] Public GitHub repository and live GitHub Pages demo verified

## Plan

- [x] Create project scaffold, Compact contract, and typed domain model
- [x] Build role-based ProofRoom frontend with mock attestations and encrypted dossier flow
- [x] Add tests/docs and run compile, build, and behavior checks

## Verification

- [x] Compact contract compiles with Compact 0.31.1
- [x] Frontend production build succeeds
- [x] Core proof and encryption flows pass automated tests
- [x] Browser smoke test covers seller proof, buyer funds proof, access grant, local decrypt, and verifier privacy boundary
- [x] Wallet CSV has 50 rows; feedback CSV has 20 rows; Remotion render is 60.05 seconds

## Review

### Changed

- Created public repository: https://github.com/SachPlayZ/proofroom
- Added GitHub Actions verification + Pages deployment.
- Added onboarding, feedback, evidence, deployment, release-link, issue, and PR templates.
- Created a focused 34-commit history and pushed `main`.

- Added the Compact contract, typed fixtures, deterministic mock attesters, AES-GCM dossier encryption, role-based React UI, tests, and README.
- Added attester registration and public one-time nullifiers to the contract.
- Marked the UI as a local demo so it does not imply a completed Preprod deployment.
- Added `npm run pilot:wallets` for deterministic, format-valid Preprod address fixtures; every transaction reference is explicitly marked not submitted on-chain.
- Added a synthetic feedback rehearsal CSV and a 60-second H.264 Remotion demo source/render.

### Verified

- `npm test` — 7 tests passed.
- `npm run build` — production bundle built.
- `npm run compact` — 7 circuits compiled with Compact 0.31.1.
- In-app browser smoke test — end-to-end happy path passed; verifier cannot see the decrypted dossier.
- Deployed browser smoke test — live GitHub Pages flow passed end-to-end.
- `npm run pilot:wallets -- 50` — 50 address rows generated.
- `video/npm run lint && video/npm run build` — Remotion bundle checks passed.
- `ffprobe video/out/proofroom-demo.mp4` — 60.053333-second H.264 MP4 verified.

### Risks

- Preprod deployment, wallet integration, generated Midnight.js bindings, and transaction/block evidence remain outstanding because no funded wallet or deployment credentials are present.
- 50 verified Preprod participants, Product X profile, and demo video require real external participants/accounts and cannot be fabricated.
- Generated wallet keys are deterministic demo fixtures and must never be funded; the CSV is not on-chain evidence. The rendered MP4 is public as a GitHub release asset, but still needs to be mirrored into the final submission form.
- Attester signatures are deterministic mock fixtures; production signature verification still needs to be implemented inside the circuit.
- Dossier ciphertext and key are memory-only in the demo.

### Follow-ups

- Pin compatible Midnight.js/proof-server versions, wire managed bindings, deploy to Preprod, and record transaction/block evidence.
