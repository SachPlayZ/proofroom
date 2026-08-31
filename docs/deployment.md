# Deployment runbook

## Local release gate

```bash
npm ci
npm test
npm run build
npm run compact
```

Install the Compact toolchain using the version pinned in `package.json`/README and verify `compact compile --version` before compiling.

## GitHub Pages

The workflow in `.github/workflows/ci.yml` verifies tests, builds the frontend, compiles Compact, and deploys `dist/` to GitHub Pages on pushes to `main`. Enable Pages with **GitHub Actions** as the source in repository settings, then copy the resulting URL into `docs/release-links.md`.

## Midnight Preprod

Before deployment, pin compatible Midnight.js, Compact runtime, wallet, proof-server, and Node versions against the current Midnight compatibility matrix. Deploy the generated `compact/managed/` contract with the official example-counter/example-bboard workflow, then record:

- contract address;
- deployment transaction hash and block;
- one transaction/block reference per pilot wallet;
- proof-server and SDK versions;
- explorer URLs.

The current repository deliberately does not contain secrets, seed phrases, or wallet credentials. Start the local proving service used by the runner with the pinned image:

```bash
docker run --rm --name proofroom-proof-server -p 6300:6300 midnightntwrk/proof-server:8.1.0
```

The live Preprod deployment is recorded in [`proofroom-preprod-deployment.json`](./proofroom-preprod-deployment.json); application receipts are recorded in [`preprod-application-transactions.csv`](./preprod-application-transactions.csv) and must be refreshed only with `npm run pilot:verify-app`.

The app runner uses a separate ignored sponsor snapshot (`.proofroom-cache/slot-01-dust-app.json`). Keep it separate from the replay snapshot so public DUST events are never applied twice.
