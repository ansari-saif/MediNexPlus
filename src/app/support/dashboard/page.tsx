"use client";

import DeptDashboardPage from "@/components/DeptDashboardPage";
import { Users } from "lucide-react";

const cfg = {
  accent:       "#059669",
  accent2:      "#047857",
  accentLight:  "#ecfdf5",
  accentBorder: "#a7f3d0",
  label:        "Support",
  basePath:     "/support/dashboard",
  icon:         <Users size={26} color="#fff" />,
  uiPrefix:     "support",
};

export default function SupportDashboardPage() {
  return (
    <div data-ui="support.dashboard">
      <DeptDashboardPage cfg={cfg} />
    </div>
  );
}
