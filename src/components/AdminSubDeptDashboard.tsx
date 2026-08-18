"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Activity, TrendingUp, RefreshCw, Loader2,
  ChevronRight, UserCheck, IndianRupee, Layers, Eye, ArrowLeft,
  Smile, Sparkles, Scissors, Heart, Microscope, Pill, Scan,
  TestTube2, Stethoscope, ClipboardList, Receipt,
} from "lucide-react";

type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };

const SUB_DEPT_META: Record<string, DeptMeta> = {
  DENTAL:      { Icon: Smile,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  DERMATOLOGY: { Icon: Sparkles,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  HAIR:        { Icon: Scissors,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  ONCOLOGY:    { Icon: Activity,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  CARDIOLOGY:  { Icon: Heart,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  PATHOLOGY:   { Icon: Microscope,   gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  PHARMACY:    { Icon: Pill,         gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  BILLING:     { Icon: Receipt,      gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  RADIOLOGY:   { Icon: Scan,         gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  LABORATORY:  { Icon: TestTube2,    gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  PROCEDURE:   { Icon: Stethoscope,  gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  OTHER:       { Icon: Layers,       gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
};
const getSubDeptMeta = (type: string) => SUB_DEPT_META[type] || SUB_DEPT_META.OTHER;

export default function AdminSubDeptDashboard({ subDeptId, onBack, backLabel = "Back to Department" }: { subDeptId: string; onBack?: () => void; backLabel?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "queue" | "completed" | "procedures" | "records">("overview");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/config/subdepartments/${subDeptId}/dashboard`, { credentials: "include" }).then(r => r.json());
      if (res.success) { setData(res.data); setError(""); }
      else setError(res.message || "Failed to load");
    } catch { setError("Network error"); }
    setLoading(false);
    setRefreshing(false);
  }, [subDeptId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const iv = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(iv);
  }, [loadDashboard]);

  if (loading) return (
    <div data-ui="hospitaladmin.subdept-dashboard" style={{ padding: 60, textAlign: "center" }}>
      <Loader2 size={24} color="#0E898F" style={{ animation: "spin .7s linear infinite", margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontSize: 13, color: "#0E898F" }}>Loading sub-department dashboard…</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 12 }}>{error || "Failed"}</div>
      {onBack && <button onClick={onBack} className="hd-btn-primary">← Back</button>}
    </div>
  );

  const profile = data.profile;
  const stats = data.stats;
  const m = getSubDeptMeta(profile?.type);
  const DI = m.Icon;

  const sections = [
    { id: "overview", label: "Overview", icon: <Eye size={14} /> },
    { id: "queue", label: `Queue (${stats.pendingQueue})`, icon: <UserCheck size={14} /> },
    { id: "completed", label: `Completed (${data.completedList?.length || 0})`, icon: <Activity size={14} /> },
    { id: "procedures", label: `Procedures (${stats.totalProcedures})`, icon: <ClipboardList size={14} /> },
    { id: "records", label: `Records (${stats.totalRecords})`, icon: <IndianRupee size={14} /> },
  ];

  return (
    <>
      {onBack && (
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#0A6B70", fontSize: 13, fontWeight: 500, marginBottom: 16, padding: "6px 0", transition: "color .15s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#0E898F"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#0A6B70"; }}
      >
        <ArrowLeft size={16} /> {backLabel}
      </button>
      )}

      {/* Hero */}
      <div style={{ background: m.gradient, borderRadius: 18, padding: "24px 26px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DI size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 3 }}>
              {profile.parentDepartment?.name} → {profile.type?.replace(/_/g, " ")}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 3, lineHeight: 1.2 }}>{profile.name}</h2>
            {profile.description && <p style={{ fontSize: 12, opacity: .8, maxWidth: 480, margin: 0 }}>{profile.description}</p>}
          </div>
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            style={{ background: "rgba(255,255,255,.2)", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: "spin .7s linear infinite" } : {}} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {profile.flow && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
            {profile.flow.split("→").map((step: string, i: number, arr: string[]) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ background: "rgba(255,255,255,.15)", padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{step.trim()}</span>
                {i < arr.length - 1 && <ChevronRight size={11} color="rgba(255,255,255,.6)" />}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Pending Queue", value: stats.pendingQueue, Icon: UserCheck, color: m.accent, bg: m.lightBg },
          { label: "Today Referrals", value: stats.todayReferrals, Icon: ClipboardList, color: m.accent, bg: m.lightBg },
          { label: "Completed Today", value: stats.completedToday, Icon: Activity, color: m.accent, bg: m.lightBg },
          { label: "Active Procedures", value: stats.activeProcedures, Icon: Layers, color: m.accent, bg: m.lightBg },
          { label: "Today Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, Icon: IndianRupee, color: m.accent, bg: m.lightBg },
          { label: "Total Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, Icon: TrendingUp, color: m.accent, bg: m.lightBg },
        ].map((s, i) => {
          const SI = s.Icon;
          return (
            <div key={i} className="hd-sc" style={{ padding: 14, gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SI size={16} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#0A6B70", marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 10, border: "1.5px solid",
              borderColor: activeSection === s.id ? m.accent : "#e2e8f0",
              background: activeSection === s.id ? m.lightBg : "#fff",
              color: activeSection === s.id ? m.accent : "#0A6B70",
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === "overview" && <SDOverview data={data} meta={m} />}
      {activeSection === "queue" && <SDQueue queue={data.queue} meta={m} />}
      {activeSection === "completed" && <SDCompleted list={data.completedList} meta={m} />}
      {activeSection === "procedures" && <SDProcedures procedures={data.procedures} meta={m} />}
      {activeSection === "records" && <SDRecords records={data.recentRecords} stats={data.stats} meta={m} />}
    </>
  );
}

/* ─── Sub-Dept Overview ─── */
function SDOverview({ data, meta }: { data: any; meta: DeptMeta }) {
  const trend = data.dailyTrend || [];
  const maxCount = Math.max(...trend.map((d: any) => d.count), 1);
  const profile = data.profile;

  return (
    <>
      {trend.length > 0 && (
        <div className="hd-card" style={{ marginBottom: 18 }}>
          <div className="hd-card-head"><div><div className="hd-card-title">14-Day Activity Trend</div><div className="hd-card-sub">Procedure records per day</div></div></div>
          <div className="hd-card-body">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {trend.map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#1e293b" }}>{d.count || ""}</div>
                  <div style={{ width: "100%", minHeight: 4, borderRadius: "4px 4px 0 0", background: d.count > 0 ? meta.gradient : "#E6F4F4", height: `${Math.max((d.count / maxCount) * 100, 4)}%`, transition: "height .3s" }} title={`${d.label}: ${d.count} records, ₹${d.revenue.toLocaleString("en-IN")}`} />
                  <div style={{ fontSize: 8, color: "#0A6B70", whiteSpace: "nowrap" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hd-card" style={{ marginBottom: 18 }}>
        <div className="hd-card-head"><div><div className="hd-card-title">Sub-Department Details</div></div></div>
        <div className="hd-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            <InfoRow label="Name" value={profile.name} />
            <InfoRow label="Code" value={profile.code} />
            <InfoRow label="Type" value={profile.type?.replace(/_/g, " ")} />
            <InfoRow label="Status" value={profile.isActive ? "Active" : "Inactive"} valueColor={profile.isActive ? "#10b981" : "#ef4444"} />
            <InfoRow label="HOD" value={profile.hodStaffName} />
            <InfoRow label="Contact" value={profile.hodStaffEmail || profile.hodStaffPhone} />
          </div>
        </div>
      </div>

      {data.recentRecords?.length > 0 && (
        <div className="hd-card">
          <div className="hd-card-head"><div><div className="hd-card-title">Recent Procedure Records</div><div className="hd-card-sub">Last {Math.min(data.recentRecords.length, 10)} records</div></div></div>
          <div className="hd-card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>{["Patient", "Procedure", "Amount", "Status", "Date"].map(h => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>))}</tr></thead>
              <tbody>
                {data.recentRecords.slice(0, 10).map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.patientName}</div><div style={{ fontSize: 10, color: "#0A6B70" }}>{r.patientId}</div></td>
                    <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, color: "#1e293b" }}>{r.procedureName}</div><div style={{ fontSize: 10, color: meta.accent }}>{r.procedureType}</div></td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#059669" }}>₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: r.status === "COMPLETED" ? "#d1fae5" : "#fef3c7", color: r.status === "COMPLETED" ? "#059669" : "#92400e" }}>{r.status?.replace(/_/g, " ")}</span></td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#0A6B70" }}>{new Date(r.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-Dept Queue ─── */
function SDQueue({ queue, meta }: { queue: any[]; meta: DeptMeta }) {
  if (!queue || queue.length === 0) return (
    <div className="hd-card"><div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}><UserCheck size={32} color="#0E898F" style={{ margin: "0 auto 12px", opacity: 0.3 }} /><div style={{ fontSize: 14, fontWeight: 600, color: "#0A6B70" }}>No pending referrals</div></div></div>
  );
  return (
    <div className="hd-card">
      <div className="hd-card-head"><div><div className="hd-card-title">Pending Referral Queue</div><div className="hd-card-sub">{queue.length} patient{queue.length !== 1 ? "s" : ""} awaiting procedure</div></div></div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>{["#", "Patient", "Referred By", "Date", "Note", "Fee"].map(h => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>))}</tr></thead>
          <tbody>
            {queue.map((q: any, i: number) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: meta.accent }}>{q.tokenNumber || i + 1}</td>
                <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{q.patient?.name}</div><div style={{ fontSize: 10, color: "#0A6B70" }}>{q.patient?.patientId} · {q.patient?.gender}</div></td>
                <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, color: "#1e293b" }}>{q.doctor?.name}</div><div style={{ fontSize: 10, color: "#0A6B70" }}>{q.doctor?.specialization}</div></td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#0A6B70" }}>{q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                <td style={{ padding: "10px 14px" }}>{q.subDeptNote ? <div style={{ fontSize: 11, color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: 6, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.subDeptNote}</div> : <span style={{ color: "#B3E0E0", fontSize: 11 }}>—</span>}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#1e293b" }}>₹{q.consultationFee || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Sub-Dept Completed ─── */
function SDCompleted({ list, meta }: { list: any[]; meta: DeptMeta }) {
  if (!list || list.length === 0) return (
    <div className="hd-card"><div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}><Activity size={32} color="#0E898F" style={{ margin: "0 auto 12px", opacity: 0.3 }} /><div style={{ fontSize: 14, fontWeight: 600, color: "#0A6B70" }}>No completed referrals yet</div></div></div>
  );
  return (
    <div className="hd-card">
      <div className="hd-card-head"><div><div className="hd-card-title">Completed Referrals</div><div className="hd-card-sub">{list.length} with procedure records</div></div></div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>{["Patient", "Doctor", "Procedure", "Amount", "Performed By", "Date"].map(h => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>))}</tr></thead>
          <tbody>
            {list.map((c: any) => { const pr = c.procedureRecords?.[0]; return (
              <tr key={c.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{c.patient?.name}</div><div style={{ fontSize: 10, color: "#0A6B70" }}>{c.patient?.patientId}</div></td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#0A6B70" }}>{c.doctor?.name || "—"}</td>
                <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, color: "#1e293b" }}>{pr?.procedureName || "—"}</div><div style={{ fontSize: 10, color: meta.accent }}>{pr?.procedureType}</div></td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#059669" }}>₹{(pr?.amount || 0).toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#0A6B70" }}>{pr?.performedBy || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "#0A6B70" }}>{pr?.performedAt ? new Date(pr.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Sub-Dept Procedures ─── */
function SDProcedures({ procedures, meta }: { procedures: any[]; meta: DeptMeta }) {
  const PROC_COLOR: Record<string, string> = { DIAGNOSTIC: "#0E898F", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6", SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#0A6B70" };
  if (!procedures || procedures.length === 0) return (
    <div className="hd-card"><div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}><ClipboardList size={32} color="#0E898F" style={{ margin: "0 auto 12px", opacity: 0.3 }} /><div style={{ fontSize: 14, fontWeight: 600, color: "#0A6B70" }}>No procedures configured</div></div></div>
  );
  const active = procedures.filter((p: any) => p.isActive);
  const inactive = procedures.filter((p: any) => !p.isActive);
  return (
    <div className="hd-card">
      <div className="hd-card-head"><div><div className="hd-card-title">Procedure Catalog</div><div className="hd-card-sub">{active.length} active, {inactive.length} inactive</div></div></div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>{["#", "Name", "Type", "Fee", "Duration", "Status"].map(h => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>))}</tr></thead>
          <tbody>
            {procedures.map((p: any, i: number) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc", opacity: p.isActive ? 1 : 0.55 }}>
                <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#0A6B70" }}>{i + 1}</td>
                <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</div>{p.description && <div style={{ fontSize: 10, color: "#0A6B70", marginTop: 2 }}>{p.description}</div>}</td>
                <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${PROC_COLOR[p.type] || "#94a3b8"}15`, color: PROC_COLOR[p.type] || "#94a3b8" }}>{p.type}</span></td>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.fee != null ? `₹${p.fee.toLocaleString("en-IN")}` : "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "#0A6B70" }}>{p.duration ? `${p.duration} min` : "—"}</td>
                <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: p.isActive ? "#d1fae5" : "#fee2e2", color: p.isActive ? "#059669" : "#dc2626" }}>{p.isActive ? "Active" : "Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Sub-Dept Records ─── */
function SDRecords({ records, stats, meta }: { records: any[]; stats: any; meta: DeptMeta }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Today Records", value: stats.todayRecords, color: meta.accent },
          { label: "Today Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, color: "#059669" },
          { label: "Total Records", value: stats.totalRecords, color: "#6366f1" },
          { label: "Total Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, color: "#0E898F" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#0A6B70", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {(!records || records.length === 0) ? (
        <div className="hd-card"><div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}><IndianRupee size={32} color="#0E898F" style={{ margin: "0 auto 12px", opacity: 0.3 }} /><div style={{ fontSize: 14, fontWeight: 600, color: "#0A6B70" }}>No procedure records found</div></div></div>
      ) : (
        <div className="hd-card">
          <div className="hd-card-head"><div><div className="hd-card-title">Recent Procedure Records</div><div className="hd-card-sub">Showing latest {records.length} records</div></div></div>
          <div className="hd-card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>{["Patient", "Procedure", "Amount", "Performed By", "Status", "Date"].map(h => (<th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>))}</tr></thead>
              <tbody>
                {records.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.patientName}</div><div style={{ fontSize: 10, color: "#0A6B70" }}>{r.patientId}</div></td>
                    <td style={{ padding: "10px 14px" }}><div style={{ fontSize: 12, color: "#1e293b" }}>{r.procedureName}</div><div style={{ fontSize: 10, color: meta.accent }}>{r.procedureType}</div></td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#059669" }}>₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#0A6B70" }}>{r.performedBy}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: r.status === "COMPLETED" ? "#d1fae5" : "#fef3c7", color: r.status === "COMPLETED" ? "#059669" : "#92400e" }}>{r.status?.replace(/_/g, " ")}</span></td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#0A6B70" }}>{new Date(r.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── HELPERS ─── */
function InfoRow({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: valueColor || "#1e293b" }}>{value || "—"}</div>
    </div>
  );
}
