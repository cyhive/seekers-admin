import { NextResponse } from "next/server";
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI inside .env.local");
  }
  await mongoose.connect(MONGODB_URI);
};

// Flexible schema pointing to the users collection
const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status } = body; // Notice we use 'id' and 'status' based on your columns file

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Missing id or status" }, { status: 400 });
    }

    // Update the worker's profile status in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { status: status },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Profile ${status} successfully` });
  } catch (error: any) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}