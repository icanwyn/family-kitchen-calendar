"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm font-medium text-slate-700">
        {error.message || "The page failed to load on this device."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white"
      >
        Try again
      </button>
      <a
        href="/login"
        className="text-sm font-semibold text-sky-800 underline"
      >
        Go to sign in
      </a>
    </div>
  );
}
