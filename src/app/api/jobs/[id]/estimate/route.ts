import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

const parseAmount = (value: unknown, fieldName: string) => {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }

  return amount;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing job id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const estimatedAmount = parseAmount(
      body?.estimatedAmount ?? body?.estimateAmount,
      "estimatedAmount"
    );
    const platformFeePercent = parseAmount(
      body?.platformFeePercent ?? body?.platformFee ?? 10,
      "platformFeePercent"
    );

    const { response, data } = await backendFetch(`/jobs/${id}/estimate`, {
      method: "PATCH",
      body: JSON.stringify({
        estimatedAmount,
        platformFeePercent,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            data?.error ||
            `Failed to save estimate (status ${response.status})`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "Estimate saved successfully",
      data: data?.data ?? data,
    });
  } catch (error: any) {
    console.error("API Error (PATCH /api/jobs/[id]/estimate):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save estimate" },
      { status: 500 }
    );
  }
}
