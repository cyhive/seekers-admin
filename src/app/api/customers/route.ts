import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 1. Establish MongoDB connection utility
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI (or MONGO_URI) inside .env.local");
  }

  await mongoose.connect(MONGODB_URI);
};

// 2. Define a flexible schema pointing to the "users" collection
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });

// Use existing model if it exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function GET() {
  try {
    await connectDB();

    // Fetch one user per phone number (phone number used as the key)
    // We sort by newest first, then group by phone and take the newest document per phone.
    const users = await User.aggregate([
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
      { $sort: { createdAt: -1, _id: -1 } },
      { $match: { __phoneKey: { $ne: "" } } },
      { $group: { _id: "$__phoneKey", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    // Format the data to match your UserCustomer interface requirements
    const formattedCustomers = users.map((user: any) => ({
      id: user._id.toString(),
      // Fallback through common name fields
      name: user.fullName || user.name || "",
      // Fallback through common phone fields
      phoneNumber: user.phoneNumber || user.phone || user.mobileNumber || "",
      // Map primarySkill to category
      category: user.primarySkill || "",
      // Added status field for future use (Accept/Reject logic)
      status: user.status || "Pending", 
      createdAt: user.createdAt || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCustomers,
    });
  } catch (error: any) {
    console.error("API Error (GET /api/customers):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}