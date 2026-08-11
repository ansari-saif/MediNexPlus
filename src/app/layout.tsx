import type { Metadata, Viewport } from "next";
import { AppointmentProvider } from "@/components/AppointmentProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Curify",
  description:
    "Curify hospital management — appointments, staff, billing, and analytics.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo/favicon-icon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppointmentProvider>{children}</AppointmentProvider>
      </body>
    </html>
  );
}
