import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "FixFlow – My Repairs",
  description: "Track all your device repairs from any FixFlow shop. No login needed.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Repairs",
  },
  openGraph: {
    title: "FixFlow – My Repairs",
    description: "Track all your device repairs from any FixFlow shop.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function CustomerAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
