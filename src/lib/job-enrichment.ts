type LooseDocument = Record<string, any>;

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const normalizePhoneNumber = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  return digits.length > 10 ? digits.slice(-10) : digits;
};

const getUserDisplayName = (user?: LooseDocument) =>
  pickString(
    user?.fullName,
    user?.name,
    user?.displayName,
    user?.username
  );

const getJobPosterFallback = (job: LooseDocument) =>
  pickString(
    job.postedByName,
    job.userName,
    job.posterName,
    job.createdByName,
    job.fullName,
    job.name
  );

const getJobAddress = (job: LooseDocument) =>
  pickString(
    job.jobAddress,
    job.fullAddress,
    job.locationText,
    job.address,
    job.workAddress,
    job.addressLine
  );

const getJobDetails = (job: LooseDocument) =>
  pickString(job.jobDetails, job.details, job.description, job.jobDescription);

export async function enrichJobsWithPosterDetails<T extends LooseDocument>(
  jobs: T[],
  User: any
) {
  const phoneKeys = new Set(
    jobs
      .map((job) => normalizePhoneNumber(job.phoneNumber || job.phone || job.mobileNumber))
      .filter(Boolean)
  );

  if (phoneKeys.size === 0) {
    return jobs.map((job) => ({
      ...job,
      id: job.id || job._id?.toString?.(),
      postedByName: getJobPosterFallback(job),
      jobDetails: getJobDetails(job),
      jobAddress: getJobAddress(job),
    }));
  }

  const users = await User.find(
    {},
    {
      phoneNumber: 1,
      phone: 1,
      mobileNumber: 1,
      fullName: 1,
      name: 1,
      displayName: 1,
      username: 1,
      createdAt: 1,
    }
  )
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  const userByPhone = new Map<string, LooseDocument>();

  for (const user of users) {
    const userPhoneFields = [user.phoneNumber, user.phone, user.mobileNumber];

    for (const phone of userPhoneFields) {
      const key = normalizePhoneNumber(phone);
      if (!key || !phoneKeys.has(key)) continue;

      const existingUser = userByPhone.get(key);
      if (!existingUser || (!getUserDisplayName(existingUser) && getUserDisplayName(user))) {
        userByPhone.set(key, user);
      }
    }
  }

  return jobs.map((job) => {
    const phoneKey = normalizePhoneNumber(job.phoneNumber || job.phone || job.mobileNumber);
    const matchedUser = phoneKey ? userByPhone.get(phoneKey) : undefined;
    const postedByName = getUserDisplayName(matchedUser) || getJobPosterFallback(job);

    return {
      ...job,
      id: job.id || job._id?.toString?.(),
      postedByName,
      jobDetails: getJobDetails(job),
      jobAddress: getJobAddress(job),
    };
  });
}
