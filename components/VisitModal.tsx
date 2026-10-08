"use client";
import { useState, useEffect } from "react";
import { X, MapPin, Clock, DollarSign, User, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Visit {
  id?: string;
  patientName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  visitDate: string;
  startTime: string;
  duration: number;
  chargeAmount: number;
  notes?: string | null;
  status?: string;
  travelTimeMode?: string | null;
  endDate?: string;
}

interface VisitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (visit: Visit) => void;
  initial?: Visit | null;
  defaultDate?: string;
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "Custom", value: 0 },
];

const STATUS_OPTIONS = ["SCHEDULED", "COMPLETED", "CANCELLED"];

export default function VisitModal({
  open,
  onClose,
  onSave,
  initial,
  defaultDate,
}: VisitModalProps) {
  const today = defaultDate ?? format(new Date(), "yyyy-MM-dd");

  const blank: Visit = {
    patientName: "",
    address: "",
    visitDate: today,
    startTime: "09:00",
    duration: 60,
    chargeAmount: 500,
    notes: "",
    status: "SCHEDULED",
    endDate: "",
  };

  const [form, setForm] = useState<Visit>(initial ?? blank);
  const [customDuration, setCustomDuration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(initial ?? blank);
      setCustomDuration(initial ? !DURATIONS.some((d) => d.value === initial.duration && d.value !== 0) : false);
      setErrors({});
    }
  }, [open, initial]);

  function set(field: keyof Visit, value: string | number | null) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.patientName.trim()) errs.patientName = "Patient name is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.visitDate) errs.visitDate = "Date is required";
    if (!form.startTime) errs.startTime = "Start time is required";
    if (!form.duration || form.duration <= 0) errs.duration = "Duration must be > 0";
    if (!form.chargeAmount || form.chargeAmount < 0) errs.chargeAmount = "Charge is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {initial?.id ? "Edit Visit" : "Add New Visit"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {initial?.id ? "Update visit details" : "Schedule a new patient visit"}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Patient Name */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <User size={13} /> Patient Name
              </span>
            </label>
            <input
              className="form-input"
              placeholder="e.g. Priya Sharma"
              value={form.patientName}
              onChange={(e) => set("patientName", e.target.value)}
            />
            {errors.patientName && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.patientName}</span>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} /> Address
              </span>
            </label>
            <input
              className="form-input"
              placeholder="e.g. 45, MG Road, Pune, Maharashtra"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
            {errors.address && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.address}</span>}
          </div>

          {/* Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} /> Visit Date
                </span>
              </label>
              <input
                type="date"
                className="form-input"
                value={form.visitDate}
                onChange={(e) => set("visitDate", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
              {errors.visitDate && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.visitDate}</span>}
            </div>

            {!initial?.id && (
              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={13} /> End Date (Optional recurring)
                  </span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={form.endDate || ""}
                  onChange={(e) => set("endDate", e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} /> Start Time
                </span>
              </label>
              <input
                type="time"
                className="form-input"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
              {errors.startTime && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.startTime}</span>}
            </div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Duration</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    if (d.value === 0) {
                      setCustomDuration(true);
                    } else {
                      setCustomDuration(false);
                      set("duration", d.value);
                    }
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.15s",
                    background:
                      (d.value !== 0 && form.duration === d.value && !customDuration) ||
                      (d.value === 0 && customDuration)
                        ? "rgba(124,58,237,0.25)"
                        : "rgba(255,255,255,0.04)",
                    borderColor:
                      (d.value !== 0 && form.duration === d.value && !customDuration) ||
                      (d.value === 0 && customDuration)
                        ? "rgba(124,58,237,0.6)"
                        : "var(--border)",
                    color:
                      (d.value !== 0 && form.duration === d.value && !customDuration) ||
                      (d.value === 0 && customDuration)
                        ? "#a78bfa"
                        : "var(--text-secondary)",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {customDuration && (
              <input
                type="number"
                className="form-input"
                placeholder="Enter minutes"
                min={1}
                value={form.duration || ""}
                onChange={(e) => set("duration", Number(e.target.value))}
                style={{ marginTop: 8 }}
              />
            )}
            {errors.duration && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.duration}</span>}
          </div>

          {/* Charge & Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DollarSign size={13} /> Charge (₹)
                </span>
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 800"
                min={0}
                value={form.chargeAmount || ""}
                onChange={(e) => set("chargeAmount", Number(e.target.value))}
              />
              {errors.chargeAmount && <span style={{ fontSize: 12, color: "#f87171" }}>{errors.chargeAmount}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                style={{ colorScheme: "dark" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Travel time manual */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                🚗 Travel Time from Previous Visit (optional)
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                className="form-input"
                placeholder="minutes (auto-calculated if blank)"
                min={0}
                value={form.travelTimeFromPrev ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    travelTimeFromPrev: e.target.value ? Number(e.target.value) : null,
                    travelTimeMode: e.target.value ? "manual" : null,
                  }))
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} /> Notes (optional)
              </span>
            </label>
            <textarea
              className="form-input"
              placeholder="Any special notes for this visit..."
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : initial?.id ? "Update Visit" : "Add Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
