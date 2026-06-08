"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ShopInfo = {
  name: string;
  phone: string;
  address: string;
  city: string;
};

type RepairType = {
  id: string;
  label: string;
  icon: string;
  templates: { name: string; faultDescription: string; repairType: string; defaultPrice: number }[];
};

const REPAIR_TYPES: RepairType[] = [
  {
    id: "phones", label: "Smartphones", icon: "📱",
    templates: [
      { name: "Screen Replacement", faultDescription: "Screen cracked or broken, needs replacement", repairType: "Screen Replacement", defaultPrice: 350 },
      { name: "Battery Replacement", faultDescription: "Battery draining fast or not charging", repairType: "Battery Replacement", defaultPrice: 150 },
      { name: "Charging Port Repair", faultDescription: "Device not charging, port damaged", repairType: "Port Repair", defaultPrice: 120 },
    ]
  },
  {
    id: "laptops", label: "Laptops", icon: "💻",
    templates: [
      { name: "Screen Replacement", faultDescription: "Laptop screen cracked or not displaying", repairType: "Screen Replacement", defaultPrice: 800 },
      { name: "Keyboard Replacement", faultDescription: "Keys not working or keyboard damaged", repairType: "Keyboard Replacement", defaultPrice: 300 },
      { name: "Battery Replacement", faultDescription: "Laptop battery not holding charge", repairType: "Battery Replacement", defaultPrice: 400 },
    ]
  },
  {
    id: "tablets", label: "Tablets", icon: "📱",
    templates: [
      { name: "Screen Replacement", faultDescription: "Tablet screen cracked or broken", repairType: "Screen Replacement", defaultPrice: 450 },
      { name: "Battery Replacement", faultDescription: "Tablet battery not charging properly", repairType: "Battery Replacement", defaultPrice: 200 },
    ]
  },
  {
    id: "consoles", label: "Game Consoles", icon: "🎮",
    templates: [
      { name: "HDMI Port Repair", faultDescription: "Console not displaying on TV", repairType: "Port Repair", defaultPrice: 250 },
      { name: "Controller Repair", faultDescription: "Controller buttons not responding", repairType: "Controller Repair", defaultPrice: 150 },
    ]
  },
  {
    id: "watches", label: "Smartwatches", icon: "⌚",
    templates: [
      { name: "Screen Replacement", faultDescription: "Smartwatch screen cracked", repairType: "Screen Replacement", defaultPrice: 200 },
      { name: "Battery Replacement", faultDescription: "Watch battery not lasting", repairType: "Battery Replacement", defaultPrice: 100 },
    ]
  },
  {
    id: "other", label: "Other Electronics", icon: "🔌",
    templates: [
      { name: "General Repair", faultDescription: "Device not working properly", repairType: "General Repair", defaultPrice: 200 },
    ]
  },
];

const STEPS = ["Welcome", "Shop Setup", "Repair Types", "Invite Engineer", "Done"];

export default function OnboardingWizard({ shopId, shopName }: { shopId: string; shopName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  // Step 2 — Shop setup
  const [shopInfo, setShopInfo] = useState<ShopInfo>({ name: shopName || "", phone: "", address: "", city: "" });
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [savingShop, setSavingShop] = useState(false);

  // Step 3 — Repair types
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Step 4 — Engineer
  const [engineerName, setEngineerName] = useState("");
  const [engineerEmail, setEngineerEmail] = useState("");
  const [engineerPassword, setEngineerPassword] = useState("");
  const [addingEngineer, setAddingEngineer] = useState(false);
  const [engineerAdded, setEngineerAdded] = useState(false);
  const [skipEngineer, setSkipEngineer] = useState(false);

  async function extractWithAI() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `Extract shop information from this text and return ONLY a JSON object with these fields: name, phone, address, city. If a field is not mentioned, use empty string. Text: "${aiInput}"`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setShopInfo({
        name: parsed.name || shopInfo.name,
        phone: parsed.phone || shopInfo.phone,
        address: parsed.address || shopInfo.address,
        city: parsed.city || shopInfo.city,
      });
    } catch { /* ignore */ }
    setAiLoading(false);
  }

  async function saveShop() {
    setSavingShop(true);
    await fetch(`/api/shops/${shopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: shopInfo.name,
        phone: shopInfo.phone,
        address: `${shopInfo.address}${shopInfo.city ? ", " + shopInfo.city : ""}`,
      }),
    });
    setSavingShop(false);
    setStep(2);
  }

  async function saveTemplates() {
    const templates = REPAIR_TYPES
      .filter(t => selectedTypes.includes(t.id))
      .flatMap(t => t.templates.map(tmpl => ({ ...tmpl, category: t.label, shopId })));

    await Promise.all(templates.map(t =>
      fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(t),
      })
    ));
    setStep(3);
  }

  async function addEngineer() {
    if (!engineerName || !engineerEmail || !engineerPassword) return;
    setAddingEngineer(true);
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: engineerName, email: engineerEmail, password: engineerPassword, role: "ENGINEER" }),
    });
    setEngineerAdded(true);
    setAddingEngineer(false);
  }

  async function finish() {
    setCompleting(true);
    try {
      await fetch(`/api/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboardingComplete: true }),
      });
    } catch { /* ignore */ }
    window.location.href = "/dashboard";
  }

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "text-blue-400" : ""}>{s}</span>
            ))}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="p-8 text-center space-y-6">
              <div className="text-6xl animate-bounce">🔧</div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to FixFlow!</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Let's set up your repair shop in just a few steps. It takes less than 2 minutes.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: "📋", label: "Manage work orders" },
                  { icon: "👤", label: "Track customers" },
                  { icon: "💰", label: "Collect payments" },
                ].map(f => (
                  <div key={f.label} className="bg-slate-800 rounded-xl p-3">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <p className="text-xs text-slate-400">{f.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
                Let's get started →
              </button>
            </div>
          )}

          {/* Step 1 — Shop Setup */}
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Tell us about your shop</h2>
                <p className="text-slate-400 text-sm">Describe your shop and our AI will fill in the details automatically.</p>
              </div>

              {/* AI input */}
              <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-lg">✨</span>
                  <p className="text-sm font-medium text-blue-300">AI Auto-fill</p>
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe your shop in any language... e.g. 'Mon magasin s'appelle TechFix, je suis à Casablanca, Tel: 0612345678' or 'My shop is called PhonePro in Rabat'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                />
                <button onClick={extractWithAI} disabled={aiLoading || !aiInput.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {aiLoading ? "✨ Extracting..." : "✨ Auto-fill with AI"}
                </button>
              </div>

              <div className="text-xs text-slate-500 text-center">— or fill manually —</div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shop Name *</label>
                  <input value={shopInfo.name} onChange={e => setShopInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. TechFix"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                    <input value={shopInfo.phone} onChange={e => setShopInfo(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+212..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">City</label>
                    <input value={shopInfo.city} onChange={e => setShopInfo(p => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Casablanca"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Address</label>
                  <input value={shopInfo.address} onChange={e => setShopInfo(p => ({ ...p, address: e.target.value }))}
                    placeholder="Street address"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <button onClick={saveShop} disabled={savingShop || !shopInfo.name}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                {savingShop ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          )}

          {/* Step 2 — Repair Types */}
          {step === 2 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">What do you repair?</h2>
                <p className="text-slate-400 text-sm">Select all that apply — we'll create templates for you automatically.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {REPAIR_TYPES.map(t => (
                  <button key={t.id}
                    onClick={() => setSelectedTypes(prev =>
                      prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                    )}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedTypes.includes(t.id)
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                    }`}>
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-slate-500">{t.templates.length} templates</p>
                    </div>
                    {selectedTypes.includes(t.id) && <span className="ml-auto text-blue-400">✓</span>}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="px-4 py-2.5 border border-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-800 transition-colors">
                  Skip
                </button>
                <button onClick={saveTemplates} disabled={selectedTypes.length === 0}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                  Create {selectedTypes.reduce((s, id) => s + (REPAIR_TYPES.find(t => t.id === id)?.templates.length ?? 0), 0)} Templates →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Invite Engineer */}
          {step === 3 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Invite your first engineer</h2>
                <p className="text-slate-400 text-sm">Add a team member to start assigning work orders.</p>
              </div>

              {!engineerAdded && !skipEngineer ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Name</label>
                    <input value={engineerName} onChange={e => setEngineerName(e.target.value)}
                      placeholder="Engineer name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Email</label>
                    <input type="email" value={engineerEmail} onChange={e => setEngineerEmail(e.target.value)}
                      placeholder="engineer@email.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Temporary Password</label>
                    <input type="password" value={engineerPassword} onChange={e => setEngineerPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSkipEngineer(true)}
                      className="px-4 py-2.5 border border-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-800 transition-colors">
                      Skip
                    </button>
                    <button onClick={addEngineer} disabled={addingEngineer || !engineerName || !engineerEmail || !engineerPassword}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                      {addingEngineer ? "Adding..." : "Add Engineer →"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  {engineerAdded ? (
                    <>
                      <div className="text-4xl">✅</div>
                      <p className="text-green-400 font-medium">{engineerName} added successfully!</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl">⏭️</div>
                      <p className="text-slate-400 text-sm">You can add engineers later from the Engineers page.</p>
                    </>
                  )}
                  <button onClick={() => setStep(4)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="p-8 text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
                <p className="text-slate-400 text-sm">Your shop is ready. Here's a quick overview of what you can do:</p>
              </div>
              <div className="space-y-3 text-left">
                {[
                  { icon: "📋", title: "Create Work Orders", desc: "Track every repair from intake to delivery" },
                  { icon: "📷", title: "Document Device Condition", desc: "Take photos at intake to avoid disputes" },
                  { icon: "💰", title: "Collect Payments", desc: "Track cash, card and bank transfers" },
                  { icon: "📊", title: "View Analytics", desc: "Monitor revenue and engineer performance" },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3 bg-slate-800 rounded-xl p-3">
                    <span className="text-xl mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{f.title}</p>
                      <p className="text-xs text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={finish} disabled={completing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-lg">
                {completing ? "Loading..." : "Go to Dashboard 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}