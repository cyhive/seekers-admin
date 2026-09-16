import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  formatCompletedJob,
  formatWorkerSummary,
  getCompletedJobsWithWorkers,
  getUsersByPhoneKeys,
  normalizePhone,
} from "@/lib/completed-workers";

export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI inside .env.local");
  await mongoose.connect(MONGODB_URI);
};

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const phoneKey = normalizePhone(decodeURIComponent(phone));

    if (!phoneKey) {
      return NextResponse.json(
        { success: false, message: "Missing worker phone" },
        { status: 400 }
      );
    }

    await connectDB();

    const completedJobs = await getCompletedJobsWithWorkers(User);
    const workerJobs = completedJobs.filter(
      (job) => normalizePhone(job.workerPhone) === phoneKey
    );

    if (!workerJobs.length) {
      return NextResponse.json(
        { success: false, message: "No completed jobs found for this worker" },
        { status: 404 }
      );
    }

    const usersByPhone = await getUsersByPhoneKeys([phoneKey], User);
    const worker = formatWorkerSummary(
      workerJobs[0].workerPhone,
      workerJobs,
      usersByPhone.get(phoneKey)
    );

    return NextResponse.json({
      success: true,
      data: {
        worker,
        jobs: workerJobs.map(formatCompletedJob),
      },
    });
  } catch (error: any) {
    console.error("API Error (GET /api/workers/completed/[phone]/jobs):", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load worker completed jobs",
      },
      { status: 500 }
    );
  }
}
