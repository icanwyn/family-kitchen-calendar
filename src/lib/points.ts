import type { PointsEntry } from "./types";

/** Calendar month key YYYY-MM in local time */
export function monthKeyFromDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthKeyFromIso(iso: string): string {
  return monthKeyFromDate(new Date(iso));
}

/** Human label e.g. "July 2026" */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

/** Entries that count toward the current rewards month */
export function entriesForMonth(
  ledger: PointsEntry[],
  monthKey: string
): PointsEntry[] {
  return (ledger ?? []).filter((e) => e.monthKey === monthKey);
}

/** Total points per member for a month */
export function monthlyPointsByMember(
  ledger: PointsEntry[],
  monthKey: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entriesForMonth(ledger, monthKey)) {
    map.set(e.memberId, (map.get(e.memberId) ?? 0) + e.points);
  }
  return map;
}

export function monthlyFamilyTotal(
  ledger: PointsEntry[],
  monthKey: string
): number {
  return entriesForMonth(ledger, monthKey).reduce((s, e) => s + e.points, 0);
}

/**
 * On the 1st (or whenever month changes), we don't wipe history —
 * the "current month" score simply uses a new monthKey so totals reset
 * to zero for the new month while past months remain in the ledger.
 *
 * Optional: prune very old ledger entries (keep last 12 months).
 */
export function pruneOldPointsLedger(
  ledger: PointsEntry[],
  keepMonths = 12,
  now: Date = new Date()
): PointsEntry[] {
  if (!ledger?.length) return ledger ?? [];
  const keys = new Set<string>();
  for (let i = 0; i < keepMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.add(monthKeyFromDate(d));
  }
  return ledger.filter((e) => keys.has(e.monthKey));
}
