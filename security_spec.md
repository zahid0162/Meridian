# Firestore Security Specification (Meridian)

## 1. Data Invariants
1. **Strict Tenant & Child-Data Isolation**: All user accounts, personal/child profiles, career assessments, and future predictions live strictly under `/users/{userId}/...` where `userId == request.auth.uid` and `request.auth.token.email_verified == true`.
2. **Master Gate**: A `PersonalProfile` cannot exist without a parent `UserAccount` at `/users/{userId}`. A `CareerAssessment` cannot exist without both `/users/{userId}` and `/users/{userId}/profiles/{profileId}`.
3. **Immutability of Historical Snapshots**: `CareerAssessment` and `FuturePrediction` documents are point-in-time historical snapshots containing the exact `profileSnapshot` and `modelVersion`. They support `create`, `get`, `list`, and `delete`, and prohibit client-side `update` tampering.
4. **Strict Keys & Bounded Arrays**: Every document validates exact `hasAll` and `hasOnly` key sets, string length limits, and bounded list sizes (`<= 25`). No arbitrary shadow fields are permitted.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must strictly equal `request.time`. `createdAt`, `uid`, `id`, `ownerId`, and `profileId` are immutable after creation.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. **Cross-Tenant Profile Read**: User B attempts `get` on `/users/{userA}/profiles/{profileId}` -> `PERMISSION_DENIED`.
2. **Cross-Tenant Assessment List**: User B attempts `list` on `/users/{userA}/profiles/{profileId}/assessments` -> `PERMISSION_DENIED`.
3. **Spoofed Owner ID on Create**: User A attempts `create` on `/users/{userA}/profiles/{profileId}` with `ownerId: userB` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection (Ghost Field)**: User A attempts `create` or `update` with extra key `isAdmin: true` or `bypassConsent: true` -> `PERMISSION_DENIED`.
5. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts `create` on `/users/{uid}` -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: User A attempts `create` with `profileId` containing `../` or 1,500-byte string -> `PERMISSION_DENIED`.
7. **Orphaned Profile Creation**: User A attempts `create` on `/users/{userA}/profiles/{p1}` before `/users/{userA}` exists -> `PERMISSION_DENIED`.
8. **Orphaned Assessment Creation**: User A attempts `create` on `/users/{userA}/profiles/nonexistent/assessments/a1` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: User A attempts `create` with backdated `createdAt: Timestamp(2020-01-01)` -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: User A attempts `update` on `/users/{userA}/profiles/{p1}` changing `createdAt` or `ownerId` -> `PERMISSION_DENIED`.
11. **Unbounded Array / Payload Exhaustion**: User A attempts `create` with 500 items in `education.subjectGrades` or 100KB `basic.name` -> `PERMISSION_DENIED`.
12. **Historical Assessment Tampering**: User A attempts `update` on `/users/{userA}/profiles/{p1}/assessments/{a1}` to rewrite past predictions -> `PERMISSION_DENIED`.
