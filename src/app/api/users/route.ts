import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    
    // Use the same database as configured in MONGODB_URI (same as /api/jobs)
    // When no name is passed, the default DB from the connection string is used.
    const db = client.db();
    const collection = db.collection("users");

    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name || "",
      phoneNumber: user.phoneNumber || user.phone || user.mobileNumber || "",
      category: user.primarySkill || "", // Fallback to empty string if not present
    }));

    return Response.json(formattedUsers);
  } catch (error: any) {
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
