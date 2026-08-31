# Lessons

## Pilot evidence semantics

- Mistake: described generated testnet stress-test inputs as fake/offline evidence.
- Rule: label deterministic addresses and planned refs as stress-test inputs; reserve on-chain status and transaction hashes for confirmed network responses.

## Participant evidence semantics

- Mistake: treated deterministic key generation as proof that wallet operators were not human participants.
- Rule: distinguish reproducible key material from participant identity; when the operator confirms human operation, record that attestation separately from the on-chain wallet/transaction proof.
