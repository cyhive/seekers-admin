"use client";

import { useEffect, useMemo, useState } from "react";
import { Member } from "@/lib/types";
import { MemberTable } from "@/components/admin/members/member-table";
import { createColumns } from "@/components/admin/members/member-table-columns";
import { CreateMemberModal } from "@/components/admin/members/create-member-modal";
import { DeleteModal } from "@/components/admin/members/member-delete-modal";
import { Button } from "@/components/ui/button";
import { useModal } from "@/context/modal-context";
import { showToast } from "@/lib/toast";

/* ===================== FILTER TYPES ===================== */
type MemberFilters = {
  ageMin?: string;
  ageMax?: string;
  bloodGroup?: string;
  rationCardType?: string;
  educationQualification?: string;
  disease?: string;
  occupation?: string;
  wardArea?: string;
  schemes?: string;
  kudumbasreeName?: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState<MemberFilters>({});
  const { openModal } = useModal();

  /* ===================== FETCH MEMBERS ===================== */
  const fetchMembers = async (activeFilters?: MemberFilters) => {
    try {
      const params = new URLSearchParams();

      Object.entries(activeFilters || {}).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`/api/members?${params.toString()}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setMembers(data);
    } catch {
      showToast.error("Failed to fetch members");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  /* ===================== SORT ===================== */
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [members]);

  /* ===================== FILTER UPDATE ===================== */
  const updateFilter = (key: keyof MemberFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  /* ===================== CREATE / UPDATE (UPLOAD SUPPORT) ===================== */
  const handleSaveMember = async (
    data: any,
    pendingFiles?: (File | null)[],
    id?: string
  ) => {
    try {
      const formData = new FormData();

      /* ---------- TEXT FIELDS ---------- */
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          // Skip empty values to prevent overwriting with empty strings
          if (key !== "bloodGroup" && key !== "rationCardType") return;
        }

        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      /* ---------- FILES ---------- */
      pendingFiles?.forEach((file) => {
        if (file) {
          const type = (file as any)._uploadType;
          let key = "images";
          if (type === "ration") key = "rationCardImages";
          else if (type === "other") key = "otherImages";
          formData.append(key, file);
        }
      });

      const url = id ? `/api/members/${id}` : `/api/members`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error();

      const saved = await res.json();

      /* ---------- UPDATE TABLE ---------- */
      setMembers((prev) =>
        id
          ? prev.map((m) => (m.id === id ? { ...m, ...saved } : m))
          : [saved, ...prev]
      );

      showToast.success(
        id ? "Member updated successfully" : "Member created successfully"
      );
    } catch (error) {
      console.error(error);
      showToast.error("Failed to save member");
    }
  };

  /* ===================== DELETE ===================== */
  const handleBulkDeleteMembers = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/members?ids=${ids.join(",")}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setMembers((prev) => prev.filter((m) => !ids.includes(m.id)));
      showToast.success("Members deleted successfully");
    } catch {
      showToast.error("Failed to delete members");
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    fetchMembers({});
  };

  const columns = createColumns({
    onBulkDelete: handleBulkDeleteMembers,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ===================== MODALS ===================== */}
      <CreateMemberModal onSave={handleSaveMember} />

      <DeleteModal
        onDelete={handleBulkDeleteMembers}
        entityName="Member"
        entityNamePlural="Members"
      />

      {/* ===================== HEADER ===================== */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your members.
          </p>
        </div>
        <Button onClick={() => openModal("createMember")}>
          Create Member
        </Button>
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 bg-muted/50 p-3 md:p-4 rounded-lg transition-all">
        <input
          placeholder="Min Age"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.ageMin || ""}
          onChange={(e) => updateFilter("ageMin", e.target.value)}
        />

        <input
          placeholder="Max Age"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.ageMax || ""}
          onChange={(e) => updateFilter("ageMax", e.target.value)}
        />

        {/* Blood Group Dropdown */}
        <select
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.bloodGroup || ""}
          onChange={(e) => updateFilter("bloodGroup", e.target.value)}
        >
          <option value="">Blood Group</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
        </select>

        <select
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.rationCardType || ""}
          onChange={(e) => updateFilter("rationCardType", e.target.value)}
        >
          <option value="">Ration Card Type</option>
          <option value="Blue card">Blue card</option>
          <option value="Pink card">Pink card</option>
          <option value="White card">White card</option>
          <option value="Yellow card">Yellow card</option>
        </select>

        <input
          placeholder="Education"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.educationQualification || ""}
          onChange={(e) => updateFilter("educationQualification", e.target.value)}
        />

        <input
          placeholder="Disease"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.disease || ""}
          onChange={(e) => updateFilter("disease", e.target.value)}
        />

        <input
          placeholder="Occupation"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.occupation || ""}
          onChange={(e) => updateFilter("occupation", e.target.value)}
        />

        {/* Ward Dropdown */}
        <select
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.wardArea || ""}
          onChange={(e) => updateFilter("wardArea", e.target.value)}
        >
          <option value="">Select Ward</option>
          <option value="പെരുംചിറക്കോണം - മുള്ളുംമ്മൂട്">പെരുംചിറക്കോണം - മുള്ളുംമ്മൂട്</option>
          <option value="കരിക്കകം - തങ്കക്കല്ല്">കരിക്കകം - തങ്കക്കല്ല്</option>
          <option value="കൈതോട് - കുരിയണിക്കര">കൈതോട് - കുരിയണിക്കര</option>
          <option value="കോങ്കലിൽ - മൂന്നാംകൊണം">കോങ്കലിൽ - മൂന്നാംകൊണം</option>
          <option value="ഇരപ്പിൽ - കോട്ടൂർക്കോണം">ഇരപ്പിൽ - കോട്ടൂർക്കോണം</option>
          <option value="എലിക്കുന്നാം മുഗൾ - കുന്നുംപുറം - ഈട്ടിമൂട്">എലിക്കുന്നാം മുഗൾ - കുന്നുംപുറം - ഈട്ടിമൂട്</option>
        </select>

        {/* Schemes Input */}
        <input
          placeholder="Schemes"
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.schemes || ""}
          onChange={(e) => updateFilter("schemes", e.target.value)}
        />

        {/* Kudumbasree Dropdown */}
        <select
          className="border px-3 py-2 rounded-md text-sm flex-1 sm:flex-none"
          value={filters.kudumbasreeName || ""}
          onChange={(e) => updateFilter("kudumbasreeName", e.target.value)}
        >
          <option value="">Select Kudumbasree</option>
          <option value="ആവണി">ആവണി</option>
          <option value="വിദ്യ">വിദ്യ</option>
          <option value="തുല്യത">തുല്യത</option>
          <option value="സമത്വം">സമത്വം</option>
          <option value="മൈത്രി">മൈത്രി</option>
          <option value="പവിത്രം">പവിത്രം</option>
          <option value="മഹാദേവർ">മഹാദേവർ</option>
          <option value="മലർവാടി">മലർവാടി</option>
          <option value="സാന്ത്വനം">സാന്ത്വനം</option>
          <option value="ഉണർവ്വ്">ഉണർവ്വ്</option>
          <option value="കൃഷ്ണ">കൃഷ്ണ</option>
          <option value="ത്രയംബകം">ത്രയംബകം</option>
          <option value="മഞ്ഞും മൂട്ടിൽ">മഞ്ഞും മൂട്ടിൽ</option>
          <option value="ബിസ്മി">ബിസ്മി</option>
          <option value="അക്ഷയ">അക്ഷയ</option>
          <option value="തേജസ്‌">തേജസ്‌</option>
          <option value="സർവ്വോദയ">സർവ്വോദയ</option>
          <option value="മഞ്ചാടി">മഞ്ചാടി</option>
          <option value="കാർത്തിക">കാർത്തിക</option>
        </select>

        <Button
          onClick={() => fetchMembers(filters)}
          size="sm"
          className="flex-1 sm:flex-none"
        >
          Apply
        </Button>

        <Button
          variant="outline"
          onClick={handleResetFilters}
          size="sm"
          className="flex-1 sm:flex-none"
        >
          Reset
        </Button>
      </div>

      {/* ===================== TABLE ===================== */}
      <MemberTable columns={columns} data={sortedMembers} />
    </div>
  );
}
