"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { IndianRupee, MapPin, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { formatCurrency, formatDateShort, toDateKey } from "@/lib/utils";

type Range = "week" | "month" | "custom";

interface Visit {
  id: string;
  patientId: string;
  patient: {
    name: string;
    address: string;
  };
  visitDate: string;
  startTime: string;
  chargeAmount: number;
  duration: number;
  status: string;
}

interface DayStat {
  date: string;
  label: string;
  visits: number;
  earnings: number;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#34d399" }}>{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export default function ReportsView() {
  const [range, setRange] = useState<Range>("week");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    setCustomStart(toDateKey(subDays(new Date(), 30)));
    setCustomEnd(toDateKey(new Date()));
    setHydrated(true);
  }, []);

  function getRangeDates() {
    const now = new Date();
    if (range === "week") return { start: toDateKey(startOfWeek(now, { weekStartsOn: 1 })), end: toDateKey(endOfWeek(now, { weekStartsOn: 1 })) };
    if (range === "month") return { start: toDateKey(startOfMonth(now)), end: toDateKey(endOfMonth(now)) };
    return { start: customStart || toDateKey(subDays(now, 30)), end: customEnd || toDateKey(now) };
  }

  const fetchReports = useCallback(async () => {
    if (!hydrated) return;
    setLoading(true);
    const { start, end } = getRangeDates();
    try {
      const res = await fetch(`/api/visits?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVisits(data);
      } else {
        console.error("API returned non-array:", data);
        setVisits([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd, hydrated]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (!hydrated) return <div style={{ minHeight: "100vh" }} />;

  // Group by day for chart
  const dayMap: Record<string, DayStat> = {};
  for (const v of visits) {
    const d = toDateKey(new Date(v.visitDate));
    if (!dayMap[d]) dayMap[d] = { date: d, label: format(new Date(v.visitDate), "d MMM"), visits: 0, earnings: 0 };
    dayMap[d].visits++;
    if (v.status !== "CANCELLED") dayMap[d].earnings += v.chargeAmount;
  }
  const chartData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  const totalEarnings = visits.filter(v => v.status !== "CANCELLED").reduce((s, v) => s + v.chargeAmount, 0);
  const completedCount = visits.filter(v => v.status === "COMPLETED").length;
  const cancelledCount = visits.filter(v => v.status === "CANCELLED").length;
  const avgPerVisit = visits.length > 0 ? totalEarnings / visits.filter(v => v.status !== "CANCELLED").length : 0;

  const RANGE_BTN = (r: Range, label: string) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid",
        transition: "all 0.15s",
        background: range === r ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
        borderColor: range === r ? "rgba(124,58,237,0.5)" : "var(--border)",
        color: range === r ? "#a78bfa" : "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", padding: "32px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
        Reports & Earnings
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
        Track your income and visit history
      </p>

      {/* Range selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {RANGE_BTN("week", "This Week")}
        {RANGE_BTN("month", "This Month")}
        {RANGE_BTN("custom", "Custom Range")}
        {range === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="form-input" style={{ width: 150, colorScheme: "dark" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="form-input" style={{ width: 150, colorScheme: "dark" }} />
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { icon: <IndianRupee size={16} color="#34d399" />, bg: "rgba(52,211,153,0.15)", label: "Total Earnings", value: formatCurrency(totalEarnings), sub: "excl. cancelled", color: "#34d399" },
          { icon: <MapPin size={16} color="#a78bfa" />, bg: "rgba(124,58,237,0.15)", label: "Total Visits", value: String(visits.length), sub: `${completedCount} completed`, color: "#a78bfa" },
          { icon: <TrendingUp size={16} color="#fbbf24" />, bg: "rgba(245,158,11,0.15)", label: "Avg per Visit", value: formatCurrency(Math.round(avgPerVisit)), sub: "per billable visit", color: "#fbbf24" },
          { icon: <XCircle size={16} color="#f87171" />, bg: "rgba(248,113,113,0.15)", label: "Cancelled", value: String(cancelledCount), sub: "visits cancelled", color: "#f87171" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 20 }}>
          Daily Earnings
        </h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "#555570", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `₹${v}`} tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={`url(#barGrad)`} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Visit list */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 16 }}>
          All Visits ({visits.length})
        </h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading...</div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
            No visits in this period
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Header */}
            <div className="visit-list-grid" style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
              <span>Patient</span>
              <span>Date</span>
              <span>Duration</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Charge</span>
            </div>
            {visits.map(v => {
              const badgeClass = v.status === "COMPLETED" ? "badge badge-completed" : v.status === "CANCELLED" ? "badge badge-cancelled" : "badge badge-scheduled";
              return (
                <div
                  key={v.id}
                  className="visit-list-grid"
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    fontSize: 13,
                    transition: "background 0.15s",
                    alignItems: "center",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.patient?.name || "Unknown Patient"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{v.patient?.address || "No address"}</div>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {formatDateShort(new Date(v.visitDate))}
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.startTime}</div>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{v.duration} min</div>
                  <span className={badgeClass} style={{ width: "fit-content" }}>
                    {v.status.charAt(0) + v.status.slice(1).toLowerCase()}
                  </span>
                  <div style={{ textAlign: "right", fontWeight: 700, color: v.status === "CANCELLED" ? "var(--text-muted)" : "#34d399" }}>
                    {v.status === "CANCELLED" ? <span style={{ textDecoration: "line-through" }}>{formatCurrency(v.chargeAmount)}</span> : formatCurrency(v.chargeAmount)}
                  </div>
                </div>
              );
            })}

            {/* Total row */}
            <div className="visit-list-grid" style={{
              padding: "14px 12px",
              borderTop: "1px solid var(--border)",
              marginTop: 4,
              fontSize: 14,
              fontWeight: 700,
            }}>
              <span>Total</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{visits.length} visits</span>
              <span></span>
              <span></span>
              <span style={{ textAlign: "right", color: "#34d399" }}>{formatCurrency(totalEarnings)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
