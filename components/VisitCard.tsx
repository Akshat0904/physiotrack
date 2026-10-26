"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, MapPin, Clock, Check, X, Car } from "lucide-react";
import { formatTime, getEndTime, formatCurrency, minutesToHM } from "@/lib/utils";

interface Visit {
  id: string;
  patientId: string;
  patient: {
    name: string;
    address: string;
  };
  visitDate: string;
  startTime: string;
  duration: number;
  chargeAmount: number;
  notes?: string | null;
  status: string;
  travelTimeFromPrev?: number | null;
  travelTimeMode?: string | null;
  travelDistanceFromPrev?: number | null;
}

interface VisitCardProps {
  visit: Visit;
  onEdit: (visit: Visit) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  showTravelTime?: boolean;
}

export default function VisitCard({
  visit,
  onEdit,
  onDelete,
  onStatusChange,
  showTravelTime,
}: VisitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: visit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const endTime = getEndTime(visit.startTime, visit.duration);

  const badgeClass =
    visit.status === "COMPLETED"
      ? "badge badge-completed"
      : visit.status === "CANCELLED"
      ? "badge badge-cancelled"
      : "badge badge-scheduled";

  return (
    <div ref={setNodeRef} style={style}>
      {/* Travel time between visits */}
      {showTravelTime && visit.travelTimeFromPrev != null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "3px 0 3px 36px",
          }}
        >
          <div className="travel-pill">
            <Car size={12} />
            {minutesToHM(visit.travelTimeFromPrev)} travel
            {visit.travelDistanceFromPrev
              ? ` · ${visit.travelDistanceFromPrev} km`
              : ""}
            {visit.travelTimeMode === "manual" && (
              <span style={{ opacity: 0.6, fontSize: 10 }}> (manual)</span>
            )}
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="glass-card"
        style={{
          display: "flex",
          gap: 0,
          padding: 0,
          overflow: "hidden",
          borderLeft:
            visit.status === "COMPLETED"
              ? "3px solid #10b981"
              : visit.status === "CANCELLED"
              ? "3px solid #f43f5e"
              : "3px solid #7c3aed",
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 6px",
            cursor: "grab",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <GripVertical size={14} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "10px 10px 10px 2px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Name & status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {visit.patient?.name || "Unknown Patient"}
                </span>
                <span className={badgeClass}>
                  {visit.status === "COMPLETED" && <Check size={10} />}
                  {visit.status === "CANCELLED" && <X size={10} />}
                  {visit.status.charAt(0) + visit.status.slice(1).toLowerCase()}
                </span>
              </div>

              {/* Address */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 5,
                }}
              >
                <MapPin size={11} />
                <span>{visit.patient?.address || "No address"}</span>
              </div>

              {/* Time & duration & charge */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  <Clock size={11} />
                  <span>
                    {formatTime(visit.startTime)} – {formatTime(endTime)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {minutesToHM(visit.duration)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#34d399",
                    marginLeft: "auto",
                  }}
                >
                  {formatCurrency(visit.chargeAmount)}
                </div>
              </div>

              {/* Notes */}
              {visit.notes && (
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11.5,
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                  }}
                >
                  {visit.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {visit.status !== "COMPLETED" && (
                <button
                  className="btn-icon"
                  title="Mark as completed"
                  onClick={() => onStatusChange(visit.id, "COMPLETED")}
                  style={{ width: 28, height: 28, color: "#34d399", borderColor: "rgba(52,211,153,0.2)" }}
                >
                  <Check size={13} />
                </button>
              )}
              <button
                className="btn-icon"
                title="Edit"
                onClick={() => onEdit(visit)}
                style={{ width: 28, height: 28 }}
              >
                <Edit2 size={13} />
              </button>
              <button
                className="btn-icon btn-danger"
                title="Delete"
                onClick={() => onDelete(visit.id)}
                style={{ width: 28, height: 28 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
