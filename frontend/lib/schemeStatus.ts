export type SchemeStatus = "OPEN" | "ACTIVE" | "UPCOMING" | "CLOSED";

function parseDateString(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function todayAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getEffectiveSchemeStatus(scheme: {
  status?: string | null;
  open_date?: string | null;
  close_date?: string | null;
}): SchemeStatus {
  const today = todayAtMidnight();
  const openDate = parseDateString(scheme.open_date);
  const closeDate = parseDateString(scheme.close_date);

  if (openDate && openDate > today) {
    return "UPCOMING";
  }

  if (closeDate) {
    return closeDate < today ? "CLOSED" : "OPEN";
  }

  const rawStatus = `${scheme.status || ""}`.toUpperCase();
  if (rawStatus === "OPEN" || rawStatus === "ACTIVE" || rawStatus === "UPCOMING" || rawStatus === "CLOSED") {
    return rawStatus;
  }

  return "ACTIVE";
}

export function normalizeScheme<T extends { status?: string | null; open_date?: string | null; close_date?: string | null }>(scheme: T) {
  return {
    ...scheme,
    status: getEffectiveSchemeStatus(scheme),
  };
}
