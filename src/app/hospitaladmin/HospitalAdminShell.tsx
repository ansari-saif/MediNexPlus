"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, HelpCircle,
  LogOut, Building2, Stethoscope, ClipboardList,
  IndianRupee, CreditCard, ChevronDown, ChevronRight, User, BedDouble, BarChart2, Menu, X, Layers
} from "lucide-react";
import { Anchor } from "@/lib/uianchor";
import { sortSubDepts, subDeptLabel } from "@/lib/subdept-catalog";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(() => import("@/components/NotificationBell"), { ssr: false });
const AppointmentAlertModal = dynamic(() => import("@/components/AppointmentAlertModal"), { ssr: false });
const SupportModal = dynamic(() => import("@/components/SupportModal"), { ssr: false });

const initials = (n: string) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", Icon: LayoutDashboard, section: "General", route: "/hospitaladmin/dashboard" },
  { id: "appointments", label: "Appointments", Icon: CalendarDays, section: "General", route: "/hospitaladmin/appointments" },
  { id: "consultation", label: "Consultation", Icon: Stethoscope, section: "General", route: "/hospitaladmin/consultation" },
  { id: "billing", label: "Billing", Icon: CreditCard, section: "General", route: "/hospitaladmin/dashboard?tab=billing" },
  { id: "inventory", label: "Inventory", Icon: ClipboardList, section: "General", route: "/hospitaladmin/dashboard?tab=inventory" },
  { id: "ipd", label: "IPD / Wards", Icon: BedDouble, section: "General", route: "/hospitaladmin/dashboard?tab=ipd" },
  { id: "staff", label: "Staff", Icon: Users, section: "General", route: "/hospitaladmin/staff" },
  { id: "doctors", label: "Doctors", Icon: Stethoscope, section: "General", route: "/hospitaladmin/doctors" },
  { id: "patients", label: "Patients", Icon: UserRound, section: "General", route: "/hospitaladmin/dashboard?tab=patients" },
  { id: "departments", label: "Departments", Icon: Building2, section: "General", route: "/hospitaladmin/dashboard?tab=departments" },
  { id: "reports", label: "Reports", Icon: BarChart2, section: "System", route: "/hospitaladmin/dashboard?tab=reports" },
  { id: "finance", label: "Finance", Icon: IndianRupee, section: "System", route: "/hospitaladmin/finance" },
];

type SubDeptNavItem = { id: string; name: string; type: string; customName?: string | null };

function getActiveId(pathname: string, tab: string | null): string {
  if (pathname.startsWith("/hospitaladmin/sub-departments")) return "subdepartments";
  if (pathname.startsWith("/hospitaladmin/appointments")) return "appointments";
  if (pathname.startsWith("/hospitaladmin/consultation")) return "consultation";
  if (pathname.startsWith("/hospitaladmin/finance")) return "finance";
  if (pathname.startsWith("/hospitaladmin/staff")) return "staff";
  if (pathname.startsWith("/hospitaladmin/doctors")) return "doctors";
  if (pathname.startsWith("/hospitaladmin/configure")) return "configure";
  if (pathname.startsWith("/hospitaladmin/profile")) return "profile";
  if (pathname.startsWith("/hospitaladmin/dashboard")) {
    if (tab === "inventory") return "inventory";
    if (tab === "billing") return "billing";
    if (tab === "ipd") return "ipd";
    if (tab === "departments") return "departments";
    if (tab === "reports") return "reports";
    if (tab === "finance") return "finance";
    if (tab === "settings") return "settings";
    if (tab === "patients") return "patients";
    return "overview";
  }
  return "overview";
}

function SearchTabSync({ onTab }: { onTab: (tab: string | null) => void }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  useEffect(() => {
    onTab(tab);
  }, [tab, onTab]);
  return null;
}

export default function HospitalAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [tab, setTab] = useState<string | null>(null);
  const [subDepts, setSubDepts] = useState<SubDeptNavItem[]>([]);
  const [subDeptsOpen, setSubDeptsOpen] = useState(false);
  const [subDeptsLoaded, setSubDeptsLoaded] = useState(false);
  const onTab = useCallback((next: string | null) => setTab(next), []);

  const activeId = getActiveId(pathname, tab);
  const activeSubDeptId = pathname.startsWith("/hospitaladmin/sub-departments/")
    ? pathname.split("/")[3] || null
    : null;

  const fetchUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
        if (d.data.role === "STAFF" || d.data.role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (d.data.role === "SUB_DEPT_HEAD") { router.push("/subdept/dashboard"); return; }
        if (d.data.role === "FINANCE_HEAD") { router.push("/finance/dashboard"); return; }
        if (d.data.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
        setUser(d.data);
        fetch("/api/config/settings", { credentials: "include" })
          .then(r => r.json())
          .then(settingsData => {
            if (settingsData.success && settingsData.data?.settings) {
              setHospitalSettings(settingsData.data.settings);
            }
          })
          .catch(() => { });
      })
      .catch(() => router.push("/login"));
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  useEffect(() => {
    const handleProfileUpdate = () => fetchUser();
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (activeId === "subdepartments") setSubDeptsOpen(true);
  }, [activeId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/subdepartments?isActive=true&limit=100", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const rows = Array.isArray(d.data?.data) ? d.data.data : Array.isArray(d.data) ? d.data : [];
        setSubDepts(sortSubDepts(rows));
        setSubDeptsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setSubDeptsLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const navigate = (item: typeof NAV_ITEMS[0]) => {
    router.push(item.route);
    setSidebarOpen(false);
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const generalItems = NAV_ITEMS.filter(n => n.section === "General");
  const systemItems = NAV_ITEMS.filter(n => n.section === "System");

  return (
    <>
      <Suspense fallback={null}>
        <SearchTabSync onTab={onTab} />
      </Suspense>

      <div className="hd">
        {sidebarOpen && <div className="hd-overlay open" onClick={closeSidebar} />}
        <aside className={`hd-sb${sidebarOpen ? " open" : ""}`}>
          <div className="hd-sb-logo">
            {hospitalSettings?.logo ? (
              <img src={hospitalSettings.logo} alt="Hospital Logo" style={{ width: "100%", maxHeight: 52, objectFit: "contain", display: "block" }} />
            ) : (
              <>
                <div className="hd-logo-ic"><Stethoscope size={18} color="white" /></div>
                <div><div className="hd-logo-tx">{hospitalSettings?.hospitalName || user?.hospital?.name || "MediNexPlus"}</div><div className="hd-logo-sub">Hospital Admin</div></div>
              </>
            )}
          </div>

          <nav className="hd-nav" data-ui="hospitaladmin.sidebar-nav">
            <div className="hd-nav-sec">General</div>
            {generalItems.map(n => (
              <Anchor.Button
                key={n.id}
                ui={`hospitaladmin.nav.${n.id}`}
                className={`hd-nb${activeId === n.id ? " on" : ""}`}
                onClick={() => navigate(n)}
                style={{ position: "relative" }}
              >
                {activeId === n.id && <div className="hd-nb-dot" />}
                <span style={{ color: activeId === n.id ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                  <n.Icon size={16} />
                </span>
                {n.label}
              </Anchor.Button>
            ))}

            <Anchor.Button
              ui="hospitaladmin.nav.subdepartments"
              className={`hd-nb${activeId === "subdepartments" ? " on" : ""}`}
              onClick={() => setSubDeptsOpen(o => !o)}
              style={{ position: "relative" }}
            >
              {activeId === "subdepartments" && <div className="hd-nb-dot" />}
              <span style={{ color: activeId === "subdepartments" ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                <Layers size={16} />
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>Sub Departments</span>
              <span style={{ color: "#94a3b8", display: "flex" }}>
                {subDeptsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </Anchor.Button>

            {subDeptsOpen && (
              <div data-ui="hospitaladmin.nav.subdepartments.menu" className="hd-subnav">
                {!subDeptsLoaded ? (
                  <div className="hd-subnav-empty">Loading…</div>
                ) : subDepts.length === 0 ? (
                  <div className="hd-subnav-empty">
                    No sub-departments yet — create in Configure
                  </div>
                ) : (
                  subDepts.map(sd => {
                    const on = activeSubDeptId === sd.id;
                    return (
                      <Anchor.Button
                        key={sd.id}
                        ui="hospitaladmin.nav.subdept-item"
                        data-ui-instance={sd.id}
                        className={`hd-nb hd-nb-sub${on ? " on" : ""}`}
                        onClick={() => {
                          router.push(`/hospitaladmin/sub-departments/${sd.id}`);
                          setSidebarOpen(false);
                        }}
                        title={sd.type?.replace(/_/g, " ")}
                      >
                        {on && <div className="hd-nb-dot" />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {subDeptLabel(sd)}
                        </span>
                      </Anchor.Button>
                    );
                  })
                )}
              </div>
            )}

            <div className="hd-nav-sec">System</div>
            {systemItems.map(n => (
              <Anchor.Button
                key={n.id}
                ui={`hospitaladmin.nav.${n.id}`}
                className={`hd-nb${activeId === n.id ? " on" : ""}`}
                onClick={() => navigate(n)}
                style={{ position: "relative" }}
              >
                {activeId === n.id && <div className="hd-nb-dot" />}
                <span style={{ color: activeId === n.id ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                  <n.Icon size={16} />
                </span>
                {n.label}
              </Anchor.Button>
            ))}

            <Anchor.Button
              ui="hospitaladmin.nav.configure"
              className={`hd-nb${activeId === "configure" ? " on" : ""}`}
              onClick={() => router.push("/hospitaladmin/configure")}
              style={{ position: "relative" }}
            >
              {activeId === "configure" && <div className="hd-nb-dot" />}
              <span style={{ color: activeId === "configure" ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                <Building2 size={16} />
              </span>
              Configure Hospital
            </Anchor.Button>

            <button className="hd-nb" onClick={() => setSupportOpen(true)}>
              <span style={{ color: "#94a3b8", display: "flex" }}><HelpCircle size={16} /></span>
              Support
            </button>
          </nav>

          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} /> : (user?.name ? initials(user.name) : "HA")}</div>
              <div style={{ overflow: "hidden" }}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <Anchor.Button className="hd-logout" ui="hospitaladmin.logout" onClick={logout}>
              <LogOut size={13} /> Log Out
            </Anchor.Button>
          </div>
        </aside>

        <main className="hd-main">
          <header className="hd-topbar">
            <button className="hd-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color="#0E898F" /> : <Menu size={18} color="#64748b" />}
            </button>
            <div className="hd-search-wrap">
              <input
                className="hd-search"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    router.push(`/hospitaladmin/dashboard?tab=patients&q=${encodeURIComponent(search.trim())}`);
                  }
                }}
              />
            </div>
            <div className="hd-topbar-right">
              <NotificationBell uiPrefix="hospitaladmin" accentColor="#0E898F" bgColor="#f8fafc" borderColor="#e2e8f0" />
              <div
                className="hd-profile"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ position: "relative" }}
              >
                <div className="hd-profile-av">{user?.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : (user?.name ? initials(user.name) : "HA")}</div>
                <div>
                  <div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div>
                  <div className="hd-profile-role">Hosp. Admin</div>
                </div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />

                {profileDropdownOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 60 }}
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
                      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)", zIndex: 70, overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button
                          onClick={() => { setProfileDropdownOpen(false); router.push("/hospitaladmin/profile"); }}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#475569", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <User size={16} color="#64748b" />
                          Account Settings
                        </button>
                        <button
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", marginTop: 4 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <LogOut size={16} color="#ef4444" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="hd-main-body">
            {children}
          </div>
        </main>
      </div>
      <AppointmentAlertModal />
      <SupportModal uiPrefix="hospitaladmin" open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
