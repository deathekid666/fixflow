import "./globals.css";
import type { Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";

// interactiveWidget keeps content (e.g. chat input) visible above the on-screen
// keyboard on mobile instead of being overlaid by it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply theme + language direction before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');var l=localStorage.getItem('lang')||'en';document.documentElement.dir=l==='ar'?'rtl':'ltr';document.documentElement.lang=l;})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
