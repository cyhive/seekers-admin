import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { writeFile, unlink } from "fs/promises";
import path from "path";

/* ======================= PUT (UPDATE MEMBER) ======================= */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;
    if (!ObjectId.isValid(memberId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const formData = await req.formData();

    /* ---------------- TEXT FIELDS ---------------- */
    const updateData: any = {
      name: formData.get("name"),
      mobileNumber: formData.get("mobileNumber"),
      age: Number(formData.get("age")),
      occupation: formData.get("occupation"),
      disease: formData.get("disease"),
      educationQualification: formData.get("educationQualification"),
      others: formData.get("others"),

      wardArea: formData.get("wardArea"),
      address: formData.get("address"),
      dateOfBirth: formData.get("dateOfBirth"),
      kudumbasreeName: formData.get("kudumbasreeName"),
      voterId: formData.get("voterId"),

      bloodGroup: formData.get("bloodGroup"),
      rationCardType: formData.get("rationCardType"),

      schemes: JSON.parse((formData.get("schemes") as string) || "[]"),
    };

    /* ---------------- IMAGE HELPERS ---------------- */
    const processImages = async (
      existingKey: string,
      removedKey: string,
      uploadKey: string
    ) => {
      const existing = JSON.parse(
        (formData.get(existingKey) as string) || "[]"
      );
      const removed = JSON.parse(
        (formData.get(removedKey) as string) || "[]"
      );

      for (const img of removed) {
        try {
          await unlink(path.join(process.cwd(), "public", img));
        } catch {}
      }

      const uploaded: string[] = [];
      const files = formData.getAll(uploadKey) as File[];

      for (const file of files) {
        if (!file?.name) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = `${Date.now()}-${file.name}`;
        await writeFile(
          path.join(process.cwd(), "public/uploads", name),
          buffer
        );
        uploaded.push(`/uploads/${name}`);
      }

      return [...existing, ...uploaded];
    };

    updateData.images = await processImages(
      "images",
      "removedImages",
      "images"
    );

    updateData.rationCardImages = await processImages(
      "rationCardImages",
      "removedRationCardImages",
      "rationCardImages"
    );

    updateData.otherImages = await processImages(
      "otherImages",
      "removedOtherImages",
      "otherImages"
    );

    console.log("Update data", updateData);

    /* ---------------- DB UPDATE ---------------- */
    const client = await clientPromise;
    const db = client.db("party");
    const collection = db.collection("Members");

    await collection.updateOne(
      { _id: new ObjectId(memberId) },
      { $set: updateData }
    );

    return Response.json({ id: memberId, ...updateData });
  } catch (error: any) {
    return Response.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}


    /* ------------------ DB UPDATE ------------------ */
