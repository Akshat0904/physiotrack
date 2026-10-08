"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GLOBAL ERROR BOUNDARY CAUGHT:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 40, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "red" }}>Next.js Crash Details</h2>
          <div style={{ background: "#f0f0f0", padding: 20, borderRadius: 8, whiteSpace: "pre-wrap", color: "black", margin: "20px 0" }}>
            <strong>{error.name}:</strong> {error.message}
            <hr />
            {error.stack}
          </div>
          <button 
            onClick={() => reset()}
            style={{ padding: "10px 20px", background: "black", color: "white", borderRadius: 4 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
