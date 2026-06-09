/**
 * Security & auth regression specs for the Sketu backend.
 *
 * IMPORTANT: Several of these tests are written to encode the CORRECT,
 * secure behaviour and are EXPECTED TO FAIL against the current codebase.
 * Each failing test pins a confirmed defect (see DEFECT_REPORT). Fix the
 * defect, then the test turns green and guards against regressions.
 *
 *   ✅ green expected:  SEC-AUTH-00 (harness sanity)
 *   ❌ red today:       SEC-AUTH-01, 02, 03, 04   (the defects)
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";

let request: typeof import("supertest").default;
let app: import("express").Express;
let db: typeof import("./db.js");

const WORKER = { role: "WORKER", name: "Ramesh Kumar", phone: "9876543210" };

beforeAll(async () => {
  // config/env validates these at import time — set before importing the app.
  process.env.MONGODB_URI ||= "mongodb://placeholder/sketu";
  process.env.JWT_SECRET ||= "test-secret-please-change-this-is-long-enough-123456";
  process.env.TWILIO_ACCOUNT_SID ||= "AC" + "0".repeat(32);
  process.env.TWILIO_AUTH_TOKEN ||= "test-token";
  process.env.TWILIO_PHONE_NUMBER ||= "+15005550006";
  process.env.OTP_DEFAULT_COUNTRY_CODE ||= "+91";
  // Prove the OTP-leak even in production mode.
  process.env.NODE_ENV = "production";

  // Keep OTP requests off the real Twilio network.
  jest.unstable_mockModule("../services/sms.js", () => ({
    sendOtpSms: async () => ({ delivered: true as const }),
  }));

  db = await import("./db.js");
  const appMod = await import("../app.js");
  app = appMod.default;
  request = (await import("supertest")).default;

  await db.connect();
});

afterAll(async () => {
  await db.disconnect();
});

beforeEach(async () => {
  await db.clear();
});

async function registerWorker() {
  return request(app).post("/api/auth/register").send(WORKER);
}

describe("Auth security", () => {
  it("SEC-AUTH-00 · harness sanity — /health responds", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // -------------------------------------------------------------------------
  // DEFECT SEC-01 (CRITICAL): login issues a JWT with no verifiable secret.
  // Only name + phone are checked — both are public/guessable. Authentication
  // must require something the attacker cannot trivially know (verified OTP or
  // a real password). This test asserts that contract and FAILS today (gets 200).
  // -------------------------------------------------------------------------
  it("SEC-AUTH-01 · login with only public identifiers (name+phone) must NOT issue a token", async () => {
    await registerWorker();

    const res = await request(app).post("/api/auth/login").send({
      role: WORKER.role,
      name: WORKER.name,
      phone: WORKER.phone,
    });

    // Secure contract: no secret supplied → no session.
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // DEFECT SEC-03 (CRITICAL): the OTP code is returned in the API response.
  // The gate `process.env.nodeEnv !== "production"` references the wrong env
  // var (nodeEnv vs NODE_ENV), so it is ALWAYS true and the code leaks in every
  // environment, production included. An OTP must never appear in the response.
  // -------------------------------------------------------------------------
  it("SEC-AUTH-02 · request-otp must never return the OTP code in the response body", async () => {
    await registerWorker();

    const res = await request(app)
      .post("/api/auth/request-otp")
      .send({ phone: WORKER.phone });

    expect(res.status).toBe(200);
    expect(res.body.otpCode).toBeUndefined(); // FAILS today: code is leaked
  });

  // -------------------------------------------------------------------------
  // DEFECT SEC-06 (HIGH): User.phone is `unique`, but register/login look up by
  // {phone, role}. Registering the same phone under a second role bypasses the
  // "existing" check and calls create(), triggering an E11000 duplicate-key
  // error that surfaces as an unhandled 500 (and leaks the raw error via the
  // 500 handler). It should be a clean 4xx, never a 500.
  // -------------------------------------------------------------------------
  it("SEC-AUTH-03 · registering the same phone under a second role must not 500", async () => {
    await registerWorker(); // WORKER with phone 9876543210

    const res = await request(app)
      .post("/api/auth/register")
      .send({ role: "FACTORY", name: "Sketu Industries", phone: WORKER.phone });

    expect(res.status).not.toBe(500); // FAILS today: duplicate-key 500
    expect([200, 201, 400, 409]).toContain(res.status);
  });

  // -------------------------------------------------------------------------
  // DEFECT SEC-08 (HIGH): no rate limiting on auth endpoints. Repeated failed
  // logins should eventually be throttled (429). Today every attempt returns
  // 401 forever — enabling unlimited brute force / credential stuffing.
  // -------------------------------------------------------------------------
  it("SEC-AUTH-04 · repeated failed logins should eventually be rate-limited (429)", async () => {
    await registerWorker();

    const statuses: number[] = [];
    for (let i = 0; i < 25; i++) {
      const res = await request(app).post("/api/auth/login").send({
        role: WORKER.role,
        name: "Wrong Name",
        phone: WORKER.phone,
      });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429); // FAILS today: never throttled
  });
});
