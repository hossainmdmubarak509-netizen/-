# Security Specification & Invariants

## 1. Core Data Invariants
1. **Strict Document IDs**: All document IDs (`{settingId}`, `{offerId}`, `{serviceId}`, `{userId}`, `{requestId}`, `{orderId}`, `{notifId}`, `{chunkId}`) must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
2. **No Shadow Fields**: Every collection uses both `keys().hasAll([...])` and `keys().hasOnly([...])` to block undeclared shadow keys (`isVerified`, `superPower`, etc.).
3. **Strict Types & Boundary Limits**: Every string checks `is string` and `.size() <= MAX`; every numeric fee/amount checks `is number` and sensible non-negative bounds (`>= 0`, `<= 10000000`); every list (`fields`, `customerFiles`) checks `is list` and `.size() <= MAX`.
4. **Enum Integrity**: Roles (`user`, `admin`), statuses (`pending`, `approved`, `completed`, `rejected`), operators (`GP`, `Robi`, `Banglalink`, `Airtel`, `Teletalk`, `Skitto`, `All`), payment methods (`bKash`, `Nagad`, `Rocket`, `Upay`), and notification types strictly match allowed enum lists.
5. **No Plaintext Passwords in Firestore**: `portal_users` only accepts `passwordHash` (hex SHA-256) and explicitly forbids storing a raw `password` field via `hasOnly`.
6. **Chunk Size Guard**: `portal_files` chunks restrict `chunkData.size() <= 700000`, `chunkIndex >= 0`, `totalChunks >= 1 && totalChunks <= 30`.
7. **Immutable Order References**: `userId` and `trxId` on financial/order records remain immutable after creation (`incoming().userId == existing().userId`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Poisoned Document ID**: Creating `/offers/invalid id with spaces & $>` (>128 chars or non-alphanumeric).
2. **Shadow Field Injection on User**: Creating `/portal_users/u1` with `{ ..., isSuperRoot: true }`.
3. **Plaintext Password Leak**: Writing `/portal_users/u1` containing `{ ..., password: "secret" }`.
4. **Role Escalation / Invalid Enum**: Creating `/portal_users/u1` with `role: "superuser"`.
5. **Negative Wallet Balance**: Writing `/portal_users/u1` with `balance: -500`.
6. **Negative Add-Money Amount**: Creating `/add_money_requests/am1` with `amount: -1000`.
7. **Unbounded Title / Resource Poisoning**: Creating `/offers/off1` with a 5,000-character `title`.
8. **Invalid Payment Method**: Creating `/add_money_requests/am1` with `method: "CryptoCoin"`.
9. **Mutable Order Owner Tampering**: Updating `/nid_orders/nid1` changing `userId` from `"user-1"` to `"user-2"`.
10. **Unbounded File Chunk Exhaustion**: Creating `/portal_files/c1` with `totalChunks: 999` or `chunkData.size() > 700000`.
11. **Missing Required Fields on Digital Service**: Creating `/digital_services/s1` omitting `fields` array.
12. **Arbitrary Unlisted Collection Access**: Reading or writing `/secret_keys/k1` caught by the global `match /{document=**} { allow read, write: if false; }`.
