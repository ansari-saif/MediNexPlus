"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Preloader = dynamic(() => import("@/components/Preloader"), { ssr: false });
const WhatsAppWidget = dynamic(() => import("@/components/whatsapp-widget"), { ssr: false });
const AIChatbot = dynamic(() => import("@/components/ai-chatbot"), { ssr: false });
const MobileAppointment = dynamic(() => import("@/components/mobile-appointment"), { ssr: false });

const APP_ROUTE =
  /^\/(administrative|clinical|diagnostic|doctor|finance|hospitaladmin|nursingadmin|parentdept|receptionist|staff|subdept|superadmin|support)(\/|$)/;

/** Marketing-only chrome. App shells skip this so dashboards are not blocked by the splash/chat widgets. */
export default function MarketingChrome() {
  const pathname = usePathname();
  if (APP_ROUTE.test(pathname || "")) return null;

  return (
    <>
      <Preloader />
      <WhatsAppWidget />
      <AIChatbot />
      <MobileAppointment />
    </>
  );
}
