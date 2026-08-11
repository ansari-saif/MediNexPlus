"use client";
import { useState } from "react";
import { CalendarCheck, RefreshCw, Plus } from "lucide-react";
import AppointmentPanel from "@/components/AppointmentPanel";
import FollowUpDashboard from "@/components/FollowUpDashboard";
import PatientProfilePanel from "@/components/PatientProfilePanel";

type Tab = "appointments" | "followups";

const TABS = [
  { id: "appointments" as Tab, label: "Appointments", icon: CalendarCheck },
  { id: "followups"    as Tab, label: "Follow-ups",   icon: RefreshCw },
];

export default function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>("appointments");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [bookTrigger, setBookTrigger] = useState(0);

  return (
    <div data-ui="hospitaladmin.appointments" style={{ padding: 24, flex: 1, overflowY: "auto", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 6, background: "#fff", borderRadius: 12, padding: 6, border: "1px solid #e2e8f0", width: "fit-content" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedPatientId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "none", background: active ? "#0E898F" : "transparent", color: active ? "#fff" : "#64748b", fontSize:12, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => { setTab("appointments"); setSelectedPatientId(null); setBookTrigger(k => k + 1); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
          <Plus size={15} />Book Appointment
        </button>
      </div>

      {selectedPatientId ? (
        <PatientProfilePanel patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
      ) : (
        <>
          {tab === "appointments" && <AppointmentPanel uiPrefix="hospitaladmin" onViewPatient={setSelectedPatientId} openTrigger={bookTrigger} />}
          {tab === "followups"    && <FollowUpDashboard onViewPatient={setSelectedPatientId} />}
        </>
      )}
    </div>
  );
}
