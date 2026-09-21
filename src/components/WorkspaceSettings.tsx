"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { DEFAULT_WORKSPACE, OPTIONAL_TOOLS, WORKSPACE_LABELS, type WorkspaceVisibility } from "@/lib/workspace";

const TOOLS = [
  { href: "/dashboard/messages", label: "messages" },
  { href: "/dashboard/suppliers", label: "suppliers" },
  { href: "/dashboard/warranties", label: "warranties" },
  { href: "/dashboard/ratings", label: "satisfaction" },
  { href: "/dashboard/csv", label: "csvImport" },
  { href: "/dashboard/analytics", label: "analytics", adminOnly: true },
  { href: "/dashboard/engineers", label: "engineers", adminOnly: true },
  { href: "/dashboard/templates", label: "templates", adminOnly: true },
  { href: "/dashboard/expenses", label: "expenses", adminOnly: true },
  { href: "/dashboard/pricing", label: "pricing", adminOnly: true },
] as const;

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const { visible, save } = useWorkspace();
  const [error, setError] = useState("");
  const copy = WORKSPACE_LABELS[lang];
  function update(next: WorkspaceVisibility) {
    setError(save(next) ? "" : "Could not save preferences. Allow site storage in your browser and try again.");
  }
  return <div className="space-y-6" id="workspace-settings">
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h2 className="font-semibold text-slate-900 dark:text-white">{copy.tools}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {TOOLS.filter(tool => !("adminOnly" in tool) || user?.role === "ADMIN").map(tool => <Link key={tool.href} href={tool.href} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 transition-colors">{t(tool.label)} →</Link>)}
      </div>
    </section>
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h2 className="font-semibold text-slate-900 dark:text-white">{copy.optional}</h2>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{copy.description}</p>
      <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {OPTIONAL_TOOLS.filter(tool => !("adminOnly" in tool) || user?.role === "ADMIN").map(tool => <label key={tool.key} className="flex items-start justify-between gap-4 py-4 cursor-pointer">
          <span><span className="block text-sm font-medium text-slate-900 dark:text-white">{tool.label}</span><span className="block text-xs text-slate-500 mt-1">{tool.description}</span></span>
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-blue-600" checked={visible[tool.key]} onChange={event => update({ ...visible, [tool.key]: event.target.checked })} />
        </label>)}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        <button onClick={() => update(Object.fromEntries(OPTIONAL_TOOLS.map(tool => [tool.key, true])) as WorkspaceVisibility)} className="text-sm rounded-lg bg-blue-600 text-white px-4 py-2">{copy.restore}</button>
        <button onClick={() => update({ ...DEFAULT_WORKSPACE })} className="text-sm rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2">{copy.reset}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-500 mt-3">{error}</p>}
    </section>
  </div>;
}
