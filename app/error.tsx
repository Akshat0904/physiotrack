"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", background: "white", minHeight: "100vh" }}>
      <h2 style={{ color: "red", fontSize: 24, fontWeight: "bold" }}>Next.js Client Crash Details</h2>
      <div style={{ background: "#f0f0f0", padding: 20, borderRadius: 8, whiteSpace: "pre-wrap", color: "black", margin: "20px 0" }}>
        <strong>{error.name}:</strong> {error.message}
        <hr style={{ margin: "10px 0" }} />
        {error.stack}
      </div>
      <button 
        onClick={() => reset()}
        style={{ padding: "10px 20px", background: "black", color: "white", borderRadius: 4, cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
