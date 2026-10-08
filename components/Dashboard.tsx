"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  IndianRupee,
  MapPin,
  Clock,
  CheckCircle,
  Car,
  Calendar,
} from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import VisitCard from "@/components/VisitCard";
import VisitModal from "@/components/VisitModal";
import { formatCurrency, formatDate, minutesToHM, toDateKey } from "@/lib/utils";

interface Visit {
  id: string;
  patientName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  visitDate: string;
  startTime: string;
  duration: number;
  chargeAmount: number;
  notes?: string | null;
  status: string;
  orderIndex: number;
  travelTimeFromPrev?: number | null;
  travelTimeMode?: string | null;
  travelDistanceFromPrev?: number | null;
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Hydrate date on client only to avoid Next.js prerender error
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const dateKey = selectedDate ? toDateKey(selectedDate) : "";

  // Fetch visits for selected date
  const fetchVisits = useCallback(async () => {
    if (!dateKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/visits?date=${dateKey}`);
      const data = await res.json();
      setVisits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Show nothing until hydrated
  if (!selectedDate) return null;

  // Calculate travel times via ORS
  async function calculateTravelTimes(visitList: Visit[]) {
    if (visitList.length < 2) return;
    setCalculating(true);
    try {
      const locations = visitList.map((v) => ({
        lat: v.latitude,
        lng: v.longitude,
        address: v.address,
      }));

      const res = await fetch("/api/travel-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations }),
      });
      const data = await res.json();

      if (data.travelTimes) {
        // Update visits with travel times (skip first visit, it has no "from prev")
        const updates = visitList.slice(1).map((v, i) => ({
          id: v.id,
          travelTimeFromPrev: data.travelTimes[i]?.duration ?? null,
          travelDistanceFromPrev: data.travelTimes[i]?.distance ?? null,
          travelTimeMode: data.travelTimes[i]?.duration != null ? "auto" : v.travelTimeMode,
        }));

        await Promise.all(
          updates.map((u) =>
            fetch(`/api/visits/${u.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                travelTimeFromPrev: u.travelTimeFromPrev,
                travelDistanceFromPrev: u.travelDistanceFromPrev,
                travelTimeMode: u.travelTimeMode,
              }),
            })
          )
        );

        await fetchVisits();
      }
    } catch (e) {
      console.error("Travel time error:", e);
    } finally {
      setCalculating(false);
    }
  }

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visits.findIndex((v) => v.id === active.id);
    const newIndex = visits.findIndex((v) => v.id === over.id);
    const reordered = arrayMove(visits, oldIndex, newIndex);
    setVisits(reordered);

    // Save new order
    await fetch("/api/visits/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((v) => v.id) }),
    });

    // Recalculate travel times after reorder
    await calculateTravelTimes(reordered);
  }

  // Save (create or update)
  async function handleSave(formData: Partial<Visit>) {
    try {
      if (editingVisit?.id) {
        await fetch(`/api/visits/${editingVisit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        const res = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const newVisit = await res.json();
        // Auto calc travel time for new visit
        const updated = [...visits, newVisit];
        await fetchVisits();
        setTimeout(() => calculateTravelTimes(updated), 500);
        setModalOpen(false);
        setEditingVisit(null);
        return;
      }
      await fetchVisits();
      setModalOpen(false);
      setEditingVisit(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visit?")) return;
    await fetch(`/api/visits/${id}`, { method: "DELETE" });
    await fetchVisits();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchVisits();
  }

  // Stats
  const totalEarnings = visits
    .filter((v) => v.status !== "CANCELLED")
    .reduce((sum, v) => sum + v.chargeAmount, 0);
  const completedCount = visits.filter((v) => v.status === "COMPLETED").length;
  const totalTravelMins = visits
    .slice(1)
    .reduce((sum, v) => sum + (v.travelTimeFromPrev ?? 0), 0);
  const totalDurationMins = visits.reduce((sum, v) => sum + v.duration, 0);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 32px 80px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.2,
            }}
          >
            {isToday(selectedDate) ? "Today's Visits" : "Visit Schedule"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
            {selectedDate ? formatDate(selectedDate) : ""}
          </p>
        </div>

        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => calculateTravelTimes(visits)}
            disabled={calculating || visits.length < 2}
            title="Recalculate travel times"
          >
            <RefreshCw size={14} className={calculating ? "animate-spin" : ""} />
            {calculating ? "Calculating..." : "Calc Travel"}
          </button>
          <button
            className="btn-primary animate-glow"
            onClick={() => {
              setEditingVisit(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Visit
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(52,211,153,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IndianRupee size={16} color="#34d399" />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Today&apos;s Earnings
            </span>
          </div>
          <div
            style={{ fontSize: 24, fontWeight: 800, color: "#34d399", marginTop: 4 }}
          >
            {formatCurrency(totalEarnings)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {visits.filter((v) => v.status !== "CANCELLED").length} billable visits
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(124,58,237,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={16} color="#a78bfa" />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total Visits
            </span>
          </div>
          <div
            style={{ fontSize: 24, fontWeight: 800, color: "#a78bfa", marginTop: 4 }}
          >
            {visits.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {completedCount} completed
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(14,165,233,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Car size={16} color="#38bdf8" />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Travel Time
            </span>
          </div>
          <div
            style={{ fontSize: 24, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}
          >
            {minutesToHM(totalTravelMins)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            between visits
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(245,158,11,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} color="#fbbf24" />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Visit Duration
            </span>
          </div>
          <div
            style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24", marginTop: 4 }}
          >
            {minutesToHM(totalDurationMins)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            total treatment time
          </div>
        </div>
      </div>

      {/* Visits List */}
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
          Loading visits...
        </div>
      ) : visits.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 80,
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(124,58,237,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={32} color="#7c3aed" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                marginBottom: 6,
              }}
            >
              No visits scheduled
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Click &quot;Add Visit&quot; to schedule your first visit for this day.
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingVisit(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add First Visit
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visits.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                position: "relative",
              }}
            >
              {/* Timeline line */}
              <div className="timeline-line" />

              <div style={{ paddingLeft: 48, display: "flex", flexDirection: "column", gap: 4 }}>
                {visits.map((visit, index) => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    onEdit={(v) => {
                      setEditingVisit(v as Visit);
                      setModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    showTravelTime={index > 0}
                  />
                ))}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal */}
      <VisitModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVisit(null);
        }}
        onSave={handleSave}
        initial={editingVisit}
        defaultDate={dateKey}
      />
    </div>
  );
}
