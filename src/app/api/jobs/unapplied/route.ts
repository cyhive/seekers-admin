import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { enrichJobsWithPosterDetails } from "@/lib/job-enrichment";

export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing in .env");
  await mongoose.connect(MONGODB_URI);
};

const jobSchema = new mongoose.Schema({}, { strict: false, collection: "jobs" });
const jobApplicantSchema = new mongoose.Schema({}, { strict: false, collection: "jobapplicants" });
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
const JobApplicant = mongoose.models.JobApplicant || mongoose.model("JobApplicant", jobApplicantSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function GET() {
  try {
    await connectDB();

    // 1. Get all jobIds that have at least one applicant
    const appliedDocs = await JobApplicant.find(
      { userPhoneNumbers: { $exists: true, $not: { $size: 0 } } },
      { jobId: 1 }
    ).lean() as any[];

    const appliedJobIds = appliedDocs.map((doc) => doc.jobId.toString());

    // 2. Find jobs whose _id is NOT in that list
    const unappliedJobs = await Job.find({
      _id: { $nin: appliedJobIds },
    })
      .sort({ createdAt: -1 })
      .lean();
    const enrichedJobs = await enrichJobsWithPosterDetails(unappliedJobs, User);

    return NextResponse.json({ success: true, data: enrichedJobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
