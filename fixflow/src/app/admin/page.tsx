"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
};

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then(setTickets);
  }, []);

  async function updateStatus(ticketId: string, status: string) {
    await fetch("/api/tickets/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status } : t
      )
    );
  }

  async function assignTicket(ticketId: string) {
    const assignedTo = prompt("Enter userId:");

    if (!assignedTo) return;

    await fetch("/api/tickets/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, assignedTo }),
    });

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, assignedTo } : t
      )
    );
  }

  const filtered =
    filter === "ALL"
      ? tickets
      : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Admin Tickets
      </h1>

      <div className="flex gap-2">
        <button onClick={() => setFilter("ALL")}>All</button>
        <button onClick={() => setFilter("OPEN")}>Open</button>
        <button onClick={() => setFilter("IN_PROGRESS")}>
          In Progress
        </button>
        <button onClick={() => setFilter("DONE")}>Done</button>
      </div>

      {filtered.map((t) => (
        <div key={t.id} className="border p-4 rounded">
          <p className="font-bold">{t.title}</p>
          <p className="text-sm">{t.description}</p>

          <p className="text-xs text-gray-500">
            {t.status} | {t.priority}
          </p>

          <p className="text-xs">
            Assigned: {t.assignedTo || "None"}
          </p>

          <div className="flex gap-2 mt-2">
            <button onClick={() => updateStatus(t.id, "IN_PROGRESS")}>
              Start
            </button>

            <button onClick={() => updateStatus(t.id, "DONE")}>
              Done
            </button>

            <button onClick={() => updateStatus(t.id, "OPEN")}>
              Reset
            </button>

            <button onClick={() => assignTicket(t.id)}>
              Assign
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}