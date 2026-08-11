import "./hospitaladmin-shell.css";
import HospitalAdminShell from "./HospitalAdminShell";

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return <HospitalAdminShell>{children}</HospitalAdminShell>;
}
