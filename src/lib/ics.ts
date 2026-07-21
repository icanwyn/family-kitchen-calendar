/**
 * Minimal iCalendar (ICS) parser for VEVENT import.
 * Handles common Google Calendar / Outlook export formats.
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
): { iso: string; allDay: boolean } {
  const value = raw.trim();
  const isDateOnly =
    params.includes("VALUE=DATE") || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6)) - 1;
    const d = Number(value.slice(6, 8));
    const date = new Date(y, m, d, 0, 0, 0, 0);
    return { iso: date.toISOString(), allDay: true };
  }

  // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
  );
  if (m) {
    const [, yy, mo, dd, hh, mi, ss, z] = m;
    if (z) {
      return {
        iso: new Date(
          Date.UTC(+yy, +mo - 1, +dd, +hh, +mi, +ss)
        ).toISOString(),
        allDay: false,
      };
    }
    return {
      iso: new Date(+yy, +mo - 1, +dd, +hh, +mi, +ss).toISOString(),
      allDay: false,
    };
  }

  // Fallback
  const d = new Date(value);
  return {
    iso: Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
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

export function parseIcs(icsText: string): ParsedIcsEvent[] {
  const text = unfold(icsText);
  const blocks = text.split("BEGIN:VEVENT");
  const events: ParsedIcsEvent[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const endIdx = blocks[i].indexOf("END:VEVENT");
    const block = endIdx >= 0 ? blocks[i].slice(0, endIdx) : blocks[i];

    const summary = getProp(block, "SUMMARY");
    const dtstart = getProp(block, "DTSTART");
    if (!summary || !dtstart) continue;

    const dtend = getProp(block, "DTEND");
    const uid = getProp(block, "UID");
    const desc = getProp(block, "DESCRIPTION");
    const loc = getProp(block, "LOCATION");

    const start = parseIcsDate(dtstart.value, dtstart.params);
    let end: { iso: string; allDay: boolean };
    if (dtend) {
      end = parseIcsDate(dtend.value, dtend.params);
    } else if (start.allDay) {
      const d = new Date(start.iso);
      d.setDate(d.getDate() + 1);
      end = { iso: d.toISOString(), allDay: true };
    } else {
      const d = new Date(start.iso);
      d.setHours(d.getHours() + 1);
      end = { iso: d.toISOString(), allDay: false };
    }

    // Skip cancelled
    const status = getProp(block, "STATUS");
    if (status?.value.toUpperCase() === "CANCELLED") continue;

    events.push({
      uid: uid?.value || `ics_${i}_${start.iso}`,
      title: unescapeText(summary.value),
      description: desc ? unescapeText(desc.value) : undefined,
      location: loc ? unescapeText(loc.value) : undefined,
      start: start.iso,
      end: end.iso,
      allDay: start.allDay,
    });
  }

  return events;
}
