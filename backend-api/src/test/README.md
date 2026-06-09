# Backend security & auth tests

These specs pin confirmed security defects in the Sketu backend. They are
written to assert the **correct, secure behaviour**, so most of them are
**expected to fail against the current code** until the defects are fixed.
A failing test here is the point — it's a regression guard waiting for its fix.

## Install

```bash
cd backend-api
npm install
```

(The test devDependencies — jest, ts-jest, supertest, mongodb-memory-server,
cross-env, @jest/globals, @types/jest, @types/supertest — are already listed
in package.json.)

## Run

```bash
npm test
```

By default an in-memory MongoDB is downloaded and started automatically.
If your environment can't download the Mongo binary (offline / locked-down CI),
point the tests at any reachable Mongo instead:

```bash
MONGO_TEST_URI=mongodb://127.0.0.1:27017/sketu_test npm test
# or pin the in-memory binary version:
MONGOMS_VERSION=7.0.14 npm test
```

## What each test pins

| Test | Defect | Expected today |
|------|--------|----------------|
| SEC-AUTH-00 | harness sanity (`/health`) | ✅ pass |
| SEC-AUTH-01 | Login issues a JWT with no verifiable secret (name+phone only) | ❌ fail (returns 200) |
| SEC-AUTH-02 | OTP code leaked in `request-otp` response (`nodeEnv` typo) | ❌ fail (code present) |
| SEC-AUTH-03 | Same phone under a second role → duplicate-key **500** | ❌ fail (500) |
| SEC-AUTH-04 | No rate limiting on auth endpoints (brute force) | ❌ fail (never 429) |

See `DEFECT_REPORT` (delivered alongside) for full repro steps, severity,
priority, and recommended fixes for every finding.
