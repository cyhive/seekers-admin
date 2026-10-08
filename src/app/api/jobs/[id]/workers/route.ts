import { NextResponse } from "next/server";
import mongoose from "mongoose";

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

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUserPhone = (user: LooseDocument) =>
  pickString(user.phoneNumber, user.primaryContact, user.phone, user.mobileNumber);

const getJobCategory = (job: LooseDocument) =>
  pickString(job.category, job.jobCategory, job.profession, job.skill);

const IGNORED_WORDS = new Set([
  "and", "the", "for", "with", "work", "works", "service", "services", "job", "jobs",
]);

// "cleaning" / "cleaner" / "cleaners" -> "clean", "plumbing" / "plumber" -> "plumb"
const toStem = (word: string) => {
  const stem = word.replace(/(ings|ing|ers|er|s)$/, "");
  return stem.length >= 3 ? stem : word;
};

const getKeywordStems = (text: string) =>
  Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3 && !IGNORED_WORDS.has(word))
        .map(toStem)
    )
  );

// 3 = same profession, 2 = one contains the other, 1 = shares a keyword
const getMatchScore = (category: string, stems: string[], skill: string) => {
  const a = category.trim().toLowerCase();
  const b = skill.trim().toLowerCase();
  if (a === b) return 3;
  if (a.includes(b) || b.includes(a)) return 2;
  const skillStems = getKeywordStems(b);
  return stems.some((stem) => skillStems.includes(stem)) ? 1 : 0;
};

const getBookingFilter = (id: string) => ({
  jobId: { $in: [new mongoose.Types.ObjectId(id), id] },
});

const loadJob = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return (await Job.findById(id).lean()) as LooseDocument | null;
};

const isApproved = (status: string) =>
  ["approved", "accepted"].includes(status.toLowerCase());

const getUserSkills = (user: LooseDocument) =>
  [
    user.primarySkill,
    user.secondarySkill,
    ...(Array.isArray(user.skills) ? user.skills : [user.skills]),
  ].filter((skill): skill is string => typeof skill === "string" && Boolean(skill.trim()));

const toWorker = (user: LooseDocument, phoneNumber: string, matchScore = 0) => ({
  id: user._id.toString(),
  name: pickString(user.fullName, user.name, user.displayName),
  phoneNumber,
  category: pickString(user.primarySkill, ...getUserSkills(user)),
  address: pickString(user.homeAddress, user.address, user.fullAddress),
  status: pickString(user.status) || "Pending",
  matchScore,
});

// Phone numbers of everyone who applied for the job (jobapplicants collection)
const getApplicantPhones = async (id: string) => {
  const db = mongoose.connection.db;
  if (!db) return [];

  const docs = await db.collection("jobapplicants").find(getBookingFilter(id)).toArray();
  const phones = docs.flatMap((doc) => [
    ...(Array.isArray(doc.userPhoneNumbers) ? doc.userPhoneNumbers : []),
    doc.userPhoneNumber,
    doc.userPhone,
    doc.phoneNumber,
  ]);

  const seen = new Set<string>();
  return phones
    .map((phone) => String(phone ?? "").trim())
    .filter((phone) => {
      const key = normalizePhone(phone);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const getApplicants = async (id: string) => {
  const phones = await getApplicantPhones(id);
  if (!phones.length) return [];

  const keys = phones.map(normalizePhone);
  const users = (await User.find({
    $or: ["phoneNumber", "primaryContact", "phone", "mobileNumber"].flatMap((field) =>
      keys.map((key) => ({ [field]: { $regex: `${key}$` } }))
    ),
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean()) as LooseDocument[];

  const userByPhone = new Map<string, LooseDocument>();
  for (const user of users) {
    const key = normalizePhone(getUserPhone(user));
    if (key && !userByPhone.has(key)) userByPhone.set(key, user);
  }

  // Applicants without a user profile are still listed by phone number
  return phones.map((phone) => {
    const user = userByPhone.get(normalizePhone(phone));
    return user
      ? toWorker(user, getUserPhone(user))
      : {
          id: `phone-${normalizePhone(phone)}`,
          name: "",
          phoneNumber: phone,
          category: "",
          address: "",
          status: "Unknown",
          matchScore: 0,
        };
  });
};

// Workers whose profession loosely matches the job's category
const getMatchingWorkers = async (job: LooseDocument, category: string) => {
  // Loose match: any keyword of the category ("cleaning") matches any profession
  // containing a word with the same stem ("House Cleaning", "Cleaner").
  const stems = getKeywordStems(category);
  if (!stems.length) return [];

  const keywordRegex = new RegExp(`\\b(${stems.map(escapeRegex).join("|")})`, "i");
  const users = (await User.find({
    $or: [
      { primarySkill: keywordRegex },
      { secondarySkill: keywordRegex },
      { skills: keywordRegex },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean()) as LooseDocument[];

  const posterKey = normalizePhone(job.phoneNumber || job.phone || job.mobileNumber);
  const seenPhones = new Set<string>();
  const workers = [];

  // One entry per phone number (newest document wins), skipping the job poster
  for (const user of users) {
    const phoneNumber = getUserPhone(user);
    const phoneKey = normalizePhone(phoneNumber);
    if (!phoneKey || phoneKey === posterKey || seenPhones.has(phoneKey)) continue;
    seenPhones.add(phoneKey);

    const matchScore = Math.max(
      0,
      ...getUserSkills(user).map((skill) => getMatchScore(category, stems, skill))
    );
    workers.push(toWorker(user, phoneNumber, matchScore));
  }

  // Closest profession first, then approved workers first
  return workers.sort(
    (a, b) =>
      b.matchScore - a.matchScore ||
      Number(isApproved(b.status)) - Number(isApproved(a.status))
  );
};

// GET: workers who applied for the job, plus workers whose profession matches it
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await loadJob(id);

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    const category = getJobCategory(job);
    const [applicants, matchingWorkers] = await Promise.all([
      getApplicants(id),
      category ? getMatchingWorkers(job, category) : Promise.resolve([]),
    ]);

    // Applicants are shown in their own section, so leave them out of the matches
    const applicantKeys = new Set(applicants.map((worker) => normalizePhone(worker.phoneNumber)));
    const workers = matchingWorkers.filter(
      (worker) => !applicantKeys.has(normalizePhone(worker.phoneNumber))
    );

    return NextResponse.json({ success: true, data: { category, applicants, workers } });
  } catch (error: any) {
    console.error("API Error (GET /api/jobs/[id]/workers):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

// POST: assign a worker to the job by creating (or replacing) its booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const workerPhone = pickString(body?.workerPhone);

    if (!workerPhone) {
      return NextResponse.json(
        { success: false, message: "Missing worker phone" },
        { status: 400 }
      );
    }

    const job = await loadJob(id);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    const phoneKey = normalizePhone(workerPhone);
    const candidates = (await User.find({
      $or: [
        { phoneNumber: { $regex: `${phoneKey}$` } },
        { primaryContact: { $regex: `${phoneKey}$` } },
        { phone: { $regex: `${phoneKey}$` } },
        { mobileNumber: { $regex: `${phoneKey}$` } },
      ],
    })
      .sort({ updatedAt: -1, _id: -1 })
      .lean()) as LooseDocument[];
    const worker = candidates.find((user) => normalizePhone(getUserPhone(user)) === phoneKey);

    if (!worker) {
      return NextResponse.json(
        { success: false, message: "Worker not found" },
        { status: 404 }
      );
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not ready");

    const now = new Date();
    const workerName = pickString(worker.fullName, worker.name, worker.displayName);
    const bookingFields = {
      workerPhone: getUserPhone(worker),
      workerId: worker._id,
      workerName,
      status: "Booked",
      bookedAt: now,
      assignedBy: "admin",
      updatedAt: now,
    };

    const bookings = db.collection("bookings");
    const existing = await bookings.findOne(getBookingFilter(id), {
      sort: { bookedAt: -1, _id: -1 },
    });

    if (existing) {
      await bookings.updateOne({ _id: existing._id }, { $set: bookingFields });
    } else {
      await bookings.insertOne({
        jobId: new mongoose.Types.ObjectId(id),
        ...bookingFields,
        createdAt: now,
      });
    }

    const jobStatus = String(job.status || "").toLowerCase();
    const nextJobStatus = !jobStatus || jobStatus === "open" ? "Confirmed" : job.status;
    await Job.findByIdAndUpdate(id, {
      status: nextJobStatus,
      assignedWorkerPhone: bookingFields.workerPhone,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Worker assigned successfully",
      data: {
        assignedWorkerName: workerName,
        assignedWorkerPhone: bookingFields.workerPhone,
        assignedWorkerStatus: "Booked",
        status: nextJobStatus,
      },
    });
  } catch (error: any) {
    console.error("API Error (POST /api/jobs/[id]/workers):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to assign worker" },
      { status: 500 }
    );
  }
}
