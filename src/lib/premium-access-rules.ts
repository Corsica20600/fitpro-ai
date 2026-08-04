const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export function getFreeAccessEmails() {
  return new Set(
    (process.env.TRAKNIO_FREE_ACCESS_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function hasPremiumAccess(profile: {
  email: string | null | undefined;
  subscriptionStatus: string;
  subscriptionCurrentPeriodEnd: Date | null;
}) {
  const email = profile.email?.trim().toLowerCase();
  if (email && getFreeAccessEmails().has(email)) return true;
  if (ENTITLED_STATUSES.has(profile.subscriptionStatus)) return true;

  const entitlementEnd = profile.subscriptionCurrentPeriodEnd?.getTime() ?? 0;
  return entitlementEnd > Date.now()
    && (profile.subscriptionStatus === "PAST_DUE" || profile.subscriptionStatus === "CANCELED");
}
