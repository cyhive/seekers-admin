import { NextResponse } from "next/server";
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI inside .env.local");
  await mongoose.connect(MONGODB_URI);
};

const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const backendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://15.206.73.249/api";

const backendOrigin = backendApiUrl.replace(/\/api\/?$/, "");

const formatImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath) return null;

  // Already absolute URL
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const cleanPath = imagePath.replace(/^\/+/, "");

  // Support values like "uploads/file.jpg" from DB
  if (cleanPath.startsWith("uploads/")) {
    return `${backendOrigin}/${cleanPath}`;
  }

  return `${backendOrigin}/uploads/${cleanPath}`;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();
    
    const user = await User.findById(id).lean() as any;
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        idType: user.idType || user.id_type || null,
        idPhotoFront: formatImageUrl(
          user.idPhotoFront || user.id_photo_front || user.idPhoto || user.id_photo
        ),
        idPhotoBack: formatImageUrl(user.idPhotoBack || user.id_photo_back),
        profilePhoto: formatImageUrl(user.profilePhoto || user.profile_photo),
        
        portfolio: Array.isArray(user.portfolio) 
          ? user.portfolio.map((img: string) => formatImageUrl(img))
          : formatImageUrl(user.portfolio),
      },
    });
  } catch (error: any) {
    console.error("Error fetching user images:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}