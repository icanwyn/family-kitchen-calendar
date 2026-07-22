/**
 * iCalendar (ICS) parser for Google / Outlook feeds.
 * Includes date-window filtering and basic RRULE expansion
 * (daily / weekly / monthly / yearly) so future months populate.
 */

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
}

/** Default import window: 1 year back, 2 years forward */
export const ICS_PAST_DAYS = 365;
export const ICS_FUTURE_DAYS = 730;

function unfold(ics: string): string {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Parse DATE (YYYYMMDD) or DATETIME (YYYYMMDDTHHMMSS or with Z) */
function parseIcsDate(
  raw: string,
  params: string
): { date: Date; allDay: boolean } {
  const value = raw.trim();
  const isDateOnly =
    params.includes("VALUE=DATE") || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6)) - 1;
    const d = Number(value.slice(6, 8));
    return { date: new Date(y, m, d, 0, 0, 0, 0), allDay: true };
  }

  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
  );
  if (m) {
    const [, yy, mo, dd, hh, mi, ss, z] = m;
    if (z) {
      return {
        date: new Date(Date.UTC(+yy, +mo - 1, +dd, +hh, +mi, +ss)),
        allDay: false,
      };
    }
    return {
      date: new Date(+yy, +mo - 1, +dd, +hh, +mi, +ss),
      allDay: false,
    };
  }

  const d = new Date(value);
  return {
    date: Number.isNaN(d.getTime()) ? new Date() : d,
    allDay: false,
  };
}

function getProp(
  block: string,
  name: string
): { value: string; params: string } | null {
  const re = new RegExp(`^${name}([^:]*):(.*)$`, "im");
  const match = block.match(re);
  if (!match) return null;
  return { params: match[1] || "", value: match[2].trim() };
}

function parseRRule(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) out[k.toUpperCase()] = v;
  }
  return out;
}

const WEEKDAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Expand a single VEVENT (with optional RRULE) into concrete occurrences
 * within [rangeStart, rangeEnd].
 */
function expandEvent(
  start: Date,
  end: Date,
  allDay: boolean,
  rruleRaw: string | null,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences = 500
): { start: Date; end: Date }[] {
  const duration = end.getTime() - start.getTime();
  const results: { start: Date; end: Date }[] = [];

  // Always include the original instance if in range
  if (start >= rangeStart && start <= rangeEnd) {
    results.push({ start: new Date(start), end: new Date(end) });
  }

  if (!rruleRaw) return results;

  const rule = parseRRule(rruleRaw);
  const freq = (rule.FREQ || "").toUpperCase();
  if (!freq) return results;

  const interval = Math.max(1, parseInt(rule.INTERVAL || "1", 10) || 1);
  const count = rule.COUNT ? parseInt(rule.COUNT, 10) : null;
  let until: Date | null = null;
  if (rule.UNTIL) {
    // UNTIL can be date or datetime
    until = parseIcsDate(rule.UNTIL, rule.UNTIL.length === 8 ? "VALUE=DATE" : "")
      .date;
  }

  const byDay = rule.BYDAY
    ? rule.BYDAY.split(",").map((d) => d.replace(/[^A-Z]/g, ""))
    : null;

  // EXDATE not fully handled for every edge case; skip simple EXDATEs later if needed
  let occurrenceIndex = 0; // counts all generated including original
  // If original is before range, we still count it for COUNT
  if (count !== null && start < rangeStart) {
    // Estimate how many occurrences before range for COUNT accounting
    // We'll regenerate from start and count properly
  }

  const cursor = new Date(start);
  let generated = 0;
  const hardLimit = maxOccurrences;

  // For COUNT, include the original as #1
  let totalCount = 1;

  while (generated < hardLimit) {
    // Advance cursor by frequency
    if (freq === "DAILY") {
      cursor.setDate(cursor.getDate() + interval);
    } else if (freq === "WEEKLY") {
      if (byDay && byDay.length > 0) {
        // Walk day-by-day to next matching weekday, respecting interval weeks
        let found = false;
        for (let step = 1; step <= 14 * interval; step++) {
          const trial = new Date(cursor);
          trial.setDate(trial.getDate() + step);
          const weeksFromStart = Math.floor(
            (trial.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksFromStart % interval !== 0 && interval > 1) {
            // only on interval weeks from start week
            const startWeek = startOfWeekMonday(start);
            const trialWeek = startOfWeekMonday(trial);
            const weekDiff = Math.round(
              (trialWeek.getTime() - startWeek.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            );
            if (weekDiff % interval !== 0) continue;
          }
          const code = Object.keys(WEEKDAY_MAP).find(
            (k) => WEEKDAY_MAP[k] === trial.getDay()
          );
          if (code && byDay.includes(code)) {
            cursor.setTime(trial.getTime());
            found = true;
            break;
          }
        }
        if (!found) {
          cursor.setDate(cursor.getDate() + 7 * interval);
        }
      } else {
        cursor.setDate(cursor.getDate() + 7 * interval);
      }
    } else if (freq === "MONTHLY") {
      cursor.setMonth(cursor.getMonth() + interval);
    } else if (freq === "YEARLY") {
      cursor.setFullYear(cursor.getFullYear() + interval);
    } else {
      // Unsupported FREQ (e.g. HOURLY) — only original instance
      break;
    }

    if (until && cursor > until) break;
    if (count !== null && totalCount >= count) break;
    if (cursor > rangeEnd) break;

    totalCount++;
    if (cursor >= rangeStart && cursor <= rangeEnd) {
      // Skip if same as original start (already added)
      if (cursor.getTime() === start.getTime()) continue;
      results.push({
        start: new Date(cursor),
        end: new Date(cursor.getTime() + duration),
      });
      generated++;
    } else if (cursor < rangeStart) {
      // still counting toward COUNT
      generated++;
    }
  }

  return results;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function parseIcs(
  icsText: string,
  options?: { pastDays?: number; futureDays?: number }
): ParsedIcsEvent[] {
  const pastDays = options?.pastDays ?? ICS_PAST_DAYS;
  const futureDays = options?.futureDays ?? ICS_FUTURE_DAYS;
  const now = Date.now();
  const rangeStart = new Date(now - pastDays * 24 * 60 * 60 * 1000);
  const rangeEnd = new Date(now + futureDays * 24 * 60 * 60 * 1000);

  const text = unfold(icsText);
  const blocks = text.split("BEGIN:VEVENT");
  const events: ParsedIcsEvent[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < blocks.length; i++) {
    const endIdx = blocks[i].indexOf("END:VEVENT");
    const block = endIdx >= 0 ? blocks[i].slice(0, endIdx) : blocks[i];

    const summary = getProp(block, "SUMMARY");
    const dtstart = getProp(block, "DTSTART");
    if (!summary || !dtstart) continue;

    const status = getProp(block, "STATUS");
    if (status?.value.toUpperCase() === "CANCELLED") continue;

    // Recurrence exceptions often have RECURRENCE-ID — treat as single instances
    const recurrenceId = getProp(block, "RECURRENCE-ID");
    const rrule = recurrenceId ? null : getProp(block, "RRULE");

    const dtend = getProp(block, "DTEND");
    const uid = getProp(block, "UID");
    const desc = getProp(block, "DESCRIPTION");
    const loc = getProp(block, "LOCATION");

    const startParsed = parseIcsDate(dtstart.value, dtstart.params);
    let endParsed: { date: Date; allDay: boolean };
    if (dtend) {
      endParsed = parseIcsDate(dtend.value, dtend.params);
    } else if (startParsed.allDay) {
      const d = new Date(startParsed.date);
      d.setDate(d.getDate() + 1);
      endParsed = { date: d, allDay: true };
    } else {
      const d = new Date(startParsed.date);
      d.setHours(d.getHours() + 1);
      endParsed = { date: d, allDay: false };
    }

    const baseUid = uid?.value || `ics_${i}`;
    const title = unescapeText(summary.value);
    const description = desc ? unescapeText(desc.value) : undefined;
    const location = loc ? unescapeText(loc.value) : undefined;

    const occurrences = expandEvent(
      startParsed.date,
      endParsed.date,
      startParsed.allDay,
      rrule?.value ?? null,
      rangeStart,
      rangeEnd
    );

    for (const occ of occurrences) {
      const key = `${baseUid}|${occ.start.toISOString()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        uid: key,
        title,
        description,
        location,
        start: occ.start.toISOString(),
        end: occ.end.toISOString(),
        allDay: startParsed.allDay,
      });
    }
  }

  return events;
}
