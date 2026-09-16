import mongoose from "mongoose";
import { enrichJobsWithPosterDetails } from "@/lib/job-enrichment";

type LooseDocument = Record<string, any>;

export const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const toJobIdString = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof (value as { toString?: () => string }).toString === "function") {
    return String(value);
  }
  return "";
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export async function getWorkerPhoneByJobId(db: mongoose.mongo.Db) {
  const workerByJobId = new Map<string, string>();

  const [bookings, payments] = await Promise.all([
    db.collection("bookings").find({}).toArray(),
    db
      .collection("jobpayments")
      .find({}, { projection: { jobId: 1, workerPhone: 1 } })
      .toArray(),
  ]);

  for (const booking of bookings) {
    const jobId = toJobIdString(booking.jobId);
    const workerPhone = pickString(booking.workerPhone);
    if (jobId && workerPhone) workerByJobId.set(jobId, workerPhone);
  }

  for (const payment of payments) {
    const jobId = toJobIdString(payment.jobId);
    const workerPhone = pickString(payment.workerPhone);
    if (jobId && workerPhone && !workerByJobId.has(jobId)) {
      workerByJobId.set(jobId, workerPhone);
    }
  }

  return workerByJobId;
}

export async function getCompletedJobsWithWorkers(User: any) {
  const db = mongoose.connection.db;
  if (!db) return [];

  const workerByJobId = await getWorkerPhoneByJobId(db);

  const completedJobs = await db
    .collection("jobs")
    .find({ status: { $regex: /^completed$/i } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const jobsWithWorkers = completedJobs
    .map((job) => {
      const jobId = toJobIdString(job._id);
      const workerPhone = workerByJobId.get(jobId) || "";
      return { job, jobId, workerPhone };
    })
    .filter((entry) => entry.workerPhone);

  const enriched = await enrichJobsWithPosterDetails(
    jobsWithWorkers.map((entry) => entry.job),
    User
  );

  return enriched.map((job: LooseDocument, index: number) => ({
    ...job,
    id: job.id || job._id?.toString?.(),
    workerPhone: jobsWithWorkers[index]?.workerPhone || "",
  }));
}

export async function getUsersByPhoneKeys(phoneKeys: string[], User: any) {
  if (!phoneKeys.length) return new Map<string, LooseDocument>();

  const users = (await User.find(
    {},
    {
      phoneNumber: 1,
      phone: 1,
      mobileNumber: 1,
      primaryContact: 1,
      fullName: 1,
      name: 1,
      primarySkill: 1,
      profilePhoto: 1,
      updatedAt: 1,
    }
  )
    .sort({ updatedAt: -1, _id: -1 })
    .lean()) as LooseDocument[];

  const userByPhone = new Map<string, LooseDocument>();

  for (const user of users) {
    const phones = [
      user.phoneNumber,
      user.primaryContact,
      user.phone,
      user.mobileNumber,
    ];

    for (const phone of phones) {
      const key = normalizePhone(phone);
      if (!key || !phoneKeys.includes(key)) continue;
      if (!userByPhone.has(key)) userByPhone.set(key, user);
    }
  }

  return userByPhone;
}

export function formatWorkerSummary(
  workerPhone: string,
  jobs: LooseDocument[],
  user?: LooseDocument
) {
  const phoneKey = normalizePhone(workerPhone);
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const latestJob = sortedJobs[0];

  return {
    workerPhone,
    phoneKey,
    workerName: pickString(user?.fullName, user?.name, latestJob?.assignedWorkerName) || "Unknown worker",
    profession: pickString(user?.primarySkill, latestJob?.category),
    completedJobsCount: jobs.length,
    latestCompletedAt:
      latestJob?.updatedAt || latestJob?.createdAt || null,
  };
}

export function formatCompletedJob(job: LooseDocument) {
  return {
    id: job.id || job._id?.toString?.(),
    title: pickString(job.title, "Untitled job"),
    details: pickString(job.jobDetails, job.details, job.description),
    category: pickString(job.category),
    jobDate: pickString(job.jobDate),
    jobTime: pickString(job.jobTime),
    address: pickString(job.jobAddress, job.fullAddress, job.locationText, job.address),
    postedByName: pickString(job.postedByName),
    posterPhone: pickString(job.phoneNumber),
    approvalStatus: pickString(job.approvalStatus, job.status),
    status: pickString(job.status),
    estimatedAmount: job.estimatedAmount ?? job.estimateAmount ?? null,
    platformFeePercent: job.platformFeePercent ?? job.platformFee ?? null,
    workerPayoutAmount: job.workerPayoutAmount ?? null,
    paymentStatus: pickString(job.paymentStatus) || null,
    paymentLink: pickString(job.paymentLink, job.paymentUrl) || null,
    createdAt: job.createdAt || null,
    updatedAt: job.updatedAt || null,
    completedAt: job.updatedAt || job.createdAt || null,
  };
}
