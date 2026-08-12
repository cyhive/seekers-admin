import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { formatImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI inside .env.local");
  await mongoose.connect(MONGODB_URI);
};

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const normalizePhone = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const toNumber = (value: unknown) => {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const getUserPhone = (user: Record<string, any>) =>
  pickString(user.phoneNumber, user.primaryContact, user.phone, user.mobileNumber);

export async function GET(request: Request) {
  try {
    const phone = new URL(request.url).searchParams.get("phone") || "";
    const phoneKey = normalizePhone(phone);

    if (!phoneKey) {
      return NextResponse.json(
        { success: false, message: "Missing worker phone" },
        { status: 400 }
      );
    }

    await connectDB();

    const users = (await User.find({
      $or: [
        { phoneNumber: { $regex: `${phoneKey}$` } },
        { primaryContact: { $regex: `${phoneKey}$` } },
        { phone: { $regex: `${phoneKey}$` } },
        { mobileNumber: { $regex: `${phoneKey}$` } },
      ],
    })
      .sort({ updatedAt: -1, _id: -1 })
      .lean()) as any[];

    const user = users.find((item) => normalizePhone(getUserPhone(item)) === phoneKey);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Worker not found" },
        { status: 404 }
      );
    }

    const db = mongoose.connection.db;
    const userId = user._id;
    const phoneVariants = Array.from(
      new Set(
        [getUserPhone(user), phone, `+91${phoneKey}`, phoneKey].filter(Boolean)
      )
    );

    const reviews = db
      ? await db
          .collection("reviews")
          .find({
            $or: [
              { workerPhone: { $in: phoneVariants } },
              { toPhone: { $in: phoneVariants } },
              { revieweePhone: { $in: phoneVariants } },
              { userPhone: { $in: phoneVariants } },
              { workerId: userId },
              { revieweeId: userId },
              { toUserId: userId },
              { userId },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray()
      : [];

    const ratingValues = reviews
      .map((review) => toNumber(review.rating ?? review.stars ?? review.score))
      .filter((value): value is number => value !== null);

    const averageRating =
      toNumber(user.averageRating ?? user.rating ?? user.avgRating) ??
      (ratingValues.length
        ? Number(
            (
              ratingValues.reduce((sum, value) => sum + value, 0) /
              ratingValues.length
            ).toFixed(1)
          )
        : null);

    const additionalSkills = Array.isArray(user.additionalSkills)
      ? user.additionalSkills.filter(Boolean)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        id: user._id?.toString?.(),
        name: pickString(user.fullName, user.name, "Unknown worker"),
        phoneNumber: getUserPhone(user) || phone,
        profession: pickString(user.primarySkill, user.category, user.profession),
        additionalSkills,
        yearsExperience: pickString(user.yearsExperience, String(user.experience || "")),
        availability: pickString(user.availability),
        hourlyRate: pickString(user.hourlyRate, String(user.hourlyRate || "")),
        dailyRate: pickString(user.dailyRate, String(user.dailyRate || "")),
        homeAddress: pickString(user.homeAddress, user.address),
        gender: pickString(user.gender),
        status: pickString(user.status),
        idType: pickString(user.idType, user.id_type) || null,
        idPhotoFront: formatImageUrl(
          user.idPhotoFront || user.id_photo_front || user.idPhoto || user.id_photo
        ),
        idPhotoBack: formatImageUrl(user.idPhotoBack || user.id_photo_back),
        profilePhoto: formatImageUrl(user.profilePhoto || user.profile_photo),
        portfolio: Array.isArray(user.portfolio)
          ? user.portfolio.map((img: string) => formatImageUrl(img)).filter(Boolean)
          : formatImageUrl(user.portfolio)
            ? [formatImageUrl(user.portfolio)]
            : [],
        averageRating,
        reviewCount: ratingValues.length || toNumber(user.reviewsCount) || 0,
        reviews: reviews.slice(0, 5).map((review) => ({
          rating: toNumber(review.rating ?? review.stars ?? review.score),
          comment: pickString(review.comment, review.review, review.feedback),
          createdAt: review.createdAt || null,
        })),
      },
    });
  } catch (error: any) {
    console.error("API Error (GET /api/workers/profile):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load worker profile" },
      { status: 500 }
    );
  }
}
