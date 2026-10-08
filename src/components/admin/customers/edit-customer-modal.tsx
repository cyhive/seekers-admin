"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FieldKind = "text" | "longText" | "number" | "boolean" | "list" | "json" | "status";

type FieldState = {
  key: string;
  kind: FieldKind;
  original: unknown;
  value: string;
};

export type CustomerRowUpdate = {
  name: string;
  phoneNumber: string;
  category: string;
  address: string;
  status: string;
};

// Shown first, and always shown even when the user document doesn't have them yet
const COMMON_FIELDS: { key: string; kind: FieldKind }[] = [
  { key: "fullName", kind: "text" },
  { key: "phoneNumber", kind: "text" },
  { key: "primarySkill", kind: "text" },
  { key: "additionalSkills", kind: "list" },
  { key: "homeAddress", kind: "longText" },
  { key: "gender", kind: "text" },
  { key: "status", kind: "status" },
  { key: "idType", kind: "text" },
  { key: "yearsExperience", kind: "text" },
  { key: "availability", kind: "text" },
  { key: "hourlyRate", kind: "text" },
  { key: "dailyRate", kind: "text" },
  // Where completed-job payouts are sent (bank account is used when filled in, else UPI)
  { key: "payoutAccountHolderName", kind: "text" },
  { key: "payoutAccountNumber", kind: "text" },
  { key: "payoutIfsc", kind: "text" },
  { key: "payoutUpiId", kind: "text" },
];

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];
const LONG_TEXT_PATTERN = /address|details|description|about|bio/i;

const toLabel = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

const isPrimitive = (value: unknown) =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const getKind = (key: string, value: unknown): FieldKind => {
  if (key === "status") return "status";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return value.every(isPrimitive) ? "list" : "json";
  if (value && typeof value === "object") return "json";
  if (LONG_TEXT_PATTERN.test(key) || (typeof value === "string" && value.length > 80)) {
    return "longText";
  }
  return "text";
};

const toInputValue = (kind: FieldKind, value: unknown) => {
  if (value === null || value === undefined) return "";
  if (kind === "list") return (value as unknown[]).join(", ");
  if (kind === "json") return JSON.stringify(value, null, 2);
  return String(value);
};

// Converts the form text back to the same type the field had in the database
const fromInputValue = (field: FieldState) => {
  const text = field.value;
  switch (field.kind) {
    case "number": {
      if (!text.trim()) return null;
      const amount = Number(text);
      if (!Number.isFinite(amount)) throw new Error(`${toLabel(field.key)} must be a number`);
      return amount;
    }
    case "boolean":
      return text === "true";
    case "list": {
      const items = text.split(",").map((item) => item.trim()).filter(Boolean);
      const original = Array.isArray(field.original) ? field.original : [];
      const numeric = original.length > 0 && original.every((item) => typeof item === "number");
      return numeric ? items.map(Number) : items;
    }
    case "json":
      if (!text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`${toLabel(field.key)} must be valid JSON`);
      }
    default:
      return field.original === null && !text ? null : text;
  }
};

const buildFields = (data: Record<string, unknown>): FieldState[] => {
  const commonKeys = new Set(COMMON_FIELDS.map((field) => field.key));
  const common = COMMON_FIELDS.map(({ key, kind }) => {
    const original = data[key];
    const resolvedKind = original === undefined || original === null ? kind : getKind(key, original);
    return { key, kind: resolvedKind, original, value: toInputValue(resolvedKind, original) };
  });
  const rest = Object.keys(data)
    .filter((key) => !commonKeys.has(key))
    .sort((a, b) => a.localeCompare(b))
    .map((key) => {
      const kind = getKind(key, data[key]);
      return { key, kind, original: data[key], value: toInputValue(kind, data[key]) };
    });

  return [...common, ...rest];
};

const pickText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export function EditCustomerModal({
  customerId,
  onSaved,
  onClose,
}: {
  customerId: string;
  onSaved?: (update: CustomerRowUpdate) => void;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<FieldState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFieldKey, setNewFieldKey] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setFields(buildFields(result.data.fields));
      } catch (e: any) {
        setError(e.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const updateField = (key: string, value: string) =>
    setFields((current) =>
      current.map((field) => (field.key === key ? { ...field, value } : field))
    );

  const addField = () => {
    const key = newFieldKey.trim();
    if (!key) return;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      alert("Field name can only contain letters, numbers and underscores");
      return;
    }
    if (fields.some((field) => field.key === key)) {
      alert("That field already exists");
      return;
    }
    setFields((current) => [...current, { key, kind: "text", original: undefined, value: "" }]);
    setNewFieldKey("");
  };

  const handleSave = async () => {
    let updates: Record<string, unknown>;
    try {
      // Only send fields the admin actually changed
      updates = Object.fromEntries(
        fields
          .filter((field) => field.value !== toInputValue(field.kind, field.original))
          .map((field) => [field.key, fromInputValue(field)])
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Invalid value");
      return;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to update user");
      }

      const saved = data.data.fields as Record<string, unknown>;
      onSaved?.({
        name: pickText(saved.fullName, saved.name),
        phoneNumber: pickText(saved.phoneNumber, saved.phone, saved.mobileNumber),
        category: pickText(saved.primarySkill),
        address: pickText(saved.homeAddress, saved.address, saved.fullAddress),
        status: pickText(saved.status) || "Pending",
      });
      onClose();
    } catch (e) {
      console.error("Failed to update user:", e);
      alert(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (field: FieldState) => {
    const id = `edit-${field.key}`;
    const onChange = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => updateField(field.key, event.target.value);
    const selectClass =
      "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

    switch (field.kind) {
      case "status":
        return (
          <select id={id} value={field.value} onChange={onChange} className={selectClass}>
            {!STATUS_OPTIONS.includes(field.value) && (
              <option value={field.value}>{field.value || "Not set"}</option>
            )}
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "Approved" ? "Accepted" : status}
              </option>
            ))}
          </select>
        );
      case "boolean":
        return (
          <select id={id} value={field.value} onChange={onChange} className={selectClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case "number":
        return <Input id={id} type="number" value={field.value} onChange={onChange} />;
      case "longText":
        return <Textarea id={id} rows={3} value={field.value} onChange={onChange} />;
      case "json":
        return (
          <Textarea
            id={id}
            rows={5}
            value={field.value}
            onChange={onChange}
            className="font-mono text-xs"
          />
        );
      case "list":
        return (
          <Input id={id} value={field.value} onChange={onChange} placeholder="Comma separated" />
        );
      default:
        return <Input id={id} value={field.value} onChange={onChange} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold">Edit user</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Loading user…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.kind === "longText" || field.kind === "json" ? "sm:col-span-2" : ""
                    }
                  >
                    <label
                      htmlFor={`edit-${field.key}`}
                      className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {toLabel(field.key)}
                    </label>
                    {renderInput(field)}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2 border-t pt-4">
                <Input
                  placeholder="Add another field (e.g. email)"
                  value={newFieldKey}
                  onChange={(event) => setNewFieldKey(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addField();
                  }}
                />
                <Button type="button" variant="outline" onClick={addField}>
                  Add field
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 shrink-0 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
