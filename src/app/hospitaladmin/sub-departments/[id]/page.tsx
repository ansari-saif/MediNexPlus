"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { subDeptLabel } from "@/lib/subdept-catalog";

const PharmacyDashboard = dynamic(() => import("@/components/PharmacyDashboard"), { ssr: false });
const PathologyDashboard = dynamic(() => import("@/components/PathologyDashboard"), { ssr: false });
const LabDashboard = dynamic(() => import("@/components/LabDashboard"), { ssr: false });
const HousekeepingDashboard = dynamic(() => import("@/components/HousekeepingDashboard"), { ssr: false });
const AmbulanceDashboard = dynamic(() => import("@/components/AmbulanceDashboard"), { ssr: false });
const OPDDashboard = dynamic(() => import("@/components/OPDDashboard"), { ssr: false });
const AdminSubDeptDashboard = dynamic(() => import("@/components/AdminSubDeptDashboard"), { ssr: false });

function TabFallback({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 8, color: "#94a3b8", fontSize: 13 }}>
      <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} />
      Loading {label}…
    </div>
  );
}

export default function HospitalAdminSubDeptPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [meRes, sdRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }).then(r => r.json()),
          fetch(`/api/config/subdepartments/${id}`, { credentials: "include" }).then(r => r.json()),
        ]);
        if (cancelled) return;
        if (!meRes.success || meRes.data?.role !== "HOSPITAL_ADMIN") {
          router.push("/login");
          return;
        }
        if (!sdRes.success || !sdRes.data) {
          setError(sdRes.message || "Sub-department not found");
          setLoading(false);
          return;
        }
        setUser(meRes.data);
        setProfile(sdRes.data);
      } catch {
        if (!cancelled) setError("Failed to load sub-department");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div data-ui="hospitaladmin.subdept" className="hd-subdept-page">
        <TabFallback label="sub-department" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div data-ui="hospitaladmin.subdept" className="hd-subdept-page" style={{ textAlign: "center", paddingTop: 48 }}>
        <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 12 }}>{error || "Not found"}</div>
        <button
          type="button"
          onClick={() => router.push("/hospitaladmin/dashboard")}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#0A6B70" }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const type = profile.type as string;
  const label = subDeptLabel(profile);

  return (
    <div data-ui="hospitaladmin.subdept" className="hd-subdept-page">
      {type === "PHARMACY" ? (
        <PharmacyDashboard profile={profile} user={user} uiPrefix="hospitaladmin.pharmacy" />
      ) : type === "PATHOLOGY" || type === "LABORATORY" ? (
        <PathologyDashboard
          profile={profile}
          user={user}
          subDepartmentId={id}
          uiPrefix="hospitaladmin.pathology"
        />
      ) : type === "BLOOD_BANK" || type === "RADIOLOGY" || type === "ECG" || type === "ENDOSCOPY" ? (
        <LabDashboard profile={profile} user={user} uiPrefix="hospitaladmin.lab" />
      ) : type === "HOUSEKEEPING" ? (
        <HousekeepingDashboard profile={profile} user={user} />
      ) : type === "AMBULANCE" ? (
        <AmbulanceDashboard profile={profile} user={user} />
      ) : type === "OPD" || type === "GENERAL_MEDICINE" ? (
        <OPDDashboard profile={profile} user={user} />
      ) : (
        <AdminSubDeptDashboard
          subDeptId={id}
          onBack={() => router.push("/hospitaladmin/dashboard")}
          backLabel={`Back from ${label}`}
        />
      )}
    </div>
  );
}
