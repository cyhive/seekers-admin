import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI inside .env.local");
  await mongoose.connect(MONGODB_URI);
};

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Fields that are never sent to or changed from the admin edit form
const READ_ONLY_FIELDS = new Set(["_id", "id", "__v", "createdAt", "updatedAt"]);
// razorpay* holds the payout contact / fund account IDs managed by the payout route
const SECRET_FIELD_PATTERN = /password|token|otp|secret|hash|salt|razorpay/i;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const isEditableField =(key: string) =>
  !READ_ONLY_FIELDS.has(key) && !SECRET_FIELD_PATTERN.test(key) && !key.startsWith("$");

const invalidId = () =>
  NextResponse.json({ success: false, message: "Invalid user id" }, { status: 400 });

const notFound = () =>
  NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

const toEditableUser = (user: Record<string, any>) => ({
  id: user._id.toString(),
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
  fields: Object.fromEntries(
    Object.entries(user).filter(([key]) => isEditableField(key))
  ),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    await connectDB();
    const user = (await User.findById(id).lean()) as Record<string, any> | null;
    if (!user) return notFound();

    return NextResponse.json({ success: true, data: toEditableUser(user) });
  } catch (error: any) {
    console.error("API Error (GET /api/customers/[id]):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    const body = await request.json().catch(() => null);
    const updates = body?.updates;

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, message: "Missing updates" },
        { status: 400 }
      );
    }

    const blockedKeys = Object.keys(updates).filter((key) => !isEditableField(key));
    if (blockedKeys.length) {
      return NextResponse.json(
        { success: false, message: `These fields cannot be edited: ${blockedKeys.join(", ")}` },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nothing to update" },
        { status: 400 }
      );
    }

    // Dates arrive as ISO strings over JSON; store them back as real dates
    const values = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        typeof value === "string" && ISO_DATE_PATTERN.test(value) ? new Date(value) : value,
      ])
    );

    await connectDB();
    const user = (await User.findByIdAndUpdate(
      id,
      { $set: { ...values, updatedAt: new Date() } },
      { new: true }
    ).lean()) as Record<string, any> | null;
    if (!user) return notFound();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: toEditableUser(user),
    });
  } catch (error: any) {
    console.error("API Error (PATCH /api/customers/[id]):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
