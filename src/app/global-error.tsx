"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f1f5f9",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>App error</h1>
        <p style={{ maxWidth: 360, color: "#334155", fontSize: 14 }}>
          {error.message || "A fatal error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "12px 20px",
            borderRadius: 12,
            border: "none",
            background: "#0369a1",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
