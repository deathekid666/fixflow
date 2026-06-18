"use client";

import Link from "next/link";
import { Wrench, ArrowRight, Check, Zap, Users, BarChart3, Package, Calendar, Star } from "lucide-react";

const BG = "#0a0f1e";

export default function LandingPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", color: "white", fontFamily: "inherit" }}>

      {/* NAVBAR */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 56,
        background: "rgba(10,15,30,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "#2563eb",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wrench size={15} color="white" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>FixFlow</span>
          </div>

          <nav style={{ display: "flex", gap: 28 }}>
            {[["#features", "Features"], ["#pricing", "Pricing"], ["#faq", "FAQ"], ["/track", "Track Repair"]].map(([href, label]) => (
              <Link key={href} href={href} style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
              Sign in
            </Link>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#2563eb", color: "white", fontSize: 14, fontWeight: 600,
              padding: "9px 20px", borderRadius: 8, textDecoration: "none",
            }}>
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ paddingTop: 140, paddingBottom: 80, textAlign: "center", paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: "#60a5fa",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20,
          }}>
            REPAIR SHOP PLATFORM
          </p>
          <h1 style={{
            fontSize: "clamp(40px,6vw,68px)", fontWeight: 800, color: "white",
            lineHeight: 1.08, letterSpacing: -2, margin: "0 0 20px",
          }}>
            Your repair shop, finally organized.
          </h1>
          <p style={{
            fontSize: 18, color: "rgba(255,255,255,0.45)", lineHeight: 1.6,
            maxWidth: 520, margin: "0 auto 36px",
          }}>
            Work orders, customer tracking, inventory, payments, and AI diagnostics — one dashboard that replaces WhatsApp and spreadsheets.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#2563eb", color: "white", fontWeight: 600, fontSize: 15,
              padding: "12px 28px", borderRadius: 10, textDecoration: "none",
            }}>
              Start free trial <ArrowRight size={15} />
            </Link>
            <Link href="#features" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
              fontSize: 15, padding: "12px 24px", borderRadius: 10,
              textDecoration: "none", background: "transparent",
            }}>
              See features
            </Link>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            {["No credit card", "Cancel anytime", "Free for 14 days"].map((text) => (
              <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Check size={13} color="#22c55e" /> {text}
              </span>
            ))}
          </div>
        </div>

        {/* DASHBOARD MOCKUP */}
        <div style={{
          marginTop: 56, marginLeft: "auto", marginRight: "auto", maxWidth: 900,
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>
          {/* Browser bar */}
          <div style={{
            height: 38, background: "#111827",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", padding: "0 14px", gap: 6,
          }}>
            {[["#ff5f57"], ["#febc2e"], ["#28c840"]].map(([bg], i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: bg }} />
            ))}
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              app.fixflow.io/dashboard
            </div>
          </div>

          {/* Dashboard body */}
          <div style={{ display: "flex", background: "#0d1117", height: 380 }}>
            {/* Sidebar */}
            <div style={{ width: 180, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "18px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", marginBottom: 20 }}>
                <Wrench size={14} color="#60a5fa" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>FixFlow</span>
              </div>
              {[
                ["Work Orders", true],
                ["Customers", false],
                ["Parts", false],
                ["Analytics", false],
                ["Settings", false],
              ].map(([label, active]) => (
                <div key={label as string} style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 10px", borderRadius: 7, fontSize: 12, marginBottom: 2,
                  background: active ? "rgba(37,99,235,0.15)" : "transparent",
                  color: active ? "#60a5fa" : "rgba(255,255,255,0.3)",
                }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: 20, overflow: "hidden" }}>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  ["Active Orders", "24", "#60a5fa"],
                  ["Revenue", "$8,420", "#34d399"],
                  ["Avg Time", "2.4h", "#a78bfa"],
                  ["Rating", "4.9★", "#fbbf24"],
                ].map(([label, value, color]) => (
                  <div key={label as string} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: color as string }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 8, overflow: "hidden",
              }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "90px 1fr 130px 90px",
                  padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontSize: 10, color: "rgba(255,255,255,0.2)",
                }}>
                  {["ORDER", "CUSTOMER", "DEVICE", "STATUS"].map((h) => <div key={h}>{h}</div>)}
                </div>
                {[
                  ["WO-0091", "Ahmed K.", "iPhone 14 Pro", "REPAIRING", "rgba(249,115,22,0.15)", "#f97316"],
                  ["WO-0090", "Sara M.", "Samsung S23", "DONE", "rgba(34,197,94,0.15)", "#22c55e"],
                  ["WO-0089", "Karim B.", "Pixel 7", "DIAGNOSING", "rgba(234,179,8,0.15)", "#eab308"],
                  ["WO-0088", "Nadia R.", "iPhone 13", "DELIVERED", "rgba(100,116,139,0.15)", "#94a3b8"],
                ].map(([id, name, device, status, bg, color]) => (
                  <div key={id as string} style={{
                    display: "grid", gridTemplateColumns: "90px 1fr 130px 90px",
                    padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                    fontSize: 12, alignItems: "center",
                  }}>
                    <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{id}</div>
                    <div style={{ fontWeight: 500, color: "white" }}>{name}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }}>{device}</div>
                    <div>
                      <span style={{
                        background: bg as string, color: color as string,
                        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100,
                      }}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF BAR */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "18px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Used by repair shops across Europe, Middle East, and Americas
        </p>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: "88px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa", letterSpacing: "0.1em", margin: "0 0 12px" }}>
            FEATURES
          </p>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: "white", letterSpacing: -1, margin: "0 0 14px" }}>
            Everything your shop needs
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 420, margin: "0 auto" }}>
            Replace the chaos of WhatsApp groups and spreadsheets with one tool.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {/* Card 1 — span 2 */}
          <div style={{
            gridColumn: "span 2",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: 28,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Wrench size={18} color="#60a5fa" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: -0.5, margin: "0 0 8px" }}>Work Orders</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
              Full lifecycle tracking from intake to delivery. Photos, checklists, parts, payments, and customer chat — all in one place.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.08))",
            border: "1px solid rgba(124,58,237,0.15)", borderRadius: 14, padding: 28,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Zap size={18} color="#a78bfa" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: -0.5, margin: "0 0 8px" }}>AI Assistant</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 14px" }}>
              Describe the fault, get repair steps, parts list, and price suggestion instantly.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(124,58,237,0.15)", padding: "3px 10px", borderRadius: 100 }}>
              Only on FixFlow
            </span>
          </div>

          {/* Card 3 */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: 28,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <BarChart3 size={18} color="#34d399" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: -0.5, margin: "0 0 8px" }}>Analytics</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
              Revenue charts, engineer performance, and industry benchmarks.
            </p>
          </div>

          {/* Card 4 — span 2 */}
          <div style={{
            gridColumn: "span 2",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: 28,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Users size={18} color="#34d399" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: -0.5, margin: "0 0 8px" }}>Customer Portal</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
              Customers track repairs in real time, chat with your shop, and rate the service. No app needed.
            </p>
          </div>

          {/* Card 5 */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: 28,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Calendar size={18} color="#fbbf24" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: -0.5, margin: "0 0 8px" }}>Appointments</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
              Smart booking slots based on your capacity. Customers book online, you confirm.
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "72px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }}>
          {[
            ["122+", "Features"],
            ["30+", "Countries"],
            ["$0", "Setup cost"],
            ["14", "Day free trial"],
          ].map(([value, label]) => (
            <div key={label}>
              <div style={{ fontSize: "clamp(36px,5vw,52px)", fontWeight: 800, color: "white", letterSpacing: -2 }}>{value}</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "6px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding: "88px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: "white", letterSpacing: -1, margin: "0 0 10px" }}>
            Simple pricing
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Start free. No credit card required.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[
            {
              name: "Starter", price: "$29", desc: "For solo technicians", popular: false,
              features: ["50 work orders/month", "Up to 3 engineers", "Customer portal", "Basic analytics", "Email support"],
            },
            {
              name: "Pro", price: "$59", desc: "For growing shops", popular: true,
              features: ["Unlimited work orders", "Unlimited engineers", "AI Repair Assistant", "Advanced analytics", "Commission tracking", "Priority support"],
            },
            {
              name: "Business", price: "$99", desc: "For multiple locations", popular: false,
              features: ["Everything in Pro", "Multiple branches", "Custom permissions", "White label", "API access", "Dedicated support"],
            },
          ].map(({ name, price, desc, popular, features }) => (
            <div key={name} style={{
              background: popular ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0.02)",
              border: popular ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: 26, position: "relative",
              boxShadow: popular ? "0 0 40px rgba(37,99,235,0.08)" : "none",
            }}>
              {popular && (
                <div style={{
                  position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                  background: "#2563eb", color: "white", fontSize: 10, fontWeight: 700,
                  padding: "4px 14px", borderRadius: "0 0 8px 8px", letterSpacing: "0.05em",
                }}>
                  MOST POPULAR
                </div>
              )}
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>{name}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: "white", letterSpacing: -2 }}>{price}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/mo</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "6px 0 20px" }}>{desc}</p>
              <Link href="/register" style={{
                display: "block", textAlign: "center", textDecoration: "none",
                fontWeight: 600, fontSize: 14, padding: "11px 0", borderRadius: 8, marginBottom: 20,
                background: popular ? "#2563eb" : "rgba(255,255,255,0.06)",
                color: "white",
                border: popular ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>
                Get started
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                    <Check size={13} color={popular ? "#60a5fa" : "#34d399"} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding: "88px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: "white", letterSpacing: -1, margin: "0 0 12px" }}>
          Ready to run a better shop?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: "0 0 32px" }}>
          14-day free trial. No credit card. Cancel anytime.
        </p>
        <Link href="/register" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#2563eb", color: "white", fontWeight: 600, fontSize: 15,
          padding: "13px 32px", borderRadius: 10, textDecoration: "none",
          boxShadow: "0 0 40px rgba(37,99,235,0.25)",
        }}>
          Get started free <ArrowRight size={15} />
        </Link>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={11} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>FixFlow</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
          © 2026 FixFlow. Built for repair shops worldwide.
        </p>
      </div>

    </div>
  );
}
