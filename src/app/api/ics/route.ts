import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy ICS calendar feeds (Google secret iCal URL, Outlook published ICS)
 * so the browser can import without CORS failures.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "Only http(s) URLs allowed" }, { status: 400 });
  }

  // Basic SSRF guard — block private IPs
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return NextResponse.json({ error: "Private hosts not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/calendar, text/plain, */*",
        "User-Agent": "FamilyKitchenCalendar/1.0",
      },
      // Don't cache forever — feeds update
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR") && !text.includes("BEGIN:VEVENT")) {
      return NextResponse.json(
        { error: "URL did not return a valid calendar (ICS) file" },
        { status: 422 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
