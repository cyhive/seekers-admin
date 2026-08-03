

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { enrichJobsWithPosterDetails } from "@/lib/job-enrichment";

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
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function GET() {
  try {
    await connectDB();

    // Fetch all jobs from the 'jobs' collection
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .lean();
    const enrichedJobs = await enrichJobsWithPosterDetails(jobs, User);

    return NextResponse.json({
      success: true,
      data: enrichedJobs,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const jobId = body?.jobId || body?.id;

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Missing job id" },
        { status: 400 }
      );
    }

    // Proxy to Express so notifications + JobPayment stay in sync.
    // Prefer /api/jobs/:id/estimate from the admin UI.
    const { backendFetch } = await import("@/lib/backend-api");
    const estimatedAmount = body?.estimatedAmount ?? body?.estimateAmount;
    const platformFeePercent =
      body?.platformFeePercent ?? body?.platformFee ?? 10;

    if (estimatedAmount === undefined || estimatedAmount === null || estimatedAmount === "") {
      return NextResponse.json(
        { success: false, message: "estimatedAmount is required" },
        { status: 400 }
      );
    }

    const { response, data } = await backendFetch(`/jobs/${jobId}/estimate`, {
      method: "PATCH",
      body: JSON.stringify({
        estimatedAmount: Number(estimatedAmount),
        platformFeePercent: Number(platformFeePercent),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            data?.error ||
            `Failed to save estimate (status ${response.status})`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "Estimate saved successfully",
      data: data?.data ?? data,
    });
  } catch (error: any) {
    console.error("API Error (PATCH /api/jobs):", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing job id" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid job id" },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedJob = await Job.findByIdAndDelete(id);

    if (!deletedJob) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error: any) {
    console.error("API Error (DELETE /api/jobs):", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
