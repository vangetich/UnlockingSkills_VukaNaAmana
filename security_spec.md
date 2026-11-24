# Firestore Security Specification

## 1. Data Invariants
1. **Owner-Only PII Isolation**: `/users/{userId}` holds `email` and personal career focus. Only `request.auth.uid == userId` with `email_verified == true` may read or write it.
2. **Master Gate Relational Sync**: Documents in `/users/{userId}/capabilities/{capabilityId}` and `/users/{userId}/contributions/{contributionId}` cannot exist or be mutated unless `/users/{userId}` exists with `uid == request.auth.uid`.
3. **Immutable Ownership & Creation Timestamps**: `uid`, `ownerUid`, `briefId`, and `createdAt` can never change after creation.
4. **Strict Server Timestamps**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Terminal Contribution Locking**: Once a contribution reaches `status == 'completed'`, no subsequent updates are allowed.
6. **Strict Key & Size Enforcement**: Every write must match `hasAll` + `hasOnly` (or `affectedKeys().hasOnly(...)` on update) with bounded string lengths and numeric ranges.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Profile Read**: `GET /users/userA` with `auth = null`.
2. **Cross-Tenant Profile Read (PII Leak)**: `GET /users/userA` signed in as `userB`.
3. **Unverified Email Write**: `CREATE /users/userA` with `email_verified: false`.
4. **Identity Spoofing on Create**: `CREATE /users/userA` signed in as `userB` with `uid: "userB"`.
5. **Shadow Field Injection**: `CREATE /users/userA` including extra ghost field `isAdmin: true`.
6. **ID Poisoning**: `CREATE /users/userA/capabilities/bad$id!with*invalid` (fails `isValidId`).
7. **Orphaned Capability Write**: `CREATE /users/userA/capabilities/cap1` when `/users/userA` does not exist.
8. **Client Timestamp Forgery**: `CREATE /users/userA` with `createdAt` set to a client past timestamp instead of `request.time`.
9. **Immutable Owner Tampering**: `UPDATE /users/userA/capabilities/cap1` changing `ownerUid`.
10. **Terminal State Bypass**: `UPDATE /users/userA/contributions/c1` when existing `status == 'completed'`.
11. **Value Poisoning / Oversized String**: `UPDATE /users/userA/contributions/c1` with `solutionNotes` > 2000 chars or `hoursLogged: -10`.
12. **Blanket List Query Scraping**: `LIST /users/userA/contributions` signed in as `userB` without matching `userId == request.auth.uid`.
