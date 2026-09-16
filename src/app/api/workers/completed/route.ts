import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
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

export async function GET() {
  try {
    await connectDB();

    const completedJobs = await getCompletedJobsWithWorkers(User);
    const grouped = new Map<string, typeof completedJobs>();

    for (const job of completedJobs) {
      const phoneKey = normalizePhone(job.workerPhone);
      if (!phoneKey) continue;
      const current = grouped.get(phoneKey) || [];
      current.push(job);
      grouped.set(phoneKey, current);
    }

    const phoneKeys = Array.from(grouped.keys());
    const usersByPhone = await getUsersByPhoneKeys(phoneKeys, User);

    const workers = phoneKeys
      .map((phoneKey) => {
        const jobs = grouped.get(phoneKey) || [];
        const workerPhone = jobs[0]?.workerPhone || phoneKey;
        return formatWorkerSummary(
          workerPhone,
          jobs,
          usersByPhone.get(phoneKey)
        );
      })
      .sort((a, b) => b.completedJobsCount - a.completedJobsCount);

    return NextResponse.json({
      success: true,
      data: workers,
    });
  } catch (error: any) {
    console.error("API Error (GET /api/workers/completed):", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load completed workers",
      },
      { status: 500 }
    );
  }
}
