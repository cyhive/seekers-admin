import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { enrichJobsWithPosterDetails } from "@/lib/job-enrichment";

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

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const percentChangeLabel = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? "New this month" : "No change from last month";
  }

  const percent = ((current - previous) / previous) * 100;
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}% from last month`;
};

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not ready");

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalJobs,
      openJobs,
      pendingApprovals,
      jobsThisMonth,
      jobsLastMonth,
      uniqueCustomers,
      customersThisMonth,
      customersLastMonth,
      paidRevenue,
      paidRevenueThisMonth,
      paidRevenueLastMonth,
      monthlyJobCounts,
      recentJobDocs,
    ] = await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({
        status: { $in: ["Open", "Confirmed", "open", "confirmed"] },
      }),
      Job.countDocuments({
        approvalStatus: { $in: ["Pending", "pending"] },
      }),
      Job.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      Job.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      }),
      User.aggregate([
        {
          $addFields: {
            __phoneKey: {
              $ifNull: [
                "$phoneNumber",
                { $ifNull: ["$phone", { $ifNull: ["$mobileNumber", ""] }] },
              ],
            },
          },
        },
        { $match: { __phoneKey: { $ne: "" } } },
        { $group: { _id: "$__phoneKey" } },
        { $count: "total" },
      ]),
      User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      }),
      db.collection("jobpayments").aggregate([
        { $match: { status: { $in: ["paid", "Paid"] } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
      db.collection("jobpayments").aggregate([
        {
          $match: {
            status: { $in: ["paid", "Paid"] },
            $or: [
              { paidAt: { $gte: startOfThisMonth } },
              { createdAt: { $gte: startOfThisMonth } },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      db.collection("jobpayments").aggregate([
        {
          $match: {
            status: { $in: ["paid", "Paid"] },
            $or: [
              {
                paidAt: {
                  $gte: startOfLastMonth,
                  $lt: startOfThisMonth,
                },
              },
              {
                createdAt: {
                  $gte: startOfLastMonth,
                  $lt: startOfThisMonth,
                },
              },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      Job.aggregate([
        { $match: { createdAt: { $gte: startOf12MonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
          },
        },
      ]),
      Job.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const monthlyMap = new Map<string, number>();
    for (const row of monthlyJobCounts as Array<{
      _id?: { year?: number; month?: number };
      total?: number;
    }>) {
      const year = row._id?.year;
      const month = row._id?.month;
      if (!year || !month) continue;
      monthlyMap.set(`${year}-${month}`, row.total || 0);
    }

    const monthlyJobs = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      return {
        name: MONTH_LABELS[date.getMonth()],
        total: monthlyMap.get(key) || 0,
      };
    });

    const enrichedRecent = await enrichJobsWithPosterDetails(
      recentJobDocs as any[],
      User
    );

    const recentJobs = enrichedRecent.map((job: any) => ({
      id: job.id || job._id?.toString?.(),
      title: job.title || "Untitled job",
      postedByName: job.postedByName || "Unknown",
      phoneNumber: job.phoneNumber || "",
      status: job.approvalStatus || job.status || "Pending",
      estimatedAmount: job.estimatedAmount ?? job.estimateAmount ?? null,
      createdAt: job.createdAt || null,
    }));

    const totalCustomers = uniqueCustomers[0]?.total || 0;
    const totalRevenue = paidRevenue[0]?.total || 0;
    const revenueThisMonth = paidRevenueThisMonth[0]?.total || 0;
    const revenueLastMonth = paidRevenueLastMonth[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        pendingApprovals,
        totalCustomers,
        totalRevenue,
        paidPayments: paidRevenue[0]?.count || 0,
        jobsThisMonth,
        monthlyJobs,
        recentJobs,
        changes: {
          jobs: percentChangeLabel(jobsThisMonth, jobsLastMonth),
          customers: percentChangeLabel(customersThisMonth, customersLastMonth),
          revenue: percentChangeLabel(revenueThisMonth, revenueLastMonth),
          openJobs: `${pendingApprovals} pending approval`,
        },
      },
    });
  } catch (error: any) {
    console.error("API Error (GET /api/dashboard):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
