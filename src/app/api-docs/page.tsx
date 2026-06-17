"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type CodeBlockProps = { code: string; language?: string };
type EndpointBadge = { method: "POST" | "GET"; path: string };

// ─── Components ──────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST: "bg-green-500/20 text-green-400 border-green-500/30",
    GET:  "bg-blue-500/20  text-blue-400  border-blue-500/30",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${colors[method] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
      {method}
    </span>
  );
}

function EndpointHeader({ method, path }: EndpointBadge) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <MethodBadge method={method} />
      <code className="text-slate-200 font-mono text-sm">{path}</code>
    </div>
  );
}

function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group rounded-xl bg-[#0d1117] border border-slate-700/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60 bg-slate-800/40">
        <span className="text-xs text-slate-500 font-medium">{language}</span>
        <button onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-slate-300 font-mono whitespace-pre">{code.trim()}</code>
      </pre>
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-white border-b border-slate-700/60 pb-3">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-200 mt-6">{children}</h3>;
}

function ParamRow({ name, type, required, description }: { name: string; type: string; required?: boolean; description: string }) {
  return (
    <tr className="border-t border-slate-800">
      <td className="py-2.5 pr-4 align-top">
        <code className="text-blue-400 font-mono text-sm">{name}</code>
        {required && <span className="ml-1.5 text-xs text-red-400 font-semibold">required</span>}
      </td>
      <td className="py-2.5 pr-4 align-top">
        <span className="text-xs text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">{type}</span>
      </td>
      <td className="py-2.5 text-sm text-slate-400 align-top">{description}</td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const BASE = "https://fixflow-ruddy.vercel.app";
  const navItems = [
    { id: "overview",        label: "Overview" },
    { id: "authentication",  label: "Authentication" },
    { id: "post-workorder",  label: "POST /workorders" },
    { id: "get-workorders",  label: "GET /workorders" },
    { id: "get-workorder",   label: "GET /workorders/:id" },
    { id: "status-codes",    label: "Status Codes" },
    { id: "field-reference", label: "Field Reference" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100">

      {/* Top nav */}
      <nav className="sticky top-0 z-30 border-b border-slate-800 bg-[#0a0c10]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-bold text-white text-sm">FixFlow API</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">v1</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://fixflow-ruddy.vercel.app/dashboard/settings" target="_blank"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Generate API Key
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex gap-8">

        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {navItems.map(item => (
              <a key={item.id} href={`#${item.id}`}
                className="block text-sm text-slate-400 hover:text-white py-1.5 px-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">

          {/* Hero */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">FixFlow External API</h1>
            <p className="text-slate-400 leading-relaxed max-w-2xl">
              The FixFlow External API lets you connect your own apps and tools — including the
              <strong className="text-slate-200"> FixFlow Diagnostics</strong> desktop app — to your repair shop.
              Create work orders, query repair status, and sync data programmatically using your shop&apos;s API key.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-mono">Base URL: {BASE}/api/external</span>
              <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg">REST · JSON</span>
            </div>
          </div>

          {/* Overview */}
          <Section id="overview">
            <SectionTitle>Overview</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: "JSON only", description: "All requests and responses use application/json" },
                { title: "API-key auth", description: "Authenticate with x-api-key header or query parameter" },
                { title: "Shop-scoped", description: "Each key is tied to a single shop — no cross-shop access" },
              ].map(card => (
                <div key={card.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <p className="text-sm font-semibold text-white mb-1">{card.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Authentication */}
          <Section id="authentication">
            <SectionTitle>Authentication</SectionTitle>
            <p className="text-sm text-slate-400 leading-relaxed">
              All API requests require a valid API key. Keys are created and managed in your{" "}
              <a href="https://fixflow-ruddy.vercel.app/dashboard/settings" target="_blank"
                className="text-blue-400 hover:underline">Settings → Integrations</a> tab.
              Pass your key in the <code className="text-amber-400 font-mono text-sm">x-api-key</code> header:
            </p>
            <CodeBlock language="bash" code={`curl -H "x-api-key: ff_live_xxxxxxxxxxxxxxxxxxxx" \\
     ${BASE}/api/external/workorders`} />
            <p className="text-xs text-slate-500">
              API keys start with <code className="text-amber-400 font-mono">ff_live_</code>.
              Never commit them to version control.
            </p>
          </Section>

          {/* POST /workorders */}
          <Section id="post-workorder">
            <SectionTitle>Create a Work Order</SectionTitle>
            <EndpointHeader method="POST" path="/api/external/workorders" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Creates a new work order in your FixFlow shop. Typically called from the FixFlow Diagnostics app
              when a device diagnostic is complete and ready for repair intake.
            </p>

            <SubTitle>Request body</SubTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Field</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Type</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                <ParamRow name="customerName"    type="string"  required    description="Customer full name" />
                <ParamRow name="customerPhone"   type="string"  required    description="Customer phone number (E.164 format recommended)" />
                <ParamRow name="deviceType"      type="string"  required    description='Device category e.g. "iPhone", "Samsung Galaxy", "MacBook"' />
                <ParamRow name="deviceModel"     type="string"             description="Specific model name e.g. iPhone 15 Pro" />
                <ParamRow name="serialNumber"    type="string"             description="Device serial number" />
                <ParamRow name="imei"            type="string"             description="IMEI number (15 digits)" />
                <ParamRow name="issue"           type="string"             description="Description of the fault or repair needed" />
                <ParamRow name="notes"           type="string"             description="Internal technician notes, diagnostic results, etc." />
                <ParamRow name="estimatedCost"   type="number"             description="Estimated repair cost in the shop's currency" />
                <ParamRow name="priority"        type="string"             description='"LOW" | "NORMAL" | "HIGH" | "URGENT" — defaults to "NORMAL"' />
                <ParamRow name="branchId"        type="string"             description="Target branch ID if multi-branch. Defaults to first branch." />
              </tbody>
            </table>

            <SubTitle>Example request</SubTitle>
            <CodeBlock language="bash" code={`curl -X POST ${BASE}/api/external/workorders \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ff_live_xxxxxxxxxxxxxxxxxxxx" \\
  -d '{
    "customerName": "Yassine Alami",
    "customerPhone": "+212600123456",
    "deviceType": "iPhone",
    "deviceModel": "iPhone 14 Pro",
    "imei": "353879234151890",
    "issue": "Screen cracked — no touch response",
    "notes": "Diagnostic: LCD flex connector damaged. Screen replacement required.",
    "estimatedCost": 850,
    "priority": "HIGH"
  }'`} />

            <SubTitle>Success response — 201 Created</SubTitle>
            <CodeBlock language="json" code={`{
  "id": "cm1234abcd5678efgh",
  "orderNumber": "WO-0042",
  "status": "RECEIVED",
  "customerName": "Yassine Alami",
  "customerPhone": "+212600123456",
  "deviceType": "iPhone",
  "deviceModel": "iPhone 14 Pro",
  "imei": "353879234151890",
  "issue": "Screen cracked — no touch response",
  "estimatedCost": 850,
  "priority": "HIGH",
  "trackingUrl": "https://fixflow-ruddy.vercel.app/track/cm1234abcd5678efgh",
  "createdAt": "2026-06-15T10:30:00.000Z"
}`} />

            <SubTitle>Error response — 400 Bad Request</SubTitle>
            <CodeBlock language="json" code={`{
  "error": "customerName and customerPhone are required"
}`} />
          </Section>

          {/* GET /workorders */}
          <Section id="get-workorders">
            <SectionTitle>List Work Orders</SectionTitle>
            <EndpointHeader method="GET" path="/api/external/workorders" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Returns a paginated list of work orders for your shop, newest first.
            </p>

            <SubTitle>Query parameters</SubTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Parameter</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Type</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                <ParamRow name="limit"  type="number"  description="Results per page (1–100, default: 20)" />
                <ParamRow name="offset" type="number"  description="Pagination offset (default: 0)" />
                <ParamRow name="status" type="string"  description="Filter by status: RECEIVED | IN_PROGRESS | DONE | DELIVERED | CANCELLED" />
              </tbody>
            </table>

            <SubTitle>Example request</SubTitle>
            <CodeBlock language="bash" code={`curl "${BASE}/api/external/workorders?limit=10&status=IN_PROGRESS" \\
  -H "x-api-key: ff_live_xxxxxxxxxxxxxxxxxxxx"`} />

            <SubTitle>Success response — 200 OK</SubTitle>
            <CodeBlock language="json" code={`{
  "data": [
    {
      "id": "cm1234abcd5678efgh",
      "orderNumber": "WO-0042",
      "status": "IN_PROGRESS",
      "customerName": "Yassine Alami",
      "customerPhone": "+212600123456",
      "deviceType": "iPhone",
      "deviceModel": "iPhone 14 Pro",
      "issue": "Screen cracked — no touch response",
      "estimatedCost": 850,
      "priority": "HIGH",
      "createdAt": "2026-06-15T10:30:00.000Z",
      "updatedAt": "2026-06-15T11:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}`} />
          </Section>

          {/* GET /workorders/:id */}
          <Section id="get-workorder">
            <SectionTitle>Get a Work Order</SectionTitle>
            <EndpointHeader method="GET" path="/api/external/workorders/:id" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Returns a single work order by its ID. Useful for polling repair status from an external system.
            </p>

            <SubTitle>Path parameters</SubTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Parameter</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-4">Type</th>
                  <th className="pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                <ParamRow name="id" type="string" required description="Work order ID returned from the POST endpoint" />
              </tbody>
            </table>

            <SubTitle>Example request</SubTitle>
            <CodeBlock language="bash" code={`curl "${BASE}/api/external/workorders/cm1234abcd5678efgh" \\
  -H "x-api-key: ff_live_xxxxxxxxxxxxxxxxxxxx"`} />

            <SubTitle>Success response — 200 OK</SubTitle>
            <CodeBlock language="json" code={`{
  "id": "cm1234abcd5678efgh",
  "orderNumber": "WO-0042",
  "status": "DONE",
  "customerName": "Yassine Alami",
  "customerPhone": "+212600123456",
  "deviceType": "iPhone",
  "deviceModel": "iPhone 14 Pro",
  "imei": "353879234151890",
  "issue": "Screen cracked — no touch response",
  "notes": "Screen replaced successfully. 90-day warranty.",
  "estimatedCost": 850,
  "finalCost": 850,
  "priority": "HIGH",
  "trackingUrl": "https://fixflow-ruddy.vercel.app/track/cm1234abcd5678efgh",
  "createdAt": "2026-06-15T10:30:00.000Z",
  "updatedAt": "2026-06-15T14:20:00.000Z"
}`} />

            <SubTitle>Error response — 404 Not Found</SubTitle>
            <CodeBlock language="json" code={`{
  "error": "Work order not found"
}`} />
          </Section>

          {/* Status codes */}
          <Section id="status-codes">
            <SectionTitle>HTTP Status Codes</SectionTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6">Code</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6">Name</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["200", "OK",                   "Request succeeded. Body contains the requested resource."],
                  ["201", "Created",               "Work order was created successfully."],
                  ["400", "Bad Request",           "Missing required fields or invalid values."],
                  ["401", "Unauthorized",          "Missing or invalid API key."],
                  ["403", "Forbidden",             "Valid key but insufficient permissions."],
                  ["404", "Not Found",             "Work order ID does not exist or belongs to a different shop."],
                  ["429", "Too Many Requests",     "Rate limit exceeded. Retry after the Retry-After header."],
                  ["500", "Internal Server Error", "Something went wrong on our side. Please retry."],
                ] as [string, string, string][]).map(([code, name, meaning]) => (
                  <tr key={code} className="border-t border-slate-800">
                    <td className="py-2.5 pr-6"><code className="text-amber-400 font-mono text-sm">{code}</code></td>
                    <td className="py-2.5 pr-6 text-slate-300 font-medium text-sm">{name}</td>
                    <td className="py-2.5 text-slate-400 text-sm">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Field reference */}
          <Section id="field-reference">
            <SectionTitle>Work Order Status Values</SectionTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6">Value</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["RECEIVED",    "Order submitted, awaiting technician assignment"],
                  ["IN_PROGRESS", "Technician is actively working on the repair"],
                  ["ON_HOLD",     "Waiting for parts or customer decision"],
                  ["DONE",        "Repair complete, ready for customer pickup"],
                  ["DELIVERED",   "Device returned to customer"],
                  ["CANCELLED",   "Order was cancelled"],
                ] as [string, string][]).map(([val, desc]) => (
                  <tr key={val} className="border-t border-slate-800">
                    <td className="py-2.5 pr-6"><code className="text-green-400 font-mono text-sm">{val}</code></td>
                    <td className="py-2.5 text-slate-400 text-sm">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <SubTitle>Priority Values</SubTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-6">Value</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["LOW",    "No rush — standard queue position"],
                  ["NORMAL", "Default priority"],
                  ["HIGH",   "Prioritize ahead of standard queue"],
                  ["URGENT", "Rush job — escalate immediately"],
                ] as [string, string][]).map(([val, desc]) => (
                  <tr key={val} className="border-t border-slate-800">
                    <td className="py-2.5 pr-6"><code className="text-amber-400 font-mono text-sm">{val}</code></td>
                    <td className="py-2.5 text-slate-400 text-sm">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Footer CTA */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
            <h3 className="text-base font-bold text-white">Ready to connect?</h3>
            <p className="text-sm text-slate-400">Create an API key in your settings and start sending work orders in minutes.</p>
            <a href="https://fixflow-ruddy.vercel.app/dashboard/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <ExternalLink className="w-4 h-4" /> Generate an API Key
            </a>
          </div>

        </main>
      </div>
    </div>
  );
}
