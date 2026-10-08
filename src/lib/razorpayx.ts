// Minimal RazorpayX Payouts client (https://razorpay.com/docs/api/x/)
const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

const getConfig = () => {
  const keyId = process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

  if (!keyId || !keySecret || !accountNumber) {
    throw new Error(
      "RazorpayX is not configured. Add RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET and RAZORPAYX_ACCOUNT_NUMBER to .env"
    );
  }

  return { keyId, keySecret, accountNumber };
};

async function razorpayRequest<T = any>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const { keyId, keySecret } = getConfig();
  const response = await fetch(`${RAZORPAY_API_URL}${path}`, {
    method: init.method || "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error?.description || data?.error?.reason || `RazorpayX request failed (${response.status})`
    );
  }
  return data as T;
}

export type PayoutDestination =
  | { type: "bank_account"; name: string; accountNumber: string; ifsc: string }
  | { type: "vpa"; upiId: string };

export async function createContact(input: {
  name: string;
  phone: string;
  referenceId: string;
}) {
  return razorpayRequest<{ id: string }>("/contacts", {
    method: "POST",
    body: {
      name: input.name,
      contact: input.phone,
      type: "vendor",
      reference_id: input.referenceId.slice(0, 40),
    },
  });
}

export async function createFundAccount(contactId: string, destination: PayoutDestination) {
  return razorpayRequest<{ id: string }>("/fund_accounts", {
    method: "POST",
    body:
      destination.type === "bank_account"
        ? {
            contact_id: contactId,
            account_type: "bank_account",
            bank_account: {
              name: destination.name,
              ifsc: destination.ifsc,
              account_number: destination.accountNumber,
            },
          }
        : {
            contact_id: contactId,
            account_type: "vpa",
            vpa: { address: destination.upiId },
          },
  });
}

export type RazorpayPayout = {
  id: string;
  status: string; // queued | pending | rejected | processing | processed | cancelled | reversed | failed
  amount: number;
  mode: string;
  utr: string | null;
  status_details?: { description?: string | null } | null;
};

export async function createPayout(input: {
  fundAccountId: string;
  amountInPaise: number;
  mode: "IMPS" | "UPI";
  referenceId: string;
  idempotencyKey: string;
  notes?: Record<string, string>;
}) {
  const { accountNumber } = getConfig();
  return razorpayRequest<RazorpayPayout>("/payouts", {
    method: "POST",
    headers: { "X-Payout-Idempotency": input.idempotencyKey },
    body: {
      account_number: accountNumber,
      fund_account_id: input.fundAccountId,
      amount: input.amountInPaise,
      currency: "INR",
      mode: input.mode,
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: input.referenceId.slice(0, 40),
      narration: "Seekers job payout",
      notes: input.notes,
    },
  });
}

export async function fetchPayout(payoutId: string) {
  return razorpayRequest<RazorpayPayout>(`/payouts/${encodeURIComponent(payoutId)}`);
}
