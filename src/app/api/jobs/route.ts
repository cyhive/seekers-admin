

import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Force Next.js to fetch fresh data on every request (prevents 304/caching issues)
export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing in .env");
  await mongoose.connect(MONGODB_URI);
};

// Ensure we are explicitly pointing to the "jobs" collection
const jobSchema = new mongoose.Schema({}, { strict: false, collection: "jobs" });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

export async function GET() {
  try {
    await connectDB();

    // Fetch all jobs from the 'jobs' collection
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}