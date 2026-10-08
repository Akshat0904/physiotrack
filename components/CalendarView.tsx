"use client";
import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, toDateKey } from "@/lib/utils";

interface DaySummary {
  date: string;
  visitCount: number;
  earnings: number;
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const router = useRouter();

  // Client-only init to avoid Next.js prerender error
  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const fetchMonth = useCallback(async () => {
    if (!currentMonth) return;
    const start = toDateKey(startOfMonth(currentMonth));
    const end = toDateKey(endOfMonth(currentMonth));
    try {
      const res = await fetch(`/api/visits?startDate=${start}&endDate=${end}`);
      const visits = await res.json();
      if (!Array.isArray(visits)) {
        console.error("API returned non-array:", visits);
        return;
      }
      const map: Record<string, DaySummary> = {};
      for (const v of visits) {
        const d = toDateKey(new Date(v.visitDate));
        if (!map[d]) map[d] = { date: d, visitCount: 0, earnings: 0 };
        map[d].visitCount++;
        if (v.status !== "CANCELLED") map[d].earnings += v.chargeAmount;
      }
      setSummaries(Object.values(map));
    } catch (e) {
      console.error(e);
    }
  }, [currentMonth]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  // Don't render until hydrated
  if (!currentMonth) return null;

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDow = getDay(startOfMonth(currentMonth));

  const summaryMap: Record<string, DaySummary> = {};
  for (const s of summaries) summaryMap[s.date] = s;

  return (
    <div style={{ minHeight: "100vh", padding: "32px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
        Calendar
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
        Monthly overview — click a day to manage its visits
      </p>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button className="btn-icon" onClick={() => setCurrentMonth(m => subMonths(m ?? new Date(), 1))}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 180, textAlign: "center" }}>
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button className="btn-icon" onClick={() => setCurrentMonth(m => addMonths(m ?? new Date(), 1))}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const key = toDateKey(day);
          const summary = summaryMap[key];
          const today = isToday(day);

          return (
            <div
              key={key}
              onClick={() => router.push(`/?date=${key}`)}
              style={{
                background: today ? "rgba(124,58,237,0.15)" : summary ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${today ? "rgba(124,58,237,0.4)" : summary ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: 12,
                padding: "12px 10px",
                cursor: "pointer",
                minHeight: 80,
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = today ? "rgba(124,58,237,0.4)" : summary ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)")}
            >
              <span style={{ fontSize: 14, fontWeight: today ? 800 : 500, color: today ? "#a78bfa" : "var(--text-secondary)" }}>
                {format(day, "d")}
              </span>
              {summary && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(124,58,237,0.15)", borderRadius: 6, padding: "2px 6px", display: "inline-block" }}>
                    {summary.visitCount} visit{summary.visitCount !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                    {formatCurrency(summary.earnings)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
