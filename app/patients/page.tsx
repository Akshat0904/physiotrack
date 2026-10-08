"use client";
import { useState, useEffect } from "react";
import { User, MapPin, Phone, FileText, Edit2, Trash2, Plus, X } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  notes?: string | null;
  _count?: { visits: number };
}

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  const [form, setForm] = useState({ name: "", address: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (Array.isArray(data)) setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ name: "", address: "", phone: "", notes: "" });
    setEditingPatient(null);
    setModalOpen(true);
  }

  function openEdit(p: Patient) {
    setForm({
      name: p.name,
      address: p.address,
      phone: p.phone || "",
      notes: p.notes || "",
    });
    setEditingPatient(p);
    setModalOpen(true);
  }

  async function savePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address) return;
    setSaving(true);
    try {
      if (editingPatient) {
        await fetch(`/api/patients/${editingPatient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function deletePatient(id: string) {
    if (!confirm("Are you sure you want to delete this patient and all their visits?")) return;
    try {
      await fetch(`/api/patients/${id}`, { method: "DELETE" });
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ padding: "32px 32px 80px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Patients</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Manage patient details and records</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
          <User size={48} color="var(--border)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Patients Yet</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Add your first patient to start scheduling visits.</p>
          <button className="btn-primary" onClick={openAdd} style={{ margin: "0 auto" }}>
            <Plus size={16} /> Add Patient
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {patients.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn-icon" onClick={() => openEdit(p)} style={{ width: 28, height: 28 }}><Edit2 size={13} /></button>
                  <button className="btn-icon btn-danger" onClick={() => deletePatient(p.id)} style={{ width: 28, height: 28 }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", gap: 8 }}><MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{p.address}</span></div>
                {p.phone && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={14} /> <span>{p.phone}</span></div>}
                {p.notes && <div style={{ display: "flex", gap: 8, color: "var(--text-muted)" }}><FileText size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{p.notes}</span></div>}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>{p._count?.visits || 0} visits scheduled</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editingPatient ? "Edit Patient" : "Add Patient"}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={savePatient} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahul Verma" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input required className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input type="tel" className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. +91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Medical history, specific requirements..." style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Patient"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
