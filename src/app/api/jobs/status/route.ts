// app/api/jobs/status/route.ts (Next.js Admin Panel)
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
};

// Flexible schema to access the jobs collection
const jobSchema = new mongoose.Schema({}, { strict: false, collection: "jobs" });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { jobId, newStatus } = body;

    if (!jobId || !newStatus) {
      return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
    }

    // Update the job status in MongoDB
   await Job.findByIdAndUpdate(jobId, { approvalStatus: newStatus });

    return NextResponse.json({ success: true, message: `Job ${newStatus} successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
