"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  Car,
  RefreshCw,
} from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import Sidebar from "@/components/Sidebar";
import { formatCurrency, formatDate, minutesToHM, toDateKey } from "@/lib/utils";

interface Visit {
  id: string;
  status: string;
  duration: number;
  chargeAmount: number;
  travelTimeFromPrev?: number | null;
}

export default function StatsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const dateKey = selectedDate ? toDateKey(selectedDate) : "";

  const fetchVisits = useCallback(async () => {
    if (!dateKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/visits?date=${dateKey}`);
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
  }, [dateKey]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  if (!selectedDate) return <div style={{ minHeight: "100vh" }} />;

  const totalEarnings = visits
    .filter((v) => v.status !== "CANCELLED")
    .reduce((sum, v) => sum + v.chargeAmount, 0);
  const completedCount = visits.filter((v) => v.status === "COMPLETED").length;
  const totalTravelMins = visits
    .slice(1)
    .reduce((sum, v) => sum + (v.travelTimeFromPrev ?? 0), 0);
  const totalDurationMins = visits.reduce((sum, v) => sum + v.duration, 0);

  const cards = [
    {
      icon: <IndianRupee size={16} color="#34d399" />,
      bg: "rgba(52,211,153,0.15)",
      label: "Today's Earnings",
      value: formatCurrency(totalEarnings),
      sub: `${visits.filter((v) => v.status !== "CANCELLED").length} billable visits`,
      color: "#34d399",
    },
    {
      icon: <MapPin size={16} color="#a78bfa" />,
      bg: "rgba(124,58,237,0.15)",
      label: "Total Visits",
      value: String(visits.length),
      sub: `${completedCount} completed`,
      color: "#a78bfa",
    },
    {
      icon: <Car size={16} color="#38bdf8" />,
      bg: "rgba(14,165,233,0.15)",
      label: "Travel Time",
      value: minutesToHM(totalTravelMins),
      sub: "between visits",
      color: "#38bdf8",
    },
    {
      icon: <Clock size={16} color="#fbbf24" />,
      bg: "rgba(245,158,11,0.15)",
      label: "Visit Duration",
      value: minutesToHM(totalDurationMins),
      sub: "total treatment time",
      color: "#fbbf24",
    },
  ];

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-shell">
          <div className="page-header-row" style={{ marginBottom: 32 }}>
            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  lineHeight: 1.2,
                }}
              >
                Day Stats
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                {selectedDate ? formatDate(selectedDate) : ""}
              </p>
            </div>

            <div className="date-nav">
              <button
                className="btn-icon"
                onClick={() => setSelectedDate((d) => subDays(d ?? new Date(), 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedDate(new Date())}
                style={{ padding: "8px 14px", fontSize: 13 }}
              >
                <Calendar size={14} />
                Today
              </button>
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setSelectedDate(new Date(e.target.value + "T00:00:00"))}
                className="form-input"
                style={{ width: 150, colorScheme: "dark" }}
              />
              <button
                className="btn-icon"
                onClick={() => setSelectedDate((d) => addDays(d ?? new Date(), 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 80,
                color: "var(--text-muted)",
                gap: 12,
              }}
            >
              <RefreshCw size={18} className="animate-spin" />
              Loading stats...
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              {cards.map((c) => (
                <div key={c.label} className="stat-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: c.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c.icon}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginTop: 4 }}>
                    {c.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
