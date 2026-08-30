# Preprod evidence register

This file is intentionally a template until the contract is deployed and participants have made verifiable transactions. Never fill it with guessed addresses or hashes.

| Evidence | Value |
| --- | --- |
| Network | Midnight Preprod |
| Contract address | _pending deployment_ |
| Deployment transaction | _pending deployment_ |
| Deployment block | _pending deployment_ |
| Proof server version | _pin before deployment_ |
| Midnight.js / SDK version | _pin before deployment_ |
| CI run URL | <https://github.com/SachPlayZ/proofroom/actions/runs/33282341389> |
| Live demo URL | <https://sachplayz.github.io/proofroom/> |
| Demo video URL | _add published video URL_ |

## Verification procedure

1. Open the contract address in the official Preprod explorer.
2. Confirm the deployment transaction and block reference resolve on-chain.
3. For every row in `preprod-users.csv`, resolve the wallet address and its transaction/block reference on the same network.
4. Confirm the public transcript contains commitments, thresholds, outcomes, nullifiers, and ciphertext hashes only—not private metrics, balances, identities, or dossier plaintext.
