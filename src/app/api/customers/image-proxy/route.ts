import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const backendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://15.206.73.249/api";

const getOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = new Set(
  [
    getOrigin(backendApiUrl),
    ...(process.env.CUSTOMER_IMAGE_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => getOrigin(origin.trim())),
  ].filter(Boolean) as string[]
);

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { success: false, message: "Missing image URL" },
      { status: 400 }
    );
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid image URL" },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(imageUrl.protocol)) {
    return NextResponse.json(
      { success: false, message: "Unsupported image URL protocol" },
      { status: 400 }
    );
  }

  if (!allowedOrigins.has(imageUrl.origin)) {
    return NextResponse.json(
      { success: false, message: "Image origin is not allowed" },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(imageUrl, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, message: "Image not found" },
        { status: upstream.status || 404 }
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") || "application/octet-stream"
    );
    headers.set(
      "Cache-Control",
      upstream.headers.get("cache-control") || "public, max-age=3600, s-maxage=86400"
    );

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load image" },
      { status: 502 }
    );
  }
}
