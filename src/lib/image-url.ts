const backendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://15.206.73.249/api";

const backendOrigin = new URL(backendApiUrl).origin;

const getOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const proxiedOrigins = new Set(
  [
    backendOrigin,
    ...(process.env.CUSTOMER_IMAGE_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => getOrigin(origin.trim())),
  ].filter(Boolean) as string[]
);

const proxiedImageUrl = (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    if (proxiedOrigins.has(url.origin)) {
      return `/api/customers/image-proxy?url=${encodeURIComponent(
        url.toString()
      )}`;
    }
  } catch {}

  return imageUrl;
};

export const formatImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath) return null;

  if (/^data:image\//i.test(imagePath)) {
    return imagePath;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return proxiedImageUrl(imagePath);
  }

  const cleanPath = imagePath.replace(/^\/+/, "");

  if (cleanPath.startsWith("uploads/")) {
    return proxiedImageUrl(`${backendOrigin}/${cleanPath}`);
  }

  if (cleanPath.startsWith("api/uploads/")) {
    return proxiedImageUrl(
      `${backendOrigin}/${cleanPath.replace(/^api\//, "")}`
    );
  }

  return proxiedImageUrl(`${backendOrigin}/uploads/${cleanPath}`);
};
