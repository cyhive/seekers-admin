"use client";

import { useEffect, useState } from "react";

type WorkerProfile = {
  id: string;
  name: string;
  phoneNumber: string;
  profession: string;
  additionalSkills: string[];
  yearsExperience: string;
  availability: string;
  hourlyRate: string;
  dailyRate: string;
  homeAddress: string;
  gender: string;
  status: string;
  idType: string | null;
  idPhotoFront: string | null;
  idPhotoBack: string | null;
  profilePhoto: string | null;
  portfolio: string[];
  averageRating: number | null;
  reviewCount: number;
  reviews: Array<{
    rating: number | null;
    comment: string;
    createdAt: string | null;
  }>;
};

const getAlternateImageUrl = (url: string) => {
  if (url.includes("/api/uploads/")) {
    return url.replace("/api/uploads/", "/uploads/");
  }
  if (url.includes("/uploads/")) {
    return url.replace("/uploads/", "/api/uploads/");
  }
  return url;
};

const FallbackImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasRetried, setHasRetried] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setHasRetried(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasRetried) {
          setCurrentSrc(getAlternateImageUrl(currentSrc));
          setHasRetried(true);
        }
      }}
    />
  );
};

const display = (value: unknown) => {
  if (typeof value !== "string") return "-";
  return value.trim() || "-";
};

export function WorkerProfileModal({
  phone,
  fallbackName,
  onClose,
}: {
  phone: string;
  fallbackName?: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/workers/profile?phone=${encodeURIComponent(phone)}`
        );
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        setProfile(result.data);
      } catch (e: any) {
        setError(e.message || "Failed to load worker details");
      } finally {
        setLoading(false);
      }
    })();
  }, [phone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">
              {profile?.name || fallbackName || "Worker details"}
            </h3>
            <p className="text-sm text-gray-500">
              {profile?.phoneNumber || phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Loading worker details…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {profile && !loading && (
          <div className="flex-1 overflow-y-auto pr-2 space-y-5">
            <div className="rounded-md border bg-gray-50 px-3 py-3">
              <p className="text-sm">
                Rating:{" "}
                <span className="font-semibold">
                  {profile.averageRating !== null
                    ? `${profile.averageRating} / 5`
                    : "No ratings yet"}
                </span>
                {profile.reviewCount > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({profile.reviewCount} review
                    {profile.reviewCount === 1 ? "" : "s"})
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Profession:</span>{" "}
                <span className="font-medium">{display(profile.profession)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Experience:</span>{" "}
                <span className="font-medium">
                  {display(profile.yearsExperience)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Availability:</span>{" "}
                <span className="font-medium">
                  {display(profile.availability)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">ID Type:</span>{" "}
                <span className="font-medium capitalize">
                  {display(profile.idType || "")}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Hourly rate:</span>{" "}
                <span className="font-medium">{display(profile.hourlyRate)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Daily rate:</span>{" "}
                <span className="font-medium">{display(profile.dailyRate)}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Skills:</span>{" "}
                <span className="font-medium">
                  {profile.additionalSkills.length
                    ? profile.additionalSkills.join(", ")
                    : "-"}
                </span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Address:</span>{" "}
                <span className="font-medium">{display(profile.homeAddress)}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Profile Photo", src: profile.profilePhoto },
                { label: "ID Photo Front", src: profile.idPhotoFront },
                { label: "ID Photo Back", src: profile.idPhotoBack },
              ].map(({ label, src }) => (
                <div key={label}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  {src ? (
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      <FallbackImage
                        src={src}
                        alt={label}
                        className="h-40 w-full rounded-lg border object-cover transition hover:opacity-90 shadow-sm"
                      />
                    </a>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              ))}
            </div>

            {profile.reviews.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Recent reviews
                </p>
                <div className="space-y-2">
                  {profile.reviews.map((review, index) => (
                    <div
                      key={`${review.createdAt}-${index}`}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">
                        {review.rating !== null ? `${review.rating} / 5` : "Rating n/a"}
                      </p>
                      <p className="text-muted-foreground">
                        {display(review.comment)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
