# ProofRoom pilot onboarding

Goal: onboard 50 small-scale Preprod participants without collecting sensitive business or financial data.

## Recruitment mix

Target 50 distinct wallet addresses:

- 20 prospective buyers
- 20 SaaS sellers / operators
- 10 advisors, auditors, or privacy reviewers

Recruit through founder communities, M&A advisors, Midnight developer channels, and direct referrals. Use a short consented invitation that explains this is a demo and that no real funds, Stripe account, or dossier should be connected.

## Five-minute participant path

1. Open the live demo link in `docs/release-links.md`.
2. Connect or create a dedicated Midnight Preprod wallet.
3. Choose the assigned role.
4. Complete one core task and note the transaction ID or block reference.
5. Answer the structured feedback questions in [feedback-loop.md](./feedback-loop.md).
6. Opt in before their wallet address is added to `docs/preprod-users.csv`.

## Safety rules

- Use a dedicated demo wallet; never request a seed phrase or private key.
- Use the supplied fixture attestation only. Never paste real Stripe, bank, customer, or acquisition documents.
- Wallet addresses are public data. Store consent timestamp and feedback ID beside each published address.
- A participant counts only after their address and a verifiable Preprod transaction/block reference are recorded.

## Success metrics

| Metric | Target | Evidence |
| --- | ---: | --- |
| Distinct Preprod wallets | 50 | `docs/preprod-users.csv` |
| Core task completion | ≥ 80% | feedback log outcomes |
| Privacy confidence | ≥ 4/5 median | feedback log |
| P0 unresolved issues | 0 | release checklist |
| Feedback-to-change links | 100% of accepted items | feedback log + commits |
