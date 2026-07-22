"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass } from "@/components/ui/Modal";
import type { FamilyMember } from "@/lib/types";

interface ConnectCalendarModalProps {
  open: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  provider: "google" | "outlook" | null;
}

type Step = "form" | "connecting" | "syncing" | "done" | "error";

export function ConnectCalendarModal({
  open,
  onClose,
  member,
  provider,
}: ConnectCalendarModalProps) {
  const { connectCalendar, syncCalendar } = useFamilyStore();
  const [email, setEmail] = useState("");
  const [icsUrl, setIcsUrl] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [showGuide, setShowGuide] = useState(true);

  const providerLabel = provider === "google" ? "Google Calendar" : "Outlook";
  const providerColor = provider === "google" ? "bg-red-500" : "bg-sky-600";

  useEffect(() => {
    if (!open || !member) return;
    setEmail(member.email ?? "");
    setIcsUrl("");
    setStep("form");
    setErrorMsg("");
    setImportedCount(0);
    setShowGuide(true);
  }, [open, member, provider]);

  const handleConnect = async () => {
    if (!member || !provider || !email.trim()) return;
    setStep("connecting");
    setErrorMsg("");

    const connectionId = connectCalendar(member.id, provider, {
      email: email.trim(),
      icsUrl: icsUrl.trim() || undefined,
    });

    // If no ICS URL, demo-only link
    if (!icsUrl.trim()) {
      await new Promise((r) => setTimeout(r, 900));
      setImportedCount(0);
      setStep("done");
      return;
    }

    // Import events from the ICS feed
    setStep("syncing");
    try {
      // Let React commit the new connection before reading it in sync
      await new Promise((r) => setTimeout(r, 30));
      const count = await syncCalendar(member.id, connectionId);
      setImportedCount(count);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sync failed");
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setEmail("");
    setIcsUrl("");
    setErrorMsg("");
    onClose();
  };

  if (!member || !provider) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Connect ${providerLabel}`}
      wide
    >
      {step === "form" && (
        <>
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Link{" "}
              <span className="font-semibold text-slate-900">
                {member.avatarEmoji} {member.name}
              </span>
              &apos;s {providerLabel} so their events show on the kitchen board.
            </p>
          </div>

          {/* How-to guide */}
          <div className="mb-5 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60">
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-sky-900"
            >
              How do I get my calendar link?
              <span className="text-sky-500">{showGuide ? "−" : "+"}</span>
            </button>
            {showGuide && (
              <div className="space-y-3 border-t border-sky-100 px-4 pb-4 pt-3 text-sm text-slate-700">
                {provider === "google" ? (
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      Open{" "}
                      <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-700 underline"
                      >
                        Google Calendar
                      </a>{" "}
                      on a computer
                    </li>
                    <li>
                      Click the gear ⚙️ → <strong>Settings</strong>
                    </li>
                    <li>
                      Left sidebar: pick the calendar under{" "}
                      <strong>Settings for my calendars</strong>
                    </li>
                    <li>
                      Scroll to <strong>Integrate calendar</strong>
                    </li>
                    <li>
                      Copy{" "}
                      <strong>Secret address in iCal format</strong> (starts
                      with{" "}
                      <code className="rounded bg-white px-1 text-xs">
                        https://calendar.google.com/calendar/ical/…
                      </code>
                      )
                    </li>
                    <li>Paste it below and connect</li>
                  </ol>
                ) : (
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>
                      Open{" "}
                      <a
                        href="https://outlook.live.com/calendar/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sky-700 underline"
                      >
                        Outlook Calendar
                      </a>{" "}
                      (or Outlook on the web for Microsoft 365)
                    </li>
                    <li>
                      Click <strong>Settings</strong> ⚙️ →{" "}
                      <strong>View all Outlook settings</strong>
                    </li>
                    <li>
                      Go to <strong>Calendar</strong> →{" "}
                      <strong>Shared calendars</strong>
                    </li>
                    <li>
                      Under <strong>Publish a calendar</strong>, choose your
                      calendar and permissions (
                      <em>Can view all details</em>)
                    </li>
                    <li>
                      Click <strong>Publish</strong>, then copy the{" "}
                      <strong>ICS</strong> link
                    </li>
                    <li>Paste it below and connect</li>
                  </ol>
                )}
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <strong>Privacy:</strong> The secret ICS link can read your
                  calendar. Only paste it on your family kitchen device. You can
                  reset/revoke the link anytime in Google or Outlook settings.
                </p>
                <p className="text-xs text-slate-500">
                  Email alone (without an ICS link) only marks the account as
                  linked for demo purposes — events will not import until you
                  paste a feed URL.
                </p>
              </div>
            )}
          </div>

          <Field label="Account email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                provider === "google" ? "name@gmail.com" : "name@outlook.com"
              }
              autoFocus
            />
          </Field>

          <Field label="Calendar ICS / iCal link (recommended)">
            <input
              type="url"
              className={inputClass}
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              placeholder={
                provider === "google"
                  ? "https://calendar.google.com/calendar/ical/…"
                  : "https://outlook.live.com/owa/calendar/…"
              }
            />
            <span className="mt-1 block text-xs text-slate-500">
              Paste the secret iCal / ICS URL from the steps above to import real
              events.
            </span>
          </Field>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={!email.trim()}
              className={`rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-40 ${providerColor}`}
            >
              {icsUrl.trim()
                ? `Connect & import from ${providerLabel}`
                : `Link ${providerLabel} (demo only)`}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {(step === "connecting" || step === "syncing") && (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="text-lg font-semibold text-slate-800">
            {step === "connecting"
              ? `Connecting to ${providerLabel}…`
              : "Importing events…"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {step === "syncing"
              ? "Fetching calendar feed and adding events to the family board"
              : `Authorizing for ${email}`}
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <p className="text-lg font-semibold text-slate-800">
            {providerLabel} connected
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {importedCount > 0
              ? `Imported ${importedCount} event${importedCount === 1 ? "" : "s"} for ${member.name}. Use Sync anytime to refresh.`
              : icsUrl.trim()
                ? `Connected, but no events were found in the feed window (1 year past / 2 years ahead, including recurring).`
                : `Account linked without a calendar feed. Add an ICS link later and hit Sync to import events.`}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Done
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">
            !
          </div>
          <p className="text-lg font-semibold text-slate-800">Couldn’t import</p>
          <p className="mt-2 max-w-md text-sm text-rose-600">{errorMsg}</p>
          <p className="mt-2 max-w-md text-xs text-slate-500">
            Double-check the ICS link is the secret/publish address (not a
            regular calendar web URL). The account is still saved — you can fix
            the link and tap Sync on the Family page.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
