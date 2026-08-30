# Slot 01 Preprod funding evidence

This is the confirmed source-wallet funding used for the ProofRoom pilot stress test. The destination rows are populated only after the Preprod indexer reports a `SUCCESS` transaction that creates the destination output.

| Field | Confirmed value |
| --- | --- |
| Network | Midnight Preprod |
| Slot | 01 |
| Source wallet | `mn_addr_preprod127fcrqn8j2tlksn66gz4f9ag7hemma7ej7yvtuhjl9dp7w76x33q8ympr7` |
| Faucet reference supplied by operator | `0072c2c70f10ca44afe40c7073aed0f91b4977007acb0c4869877b128bd1f6ecb0` |
| Canonical Midnight transaction hash | `55847e8cf1b4ab68596759cee6f847ee088b87c832d0caedbdb3dd1bd193718d` |
| Indexer transaction id | `579102` |
| Block height | `2332287` |
| Block hash | `dd1f1a935bdfbd8703e7474d4d7e3a7eadc398cd9f0f8d788fa8a1d69d2e11ff` |
| Output | `5,000,000,000` raw NIGHT |

The source output was then registered for DUST generation so that regular wallet transfers can pay Preprod transaction fees:

| Field | Confirmed value |
| --- | --- |
| Registration transaction | `e29d76daa081f9991bd4235e6131378c54020d2593da5432cffdea1124e65b98` |
| Indexer transaction id | `579127` |
| Block height | `2332577` |
| Block hash | `b4a6c2d090735838fd2af8ffd17edc63c8680183546aaeaed35e672cba9b59fc` |
| Status | `SUCCESS` |
| Registered output | `5,000,000,000` raw NIGHT, `registeredForDustGeneration=true` |

## Reproduce the remaining transfers

1. Install the pinned dependencies and start the local proof server (`docker run --rm -p 6300:6300 midnightntwrk/proof-server:8.0.3 midnight-proof-server -v`).
2. Build the local DUST snapshot. This replays the public DUST ledger; it does not export private credentials:

   ```bash
   npm run pilot:dust-sync
   ```

3. Submit one serial transfer per destination and wait for the indexer confirmation after each transfer:

   ```bash
npm run pilot:stress -- 50 --execute --fund-children
npm run pilot:verify
```

The runner uses slot 01's deterministic Preprod-only key, pays fees from its restored DUST state, submits through the Preprod RPC, and records only indexer-confirmed Midnight transaction hashes in [`pilot-transaction-proof.csv`](pilot-transaction-proof.csv). Never use these deterministic keys on mainnet.
