"use client";

type RecentJob = {
  id: string;
  title: string;
  postedByName: string;
  phoneNumber: string;
  status: string;
  estimatedAmount: number | null;
  createdAt: string | null;
};

const formatCurrency = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const statusClass = (status: string) => {
  const lower = status.toLowerCase();
  if (lower === "approved" || lower === "completed" || lower === "paid") {
    return "bg-green-100 text-green-700";
  }
  if (lower === "rejected") return "bg-red-100 text-red-700";
  return "bg-secondary text-secondary-foreground";
};

export function RecentOrders({ jobs }: { jobs: RecentJob[] }) {
  return (
    <div
      className="rounded-lg border bg-card text-card-foreground shadow-sm glassmorphism animate-slide-in-up"
      style={{ animationDelay: "600ms" }}
    >
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight font-headline">
          Recent Jobs
        </h3>
        <p className="text-sm text-muted-foreground">
          Latest jobs from the database.
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Job
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Estimate
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {jobs.length ? (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.postedByName}
                        {job.phoneNumber ? ` · ${job.phoneNumber}` : ""}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {formatCurrency(job.estimatedAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
