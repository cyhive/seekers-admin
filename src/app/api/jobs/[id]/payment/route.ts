import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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

    const { response, data } = await backendFetch(
      `/job-payments/job/${id}`
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            data?.error ||
            `Failed to fetch payment (status ${response.status})`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data ?? data,
    });
  } catch (error: any) {
    console.error("API Error (GET /api/jobs/[id]/payment):", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "link").toLowerCase();

    const path =
      action === "sync"
        ? `/job-payments/job/${id}/sync`
        : `/job-payments/job/${id}/link`;

    const { response, data } = await backendFetch(path, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            data?.message ||
            data?.error ||
            `Failed to ${action} payment (status ${response.status})`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        data?.message ||
        (action === "sync"
          ? "Payment status synced"
          : "Payment link created"),
      data: data?.data ?? data,
    });
  } catch (error: any) {
    console.error("API Error (POST /api/jobs/[id]/payment):", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process payment action",
      },
      { status: 500 }
    );
  }
}
