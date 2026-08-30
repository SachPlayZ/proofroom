# Two-minute ProofRoom demo

Use the live demo at <https://sachplayz.github.io/proofroom/>. Keep the browser visible and do not paste real financial or company data.

| Time | Action | Point to |
| --- | --- | --- |
| 0:00–0:20 | Introduce the anonymous Atlas listing and asking floor. | Company identity and dossier hash are hidden behind commitments. |
| 0:20–0:45 | Select **Seller** and click **Prove seller fit**. | Four private metrics produce one public qualification result. |
| 0:45–1:05 | Select **Buyer** and click **Prove funds threshold**. | Exact balance and identity stay local. |
| 1:05–1:25 | Return to **Seller**, click **Grant access**. | Only mutual qualification releases an encrypted ciphertext hash. |
| 1:25–1:45 | Select **Buyer**, click **Unlock locally**. | AES-GCM decrypts the dossier in the browser. |
| 1:45–2:00 | Select **Public verifier**. | Public outcomes remain visible; decrypted dossier disappears from verifier view. |

Close by showing the README, the Compact source, the passing CI run, and the Preprod evidence register. State clearly that the current demo uses mock attesters and local memory storage.
