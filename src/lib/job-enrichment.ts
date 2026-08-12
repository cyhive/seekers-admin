import mongoose from "mongoose";

type LooseDocument = Record<string, any>;

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const normalizePhoneNumber = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  return digits.length > 10 ? digits.slice(-10) : digits;
};

const getUserDisplayName = (user?: LooseDocument) =>
  pickString(
    user?.fullName,
    user?.name,
    user?.displayName,
    user?.username
  );

const getJobPosterFallback = (job: LooseDocument) =>
  pickString(
    job.postedByName,
    job.userName,
    job.posterName,
    job.createdByName,
    job.fullName,
    job.name
  );

const getJobAddress = (job: LooseDocument) =>
  pickString(
    job.jobAddress,
    job.fullAddress,
    job.locationText,
    job.address,
    job.workAddress,
    job.addressLine
  );

const getJobDetails = (job: LooseDocument) =>
  pickString(job.jobDetails, job.details, job.description, job.jobDescription);

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const getPaymentFields = (job: LooseDocument) => {
  const estimatedAmount = toNumberOrNull(
    job.estimatedAmount ?? job.estimateAmount
  );
  const platformFeePercent = toNumberOrNull(
    job.platformFeePercent ?? job.platformFee
  );
  const platformFeeAmount = toNumberOrNull(job.platformFeeAmount);
  const workerPayoutAmount = toNumberOrNull(
    job.workerPayoutAmount ??
      (estimatedAmount !== null && platformFeePercent !== null
        ? estimatedAmount - (estimatedAmount * platformFeePercent) / 100
        : estimatedAmount !== null && platformFeeAmount !== null
          ? estimatedAmount - platformFeeAmount
          : null)
  );

  return {
    estimatedAmount,
    platformFeePercent,
    platformFee:
      platformFeePercent ??
      toNumberOrNull(job.platformFee) ??
      platformFeeAmount,
    platformFeeAmount,
    workerPayoutAmount,
    paymentStatus: pickString(job.paymentStatus) || null,
    paymentLink: pickString(
      job.paymentLink,
      job.paymentUrl,
      job.razorpayPaymentLink,
      job.shortUrl
    ) || null,
  };
};

const toJobIdString = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof (value as { toString?: () => string }).toString === "function") {
    return String(value);
  }
  return "";
};

const getJobIdVariants = (jobs: LooseDocument[]) => {
  const objectIds: mongoose.Types.ObjectId[] = [];
  const stringIds: string[] = [];

  for (const job of jobs) {
    const rawId = job._id ?? job.id;
    const id = toJobIdString(rawId);
    if (!id) continue;
    stringIds.push(id);
    if (mongoose.Types.ObjectId.isValid(id)) {
      objectIds.push(new mongoose.Types.ObjectId(id));
    }
  }

  return { objectIds, stringIds };
};

const jobIdFilter = (objectIds: mongoose.Types.ObjectId[], stringIds: string[]) => ({
  $or: [
    ...(objectIds.length ? [{ jobId: { $in: objectIds } }] : []),
    ...(stringIds.length ? [{ jobId: { $in: stringIds } }] : []),
  ],
});

async function getAssignedWorkerByJobId(jobs: LooseDocument[]) {
  const assignedByJobId = new Map<
    string,
    {
      assignedWorkerName: string;
      assignedWorkerPhone: string;
      assignedWorkerStatus: string;
      applicantPhones: string[];
    }
  >();

  const db = mongoose.connection.db;
  if (!db || jobs.length === 0) return assignedByJobId;

  const { objectIds, stringIds } = getJobIdVariants(jobs);
  if (!objectIds.length && !stringIds.length) return assignedByJobId;

  const filter = jobIdFilter(objectIds, stringIds);

  const [bookings, payments, applicants] = await Promise.all([
    db.collection("bookings").find(filter).sort({ bookedAt: -1, _id: -1 }).toArray(),
    db
      .collection("jobpayments")
      .find(filter, { projection: { jobId: 1, workerPhone: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1, _id: -1 })
      .toArray(),
    db
      .collection("jobapplicants")
      .find(filter, { projection: { jobId: 1, userPhoneNumbers: 1 } })
      .toArray(),
  ]);

  const bookingByJobId = new Map<string, LooseDocument>();
  for (const booking of bookings) {
    const jobId = toJobIdString(booking.jobId);
    if (!jobId || bookingByJobId.has(jobId)) continue;
    bookingByJobId.set(jobId, booking);
  }

  const paymentByJobId = new Map<string, LooseDocument>();
  for (const payment of payments) {
    const jobId = toJobIdString(payment.jobId);
    if (!jobId || paymentByJobId.has(jobId)) continue;
    paymentByJobId.set(jobId, payment);
  }

  const applicantsByJobId = new Map<string, string[]>();
  for (const applicant of applicants) {
    const jobId = toJobIdString(applicant.jobId);
    if (!jobId) continue;
    const phones = Array.isArray(applicant.userPhoneNumbers)
      ? applicant.userPhoneNumbers.map((phone: unknown) => String(phone || "").trim()).filter(Boolean)
      : [];
    applicantsByJobId.set(jobId, phones);
  }

  for (const job of jobs) {
    const jobId = toJobIdString(job._id ?? job.id);
    if (!jobId) continue;

    const booking = bookingByJobId.get(jobId);
    const payment = paymentByJobId.get(jobId);
    const applicantPhones = applicantsByJobId.get(jobId) || [];
    const assignedWorkerPhone = pickString(
      booking?.workerPhone,
      payment?.workerPhone
    );
    const assignedWorkerStatus = booking
      ? pickString(booking.status, "Booked")
      : payment?.workerPhone
        ? "Assigned"
        : "";

    assignedByJobId.set(jobId, {
      assignedWorkerName: "",
      assignedWorkerPhone,
      assignedWorkerStatus,
      applicantPhones,
    });
  }

  return assignedByJobId;
}

const enrichJobBase = (
  job: LooseDocument,
  assigned?: {
    assignedWorkerName: string;
    assignedWorkerPhone: string;
    assignedWorkerStatus: string;
    applicantPhones: string[];
  }
) => ({
  ...job,
  id: job.id || job._id?.toString?.(),
  postedByName: getJobPosterFallback(job),
  jobDetails: getJobDetails(job),
  jobAddress: getJobAddress(job),
  assignedWorkerName: assigned?.assignedWorkerName || "",
  assignedWorkerPhone: assigned?.assignedWorkerPhone || "",
  assignedWorkerStatus: assigned?.assignedWorkerStatus || "",
  applicantPhones: assigned?.applicantPhones || [],
  ...getPaymentFields(job),
});

export async function enrichJobsWithPosterDetails<T extends LooseDocument>(
  jobs: T[],
  User: any
) {
  const assignedByJobId = await getAssignedWorkerByJobId(jobs);

  const phoneKeys = new Set(
    jobs
      .map((job) => normalizePhoneNumber(job.phoneNumber || job.phone || job.mobileNumber))
      .filter(Boolean)
  );

  for (const assigned of assignedByJobId.values()) {
    const workerKey = normalizePhoneNumber(assigned.assignedWorkerPhone);
    if (workerKey) phoneKeys.add(workerKey);
    for (const phone of assigned.applicantPhones) {
      const key = normalizePhoneNumber(phone);
      if (key) phoneKeys.add(key);
    }
  }

  if (phoneKeys.size === 0) {
    return jobs.map((job) =>
      enrichJobBase(job, assignedByJobId.get(toJobIdString(job._id ?? job.id)))
    );
  }

  const users = await User.find(
    {},
    {
      phoneNumber: 1,
      phone: 1,
      mobileNumber: 1,
      fullName: 1,
      name: 1,
      displayName: 1,
      username: 1,
      createdAt: 1,
    }
  )
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  const userByPhone = new Map<string, LooseDocument>();

  for (const user of users) {
    const userPhoneFields = [user.phoneNumber, user.phone, user.mobileNumber];

    for (const phone of userPhoneFields) {
      const key = normalizePhoneNumber(phone);
      if (!key || !phoneKeys.has(key)) continue;

      const existingUser = userByPhone.get(key);
      if (!existingUser || (!getUserDisplayName(existingUser) && getUserDisplayName(user))) {
        userByPhone.set(key, user);
      }
    }
  }

  for (const assigned of assignedByJobId.values()) {
    const workerKey = normalizePhoneNumber(assigned.assignedWorkerPhone);
    assigned.assignedWorkerName = workerKey
      ? getUserDisplayName(userByPhone.get(workerKey))
      : "";
  }

  return jobs.map((job) => {
    const phoneKey = normalizePhoneNumber(job.phoneNumber || job.phone || job.mobileNumber);
    const matchedUser = phoneKey ? userByPhone.get(phoneKey) : undefined;
    const postedByName = getUserDisplayName(matchedUser) || getJobPosterFallback(job);
    const assigned = assignedByJobId.get(toJobIdString(job._id ?? job.id));

    return {
      ...enrichJobBase(job, assigned),
      postedByName,
    };
  });
}
