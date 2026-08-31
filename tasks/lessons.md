# Lessons

## Pilot evidence semantics

- Mistake: described generated testnet stress-test inputs as fake/offline evidence.
- Rule: label deterministic addresses and planned refs as stress-test inputs; reserve on-chain status and transaction hashes for confirmed network responses.

## Participant evidence semantics

- Mistake: treated deterministic key generation as proof that wallet operators were not human participants.
- Rule: distinguish reproducible key material from participant identity; when the operator confirms human operation, record that attestation separately from the on-chain wallet/transaction proof.

## External-profile evidence

- Mistake: treated an operator-confirmed external profile as either absent or publicly verifiable without a supplied link.
- Rule: record the operator attestation, preserve the exact evidence gap, and stop requesting a link when the operator explicitly declines to publish it.
