import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { writeFile } from "fs/promises";
import path from "path";

/* ======================= GET ======================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");
    const bloodGroup = searchParams.get("bloodGroup");
    const rationCardType = searchParams.get("rationCardType");
    const educationQualification = searchParams.get("educationQualification");
    const disease = searchParams.get("disease");
    const occupation = searchParams.get("occupation");
    const wardArea = searchParams.get("wardArea");
    const schemes = searchParams.get("schemes");
    const kudumbasreeName = searchParams.get("kudumbasreeName");
    const search = searchParams.get("search");

    const query: any = {};

    /* AGE RANGE */
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = Number(ageMin);
      if (ageMax) query.age.$lte = Number(ageMax);
    }

    /* EXACT MATCH */
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (rationCardType) query.rationCardType = rationCardType;
    if (wardArea) query.wardArea = wardArea;
    if (kudumbasreeName) query.kudumbasreeName = kudumbasreeName;

    /* NORMALIZED FIELDS */
    if (educationQualification)
      query.educationQualification = educationQualification.toLowerCase();

    if (disease) query.disease = disease.toLowerCase();

    if (occupation)
      query.occupation = { $regex: occupation, $options: "i" };

    /* SCHEMES ARRAY FILTER */
    if (schemes)
      query.schemes = { $in: [schemes] };

    /* GLOBAL SEARCH */
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { occupation: { $regex: search, $options: "i" } },
      ];
    }

    const client = await clientPromise;
    const db = client.db("party");
    const collection = db.collection("Members");

    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const members = docs.map((doc: any) => ({
      id: doc._id.toString(),
      ...doc,
    }));

    return Response.json(members);
  } catch (error: any) {
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}

/* ======================= POST (CREATE) ======================= */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    /* ---------------- IMAGE UPLOADS ---------------- */
    const uploadFiles = async (key: string) => {
      const urls: string[] = [];
      const files = formData.getAll(key) as File[];

      for (const file of files) {
        if (!file || !file.name) continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${file.name}`;
        const uploadDir = path.join(process.cwd(), "public/uploads");
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        urls.push(`/uploads/${fileName}`);
      }
      return urls;
    };

    const images = await uploadFiles("images");
    const rationCardImages = await uploadFiles("rationCardImages");
    const otherImages = await uploadFiles("otherImages");

    /* ---------------- DATA ---------------- */
    const doc = {
      name: formData.get("name"),
      mobileNumber: formData.get("mobileNumber"),
      age: Number(formData.get("age")),
      occupation: formData.get("occupation"),
      disease: formData.get("disease"),
      educationQualification: formData.get("educationQualification"),
      schemes: JSON.parse((formData.get("schemes") as string) || "[]"),
      others: formData.get("others"),

      wardArea: formData.get("wardArea"),
      address: formData.get("address"),
      dateOfBirth: formData.get("dateOfBirth"),
      kudumbasreeName: formData.get("kudumbasreeName"),
      voterId: formData.get("voterId"),

      images,
      rationCardImages,
      otherImages,

      bloodGroup: formData.get("bloodGroup"),
      rationCardType: formData.get("rationCardType"),

      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("party");
    const collection = db.collection("Members");

    const result = await collection.insertOne(doc);

    return Response.json(
      { id: result.insertedId.toString(), ...doc },
      { status: 201 }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}


/* ======================= DELETE ======================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (!ids.length) {
      return Response.json(
        { error: "No IDs provided" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("party");
    const collection = db.collection("Members");

    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.deleteMany({
      _id: { $in: objectIds },
    });

    return Response.json({
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
