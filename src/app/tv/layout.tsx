import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TV Display — FixFlow",
};

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
