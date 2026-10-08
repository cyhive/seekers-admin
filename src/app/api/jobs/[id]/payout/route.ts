import { NextResponse } from "next/server";
import { createHash } from "crypto";
import mongoose from "mongoose";
import {
  createContact,
  createFundAccount,
  createPayout,
  fetchPayout,
  type PayoutDestination,
  type RazorpayPayout,
} from "@/lib/razorpayx";

export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing in .env");
  await mongoose.connect(MONGODB_URI);
};

const jobSchema = new mongoose.Schema({}, { strict: false, collection: "jobs" });
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

type LooseDocument = Record<string, any>;

// A payout in one of these states blocks starting another one for the same job
const ACTIVE_PAYOUT_STATUSES = ["initiating", "queued", "pending", "processing", "processed"];

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const getUserPhone = (user: LooseDocument) =>
  pickString(user.phoneNumber, user.primaryContact, user.phone, user.mobileNumber);

const fail = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

const getWorkerPayoutAmount = (job: LooseDocument) => {
  const stored = toNumber(job.workerPayoutAmount);
  if (stored !== null) return stored;

  const estimate = toNumber(job.estimatedAmount ?? job.estimateAmount);
  const feePercent = toNumber(job.platformFeePercent ?? job.platformFee);
  if (estimate === null || feePercent === null) return null;
  return Math.max(0, estimate - (estimate * feePercent) / 100);
};

const getAssignedWorkerPhone = async (id: string) => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");

  const filter = { jobId: { $in: [new mongoose.Types.ObjectId(id), id] } };
  const [booking, payment] = await Promise.all([
    db.collection("bookings").findOne(filter, { sort: { bookedAt: -1, _id: -1 } }),
    db.collection("jobpayments").findOne(filter, { sort: { updatedAt: -1, _id: -1 } }),
  ]);

  return pickString(booking?.workerPhone, payment?.workerPhone);
};

const findWorker = async (phone: string) => {
  const key = normalizePhone(phone);
  const users = (await User.find({
    $or: ["phoneNumber", "primaryContact", "phone", "mobileNumber"].map((field) => ({
      [field]: { $regex: `${key}$` },
    })),
  })
    .sort({ updatedAt: -1, _id: -1 })
    .lean()) as LooseDocument[];

  return users.find((user) => normalizePhone(getUserPhone(user)) === key) || null;
};

// Bank account takes priority over UPI when both are filled in
const getDestination = (worker: LooseDocument): PayoutDestination | null => {
  const accountNumber = pickString(worker.payoutAccountNumber).replace(/\s/g, "");
  const ifsc = pickString(worker.payoutIfsc).toUpperCase();
  const name = pickString(worker.payoutAccountHolderName, worker.fullName, worker.name);
  if (accountNumber && ifsc && name) return { type: "bank_account", name, accountNumber, ifsc };

  const upiId = pickString(worker.payoutUpiId);
  if (upiId) return { type: "vpa", upiId };

  return null;
};

const describeDestination = (destination: PayoutDestination) =>
  destination.type === "bank_account"
    ? `Bank a/c ••••${destination.accountNumber.slice(-4)} (${destination.ifsc})`
    : `UPI ${destination.upiId}`;

// Reuses the worker's Razorpay fund account unless their payout details changed
const getFundAccountId = async (worker: LooseDocument, destination: PayoutDestination) => {
  const fingerprint = createHash("sha256").update(JSON.stringify(destination)).digest("hex");
  if (worker.razorpayFundAccountId && worker.razorpayFundAccountFingerprint === fingerprint) {
    return worker.razorpayFundAccountId as string;
  }

  const contactId =
    worker.razorpayContactId ||
    (
      await createContact({
        name: pickString(worker.fullName, worker.name, "Worker"),
        phone: normalizePhone(getUserPhone(worker)),
        referenceId: worker._id.toString(),
      })
    ).id;
  const fundAccount = await createFundAccount(contactId, destination);

  await User.updateOne(
    { _id: worker._id },
    {
      $set: {
        razorpayContactId: contactId,
        razorpayFundAccountId: fundAccount.id,
        razorpayFundAccountFingerprint: fingerprint,
      },
    }
  );

  return fundAccount.id;
};

const payoutFields = (payout: RazorpayPayout) => ({
  payoutId: payout.id,
  payoutStatus: payout.status,
  payoutUtr: payout.utr || null,
  payoutFailureReason:
    ["failed", "rejected", "reversed", "cancelled"].includes(payout.status)
      ? payout.status_details?.description || payout.status
      : null,
  payoutUpdatedAt: new Date(),
});

const toResponseData = (job: LooseDocument) => ({
  payoutId: job.payoutId || null,
  payoutStatus: job.payoutStatus || null,
  payoutAmount: toNumber(job.payoutAmount),
  payoutUtr: job.payoutUtr || null,
  payoutDestination: job.payoutDestination || null,
  payoutWorkerPhone: job.payoutWorkerPhone || null,
  payoutFailureReason: job.payoutFailureReason || null,
  payoutInitiatedAt: job.payoutInitiatedAt || null,
});

// POST { action: "pay" }  -> send the worker payout for a completed job
// POST { action: "sync" } -> refresh the payout status from RazorpayX
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let lockedJobId: string | null = null;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail("Invalid job id");

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "pay").toLowerCase();

    await connectDB();
    const job = (await Job.findById(id).lean()) as LooseDocument | null;
    if (!job) return fail("Job not found", 404);

    if (action === "sync") {
      if (!job.payoutId) return fail("This job has no payout yet");
      const payout = await fetchPayout(job.payoutId);
      const updated = (await Job.findByIdAndUpdate(
        id,
        { $set: payoutFields(payout) },
        { new: true }
      ).lean()) as LooseDocument;
      return NextResponse.json({ success: true, data: toResponseData(updated) });
    }

    if (String(job.status || "").toLowerCase() !== "completed") {
      return fail("The worker can only be paid after the job is completed");
    }

    const amount = getWorkerPayoutAmount(job);
    if (amount === null || amount <= 0) {
      return fail("Save an estimate first so the worker payout amount is known");
    }
    const amountInPaise = Math.round(amount * 100);

    const workerPhone = await getAssignedWorkerPhone(id);
    if (!workerPhone) return fail("No worker is assigned to this job");

    const worker = await findWorker(workerPhone);
    if (!worker) return fail("Assigned worker's profile was not found", 404);

    const destination = getDestination(worker);
    if (!destination) {
      return fail(
        "The worker has no bank account (account number, IFSC, holder name) or UPI ID. Add them from Users → Edit."
      );
    }

    // Lock the job so a double click can't send the money twice
    // A new idempotency key only once RazorpayX has confirmed the previous payout failed;
    // if we never got a response, retrying with the same key can't create a second payout.
    const previousAttempts = toNumber(job.payoutAttempts) ?? 0;
    const attempt = job.payoutId || previousAttempts === 0 ? previousAttempts + 1 : previousAttempts;
    const locked = await Job.findOneAndUpdate(
      { _id: id, payoutStatus: { $nin: ACTIVE_PAYOUT_STATUSES } },
      {
        $set: {
          payoutStatus: "initiating",
          payoutId: null,
          payoutUtr: null,
          payoutAmount: amount,
          payoutWorkerPhone: getUserPhone(worker),
          payoutDestination: describeDestination(destination),
          payoutFailureReason: null,
          payoutInitiatedAt: new Date(),
          payoutAttempts: attempt,
        },
      },
      { new: true }
    );
    if (!locked) return fail("A payout for this job is already in progress or completed", 409);
    lockedJobId = id;

    const fundAccountId = await getFundAccountId(worker, destination);
    const payout = await createPayout({
      fundAccountId,
      amountInPaise,
      mode: destination.type === "bank_account" ? "IMPS" : "UPI",
      referenceId: id,
      idempotencyKey: `job-${id}-${attempt}`,
      notes: { jobId: id, jobTitle: pickString(job.title).slice(0, 250) },
    });

    const updated = (await Job.findByIdAndUpdate(
      id,
      { $set: payoutFields(payout) },
      { new: true }
    ).lean()) as LooseDocument;
    lockedJobId = null;

    return NextResponse.json({
      success: true,
      message: `Payout of ₹${amount} ${payout.status}`,
      data: toResponseData(updated),
    });
  } catch (error: any) {
    console.error("API Error (POST /api/jobs/[id]/payout):", error);

    // Release the lock so the admin can retry after fixing the problem
    if (lockedJobId) {
      await Job.updateOne(
        { _id: lockedJobId, payoutStatus: "initiating" },
        { $set: { payoutStatus: "failed", payoutFailureReason: error.message || "Payout failed" } }
      ).catch(() => null);
    }

    return fail(error.message || "Failed to pay worker", 500);
  }
}
