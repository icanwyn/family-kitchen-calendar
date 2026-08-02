import type { Chore, PointsEntry } from "./types";
import { choreAssigneeIds } from "./types";

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
    if (!e.memberId || !e.points) continue;
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
 * Decide who earns points when a chore is completed.
 *
 * Rules (family kitchen / rewards fair):
 * 1. If the person completing is an assignee → they get full points
 * 2. Else if exactly one assignee → they get full points (parent checks off for a kid)
 * 3. Else if multiple assignees → split points evenly among them
 * 4. Else fall back to the completer / active user
 */
export function resolvePointsRecipients(
  chore: Chore,
  options: {
    completedById?: string | null;
    activeMemberId?: string | null;
    validMemberIds?: Set<string> | string[];
  } = {}
): { memberId: string; points: number }[] {
  const pts = Math.max(0, Math.round(Number(chore.points) || 0));
  if (pts <= 0) return [];

  const assignees = choreAssigneeIds(chore);
  const completer = options.completedById || options.activeMemberId || null;

  const valid = options.validMemberIds
    ? options.validMemberIds instanceof Set
      ? options.validMemberIds
      : new Set(options.validMemberIds)
    : null;

  const isValid = (id: string) => !valid || valid.has(id);

  // Completer is one of the people assigned → they did the job
  if (completer && isValid(completer) && assignees.includes(completer)) {
    return [{ memberId: completer, points: pts }];
  }

  // Completer not an assignee (e.g. parent marking done for a child)
  const validAssignees = assignees.filter(isValid);
  if (validAssignees.length === 1) {
    return [{ memberId: validAssignees[0], points: pts }];
  }
  if (validAssignees.length > 1) {
    const share = Math.floor(pts / validAssignees.length);
    const remainder = pts - share * validAssignees.length;
    return validAssignees.map((memberId, i) => ({
      memberId,
      points: share + (i === 0 ? remainder : 0),
    }));
  }

  // Unassigned chore — credit whoever marked it done
  if (completer && isValid(completer)) {
    return [{ memberId: completer, points: pts }];
  }

  return [];
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
