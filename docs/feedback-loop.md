# ProofRoom feedback loop

This is the operating loop for the 50-user Preprod pilot. Every observation gets a feedback ID and is traceable to a release decision.

## Collection

1. Recruit a participant who is either a SaaS seller, acquisition buyer, advisor, or privacy-minded verifier.
2. Give them the [pilot onboarding flow](./onboarding.md) and a fresh demo wallet. Never ask for a real company dossier, bank balance, or customer data.
3. Ask the participant to complete one task without coaching:
   - seller: publish a listing and prove the private metrics;
   - buyer: publish criteria and prove funds;
   - verifier: inspect the public receipt and confirm private fields are absent.
4. Capture structured feedback immediately using the fields below. Wallet addresses are collected only for on-chain participation evidence and only with consent.

## Feedback record

| Field | Allowed values / guidance |
| --- | --- |
| `feedback_id` | `FB-001`, sequential |
| `wallet_address` | Verifiable Preprod address, or `not-collected` |
| `role` | `seller`, `buyer`, `verifier` |
| `task` | One of the three tasks above |
| `outcome` | `completed`, `blocked`, `abandoned` |
| `friction` | One concrete point, in the participant's words |
| `privacy_confidence` | `1`–`5` |
| `severity` | `P0` blocker, `P1` major, `P2` polish |
| `requested_change` | One testable change |
| `consent` | `yes` before publishing a wallet address or quote |

Store records in a private working copy first. Publish only redacted, consented summaries in `docs/feedback-log.md`.

## Triage and prioritization

At the end of each pilot day, sort by:

`priority = severity × frequency × privacy impact`

Fix all P0 issues before adding scope. Promote a P1 item when at least three participants report it or when it breaks a core proof/privacy promise. P2 items wait for the next release unless they affect accessibility or data handling.

Every accepted item must link to a commit, test, or documentation change. Every rejected item gets a one-line reason so the decision is auditable.

## Documentation sync

After each release:

- update `README.md` setup/usage and the release links;
- append the release number and resolved feedback IDs to `docs/feedback-log.md`;
- update `docs/preprod-users.csv` and `docs/preprod-evidence.md` only with verified, consented data;
- rerun `npm test`, `npm run build`, and `npm run compact`;
- record the CI run URL in `docs/release-links.md`.
