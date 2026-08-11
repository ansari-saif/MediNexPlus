"use client";
import AdminSubDeptDashboard from "@/components/AdminSubDeptDashboard";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, Users, Activity, TrendingUp, RefreshCw, Loader2,
  ChevronRight, UserCheck, IndianRupee, Layers, Eye, ArrowLeft,
  Smile, Sparkles, Scissors, Heart, Microscope, Pill, Scan,
  TestTube2, Stethoscope, FlaskConical, ClipboardList, Receipt,
  ToggleLeft, ToggleRight, CalendarDays, Package, Search, X, Check
} from "lucide-react";

/* ─── Dept-type metadata ─── */
type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };
const DEPT_TYPE_META: Record<string, DeptMeta> = {
  GENERAL:     { Icon: Building2,    gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  SURGICAL:    { Icon: Scissors,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  DIAGNOSTIC:  { Icon: Microscope,   gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  EMERGENCY:   { Icon: Activity,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  OUTPATIENT:  { Icon: Users,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  INPATIENT:   { Icon: Building2,    gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  LABORATORY:  { Icon: TestTube2,    gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  PHARMACY:    { Icon: Pill,         gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  RADIOLOGY:   { Icon: Scan,         gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  CARDIOLOGY:  { Icon: Heart,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  NEUROLOGY:   { Icon: Activity,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  PEDIATRICS:  { Icon: Smile,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  ORTHOPEDICS: { Icon: Stethoscope,  gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  ONCOLOGY:    { Icon: FlaskConical, gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  DERMATOLOGY: { Icon: Sparkles,     gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  OTHER:       { Icon: Layers,       gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0A6B70", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
};
const getDeptMeta = (type: string) => DEPT_TYPE_META[type] || DEPT_TYPE_META.OTHER;

/* Sub-dept type metadata (same as parentdept page) */
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

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORTED COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function AdminDepartmentsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewDeptId, setViewDeptId] = useState<string | null>(null);
  const [viewSubDeptId, setViewSubDeptId] = useState<string | null>(null);

  useEffect(() => {
    const d = searchParams.get("dept");
    const sd = searchParams.get("subdept");
    setViewDeptId(d);
    setViewSubDeptId(sd);
  }, [searchParams]);

  const openDept = (id: string) => {
    router.push(`/hospitaladmin/dashboard?tab=departments&dept=${id}`, { scroll: false });
  };
  const closeDept = () => {
    router.push("/hospitaladmin/dashboard?tab=departments", { scroll: false });
  };
  const openSubDept = (deptId: string, subDeptId: string) => {
    router.push(`/hospitaladmin/dashboard?tab=departments&dept=${deptId}&subdept=${subDeptId}`, { scroll: false });
  };
  const closeSubDept = (deptId: string) => {
    router.push(`/hospitaladmin/dashboard?tab=departments&dept=${deptId}`, { scroll: false });
  };

  if (viewSubDeptId && viewDeptId) {
    return <AdminSubDeptDashboard subDeptId={viewSubDeptId} onBack={() => closeSubDept(viewDeptId)} />;
  }
  if (viewDeptId) {
    return <DepartmentDetailView deptId={viewDeptId} onBack={closeDept} onOpenSubDept={(sdId) => openSubDept(viewDeptId, sdId)} />;
  }
  return <DepartmentsGrid onOpenDept={openDept} />;
}

/* ═══════════════════════════════════════════════════════════════════
   DEPARTMENTS TABLE — Proper table listing with search / filters
   ═══════════════════════════════════════════════════════════════════ */
function DepartmentsGrid({ onOpenDept }: { onOpenDept: (id: string) => void }) {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortCol, setSortCol] = useState<"name" | "type" | "doctors" | "subdepts" | "staff">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (filtered.length > 0 && selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((d: any) => d.id)));
  };

  const load = () => {
    setLoading(true);
    fetch("/api/config/departments", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setDepts(d.data?.data || d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const types = Array.from(new Set(depts.map((d: any) => d.type).filter(Boolean)));

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(p => p === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = depts
    .filter((d: any) => {
      const q = search.toLowerCase();
      const matchQ = !q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q) || (d.type || "").toLowerCase().includes(q) || (d.hodDoctor?.name || "").toLowerCase().includes(q);
      const matchType = !typeFilter || d.type === typeFilter;
      const matchStatus = !statusFilter || (statusFilter === "active" ? d.isActive : !d.isActive);
      return matchQ && matchType && matchStatus;
    })
    .sort((a: any, b: any) => {
      let va: any, vb: any;
      if (sortCol === "name")     { va = a.name || ""; vb = b.name || ""; }
      else if (sortCol === "type") { va = a.type || ""; vb = b.type || ""; }
      else if (sortCol === "doctors")  { va = a._count?.doctors || 0; vb = b._count?.doctors || 0; }
      else if (sortCol === "subdepts") { va = a._count?.subDepartments || 0; vb = b._count?.subDepartments || 0; }
      else if (sortCol === "staff")    { va = a._count?.staff || 0; vb = b._count?.staff || 0; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const summaryStats = [
    { label: "Total Departments", val: depts.length, Icon: Building2 },
    { label: "Active",            val: depts.filter((d: any) => d.isActive).length, Icon: Activity },
    { label: "Total Doctors",     val: depts.reduce((s: number, d: any) => s + (d._count?.doctors || 0), 0), Icon: Stethoscope },
    { label: "Sub-Departments",   val: depts.reduce((s: number, d: any) => s + (d._count?.subDepartments || 0), 0), Icon: Layers },
  ];

  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    <span style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.35, fontSize: 10 }}>
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <>
      <style>{`@keyframes deptSpin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-.01em" }}>Departments</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Manage hospital departments and sub-departments</div>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={13} style={loading ? { animation: "deptSpin 1s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {summaryStats.map((s, i) => {
          const SI = s.Icon;
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SI size={16} color="#0A6B70" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Panel */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>

        {/* Toolbar */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, type, HOD…"
              style={{ width: "100%", padding: "8px 28px 8px 30px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 2 }}>
                <X size={12} />
              </button>
            )}
          </div>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155", minWidth: 140 }}>
            <option value="">All Types</option>
            {types.map(t => <option key={String(t)} value={String(t)}>{String(t).replace(/_/g, " ")}</option>)}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc", color: "#334155", minWidth: 120 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto", whiteSpace: "nowrap" }}>
            {filtered.length} of {depts.length} departments
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 56, textAlign: "center", color: "#0E898F", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Loader2 size={18} style={{ animation: "deptSpin 1s linear infinite" }} /> Loading departments…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Building2 size={32} color="#94a3b8" style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>
              {depts.length === 0 ? "No departments found" : "No results match your filters"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {depts.length === 0 ? "Go to Configure Hospital to add departments" : "Try adjusting your search or filters"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "13px 10px 13px 16px", width: 36 }}>
                    <div onClick={toggleAll} style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${filtered.length > 0 && selectedIds.size === filtered.length ? "#0E898F" : "#cbd5e1"}`, background: filtered.length > 0 && selectedIds.size === filtered.length ? "#0E898F" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {filtered.length > 0 && selectedIds.size === filtered.length && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </th>
                  <th onClick={() => toggleSort("name")} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: sortCol === "name" ? "#0A6B70" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    Department <SortIcon col="name" />
                  </th>
                  <th onClick={() => toggleSort("type")} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: sortCol === "type" ? "#0A6B70" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    Type <SortIcon col="type" />
                  </th>
                  <th onClick={() => toggleSort("doctors")} style={{ padding: "13px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: sortCol === "doctors" ? "#0A6B70" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    Doctors <SortIcon col="doctors" />
                  </th>
                  <th onClick={() => toggleSort("subdepts")} style={{ padding: "13px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: sortCol === "subdepts" ? "#0A6B70" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    Sub-Depts <SortIcon col="subdepts" />
                  </th>
                  <th onClick={() => toggleSort("staff")} style={{ padding: "13px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: sortCol === "staff" ? "#0A6B70" : "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    Staff <SortIcon col="staff" />
                  </th>
                  <th style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>HOD Doctor</th>
                  <th style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any, i: number) => {
                  const m = getDeptMeta(d.type);
                  const DI = m.Icon;
                  return (
                    <tr
                      key={d.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s", background: selectedIds.has(d.id) ? "#f0fdfa" : undefined }}
                      onMouseEnter={e => { if (!selectedIds.has(d.id)) e.currentTarget.style.background = "#fafbfc"; }}
                      onMouseLeave={e => { if (!selectedIds.has(d.id)) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "15px 10px 15px 16px", width: 36 }}>
                        <div onClick={() => toggleSelect(d.id)} style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selectedIds.has(d.id) ? "#0E898F" : "#cbd5e1"}`, background: selectedIds.has(d.id) ? "#0E898F" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {selectedIds.has(d.id) && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                      </td>

                      <td style={{ padding: "15px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <DI size={15} color="#0A6B70" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{d.name}</div>
                            {d.code && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{d.code}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "15px 16px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", color: "#64748b", fontSize: 12 }}>
                          {(d.type || "—").replace(/_/g, " ")}
                        </span>
                      </td>

                      <td style={{ padding: "15px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A6B70" }}>{d._count?.doctors || 0}</span>
                      </td>

                      <td style={{ padding: "15px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A6B70" }}>{d._count?.subDepartments || 0}</span>
                      </td>

                      <td style={{ padding: "15px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A6B70" }}>{d._count?.staff || 0}</span>
                      </td>

                      <td style={{ padding: "15px 16px" }}>
                        {d.hodDoctor ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Stethoscope size={13} color="#0284c7" />
                            </div>
                            <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{d.hodDoctor.name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "15px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: d.isActive ? "#dcfce7" : "#fee2e2", color: d.isActive ? "#16a34a" : "#dc2626" }}>
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={{ padding: "15px 16px" }}>
                        <button
                          onClick={() => d.isActive && onOpenDept(d.id)}
                          disabled={!d.isActive}
                          style={{ padding: "6px 12px", background: d.isActive ? "#E6F4F4" : "#f8fafc", color: d.isActive ? "#0E898F" : "#94a3b8", border: "none", borderRadius: 8, cursor: d.isActive ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, opacity: d.isActive ? 1 : 0.6 }}
                          title="View Department"
                        >
                          View <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", background: "#fafcff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> department{filtered.length !== 1 ? "s" : ""}
              {(search || typeFilter || statusFilter) && <> — filtered from <strong style={{ color: "#334155" }}>{depts.length}</strong> total</>}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Click a column header to sort · Click <strong style={{ color: "#0A6B70" }}>View</strong> for details
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEPARTMENT DETAIL VIEW — Shows dept info + sub-dept cards
   ═══════════════════════════════════════════════════════════════════ */
function DepartmentDetailView({ deptId, onBack, onOpenSubDept }: { deptId: string; onBack: () => void; onOpenSubDept: (sdId: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/config/departments/${deptId}/dashboard`, { credentials: "include" }).then(r => r.json());
      if (res.success) { setData(res.data); setError(""); }
      else setError(res.message || "Failed to load");
    } catch { setError("Network error"); }
    setLoading(false);
    setRefreshing(false);
  }, [deptId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <Loader2 size={24} color="#0E898F" style={{ animation: "spin .7s linear infinite", margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontSize: 13, color: "#0E898F" }}>Loading department…</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 12 }}>{error || "Failed"}</div>
      <button onClick={onBack} className="hd-btn-primary">← Back</button>
    </div>
  );

  const dept = data.department;
  const stats = data.stats;
  const subDepts = data.subDepartments || [];
  const doctors = data.doctors || [];
  const m = getDeptMeta(dept.type);
  const DI = m.Icon;

  return (
    <>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#0A6B70", fontSize: 13, fontWeight: 500, marginBottom: 16, padding: "6px 0", transition: "color .15s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#0E898F"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#0A6B70"; }}
      >
        <ArrowLeft size={16} /> Back to Departments
      </button>

      {/* Hero Banner */}
      <div style={{ background: m.gradient, borderRadius: 18, padding: "24px 26px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DI size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 3 }}>{dept.type?.replace(/_/g, " ")} Department</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 3, lineHeight: 1.2 }}>{dept.name}</h2>
            {dept.description && <p style={{ fontSize: 12, opacity: .8, maxWidth: 480, margin: 0 }}>{dept.description}</p>}
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{ background: "rgba(255,255,255,.2)", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: "spin .7s linear infinite" } : {}} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Doctors", value: stats.totalDoctors, Icon: Stethoscope, color: m.accent, bg: m.lightBg },
          { label: "Sub-Departments", value: stats.totalSubDepts, Icon: Building2, color: m.accent, bg: m.lightBg },
          { label: "Today Appointments", value: stats.todayAppointments, Icon: CalendarDays, color: m.accent, bg: m.lightBg },
          { label: "Total Records", value: stats.totalRecords, Icon: ClipboardList, color: m.accent, bg: m.lightBg },
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

      {/* Department Info Card */}
      <div className="hd-card" style={{ marginBottom: 18 }}>
        <div className="hd-card-head">
          <div>
            <div className="hd-card-title">Department Information</div>
            <div className="hd-card-sub">{dept.code} · {dept.type?.replace(/_/g, " ")}</div>
          </div>
        </div>
        <div className="hd-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <InfoRow label="Name" value={dept.name} />
            <InfoRow label="Code" value={dept.code} />
            <InfoRow label="Type" value={dept.type?.replace(/_/g, " ")} />
            <InfoRow label="Status" value={dept.isActive ? "Active" : "Inactive"} valueColor={dept.isActive ? "#10b981" : "#ef4444"} />
            <InfoRow label="HOD Doctor" value={dept.hodDoctor?.name} />
            <InfoRow label="Login Email" value={dept.loginEmail} />
          </div>
        </div>
      </div>

      {/* Doctors List */}
      {doctors.length > 0 && (
        <div className="hd-card" style={{ marginBottom: 18 }}>
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Doctors ({doctors.length})</div>
              <div className="hd-card-sub">{doctors.filter((d: any) => d.isActive).length} active</div>
            </div>
          </div>
          <div className="hd-card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Name", "Specialization", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #E6F4F4" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc: any) => (
                  <tr key={doc.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          {doc.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{doc.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#0A6B70" }}>{doc.specialization || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: doc.isActive ? "#d1fae5" : "#fee2e2", color: doc.isActive ? "#059669" : "#dc2626" }}>
                        {doc.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Department Cards */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Sub-Departments</div>
        <div style={{ fontSize: 11, color: "#0A6B70" }}>
          {subDepts.length} sub-department{subDepts.length !== 1 ? "s" : ""} — click to view live dashboard
        </div>
      </div>

      {subDepts.length === 0 ? (
        <div className="hd-card">
          <div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}>
            <Building2 size={32} color="#0E898F" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0A6B70" }}>No sub-departments</div>
            <div style={{ fontSize: 12, color: "#0A6B70", marginTop: 4 }}>Configure sub-departments from the hospital settings</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {subDepts.map((sd: any) => {
            const sm = getSubDeptMeta(sd.type);
            const SI = sm.Icon;
            const isInactive = !sd.isActive;
            return (
              <div
                key={sd.id}
                onClick={() => sd.isActive && onOpenSubDept(sd.id)}
                style={{
                  background: "#fff",
                  borderRadius: 14, border: `1px solid ${isInactive ? "#e2e8f0" : "#e2e8f0"}`,
                  overflow: "hidden", cursor: isInactive ? "default" : "pointer",
                  transition: "all .2s",
                  opacity: isInactive ? 0.65 : 1,
                }}
                onMouseEnter={e => { if (!isInactive) { e.currentTarget.style.borderColor = "#B3E0E0"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                {/* Removed gradient bar */}
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isInactive ? "#f8fafc" : "#E6F4F4",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <SI size={20} color={isInactive ? "#94a3b8" : "#0E898F"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isInactive ? "#94a3b8" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sd.name}
                      </div>
                      <div style={{ fontSize: 11, color: isInactive ? "#B3E0E0" : "#0A6B70", fontWeight: 600, marginTop: 1 }}>
                        {sd.code ? `${sd.code} · ` : ""}{sd.type?.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>

                  {sd.description && (
                    <div style={{ fontSize: 12, color: "#0A6B70", marginBottom: 14, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {sd.description}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{sd._count?.procedures || 0}</div>
                      <div style={{ fontSize: 9, color: "#0A6B70", fontWeight: 600, textTransform: "uppercase" }}>Procedures</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{sd._count?.procedureRecords || 0}</div>
                      <div style={{ fontSize: 9, color: "#0A6B70", fontWeight: 600, textTransform: "uppercase" }}>Records</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{sd._count?.appointments || 0}</div>
                      <div style={{ fontSize: 9, color: "#0A6B70", fontWeight: 600, textTransform: "uppercase" }}>Referrals</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #E6F4F4" }}>
                    {sd.hodStaffName ? (
                      <div style={{ fontSize: 11, color: "#0A6B70", display: "flex", alignItems: "center", gap: 5 }}>
                        <Users size={12} color="#0E898F" /> {sd.hodStaffName}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#B3E0E0" }}>No HOD assigned</div>
                    )}
                    {sd.isActive && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#0E898F", display: "flex", alignItems: "center", gap: 4 }}>
                        View Dashboard <ChevronRight size={13} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: valueColor || "#1e293b" }}>{value || "—"}</div>
    </div>
  );
}

