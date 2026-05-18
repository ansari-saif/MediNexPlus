"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays, ChevronRight, ChevronLeft, Loader2,
  PlayCircle, CheckCircle2, X, FileText, Clock, RefreshCw,
  Pencil, Search, ArrowUpDown, ChevronUp, ChevronDown,
  Stethoscope, Activity,
} from "lucide-react";
import PatientProfilePanel from "@/components/PatientProfilePanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const TYPE_LABEL: Record<string, string> = {
  OPD: "OPD", ONLINE: "Online", FOLLOW_UP: "Follow-up", EMERGENCY: "Emergency",
};

const STATUS_CFG: Record<string, { label: string; dot: string; badge: [string, string, string] }> = {
  SCHEDULED:   { label: "Scheduled",   dot: "#94a3b8", badge: ["#f8fafc", "#475569", "#e2e8f0"] },
  CONFIRMED:   { label: "Confirmed",   dot: "#10b981", badge: ["#f0fdf4", "#16a34a", "#bbf7d0"] },
  IN_PROGRESS: { label: "In Progress", dot: "#0E898F", badge: ["#E6F4F4", "#0A6B70", "#B3E0E0"] },
  COMPLETED:   { label: "Completed",   dot: "#059669", badge: ["#f0fdf4", "#059669", "#a7f3d0"] },
  CANCELLED:   { label: "Cancelled",   dot: "#ef4444", badge: ["#fff5f5", "#ef4444", "#fecaca"] },
  NO_SHOW:     { label: "No Show",     dot: "#f97316", badge: ["#fff7ed", "#c2410c", "#fed7aa"] },
  RESCHEDULED: { label: "Rescheduled", dot: "#a855f7", badge: ["#faf5ff", "#7c3aed", "#e9d5ff"] },
};

function ConsultModal({
  appt, onClose, onDone, onStartPrescription, setSelectedPatientId,
}: {
  appt: any;
  onClose: () => void;
  onDone: () => void;
  onStartPrescription: (id: string) => void;
  setSelectedPatientId: (id: string) => void;
}) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [subDeptId, setSubDeptId] = useState<string>(appt.subDepartmentId || "");
  const [subDeptNote, setSubDeptNote] = useState<string>(appt.subDeptNote || "");
  const [showReferral, setShowReferral] = useState(!!(appt.subDepartmentId));
  const [transferToBilling, setTransferToBilling] = useState(false);
  const [billingNote, setBillingNote] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [showServicePlan, setShowServicePlan] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [planCreated, setPlanCreated] = useState(false);
  const [subDeptsLoaded, setSubDeptsLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  useEffect(() => {
    if (showReferral && !subDeptsLoaded) {
      api("/api/config/subdepartments?limit=50").then(r => {
        if (r.success) setSubDepts(r.data?.data || r.data || []);
      }).catch(() => {}).finally(() => setSubDeptsLoaded(true));
    }
  }, [showReferral, subDeptsLoaded]);

  useEffect(() => {
    if (showServicePlan && !servicesLoaded) {
      api("/api/config/services?isActive=true&limit=100").then(r => {
        if (r.success) setServices(r.data?.services || r.data?.data || []);
      }).catch(() => {}).finally(() => setServicesLoaded(true));
    }
  }, [showServicePlan, servicesLoaded]);

  const doBillingTransfer = async () => {
    const r = await api("/api/billing/transfer", "POST", {
      appointmentId: appt.id,
      note: billingNote || "Transferred from consultation",
    });
    if (!r.success) { setMsg(r.message || "Failed to transfer to billing"); return false; }
    return true;
  };

  const handleStartPrescription = async () => {
    if (transferToBilling) {
      setSaving(true);
      const ok = await doBillingTransfer();
      setSaving(false);
      if (!ok) return;
    }
    onStartPrescription(appt.id);
  };

  const handleCompleteAndBill = async () => {
    setSaving(true);
    const body: any = { status: "COMPLETED", notes: notes || undefined };
    if (showReferral && subDeptId) { body.subDepartmentId = subDeptId; body.subDeptNote = subDeptNote || undefined; }
    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) { await doBillingTransfer(); onDone(); onClose(); }
    else setMsg(d.message || "Failed to complete");
    setSaving(false);
  };

  const update = async (status: string) => {
    setSaving(true);
    const body: any = { status, notes: notes || undefined };
    if (showReferral && subDeptId) { body.subDepartmentId = subDeptId; body.subDeptNote = subDeptNote || undefined; }
    else if (!showReferral) { body.subDepartmentId = null; body.subDeptNote = null; }
    if (transferToBilling) {
      const ok = await doBillingTransfer();
      if (!ok) { setSaving(false); return; }
    }
    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) {
      if (status === "COMPLETED" && showServicePlan && selectedServiceId && appt.patient?.id && !planCreated) {
        const svc = services.find((s: any) => s.id === selectedServiceId);
        api("/api/treatment-plans", "POST", {
          patientId: appt.patient.id,
          serviceId: selectedServiceId,
          doctorId: appt.doctorId,
          departmentId: appt.departmentId,
          planName: svc?.name || "Treatment Plan",
          totalSessions: svc?.sessionCount || 1,
          totalCost: svc?.price || 0,
        }).then(() => setPlanCreated(true)).catch(() => {});
      }
      onDone(); onClose();
    } else setMsg(d.message || "Failed to update");
    setSaving(false);
  };

  const sc = STATUS_CFG[appt.status] || STATUS_CFG.SCHEDULED;
  const patientName = appt.patient?.name || "Patient";
  const apptDate = new Date(appt.appointmentDate);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", margin: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Patient Consultation</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{apptDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {appt.timeSlot}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><X size={14} /></button>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{patientName}</div>
              <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 8, marginTop: 2 }}>
                <span>{appt.patient?.patientId}</span>
                {appt.patient?.phone && <><span>·</span><span>{appt.patient.phone}</span></>}
              </div>
              {(appt.doctor?.name || appt.department?.name) && (
                <div style={{ fontSize: 10, color: "#0E898F", marginTop: 3, fontWeight: 600 }}>
                  {appt.doctor?.name && `Dr. ${appt.doctor.name}`}{appt.department?.name && ` · ${appt.department.name}`}
                </div>
              )}
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 100, background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}`, fontWeight: 700 }}>{sc.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[
              ["Type", TYPE_LABEL[appt.type] || appt.type],
              ["Token", appt.tokenNumber ? `#${appt.tokenNumber}` : "—"],
              ["Fee", appt.consultationFee ? `₹${appt.consultationFee}` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: "#fff", borderRadius: 9, padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Consultation Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Diagnosis, prescription, follow-up instructions..."
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#334155", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
        </div>

        <div style={{ marginBottom: 18, background: showReferral ? "#f0fdf4" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showReferral ? "#bbf7d0" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowReferral(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showReferral ? "#22c55e" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showReferral ? "#fff" : "#94a3b8"} style={{ transform: showReferral ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: showReferral ? "#166534" : "#64748b" }}>
                {showReferral ? "Referring to Sub-Department" : "Refer to Sub-Department (optional)"}
              </span>
            </div>
            {appt.subDepartmentId && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Previously Referred</span>}
          </button>
          {showReferral && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={subDeptId} onChange={e => setSubDeptId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize: 12, color: "#334155", outline: "none", marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Sub-Department —</option>
                {subDepts.map((sd: any) => <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>)}
              </select>
              <textarea value={subDeptNote} onChange={e => setSubDeptNote(e.target.value)} rows={2}
                placeholder="Referral instructions for sub-dept"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize: 11, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              {!subDeptId && <p style={{ fontSize: 10, color: "#f59e0b", marginTop: 5, fontWeight: 600 }}>Select a sub-department to save the referral.</p>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: transferToBilling ? "#fef3c7" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${transferToBilling ? "#fde68a" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setTransferToBilling(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: transferToBilling ? "#f59e0b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={transferToBilling ? "#fff" : "#94a3b8"} style={{ transform: transferToBilling ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: transferToBilling ? "#92400e" : "#64748b" }}>
                {transferToBilling ? "Transferring to Billing" : "Transfer to Billing (optional)"}
              </span>
            </div>
          </button>
          {transferToBilling && (
            <div style={{ padding: "0 14px 14px" }}>
              <textarea value={billingNote} onChange={e => setBillingNote(e.target.value)} rows={2}
                placeholder="Billing notes (optional)..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #fde68a", background: "#fff", fontSize: 11, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              <div style={{ fontSize: 10, color: "#92400e", marginTop: 8, fontWeight: 600 }}>✓ Patient will be sent to billing queue with consultation fee</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: showServicePlan ? "#eff6ff" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showServicePlan ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowServicePlan(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showServicePlan ? "#3b82f6" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showServicePlan ? "#fff" : "#94a3b8"} style={{ transform: showServicePlan ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: showServicePlan ? "#1d4ed8" : "#64748b" }}>Assign Service Package (optional)</span>
            </div>
            {planCreated && <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Plan Created</span>}
          </button>
          {showServicePlan && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bfdbfe", background: "#fff", fontSize: 12, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Package —</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} · {s.sessionCount} sessions · ₹{s.price?.toLocaleString()}</option>)}
              </select>
              {selectedServiceId && <div style={{ fontSize: 10, color: "#1d4ed8", marginTop: 8, fontWeight: 600 }}>✓ Treatment plan will be auto-created when consultation is completed</div>}
              {services.length === 0 && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>No service packages configured yet.</div>}
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Start Consultation
            </button>
          )}
          {appt.status === "IN_PROGRESS" && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Continue Prescription
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS") && transferToBilling && (
            <button onClick={handleCompleteAndBill} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
              Complete & Bill
            </button>
          )}
          {appt.status === "COMPLETED" && (
            <button onClick={() => update("COMPLETED")} disabled={saving || (showReferral && !subDeptId)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: "#f0fdf4", color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #bbf7d0" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : "Update Notes & Referral"}
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={() => update("NO_SHOW")} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "1.5px solid #fed7aa", background: "#fff7ed", color: "#c2410c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              No Show
            </button>
          )}
        </div>

        {appt.patient?.id && (
          <button
            onClick={() => { setSelectedPatientId(appt.patient.id); onClose(); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 11, color: "#0E898F", fontWeight: 600, background: "none", border: "none", cursor: "pointer", width: "100%" }}>
            <FileText size={12} />View Full Patient Profile
          </button>
        )}
      </div>
    </div>
  );
}

const ACCENT = "#0E898F";

function sortIcon(field: string, curField: string, curDir: "asc" | "desc") {
  if (curField !== field) return <ArrowUpDown size={10} style={{ opacity: .35 }} />;
  return curDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

function ConsultationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = searchParams.get("date");
    return d ? new Date(d + "T00:00:00") : new Date();
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [consultAppt, setConsultAppt] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("tokenNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const isToday = fmtDate(selectedDate) === fmtDate(new Date());

  const fetchAppointments = useCallback(async (date: string, deptId = "", docId = "") => {
    setLoading(true);
    let url = `/api/appointments?date=${date}&limit=200&sortBy=timeSlot&sortOrder=asc`;
    if (deptId) url += `&departmentId=${deptId}`;
    if (docId) url += `&doctorId=${docId}`;
    const d = await api(url);
    if (d.success) setAppointments(d.data?.data || []);
    setLoading(false);
  }, []);

  const fetchDepartments = useCallback(async () => {
    const d = await api("/api/config/departments?simple=true");
    if (d.success) setDepartments(d.data || []);
  }, []);

  const fetchDoctors = useCallback(async (deptId = "") => {
    let url = "/api/config/doctors?simple=true";
    if (deptId) url += `&departmentId=${deptId}`;
    const d = await api(url);
    if (d.success) setDoctors(d.data || []);
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { fetchDoctors(deptFilter); }, [deptFilter, fetchDoctors]);

  useEffect(() => {
    fetchAppointments(fmtDate(selectedDate), deptFilter, doctorFilter);
  }, [selectedDate, deptFilter, doctorFilter, fetchAppointments]);

  const goDate = (offset: number) =>
    setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const updateStatus = async (apptId: string, status: string) => {
    setUpdatingStatusId(apptId);
    await api(`/api/appointments/${apptId}`, "PUT", { status });
    await fetchAppointments(fmtDate(selectedDate), deptFilter, doctorFilter);
    setUpdatingStatusId(null);
  };

  const handleStartPrescription = (appointmentId: string) => {
    router.push(`/hospitaladmin/consultation/prescription/${appointmentId}`);
  };

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter(a => a.status === "COMPLETED").length;
  const remainingAppts = appointments.filter(a => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length;
  const inProgressAppt = appointments.find(a => a.status === "IN_PROGRESS");

  const filtered = appointments.filter(a => {
    if (!showAllStatuses && !["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.patient?.name || "").toLowerCase().includes(q) ||
      (a.patient?.patientId || "").toLowerCase().includes(q) ||
      (a.timeSlot || "").includes(q) ||
      (a.doctor?.name || "").toLowerCase().includes(q) ||
      (a.department?.name || "").toLowerCase().includes(q) ||
      (STATUS_CFG[a.status]?.label || "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    const d = sortDir === "asc" ? 1 : -1;
    if (sortField === "tokenNumber") return d * ((a.tokenNumber || 0) - (b.tokenNumber || 0));
    if (sortField === "timeSlot") return d * ((a.timeSlot || "").localeCompare(b.timeSlot || ""));
    if (sortField === "patient") return d * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (sortField === "doctor") return d * ((a.doctor?.name || "").localeCompare(b.doctor?.name || ""));
    if (sortField === "department") return d * ((a.department?.name || "").localeCompare(b.department?.name || ""));
    if (sortField === "type") return d * ((a.type || "").localeCompare(b.type || ""));
    if (sortField === "status") return d * ((a.status || "").localeCompare(b.status || ""));
    return 0;
  });

  if (selectedPatientId) {
    return (
      <div style={{ padding: "24px 32px", flex: 1, overflowY: "auto" }}>
        <PatientProfilePanel patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
      </div>
    );
  }

  return (
    <>
      {consultAppt && (
        <ConsultModal
          appt={consultAppt}
          onClose={() => setConsultAppt(null)}
          onDone={() => fetchAppointments(fmtDate(selectedDate), deptFilter, doctorFilter)}
          onStartPrescription={handleStartPrescription}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .ac-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:16px}
        .ac-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .ac-card-title{font-size:13px;font-weight:700;color:#1e293b}
        .ac-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
        .ac-tbl{width:100%;border-collapse:collapse}
        .ac-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .ac-tbl td{padding:11px 12px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc}
        .ac-tbl tr:last-child td{border-bottom:none}
        .ac-tbl tbody tr:hover td{background:#f8fafc}
        .ac-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .ac-stat{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;transition:transform .2s}
        .ac-stat:hover{transform:translateY(-2px)}
        .ac-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      `}</style>

      <div style={{ padding: "24px 32px", flex: 1, overflowY: "auto", minHeight: 0, fontFamily: "'Inter',sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-.02em" }}>Patient Consultation</h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>Manage and consult patients across all departments</p>
          </div>
          <span style={{ fontSize: 11, color: "#64748b", background: "#f0fdf4", border: "1px solid #d1fae5", padding: "5px 12px", borderRadius: 8, fontWeight: 500 }}>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { icon: <CalendarDays size={20} color="#0E898F" />, label: isToday ? "TODAY'S APPOINTMENTS" : "APPOINTMENTS", val: totalAppts, bg: "#E6F4F4" },
            { icon: <CheckCircle2 size={20} color="#059669" />, label: "COMPLETED", val: completedAppts, bg: "#f0fdf4" },
            { icon: <Clock size={20} color="#f59e0b" />, label: "REMAINING", val: remainingAppts, bg: "#fffbeb" },
            { icon: <Activity size={20} color="#ef4444" />, label: "IN PROGRESS", val: inProgressAppt ? 1 : 0, bg: "#fef2f2" },
          ].map((s, i) => (
            <div key={i} className="ac-stat">
              <div className="ac-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-.02em" }}>{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* In Progress Banner */}
        {inProgressAppt && (
          <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Consultation in progress — {inProgressAppt.patient?.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.75)" }}>
                  Token #{inProgressAppt.tokenNumber} · {inProgressAppt.timeSlot} · {TYPE_LABEL[inProgressAppt.type]} · {inProgressAppt.doctor?.name ? `Dr. ${inProgressAppt.doctor.name}` : ""} {inProgressAppt.department?.name ? `· ${inProgressAppt.department.name}` : ""}
                </div>
              </div>
            </div>
            <button onClick={() => handleStartPrescription(inProgressAppt.id)}
              style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Continue →
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="ac-card">
          {/* Card Header */}
          <div className="ac-card-head">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => goDate(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><ChevronLeft size={14} /></button>
              <div style={{ textAlign: "center", minWidth: 160 }}>
                <div className="ac-card-title">{isToday ? "Today's Appointments" : "Appointments"}</div>
                <div className="ac-card-sub">{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <button onClick={() => goDate(1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><ChevronRight size={14} /></button>
              {!isToday && (
                <button onClick={() => setSelectedDate(new Date())} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Today</button>
              )}
              <input type="date" value={fmtDate(selectedDate)} onChange={e => { if (e.target.value) setSelectedDate(new Date(e.target.value + "T00:00:00")); }}
                style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, color: "#334155", cursor: "pointer", fontFamily: "'Inter',sans-serif" }} />
            </div>
            <button onClick={() => fetchAppointments(fmtDate(selectedDate), deptFilter, doctorFilter)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              <RefreshCw size={12} />Refresh
            </button>
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
            {/* Show All */}
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, color: showAllStatuses ? ACCENT : "#64748b", background: showAllStatuses ? ACCENT + "12" : "#f8fafc", border: `1px solid ${showAllStatuses ? ACCENT : "#e2e8f0"}`, borderRadius: 8, padding: "6px 10px", flexShrink: 0, transition: "all .15s" }}>
              <input type="checkbox" checked={showAllStatuses} onChange={e => { setShowAllStatuses(e.target.checked); setStatusFilter(""); }} style={{ accentColor: ACCENT, width: 13, height: 13 }} />
              Show All
            </label>

            {/* Department Filter */}
            <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setDoctorFilter(""); }}
              style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${deptFilter ? ACCENT : "#e2e8f0"}`, background: deptFilter ? ACCENT + "12" : "#f8fafc", fontSize: 11, color: deptFilter ? ACCENT : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            {/* Doctor Filter */}
            <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${doctorFilter ? ACCENT : "#e2e8f0"}`, background: doctorFilter ? ACCENT + "12" : "#f8fafc", fontSize: 11, color: doctorFilter ? ACCENT : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              <option value="">All Doctors</option>
              {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
            </select>

            {/* Type Filter */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${typeFilter ? ACCENT : "#e2e8f0"}`, background: typeFilter ? ACCENT + "12" : "#f8fafc", fontSize: 11, color: typeFilter ? ACCENT : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              <option value="">All Types</option>
              <option value="OPD">OPD</option>
              <option value="ONLINE">Online</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            {/* Status Filter (when show all) */}
            {showAllStatuses && (
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${statusFilter ? ACCENT : "#e2e8f0"}`, background: statusFilter ? ACCENT + "12" : "#f8fafc", fontSize: 11, color: statusFilter ? ACCENT : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            )}

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", flex: 1, minWidth: 160 }}>
              <Search size={13} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, doctor, dept..."
                style={{ border: "none", background: "none", outline: "none", fontSize: 11, color: "#334155", width: "100%" }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={12} /></button>}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#94a3b8" }}>
              <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading appointments...
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 20px", color: "#94a3b8" }}>
              <Stethoscope size={40} style={{ opacity: .25, marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>No appointments found</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>{isToday ? "No appointments scheduled for today." : "No appointments on this date."}</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="ac-tbl">
                <thead>
                  <tr>
                    {[
                      { k: "tokenNumber", l: "Token" },
                      { k: "timeSlot", l: "Time" },
                      { k: "patient", l: "Patient" },
                      { k: "doctor", l: "Doctor" },
                      { k: "department", l: "Department" },
                      { k: "type", l: "Type" },
                      { k: "status", l: "Status" },
                    ].map(c => (
                      <th key={c.k} onClick={() => handleSort(c.k)} style={{ cursor: "pointer", userSelect: "none" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{c.l} {sortIcon(c.k, sortField, sortDir)}</span>
                      </th>
                    ))}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a: any) => {
                    const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                    const canConsult = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status);
                    return (
                      <tr key={a.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6, fontSize: 11 }}>
                            #{a.tokenNumber || "—"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#334155" }}>{a.timeSlot}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => a.patient?.id && setSelectedPatientId(a.patient.id)}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${ACCENT},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                              {(a.patient?.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>{a.patient?.name || "—"}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{a.patient?.patientId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "#475569" }}>{a.doctor?.name ? `Dr. ${a.doctor.name}` : "—"}</td>
                        <td style={{ fontSize: 11, color: "#475569" }}>{a.department?.name || "—"}</td>
                        <td>
                          <span style={{ fontSize: 10, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                            {TYPE_LABEL[a.type] || a.type}
                          </span>
                        </td>
                        <td>
                          <span className="ac-badge" style={{ background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}` }}>{sc.label}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {canConsult && (
                              <button onClick={() => setConsultAppt(a)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${ACCENT},#0A6B70)`, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 10px ${ACCENT}4d` }}>
                                <PlayCircle size={12} />{a.status === "IN_PROGRESS" ? "Continue" : "Consult"}
                              </button>
                            )}
                            {a.status === "COMPLETED" && (
                              <>
                                <button onClick={() => router.push(`/hospitaladmin/consultation/prescription/${a.id}?mode=view`)}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                  <FileText size={12} />View Rx
                                </button>
                                <button onClick={() => setConsultAppt(a)}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                  <Pencil size={12} />Edit
                                </button>
                              </>
                            )}
                            {!canConsult && a.status !== "COMPLETED" && (
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>—</span>
                            )}
                            <select
                              value={a.status}
                              disabled={updatingStatusId === a.id}
                              onChange={e => updateStatus(a.id, e.target.value)}
                              style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 10, color: "#334155", cursor: updatingStatusId === a.id ? "not-allowed" : "pointer" }}>
                              {["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"].map(s => (
                                <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {sorted.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Showing {sorted.length} of {appointments.length} appointments</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {[deptFilter && departments.find((d: any) => d.id === deptFilter)?.name, doctorFilter && "Filtered by doctor"].filter(Boolean).join(" · ") || "All departments"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminConsultationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, color: "#94a3b8", fontFamily: "'Inter',sans-serif" }}>
        <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Loading...
      </div>
    }>
      <ConsultationContent />
    </Suspense>
  );
}
