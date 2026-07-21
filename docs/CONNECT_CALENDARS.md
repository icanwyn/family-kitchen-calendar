# Connecting Google Calendar or Outlook

Family Kitchen Calendar imports events using a **published ICS / iCal feed URL**. You do not enter your Google or Microsoft password into this app.

## Google Calendar

1. Open [calendar.google.com](https://calendar.google.com) on a computer.
2. Click the **gear** → **Settings**.
3. Under **Settings for my calendars**, select the calendar to share.
4. Scroll to **Integrate calendar**.
5. Copy **Secret address in iCal format**  
   (looks like `https://calendar.google.com/calendar/ical/.../basic.ics`).
6. In this app: **Family** → choose the member → **Google** → paste the link → **Connect & import**.

To stop sharing later: Google Calendar settings → reset the secret address.

## Outlook (personal / Microsoft 365 web)

1. Open [Outlook Calendar on the web](https://outlook.live.com/calendar/).
2. **Settings** → **View all Outlook settings**.
3. **Calendar** → **Shared calendars**.
4. Under **Publish a calendar**, choose the calendar and **Can view all details**.
5. **Publish**, then copy the **ICS** link.
6. In this app: **Family** → member → **Outlook** → paste → **Connect & import**.

## After connecting

- Events appear on **Today** and **Calendar**, colored for that family member.
- Tap **Sync** on the member card anytime to refresh from the feed.
- **Disconnect** removes the link and imported events from that provider.

## Privacy notes

- Treat the ICS URL like a password: anyone with it can read that calendar.
- Only paste it on your trusted kitchen device.
- The app fetches the feed through a local proxy (`/api/ics`) so the browser is not blocked by CORS.
- Data stays in this browser’s `localStorage` unless you deploy your own backend.

## Why not “Sign in with Google”?

Full OAuth (Google Sign-In / Microsoft login) needs cloud app credentials, redirect URLs, and secure token storage. The ICS approach works for a home kitchen tablet today without that setup. OAuth can be added later if you want two-way edit from this app into Google/Outlook.
