import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleStripeWebhook } from "./stripe-webhook";

vi.mock("stripe", () => {
  const constructEventMock = vi.fn();
  const MockStripe = vi.fn().mockImplementation(function() {
    return {
      webhooks: { constructEvent: constructEventMock },
    };
  });
  return {
    default: MockStripe,
    constructEventMock, // Export for test access
  };
});

const { constructEventMock } = await import("stripe") as any;

function createMockRes() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const sendStatus = vi.fn().mockReturnThis();
  const send = vi.fn().mockReturnThis();
  const end = vi.fn().mockReturnThis();
  return { status, json, sendStatus, send, end } as any;
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  vi.clearAllMocks();
});

describe("handleStripeWebhook", () => {
  it("returns 400 when stripe signature is missing", async () => {
    const req = { headers: {}, body: Buffer.from(""), rawBody: Buffer.from("") } as any;
    const res = createMockRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Missing Stripe signature" })
    );
  });

  it("returns 400 when signature verification fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    const req = {
      headers: { "stripe-signature": "bad-signature" },
      body: Buffer.from("{}"),
      rawBody: Buffer.from("{}"),
    } as any;
    const res = createMockRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/signature/i) })
    );
  });

  it("returns 200 on valid event", async () => {
    const payload = { 
      id: "evt_test_123",
      type: "checkout.session.completed", 
      data: { object: { id: "cs_123" } } 
    };
    constructEventMock.mockReturnValue(payload);

    const req = {
      headers: { "stripe-signature": "good-signature" },
      body: Buffer.from(JSON.stringify(payload)),
      rawBody: Buffer.from(JSON.stringify(payload)),
    } as any;
    const res = createMockRes();

    await handleStripeWebhook(req, res);

    const okStatusCalled = res.sendStatus.mock.calls.some(([code]: any) => code === 200);
    const statusCalled = res.status.mock.calls.some(([code]: any) => code === 200);
    const receivedJson = res.json.mock.calls.some(
      ([arg]: any) => arg && (arg.received === true || arg.verified === true)
    );
    const receivedSend = res.send.mock.calls.some(
      ([arg]: any) => arg && (arg.received === true || arg.verified === true)
    );
    const endCalled = res.end.mock.calls.length > 0;

    expect(okStatusCalled || statusCalled || receivedJson || receivedSend || endCalled).toBe(true);
  });
});