# Release links

Replace each pending value only after it resolves publicly. Do not publish placeholder links as submission evidence.

| Item | Link / value | Status |
| --- | --- | --- |
| Public GitHub repository | <https://github.com/SachPlayZ/proofroom> | live |
| Live demo | <https://sachplayz.github.io/proofroom/> | live GitHub Pages demo |
| Preprod contract address | `0e0d4b0200dc7faeb0412e3f874867809c6e118b354e3ad48d9b465e2a247237` | deployed; receipt in [`proofroom-preprod-deployment.json`](./proofroom-preprod-deployment.json) |
| Preprod application receipts | [`preprod-application-transactions.csv`](./preprod-application-transactions.csv) | 50 distinct caller wallets; all `SUCCESS` |
| CI/CD workflow | <https://github.com/SachPlayZ/proofroom/actions/workflows/ci.yml> | configured |
| Passing CI run | <https://github.com/SachPlayZ/proofroom/actions/runs/33306462901> | passed: tests, build, Compact, stress-test addresses, real-flow capture, Remotion, Pages |
| Product X profile | _pending profile creation_ | blocked on X account |
| Demo video | <https://github.com/SachPlayZ/proofroom/releases/download/v0.1.0/proofroom-demo.mp4> | public 60s Remotion render |
| Demo script | [`demo-script.md`](./demo-script.md) | ready to record |
| 50-user evidence | [`preprod-users.csv`](./preprod-users.csv) | 0/50 verified |
| Preprod stress-test addresses | [`pilot-wallets.csv`](./pilot-wallets.csv) | 50 generated addresses; all 50 wallet transfers confirmed |
| Transaction proof register | [`pilot-transaction-proof.csv`](./pilot-transaction-proof.csv) | 50 unique indexer-verified `SUCCESS` hashes with block evidence |
| Slot 01 source funding | [`preprod-source-funding.md`](./preprod-source-funding.md) | faucet + DUST registration confirmed |
| Feedback summary | [`feedback-log.md`](./feedback-log.md) | awaiting pilot |
| Synthetic feedback rehearsal | [`pilot-feedback.csv`](./pilot-feedback.csv) | 20 records; not submission evidence |

## Submission gate

The release is not submission-ready until every pending value above is replaced with a public, verifiable link or value and `docs/preprod-evidence.md` agrees with it.
