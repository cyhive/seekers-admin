"use client";

import React, { useState } from "react";
import { Member } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

/* ================= OPTIONS ================= */

const WARD_OPTIONS = [
  "പെരുംചിറക്കോണം - മുള്ളുംമ്മൂട്",
  "കരിക്കകം - തങ്കക്കല്ല്",
  "കൈതോട് - കുരിയണിക്കര",
  "കോങ്കലിൽ - മൂന്നാംകൊണം",
  "ഇരപ്പിൽ - കോട്ടൂർക്കോണം",
  "എലിക്കുന്നാം മുഗൾ - കുന്നുംപുറം - ഈട്ടിമൂട്",
];

const KUDUMBASREE_OPTIONS = [
  "ആവണി",
  "വിദ്യ",
  "തുല്യത",
  "സമത്വം",
  "മൈത്രി",
  "പവിത്രം",
  "മഹാദേവർ",
  "മലർവാടി",
  "സാന്ത്വനം",
  "ഉണർവ്വ്",
  "കൃഷ്ണ",
  "ത്രയംബകം",
  "മഞ്ഞും മൂട്ടിൽ",
  "ബിസ്മി",
  "അക്ഷയ",
  "തേജസ്‌",
  "സർവ്വോദയ",
  "മഞ്ചാടി",
  "കാർത്തിക",
];

const BLOOD_GROUP_OPTIONS = [
  "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"
];

const RATION_CARD_OPTIONS = [
  "Blue card", "Pink card", "White card", "Yellow card"
];

/* ================= TYPES ================= */

export type MemberFormValues = {
  name: string;
  mobileNumber?: string;
  age?: number;

  occupation?: string;
  disease?: string;
  educationQualification?: string;
  schemes: string[];
  others?: string;

  wardArea?: string;
  address?: string;
  dateOfBirth?: string;
  kudumbasreeName?: string;
  voterId?: string;

  bloodGroup?: string;
  rationCardType?: string;

  images: string[];
  rationCardImages: string[];
  otherImages: string[];

  removedImages?: string[];
  removedRationCardImages?: string[];
  removedOtherImages?: string[];
};

interface MemberFormProps {
  onSubmit: (
    values: MemberFormValues,
    pendingFiles?: (File | null)[]
  ) => void;
  initialData?: Member | null;
  onCancel?: () => void;
}

/* ================= IMAGE SECTION COMPONENT ================= */

function ImageSection({
  title,
  images,
  onImagesChange,
  removedImages,
  onRemovedImagesChange,
  onFileChange,
  fileInputId,
}: {
  title: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  removedImages: string[];
  onRemovedImagesChange: (removed: string[]) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputId: string;
}) {
  return (
    <div className="space-y-2">
      <label className="font-semibold">{title}</label>
      
      {/* Existing Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {images.map((img) => (
            <div key={img} className="relative">
              <img
                src={img}
                alt="preview"
                className="w-full h-20 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => {
                  onImagesChange(images.filter((i) => i !== img));
                  onRemovedImagesChange([...removedImages, img]);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        id={fileInputId}
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
      />
    </div>
  );
}

/* ================= COMPONENT ================= */

export function MemberForm({
  onSubmit,
  initialData,
  onCancel,
}: MemberFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [mobileNumber, setMobileNumber] = useState(initialData?.mobileNumber || "");
  const [age, setAge] = useState<number>(initialData?.age || 0);

  const [occupation, setOccupation] = useState(initialData?.occupation || "");
  const [disease, setDisease] = useState(initialData?.disease || "");
  const [educationQualification, setEducationQualification] = useState(
    initialData?.educationQualification || ""
  );

  const [schemesText, setSchemesText] = useState(
    initialData?.schemes?.join(", ") || ""
  );
  const [others, setOthers] = useState(initialData?.others || "");

  const [wardArea, setWardArea] = useState(initialData?.wardArea || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    if (initialData?.dateOfBirth) {
      const date = new Date(initialData.dateOfBirth);
      return date.toISOString().split('T')[0];
    }
    return "";
  });
  const [kudumbasreeName, setKudumbasreeName] = useState(
    initialData?.kudumbasreeName || ""
  );
  const [voterId, setVoterId] = useState(initialData?.voterId || "");

  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup || "");
  const [rationCardType, setRationCardType] = useState(initialData?.rationCardType || "");

  /* ================= IMAGE STATES ================= */

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [rationCardImages, setRationCardImages] = useState<string[]>(
    initialData?.rationCardImages || []
  );
  const [otherImages, setOtherImages] = useState<string[]>(
    initialData?.otherImages || []
  );

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [removedRationCardImages, setRemovedRationCardImages] = useState<string[]>([]);
  const [removedOtherImages, setRemovedOtherImages] = useState<string[]>([]);

  /* ================= FILE HANDLERS ================= */

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "images" | "ration" | "other"
  ) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((f) => ((f as any)._uploadType = type));
    setPendingFiles((prev) => [...prev, ...files]);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: MemberFormValues = {
      name,
      mobileNumber,
      age: age || undefined,
      bloodGroup,
      rationCardType,
      occupation,
      disease,
      educationQualification,
      schemes: schemesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      others,
      wardArea,
      address,
      dateOfBirth,
      kudumbasreeName,
      voterId,
      images,
      rationCardImages,
      otherImages,
      removedImages,
      removedRationCardImages,
      removedOtherImages,
    };

    onSubmit(formData, pendingFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-h-[75vh] overflow-y-auto pr-2">
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
      <Input placeholder="Age" type="number" value={age || ""} onChange={(e) => setAge(Number(e.target.value))} />

      <Input placeholder="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
      <Input placeholder="Highest Education" value={educationQualification} onChange={(e) => setEducationQualification(e.target.value)} />

      <Textarea placeholder="Diseases" value={disease} onChange={(e) => setDisease(e.target.value)} />
      <Textarea placeholder="Welfare Schemes (comma separated)" value={schemesText} onChange={(e) => setSchemesText(e.target.value)} />
      <Textarea placeholder="Others" value={others} onChange={(e) => setOthers(e.target.value)} />

      {/* ✅ WARD DROPDOWN */}
      <select
        value={wardArea}
        onChange={(e) => setWardArea(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">Select Ward</option>
        {WARD_OPTIONS.map((ward) => (
          <option key={ward} value={ward}>
            {ward}
          </option>
        ))}
      </select>

      <Textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />

      {/* ✅ KUDUMBASREE DROPDOWN */}
      <select
        value={kudumbasreeName}
        onChange={(e) => setKudumbasreeName(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">Select Kudumbasree</option>
        {KUDUMBASREE_OPTIONS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <Input placeholder="Voter ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} />

      {/* Blood Group Dropdown */}
      <select
        value={bloodGroup}
        onChange={(e) => setBloodGroup(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">Select Blood Group</option>
        {BLOOD_GROUP_OPTIONS.map((bg) => (
          <option key={bg} value={bg}>
            {bg}
          </option>
        ))}
      </select>

      {/* Ration Card Type Dropdown */}
      <select
        value={rationCardType}
        onChange={(e) => setRationCardType(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">Select Ration Card Type</option>
        {RATION_CARD_OPTIONS.map((rc) => (
          <option key={rc} value={rc}>
            {rc}
          </option>
        ))}
      </select>

      {/* IMAGE UPLOADS */}
      <ImageSection
        title="Member Images"
        images={images}
        onImagesChange={setImages}
        removedImages={removedImages}
        onRemovedImagesChange={setRemovedImages}
        onFileChange={(e) => handleFileChange(e, "images")}
        fileInputId="member-images"
      />

      <ImageSection
        title="Ration Card Images"
        images={rationCardImages}
        onImagesChange={setRationCardImages}
        removedImages={removedRationCardImages}
        onRemovedImagesChange={setRemovedRationCardImages}
        onFileChange={(e) => handleFileChange(e, "ration")}
        fileInputId="ration-images"
      />

      <ImageSection
        title="Other Images"
        images={otherImages}
        onImagesChange={setOtherImages}
        removedImages={removedOtherImages}
        onRemovedImagesChange={setRemovedOtherImages}
        onFileChange={(e) => handleFileChange(e, "other")}
        fileInputId="other-images"
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {initialData ? "Update Member" : "Create Member"}
        </Button>
      </div>
    </form>
  );
}
