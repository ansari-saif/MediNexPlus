"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const APP_ROUTE =
  /^\/(administrative|clinical|diagnostic|doctor|finance|hospitaladmin|nursingadmin|parentdept|receptionist|staff|subdept|superadmin|support)(\/|$)/;

/** Site footer on public pages only — dashboards keep their own chrome. */
export default function PublicFooter() {
  const pathname = usePathname();
  if (APP_ROUTE.test(pathname || "")) return null;
  return <Footer />;
}
