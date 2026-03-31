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

// 👇 HELPER: Guaranteed to output http://localhost:5000/uploads/...
const formatImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath) return null;
  
  // 1. Strip out any old http:// domains or IP addresses
  let cleanPath = imagePath.replace(/^https?:\/\/[^/]+\//, '');
  
  // 2. Strip out 'uploads/' and leading slashes just in case they are already there 
  // (This prevents accidental "uploads/uploads/image.jpg" duplication)
  cleanPath = cleanPath.replace(/^uploads\//, '');
  cleanPath = cleanPath.replace(/^\//, ''); 
  
  // 3. Force the exact URL structure you requested
  return `http://localhost:5000/uploads/${cleanPath}`;
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
        idPhoto: formatImageUrl(user.idPhoto || user.id_photo),
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