"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, loading]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r p-4 space-y-2">
        <h2 className="font-bold">Admin Panel</h2>

        <a href="/admin">Tickets</a>
        <br />
        <a href="/dashboard">Dashboard</a>
      </aside>

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}