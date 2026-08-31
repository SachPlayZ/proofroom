# Todo

## Release requirements plan

- [x] Add reproducible setup/usage docs, feedback loop, onboarding log, and submission evidence templates
- [x] Add CI/CD workflow, deployment configuration, profile/readme links, and release checklist
- [x] Initialize a focused git history with meaningful commits and verify the release locally
- [x] Reclassify the 50-wallet set as a Preprod stress-test input and add an executable faucet runner
- [x] Regenerate stress-test docs/CSV and verify the dry-run path
- [x] Publish the GitHub repository, live demo, and public demo-video link
- [x] Rebuild the README as a complete evidence index and add the reproducible transaction-proof CSV
- [ ] Collect 50 consented human Preprod wallet addresses and create the Product X profile (external accounts still required)
- [x] Confirm slot 01 funding and register its NIGHT output for DUST generation
- [x] Fund slots 02–50 with 49 confirmed Preprod transfers and record indexer hashes/blocks
- [x] Add reproducible stress-test runner, source-funding evidence, and README links

## Release verification

- [x] CI workflow passes tests/build/Compact compilation
- [x] README contains setup, usage, privacy, feedback, live links, and evidence links
- [x] README links every submission artifact and distinguishes confirmed on-chain evidence from stress-test plan rows
- [x] Evidence files have verifiable on-chain wallet/transaction fields (no fabricated data)
- [x] Every populated proof row maps to a SUCCESS transaction returned by the Preprod indexer
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
- [x] Remotion video uses a Playwright recording of the real app flow with cursor/click overlays and audio SFX

## Review

### Changed

- Created public repository: https://github.com/SachPlayZ/proofroom
- Added GitHub Actions verification + Pages deployment.
- Added onboarding, feedback, evidence, deployment, release-link, issue, and PR templates.
- Created a focused 35+ commit history and pushed `main`.

- Added the Compact contract, typed fixtures, deterministic mock attesters, AES-GCM dossier encryption, role-based React UI, tests, and README.
- Added attester registration and public one-time nullifiers to the contract.
- Marked the UI as a local demo so it does not imply a completed Preprod deployment.
- Added `npm run pilot:wallets` for deterministic Preprod stress-test addresses and `npm run pilot:stress` for faucet health checks and explicit request execution.
- Added a synthetic feedback rehearsal CSV and a 60-second H.264 Remotion demo source/render.
- Replaced the slide-style demo with a real app recording, visible interaction cursor/ripples, and local click/switch/ding/whoosh tracks.
- Rebuilt `README.md` as the submission evidence index with setup, privacy model, role flow, feedback, CI/CD, video, stress-test, and deployment handoff sections.
- Added the pinned Midnight wallet/DUST SDK stack, a public DUST snapshot builder, direct Preprod RPC submission, and an indexer verifier.
- Added `docs/preprod-source-funding.md`; wallet generation preserves confirmed hashes and `docs/pilot-transaction-proof.csv` now stores block/amount evidence.

### Verified

- `npm test` — 7 tests passed.
- `npm run build` — production bundle built.
- `npm run compact` — 7 circuits compiled with Compact 0.31.1.
- In-app browser smoke test — end-to-end happy path passed; verifier cannot see the decrypted dossier.
- Deployed browser smoke test — live GitHub Pages flow passed end-to-end.
- `npm run pilot:wallets -- 50` — 50 address rows generated.
- `npm run pilot:stress -- 50` — Preprod faucet health `SERVING`; plan-only mode confirmed no submissions.
- `MIDNIGHT_CAPTCHA_TOKEN=test-token-not-valid npm run pilot:stress -- 1 --execute` — real faucet path reached; rejected by Turnstile, so no hash was recorded.
- `npm run pilot:wallets -- 50` — regenerated 50-address wallet CSV and 50-row transaction-proof register.
- `npm run pilot:dust-sync` — replayed the public DUST ledger and produced a local slot-01 snapshot.
- `npm run pilot:stress -- 50 --execute --fund-children` — 49 serial source-to-destination transfers confirmed on Preprod (50 unique hashes including slot 01 funding).
- `npm run pilot:verify` — independently resolved all 50 hashes to `SUCCESS` outputs and wrote block height/hash/amount fields.
- `video/npm run lint && video/npm run build` — Remotion bundle checks passed.
- `ffprobe video/out/proofroom-demo.mp4` — 60.053333-second H.264 MP4 verified.

### Risks

- 50 consented human participant records and the Product X profile remain outstanding external requirements; the Compact deployment/integration is complete.
- The faucet’s external Turnstile gate blocked direct batch drips; the confirmed run used the operator-funded slot-01 wallet and fee-paying RPC transfers instead.
- 50 verified Preprod participants and the Product X profile require real external participants/accounts; the demo video is now public as a release asset.
- Generated wallet keys are deterministic stress-test keys; use only on Preprod and record confirmed hashes from the runner. The rendered MP4 is public as a GitHub release asset, but still needs to be mirrored into the final submission form.
- Attester signatures are deterministic mock fixtures; production signature verification still needs to be implemented inside the circuit.
- Dossier ciphertext and key are memory-only in the demo.

### Follow-ups

- Collect opt-in participant evidence and create the Product X profile when those external accounts are available.

## Active work

The funded source is slot 01. Its faucet transaction, DUST-registration transaction, and 49 serial child transfers are confirmed; contract deployment and 50 application calls are also verified. Consented participant evidence remains a separate outstanding requirement.

## Application transaction pass

- [x] Pin compatible Midnight.js/Compact runtime packages from the official Preprod examples
- [x] Add a reproducible Preprod deployment and contract-call runner using the managed ProofRoom binding
- [x] Deploy ProofRoom to Preprod and record the contract address/transaction reference
- [x] Submit one real ProofRoom application call from each funded wallet; record only confirmed indexer evidence
- [x] Independently verify application hashes, blocks, caller addresses, and public ledger fields
- [x] Update README and release evidence to distinguish application calls from funding transfers

## Application verification

- [x] `npm run compact`
- [x] `npm test`
- [x] `npm run build`
- [x] Preprod deployment and application-call runner complete without fabricated rows
- [x] Indexer verification confirms every populated application row

## Application pass review

### Changed

- Deployed ProofRoom to Preprod and ran `createListing` from all 50 deterministic stress-test caller wallets.
- Added targeted indexer verification, retry-safe application batch runner, clean DUST replay, and password-safe local private-state encryption.
- Updated the evidence README/registers with deployment and application receipt links.

### Verified

- `docs/preprod-application-transactions.csv`: 50 unique slots, 50 unique caller addresses, 50 `SUCCESS` rows.
- `npm run pilot:verify-app`: every row matched its tx ID, contract action, SUCCESS status, block, and indexer ID.
- `npm run pilot:verify`: all 50 funding rows independently re-resolved to SUCCESS outputs.
- `npm run compact`, `npm test`, `npm run build`: passed.

### Risks

- Deterministic slots are testnet stress-test wallets, not 50 human participants; participant evidence and Product X remain external follow-ups.
- Slot 01 sponsors DUST fees for the 49 other application calls; caller addresses remain distinct and public in the application CSV.
