"use client";

import { useState } from "react";
import Link from "next/link";
import { LAUNCH_VISIBILITY, isLaunchPlanVisible } from "@/lib/workspace";
import {
  ArrowUpRight,
  ArrowRight,
  Wrench,
  Check,
  Plus,
  Menu,
  X,
  Search,
  CalendarDays,
  Package,
  Users,
  ChartNoAxesCombined,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Laptop,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Wrench,
    title: "Every repair, accounted for.",
    text: "From the first diagnosis to the final handover. Keep photos, parts, notes and payments attached to the work order.",
    tag: "WORK ORDERS",
  },
  {
    icon: MessageCircle,
    title: "Less chasing. More clarity.",
    text: "Give customers a repair tracking link and a direct line to your shop. Keep updates where everyone can find them.",
    tag: "CUSTOMER EXPERIENCE",
  },
  {
    icon: Package,
    title: "Know what’s on the shelf.",
    text: "Manage spare parts, suppliers and stock levels alongside the repairs that need them.",
    tag: "INVENTORY",
  },
  {
    icon: CalendarDays,
    title: "Make room for what’s next.",
    text: "Let customers book online, manage appointments and keep your team’s day organized.",
    tag: "APPOINTMENTS",
  },
];
const faqs = [
  [
    "What is FixFlow?",
    "FixFlow is a workspace for repair shops. It brings work orders, customer updates, spare parts, appointments and reporting into one application.",
  ],
  [
    "Can I start for free?",
    "Yes. New shops start with a 14-day trial, without a credit card. Paid checkout is not available yet; contact us about continuing after your trial.",
  ],
  [
    "Do my customers need to install an app?",
    "No. Customers can open their repair tracking link in a browser to see progress and message your shop.",
  ],
  [
    "How does the AI assistant work?",
    "The assistant helps draft repair guidance from the device and fault information you provide. AI availability depends on the configured provider and its credits. Always verify suggestions before working on a device.",
  ],
  [
    "Does it work on a phone?",
    "FixFlow runs in a web browser on desktop, tablet and mobile. Customers can also track repairs and book appointments from their phones.",
  ],
];
const navigation = [
  ["Product", "#product"],
  ["How it works", "#workflow"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

function Brand() {
  return (
    <Link
      href="/"
      aria-label="FixFlow home"
      className="inline-flex items-center gap-2.5 font-bold text-xl tracking-tight"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Wrench size={17} strokeWidth={2.5} />
      </span>
      FixFlow<span className="text-blue-500">.</span>
    </Link>
  );
}

function ProductPreview() {
  const [view, setView] = useState("Repairs");
  return (
    <div className="ff-preview">
      <div className="ff-window">
        <div className="flex gap-1.5" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>YOUR SHOP, IN SYNC</span>
        <span className="ff-demo-label">Interactive preview · sample data</span>
      </div>
      <div className="ff-app">
        <aside className="ff-app-sidebar">
          <div className="mb-8 flex items-center gap-2 text-sm font-semibold">
            <Wrench size={17} className="text-blue-400" /> FixFlow
          </div>
          <p className="mb-3 text-[9px] tracking-[.18em] text-slate-500">
            WORKSPACE
          </p>
          {[
            [Wrench, "Repairs"],
            [MessageCircle, "Updates"],
            [ChartNoAxesCombined, "Overview"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Wrench;
            return (
              <button
                key={String(label)}
                onClick={() => setView(String(label))}
                aria-pressed={view === label}
                className={`ff-app-nav ${view === label ? "selected" : ""}`}
              >
                <I size={14} />
                {String(label)}
              </button>
            );
          })}
          <div className="mt-auto border-t border-white/10 pt-4 text-xs text-slate-400">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-300">
              S
            </span>{" "}
            Your repair shop
          </div>
        </aside>
        <div className="ff-app-main">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] text-slate-500">
                WORKSPACE / {view.toUpperCase()}
              </p>
              <h3 className="text-xl font-semibold tracking-tight">
                {view === "Repairs"
                  ? "A good day to fix things."
                  : view === "Updates"
                    ? "Keep everyone in the loop."
                    : "Your shop at a glance."}
              </h3>
            </div>
            <span className="hidden rounded-lg border border-white/10 px-3 py-2 text-[10px] text-slate-400 sm:block">
              Today <ChevronDown className="ml-3 inline" size={10} />
            </span>
          </div>
          <div
            className="ff-preview-tabs"
            role="group"
            aria-label="Preview views"
          >
            {["Repairs", "Updates", "Overview"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={view === v ? "selected" : ""}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="ff-metrics">
            {[
              ["Active repairs", "24", "Across your team"],
              ["Ready for pickup", "08", "Ready for a new day"],
              ["Completed today", "12", "Progress you can see"],
            ].map(([label, value, sub]) => (
              <div key={label}>
                <span className="text-[10px] text-slate-400">{label}</span>
                <strong>
                  {value}
                  <span className="text-blue-400">
                    <ArrowUpRight size={17} />
                  </span>
                </strong>
                <span className="text-[9px] text-slate-500">{sub}</span>
              </div>
            ))}
          </div>
          {view === "Repairs" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold">
                  Repair queue <span className="ml-2 text-slate-500">24</span>
                </h4>
                <Search size={14} className="text-slate-500" />
              </div>
              <div className="ff-repair-list">
                {[
                  ["iPhone 14 Pro", "Screen replacement", "In repair", "AK"],
                  ["MacBook Air", "Battery replacement", "Diagnosing", "SM"],
                  ["Samsung S23", "Charging port", "Ready for pickup", "OB"],
                ].map(([device, fault, status, initials], i) => (
                  <div key={device} className="ff-repair-row">
                    <span className="ff-device">
                      {i === 1 ? (
                        <Laptop size={19} />
                      ) : (
                        <Smartphone size={19} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{device}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{fault}</p>
                    </div>
                    <span className={`ff-status ${i === 2 ? "ready" : ""}`}>
                      <span />
                      {status}
                    </span>
                    <span className="ff-avatar">{initials}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck size={13} /> Every detail stays with the repair.
              </div>
            </>
          ) : view === "Updates" ? (
            <div className="ff-message">
              <span className="ff-eyebrow">CUSTOMER PORTAL</span>
              <h4 className="mb-4 mt-3 font-semibold">
                Your device is ready for pickup.
              </h4>
              <p className="rounded-xl bg-blue-600/15 p-4 text-sm leading-relaxed text-blue-100">
                Hi Alex, your screen replacement is complete. Your device has
                passed its final checks and is ready to collect.
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Delivered to the repair tracking portal{" "}
                <Check size={13} className="inline text-blue-400" />
              </p>
            </div>
          ) : (
            <div
              className="ff-chart"
              aria-label="Illustrative weekly repair volume"
            >
              <div className="mb-5 flex justify-between text-xs">
                <span>Repairs completed this week</span>
                <span className="text-slate-500">Sample activity</span>
              </div>
              <div className="flex h-32 items-end gap-3">
                {[35, 58, 45, 78, 63, 92, 72].map((n, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col justify-end gap-2 text-center"
                  >
                    <div
                      style={{ height: `${n}%` }}
                      className="rounded-t bg-blue-500/60"
                    />
                    <span className="text-[9px] text-slate-500">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  return (
    <main className="ff-landing">
      <style
        dangerouslySetInnerHTML={{
          __html: `
      .ff-landing{background:#050914;color:#f8fafc;font-family:inherit;overflow-x:clip;--muted:#94a3b8} .ff-landing *{box-sizing:border-box} .ff-landing a{display:inline-flex;align-items:center;text-decoration:none} .ff-landing button,.ff-landing a{transition:background .18s,color .18s,transform .18s} .ff-landing a:focus-visible,.ff-landing button:focus-visible,.ff-landing summary:focus-visible,.ff-landing input:focus-visible{outline:2px solid #60a5fa;outline-offset:5px} .ff-landing section[id]{scroll-margin-top:95px} .ff-wrap{max-width:1160px;margin:auto;padding:0 28px} .ff-nav{height:76px;display:flex;align-items:center;justify-content:space-between;gap:24px} .ff-nav-links{display:flex;gap:28px;font-size:12px;color:#94a3b8} .ff-nav-links a:hover{color:white}.ff-button{justify-content:center;gap:9px;border-radius:9px;padding:13px 20px;font-size:13px;font-weight:600;background:#2563eb;color:white;min-height:46px}.ff-button:hover{background:#3b82f6;transform:translateY(-2px)}.ff-button.secondary{background:#ffffff05;border:1px solid #ffffff20;color:#cbd5e1}.ff-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:600;color:#60a5fa}.ff-hero{padding:75px 0 0;position:relative;background:radial-gradient(ellipse at 70% 43%,#2563eb15,transparent 58%)}.ff-hero:before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#ffffff02 1px,transparent 1px),linear-gradient(90deg,#ffffff02 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(black,transparent)}.ff-hero-intro{position:relative;display:grid;grid-template-columns:1.1fr 1fr;gap:70px;align-items:end;margin-bottom:46px}.ff-hero h1{font-size:clamp(46px,5.9vw,76px);line-height:1.04;letter-spacing:-.058em;font-weight:600;margin:24px 0 0}.ff-hero h1 em{font-style:normal;color:#60a5fa}.ff-lead{font-size:16px;line-height:1.8;color:#94a3b8;max-width:410px}.ff-preview{position:relative;border:1px solid #ffffff1c;border-radius:14px 14px 0 0;overflow:hidden;background:#0b1120;box-shadow:0 0 90px #2563eb0d,0 20px 80px #0005}.ff-window{height:38px;border-bottom:1px solid #ffffff0d;background:#ffffff02;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:8px;letter-spacing:.15em;color:#64748b}.ff-window i{width:7px;height:7px;background:#334155;border-radius:50%}.ff-demo-label{letter-spacing:0}.ff-app{display:flex;min-height:380px}.ff-app-sidebar{width:190px;flex-shrink:0;border-right:1px solid #ffffff0d;padding:24px 16px;display:flex;flex-direction:column}.ff-app-nav{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:6px;font-size:11px;text-align:left;color:#94a3b8;margin-bottom:5px}.ff-app-nav.selected,.ff-preview-tabs .selected{background:#2563eb24;color:#93c5fd}.ff-app-main{flex:1;min-width:0;padding:26px 30px}.ff-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.ff-metrics>div{border:1px solid #ffffff0a;border-radius:8px;padding:12px 15px;background:#ffffff02}.ff-metrics strong{display:flex;align-items:center;justify-content:space-between;font-size:28px;letter-spacing:-1px;font-weight:500;margin:5px 0}.ff-repair-list{border:1px solid #ffffff0b;border-radius:8px}.ff-repair-row{display:flex;align-items:center;gap:14px;padding:13px 15px}.ff-repair-row+.ff-repair-row{border-top:1px solid #ffffff08}.ff-device{display:flex;align-items:center;justify-content:center;width:32px;height:36px;border-radius:7px;background:#ffffff05;color:#94a3b8}.ff-status{font-size:9px;border:1px solid #ffffff0e;padding:4px 8px;border-radius:5px;color:#94a3b8;white-space:nowrap}.ff-status>span{display:inline-block;width:4px;height:4px;border-radius:50%;background:currentColor;margin-right:5px}.ff-status.ready{color:#93c5fd;background:#2563eb14}.ff-avatar{font-size:9px;padding:6px;border-radius:50%;background:#ffffff08;color:#94a3b8;margin-left:15px}.ff-preview-tabs{display:none}.ff-message,.ff-chart{min-height:182px;padding:16px;border:1px solid #ffffff0b;border-radius:8px}.ff-section{padding:100px 0;border-top:1px solid #ffffff0c}.ff-heading{font-size:clamp(32px,4vw,48px);line-height:1.12;letter-spacing:-.045em;font-weight:500}.ff-feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:42px}.ff-card{padding:32px;border:1px solid #ffffff0e;border-radius:14px;background:linear-gradient(130deg,#ffffff04,#ffffff01);transition:transform .2s,border-color .2s}.ff-card:hover{transform:translateY(-4px);border-color:#ffffff25}.ff-feature-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid #3b82f633;border-radius:10px;background:#2563eb0d;color:#60a5fa}.ff-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:50px}.ff-step-number{font-family:monospace;font-size:12px;color:#60a5fa;border-top:1px solid #ffffff20;padding-top:18px;margin-bottom:24px}.ff-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:40px}.ff-plan{display:flex;flex-direction:column}.ff-plan.featured{border-color:#3b82f655;background:linear-gradient(145deg,#2563eb14,#ffffff02)}.ff-faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:80px}.ff-faq details{border-bottom:1px solid #ffffff10;padding:20px 0}.ff-faq summary{display:flex;justify-content:space-between;align-items:center;gap:20px;cursor:pointer;font-size:14px;font-weight:500;list-style:none;min-height:44px}.ff-faq summary::-webkit-details-marker{display:none}.ff-faq details[open] summary svg{transform:rotate(45deg)}.ff-faq details p{font-size:14px;line-height:1.8;color:#94a3b8;padding:14px 25px 0 0}.ff-tracking{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:32px;border:1px solid #ffffff12;border-radius:14px;background:#ffffff02}.ff-footer{display:flex;justify-content:space-between;align-items:center;gap:24px;padding-top:32px;padding-bottom:32px}.ff-mobile-menu-button{display:none}.ff-enter{animation:ff-rise .7s ease-out both}@keyframes ff-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:900px){.ff-nav-links{gap:16px}.ff-hero-intro{gap:35px}.ff-app-sidebar{width:150px}.ff-app-main{padding:22px}.ff-card{padding:25px}.ff-faq{gap:40px}.ff-avatar{display:none}}
      @media(max-width:700px){.ff-wrap{padding-left:20px;padding-right:20px}.ff-nav{height:66px}.ff-nav-links,.ff-signin{display:none!important}.ff-mobile-menu-button{display:flex;align-items:center;justify-content:center;width:44px;height:44px}.ff-hero{padding-top:45px}.ff-hero-intro{grid-template-columns:1fr;gap:24px;margin-bottom:32px}.ff-hero h1{font-size:54px}.ff-lead{font-size:15px;max-width:none}.ff-app-sidebar{display:none}.ff-app-main{padding:18px 14px}.ff-preview-tabs{display:flex;gap:6px;margin-bottom:16px}.ff-preview-tabs button{padding:5px 12px;border-radius:5px;font-size:11px;color:#94a3b8}.ff-metrics{gap:6px}.ff-metrics>div{padding:9px}.ff-metrics strong{font-size:24px}.ff-metrics>div>span:last-child{display:none}.ff-window>span:not(.ff-demo-label){display:none}.ff-repair-row{gap:8px;padding:12px 8px}.ff-status{font-size:8px;padding:4px}.ff-section{padding:65px 0}.ff-feature-grid,.ff-plans,.ff-faq,.ff-tracking{grid-template-columns:1fr}.ff-steps{grid-template-columns:1fr;gap:28px;margin-top:32px}.ff-step-number{margin-bottom:15px}.ff-faq{gap:24px}.ff-tracking{padding:24px;gap:24px}.ff-footer{flex-wrap:wrap}.ff-footer nav{flex-wrap:wrap;gap:18px!important}.ff-heading{font-size:36px}.ff-app{min-height:375px}}
      @media(max-width:360px){.ff-hero h1{font-size:46px}.ff-wrap{padding-left:16px;padding-right:16px}.ff-device{display:none}.ff-nav .ff-button{font-size:11px;padding:10px}.ff-metrics strong svg{display:none}}
      @media(prefers-reduced-motion:reduce){.ff-landing *{animation:none!important;transition:none!important;scroll-behavior:auto!important}.ff-card:hover,.ff-button:hover{transform:none}}
    `,
        }}
      />
      <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#050914]/90 backdrop-blur-xl">
        <div className="ff-wrap ff-nav">
          <Brand />
          <nav className="ff-nav-links" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="ff-signin text-xs text-slate-400 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="ff-button"
              style={{ padding: "9px 15px", minHeight: 40 }}
            >
              Get started <ArrowUpRight size={14} />
            </Link>
            <button
              className="ff-mobile-menu-button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-white/10 px-6 py-4 md:hidden"
          >
            {[
              ...navigation,
              ["Track a repair", "#track"],
              ["Sign in", "/login"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="!flex py-2 text-sm text-slate-300"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <section className="ff-hero">
        <div className="ff-wrap">
          <div className="ff-hero-intro ff-enter">
            <div>
              <span className="ff-eyebrow inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> THE
                WORKSPACE FOR REPAIR SHOPS
              </span>
              <h1>
                Great repairs.
                <br />
                <em>Without the chaos.</em>
              </h1>
            </div>
            <div>
              <p className="ff-lead">
                Your craft deserves better than scattered notes.
                <br className="hidden lg:block" /> Bring every repair, customer
                and spare part into one beautifully organized workspace.
              </p>
              <div className="mb-4 mt-6 flex flex-wrap gap-3">
                <Link href="/register" className="ff-button">
                  Start for free <ArrowRight size={15} />
                </Link>
                <a href="#product" className="ff-button secondary">
                  Explore the workspace <ArrowDownIcon />
                </a>
              </div>
              <p className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
                <span>
                  <Check size={12} className="mr-1 inline text-blue-400" /> No
                  credit card
                </span>
                <span>
                  <Check size={12} className="mr-1 inline text-blue-400" /> Free
                  Starter plan
                </span>
              </p>
            </div>
          </div>
          <div className="ff-enter" style={{ animationDelay: ".12s" }}>
            <ProductPreview />
          </div>
        </div>
      </section>
      <div className="border-y border-white/[.07]">
        <div className="ff-wrap flex flex-wrap items-center justify-between gap-5 py-6 text-xs text-slate-500">
          <span className="text-[10px] tracking-[.15em]">
            BUILT AROUND YOUR BENCH
          </span>
          {[
            [Smartphone, "Phone repairs"],
            [Laptop, "Computer repairs"],
            [Wrench, "Independent shops"],
            [Users, "Growing teams"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof Wrench;
            return (
              <span key={String(text)} className="flex items-center gap-2">
                <I size={15} />
                {String(text)}
              </span>
            );
          })}
        </div>
      </div>
      <section id="product" className="ff-section">
        <div className="ff-wrap">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="ff-eyebrow mb-4">LESS ADMIN. MORE REPAIRING.</p>
              <h2 className="ff-heading">
                Everything in its place.
                <br />
                <span className="text-slate-500">Finally.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-slate-400">
              A connected workspace for the real work of running a repair shop.
              From “Can you fix this?” to “Thanks, it’s perfect.”
            </p>
          </div>
          <div className="ff-feature-grid">
            {features.map(({ icon: Icon, title, text, tag }) => (
              <article className="ff-card" key={tag}>
                <div className="mb-7 flex items-center justify-between">
                  <div className="ff-feature-icon">
                    <Icon size={20} />
                  </div>
                  <span className="text-[9px] tracking-[.15em] text-slate-500">
                    {tag}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-medium tracking-tight">
                  {title}
                </h3>
                <p className="max-w-md text-sm leading-7 text-slate-400">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="workflow" className="ff-section">
        <div className="ff-wrap">
          <p className="ff-eyebrow mb-4">A BETTER EVERYDAY</p>
          <h2 className="ff-heading">One repair. One clear path.</h2>
          <div className="ff-steps">
            {[
              [
                "01 / TAKE IT IN",
                "Start with the whole story.",
                "Capture the device, the fault and the customer’s details. Assign a technician and keep the intake organized.",
              ],
              [
                "02 / KEEP IT MOVING",
                "Focus on the fix.",
                "Record diagnosis, parts and progress in one place. Your team knows what’s next, and customers can follow along.",
              ],
              [
                "03 / HAND IT OVER",
                "Finish with confidence.",
                "Record the payment, mark the device ready and close the repair with its history intact.",
              ],
            ].map(([number, title, text]) => (
              <article key={number}>
                <p className="ff-step-number">{number}</p>
                <h3 className="mb-3 text-lg font-medium">{title}</h3>
                <p className="text-sm leading-7 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="ai" className="ff-section">
        <div className="ff-wrap">
          <div
            className="ff-card grid items-center gap-10 md:grid-cols-2"
            style={{
              background:
                "radial-gradient(ellipse at 95% 0%,#2563eb18,transparent 70%)",
            }}
          >
            <div>
              <span className="ff-eyebrow flex items-center gap-2">
                <Sparkles size={14} /> AN EXTRA PAIR OF HANDS
              </span>
              <h2 className="ff-heading mb-5 mt-5">
                Your expertise.
                <br />A little extra assistance.
              </h2>
              <p className="text-sm leading-7 text-slate-400">
                Turn a fault description into a starting point for diagnosis.
                Use AI to help with repair guidance, then apply the judgment
                only you bring to the bench.
              </p>
              <p className="mt-4 text-xs leading-6 text-slate-500">
                Requires an available AI provider and credits. Suggestions
                should always be checked by a technician.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#080e1c] p-6">
              <div className="mb-5 flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={15} className="text-blue-400" /> ASSISTANT ·
                ILLUSTRATIVE EXAMPLE
              </div>
              <p className="mb-5 rounded-lg border border-white/5 bg-white/[.03] p-4 text-sm text-slate-300">
                Phone won’t charge. Where should I start?
              </p>
              <div className="space-y-4">
                {[
                  "Confirm the cable and power source.",
                  "Inspect the port for debris or damage.",
                  "Record your findings before replacing parts.",
                ].map((line, i) => (
                  <p
                    key={line}
                    className="flex gap-3 text-xs leading-6 text-slate-400"
                  >
                    <span className="text-blue-400">0{i + 1}</span>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" className="ff-section">
        <div className="ff-wrap">
          <div className="text-center">
            <p className="ff-eyebrow mb-4">ROOM TO GROW</p>
            <h2 className="ff-heading">Start small. Build your shop.</h2>
            <p className="mt-4 text-sm text-slate-400">
              One clear plan for your repair team. Start with a 14-day trial.
            </p>
          </div>
          <div className="ff-plans" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", maxWidth: 680, marginInline: "auto" }}>
            {[
              {
                key: "FREE",
                name: "Starter",
                price: "0",
                desc: "For your first organized repair.",
                items: [
                  "50 work orders per month",
                  "1 user account",
                  "Customer tracking portal",
                ],
              },
              {
                key: "PRO",
                name: "Pro",
                price: "29",
                desc: "For a growing repair team.",
                items: [
                  "Unlimited work orders",
                  "Up to 10 users",
                  "Advanced analytics & reports",
                ],
              },
              {
                key: "ENTERPRISE",
                name: "Enterprise",
                price: "79",
                desc: "For a larger repair operation.",
                items: [
                  "Unlimited users & branches",
                  "Everything in Pro",
                  "Custom integration options",
                ],
              },
            ].filter(plan => isLaunchPlanVisible(plan.key)).map((plan) => (
              <article
                key={plan.name}
                className={`ff-card ff-plan ${plan.key === "PRO" ? "featured" : ""}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{plan.name}</h3>
                  {plan.key === "PRO" && (
                    <span className="text-[9px] tracking-widest text-blue-400">
                      FOR GROWING TEAMS
                    </span>
                  )}
                </div>
                <p>
                  <span className="text-5xl font-medium tracking-tighter">
                    ${plan.price}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {plan.key === "FREE" ? "forever" : "USD / month"}
                  </span>
                </p>
                <p className="mb-7 mt-4 text-xs text-slate-400">{plan.desc}</p>
                <Link
                  href={plan.key === "FREE" ? "/register" : "/pricing"}
                  className={`ff-button ${plan.key === "PRO" ? "" : "secondary"}`}
                >
                  {plan.key === "FREE" ? "Start for free" : "View plan details"}
                  <ArrowUpRight size={14} />
                </Link>
                <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  {plan.items.map((item) => (
                    <p
                      key={item}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <Check size={13} className="text-blue-400" />
                      {item}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-center text-xs leading-6 text-slate-500">
            Paid-plan checkout is not yet available. AI and automated messaging require configured providers and usage credit.
          </p>
        </div>
      </section>
      <p className="ff-wrap pb-12 text-center text-sm text-slate-400">Need more users or locations? <a className="text-blue-400 hover:text-blue-300" href="mailto:hello@fixflow.ma?subject=FixFlow%20shop%20requirements">Contact us →</a></p>
      <section id="faq" className="ff-section">
        <div className="ff-wrap ff-faq">
          <div>
            <p className="ff-eyebrow mb-4">GOOD QUESTIONS</p>
            <h2 className="ff-heading">
              A few things
              <br />
              you might wonder.
            </h2>
            {LAUNCH_VISIBILITY.directoryPromotion && (<Link
              href="/directory"
              className="mt-6 gap-2 text-sm text-slate-400 hover:text-white"
            >
              Looking for a repair shop? <ArrowUpRight size={14} />
            </Link>)}
          </div>
          <div>
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={17} className="shrink-0 text-slate-500" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section id="track" className="ff-wrap pb-20">
        <div className="ff-tracking">
          <div>
            <div className="mb-2 flex items-center gap-2 text-lg font-medium">
              <Search size={18} className="text-blue-400" /> Here to check on a
              repair?
            </div>
            <p className="text-sm leading-6 text-slate-400">
              Enter the complete tracking reference provided by your shop.
            </p>
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (tracking.trim())
                window.location.assign(
                  `/track/${encodeURIComponent(tracking.trim().toLowerCase())}`,
                );
            }}
          >
            <label htmlFor="repair-reference" className="sr-only">
              Repair tracking reference
            </label>
            <input
              id="repair-reference"
              name="reference"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              required
              maxLength={100}
              placeholder="Your repair reference"
              className="min-w-0 flex-[1_1_180px] rounded-lg border border-white/15 bg-[#050914] px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />
            <button className="ff-button" type="submit">
              Track repair <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </section>
      <section
        className="ff-section text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%,#2563eb20,transparent 70%)",
        }}
      >
        <div className="ff-wrap">
          <div className="mb-6 inline-flex rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
            <Wrench size={25} />
          </div>
          <h2 className="ff-heading">Back to what you do best.</h2>
          <p className="mb-8 mt-5 text-sm text-slate-400">
            You fix the devices. Let FixFlow help organize the rest.
          </p>
          <Link href="/register" className="ff-button">
            Build a better repair day <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <footer className="border-t border-white/10">
        <div className="ff-wrap ff-footer">
          <Brand />
          <nav
            aria-label="Footer navigation"
            className="flex gap-6 text-xs text-slate-400"
          >
            {[
              ["Find a shop", "/directory"],
              ["Track repair", "#track"],
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
            ].filter(([, href]) => href !== "/directory" || LAUNCH_VISIBILITY.directoryPromotion).map(([label, href]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} FixFlow
          </p>
        </div>
      </footer>
    </main>
  );
}

function ArrowDownIcon() {
  return <ArrowRight size={14} style={{ transform: "rotate(90deg)" }} />;
}
