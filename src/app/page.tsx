"use client"
import Link from "next/link"
import { Wrench, ArrowRight, Check, Zap, Users, BarChart3, Calendar, Package, Star, Shield, Clock, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="bg-[#060912] text-white min-h-screen" style={{fontFamily:"Inter,system-ui,sans-serif"}}>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{background:"rgba(6,9,18,0.85)",backdropFilter:"blur(20px)",height:60}}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench size={15} color="white" />
            </div>
            <span className="font-bold text-lg text-white">FixFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {["Features","AI","Pricing","FAQ"].map(l=>(
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-slate-400 hover:text-white transition-colors no-underline">{l}</a>
            ))}
            <a href="/track" className="text-sm text-blue-400 hover:text-blue-300 transition-colors no-underline">Track Repair</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors no-underline">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors no-underline">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 border border-blue-500/20 bg-blue-500/8 rounded-full px-3 py-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-xs text-blue-400 font-medium">AI-Powered Repair Shop Platform</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{letterSpacing:"-2px"}}>
              Run your repair shop<br/>
              <span className="text-blue-400">like a pro.</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              Work orders, AI diagnostics, customer tracking, inventory, and payments — one platform that finally replaces WhatsApp and spreadsheets.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all no-underline" style={{boxShadow:"0 0 40px rgba(37,99,235,0.3)"}}>
                Start free — 14 days <ArrowRight size={16}/>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-all border border-white/10 hover:border-white/20 no-underline">
                See features
              </a>
            </div>
            <div className="flex flex-wrap gap-5">
              {["No credit card","Cancel anytime","Free for 14 days"].map(t=>(
                <span key={t} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Check size={13} color="#22c55e"/>{t}
                </span>
              ))}
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-3 mt-8 pt-8 border-t border-white/5">
              <div className="flex">
                {[1,2,3,4,5].map(i=><Star key={i} size={14} className="text-yellow-400" fill="#facc15"/>)}
              </div>
              <span className="text-sm text-slate-400">Trusted by <span className="text-white font-medium">1,000+</span> repair shops worldwide</span>
            </div>
          </div>
          {/* Right - Dashboard mockup */}
          <div className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden border border-white/8" style={{boxShadow:"0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(37,99,235,0.08)",background:"#0d1117"}}>
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 border-b border-white/5" style={{height:38,background:"#161b22"}}>
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"/>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"/>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"/>
                <div className="flex-1 text-center text-xs text-slate-600 font-mono">app.fixflow.io/dashboard</div>
              </div>
              {/* Dashboard */}
              <div className="flex" style={{height:400}}>
                {/* Sidebar */}
                <div className="w-44 border-r border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center"><Wrench size={12} color="white"/></div>
                    <span className="text-sm font-semibold">FixFlow</span>
                  </div>
                  {[{icon:<Wrench size={13}/>,label:"Work Orders",active:true},{icon:<Users size={13}/>,label:"Customers"},{icon:<Package size={13}/>,label:"Parts"},{icon:<BarChart3 size={13}/>,label:"Analytics"},{icon:<Calendar size={13}/>,label:"Appointments"}].map(item=>(
                    <div key={item.label} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1 text-xs" style={{background:item.active?"rgba(37,99,235,0.15)":"transparent",color:item.active?"#60a5fa":"rgba(255,255,255,0.3)"}}>
                      {item.icon}{item.label}
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="flex-1 p-5 overflow-hidden">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[{l:"Revenue",v:"$8,420",c:"#34d399"},{l:"Active",v:"24",c:"#60a5fa"},{l:"Done",v:"38",c:"#a78bfa"},{l:"Rating",v:"4.9★",c:"#fbbf24"}].map(s=>(
                      <div key={s.l} className="rounded-lg p-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div className="text-xs mb-1" style={{color:"rgba(255,255,255,0.3)"}}>{s.l}</div>
                        <div className="text-base font-bold" style={{color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Table */}
                  <div className="rounded-xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="grid px-4 py-2 text-xs" style={{gridTemplateColumns:"80px 1fr 120px 90px",borderBottom:"1px solid rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.2)"}}>
                      <span>ORDER</span><span>CUSTOMER</span><span>DEVICE</span><span>STATUS</span>
                    </div>
                    {[{id:"#1042",name:"Ahmed K.",device:"iPhone 14 Pro",status:"REPAIRING",color:"#f97316"},{id:"#1041",name:"Sara M.",device:"Samsung S23",status:"DONE",color:"#22c55e"},{id:"#1040",name:"Omar B.",device:"MacBook Air",status:"DIAGNOSING",color:"#eab308"},{id:"#1039",name:"Nadia R.",device:"iPhone 13",status:"DELIVERED",color:"#64748b"}].map(r=>(
                      <div key={r.id} className="grid px-4 py-2.5 text-xs items-center" style={{gridTemplateColumns:"80px 1fr 120px 90px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                        <span style={{color:"rgba(255,255,255,0.25)",fontFamily:"monospace"}}>{r.id}</span>
                        <span className="font-medium">{r.name}</span>
                        <span style={{color:"rgba(255,255,255,0.4)"}}>{r.device}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{background:`${r.color}18`,color:r.color}}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="border-y border-white/5 py-5 px-6 text-center">
        <p className="text-sm text-slate-500">Used by repair shops across <span className="text-slate-300">Europe</span>, <span className="text-slate-300">Middle East</span>, and <span className="text-slate-300">Americas</span> — available in English, French & Arabic</p>
      </div>

      {/* PROBLEM SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{letterSpacing:"-1px"}}>Still running your shop on WhatsApp?</h2>
          <p className="text-lg text-slate-400">Most repair shops lose 2+ hours daily to manual work. FixFlow fixes that.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{icon:"😤",title:"Lost repair history",desc:"Customer brings back a device. You have no idea what you did last time or who worked on it."},{icon:"💸",title:"Missed payments",desc:"Someone owes you money but you forgot to chase. No system to track outstanding balances."},{icon:"📱",title:"Customers calling non-stop",desc:"They want updates. You're busy repairing. WhatsApp is chaos. Customers get frustrated."}].map(p=>(
            <div key={p.title} className="p-6 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase mb-3">FEATURES</p>
            <h2 className="text-4xl font-bold mb-4" style={{letterSpacing:"-1px"}}>Everything your shop needs</h2>
            <p className="text-lg text-slate-400 max-w-lg mx-auto">Replace the chaos of multiple tools with one platform built specifically for repair shops.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Big card */}
            <div className="md:col-span-2 p-8 rounded-2xl border border-white/6 relative overflow-hidden" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full" style={{background:"radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)"}}/>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4"><Wrench size={20} color="#60a5fa"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Smart Work Orders</h3>
              <p className="text-slate-400 leading-relaxed">Full lifecycle from intake to delivery. Photos, checklists, parts, payments, customer chat, repair timer, and SLA tracking — all in one place.</p>
            </div>
            {/* AI card */}
            <div className="p-8 rounded-2xl border border-purple-500/15 relative overflow-hidden" style={{background:"linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.05))"}}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4"><Zap size={20} color="#a78bfa"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>AI Repair Assistant</h3>
              <p className="text-slate-400 leading-relaxed mb-4">Describe the fault. Get repair steps, parts list, time estimate, and price suggestion instantly.</p>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/15 px-3 py-1 rounded-full">Only on FixFlow</span>
            </div>
            {/* Analytics */}
            <div className="p-8 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-4"><BarChart3 size={20} color="#34d399"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Analytics</h3>
              <p className="text-slate-400 leading-relaxed">Revenue charts, engineer leaderboards, parts profitability, and industry benchmarks.</p>
            </div>
            {/* Customer portal - big */}
            <div className="md:col-span-2 p-8 rounded-2xl border border-white/6 relative overflow-hidden" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full" style={{background:"radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)"}}/>
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-4"><Users size={20} color="#34d399"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Customer Portal</h3>
              <p className="text-slate-400 leading-relaxed">Customers track repairs in real time, chat with your shop, see completion photos, and rate the service. No app download. No login.</p>
            </div>
            {/* Appointments */}
            <div className="p-8 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center mb-4"><Calendar size={20} color="#fbbf24"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Appointments</h3>
              <p className="text-slate-400 leading-relaxed">Smart capacity-based booking. Customers book online, you confirm.</p>
            </div>
            {/* Inventory */}
            <div className="p-8 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center mb-4"><Package size={20} color="#f97316"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Inventory</h3>
              <p className="text-slate-400 leading-relaxed">Parts catalog, stock tracking, low stock alerts, and supplier management.</p>
            </div>
            {/* Multi-language */}
            <div className="p-8 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-4"><Globe size={20} color="#22d3ee"/></div>
              <h3 className="text-xl font-bold mb-3" style={{letterSpacing:"-0.5px"}}>Arabic & French</h3>
              <p className="text-slate-400 leading-relaxed">Full RTL Arabic support, French, and English. The only repair CRM built for MENA markets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/5 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[{n:"122+",l:"Features"},{n:"30+",l:"Countries"},{n:"$0",l:"Setup cost"},{n:"14",l:"Day free trial"}].map(s=>(
            <div key={s.l}>
              <div className="text-5xl font-bold mb-2" style={{letterSpacing:"-2px"}}>{s.n}</div>
              <div className="text-sm text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY FIXFLOW */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{letterSpacing:"-1px"}}>Why repair shops choose FixFlow</h2>
            <p className="text-lg text-slate-400">Not just another CRM. A complete operating system for repair shops.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{icon:<Zap size={22} color="#a78bfa"/>,bg:"rgba(124,58,237,0.15)",title:"AI built in",desc:"The only repair CRM with a built-in AI assistant. Get repair guidance, price suggestions, and customer message drafts instantly."},{icon:<Shield size={22} color="#34d399"/>,bg:"rgba(16,185,129,0.15)",title:"50% cheaper",desc:"RepairDesk charges $75-150/month. RepairShopr $50-150/month. FixFlow starts at $29/month with more features."},{icon:<Clock size={22} color="#60a5fa"/>,bg:"rgba(37,99,235,0.15)",title:"Setup in minutes",desc:"No training needed. Create your first work order in under 2 minutes. Import your parts catalog via CSV."}].map(w=>(
              <div key={w.title} className="p-8 rounded-2xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{background:w.bg}}>{w.icon}</div>
                <h3 className="text-lg font-bold mb-3">{w.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3" style={{letterSpacing:"-1px"}}>Simple pricing</h2>
            <p className="text-lg text-slate-400">Start free. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[{name:"Starter",price:"$29",desc:"For solo technicians",features:["50 work orders/month","Up to 3 engineers","Customer portal","Basic analytics","Email support"],popular:false},{name:"Pro",price:"$59",desc:"For growing shops",features:["Unlimited work orders","Unlimited engineers","AI Repair Assistant","Advanced analytics","Commission tracking","Priority support"],popular:true},{name:"Business",price:"$99",desc:"For multiple locations",features:["Everything in Pro","Multiple branches","Custom permissions","White label","API access","Dedicated support"],popular:false}].map(plan=>(
              <div key={plan.name} className="rounded-2xl p-7 relative" style={{background:plan.popular?"rgba(37,99,235,0.08)":"rgba(255,255,255,0.02)",border:plan.popular?"1px solid rgba(37,99,235,0.4)":"1px solid rgba(255,255,255,0.07)",boxShadow:plan.popular?"0 0 60px rgba(37,99,235,0.1)":"none"}}>
                {plan.popular&&<div className="absolute -top-px left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg tracking-wide">MOST POPULAR</div>}
                <p className="text-sm text-slate-400 mb-2 mt-2">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold" style={{letterSpacing:"-2px"}}>{plan.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">{plan.desc}</p>
                <Link href="/register" className="block text-center font-semibold text-sm py-2.5 rounded-xl mb-6 no-underline transition-colors" style={{background:plan.popular?"#2563eb":"rgba(255,255,255,0.06)",color:"white",border:plan.popular?"none":"1px solid rgba(255,255,255,0.08)"}}>
                  Start free trial
                </Link>
                <div className="flex flex-col gap-3">
                  {plan.features.map(f=>(
                    <div key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <Check size={13} color={plan.popular?"#60a5fa":"#34d399"}/>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4" style={{letterSpacing:"-1px"}}>Ready to run a better shop?</h2>
          <p className="text-lg text-slate-400 mb-10">Join 1,000+ repair shops already using FixFlow. 14-day free trial. No credit card.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base px-10 py-4 rounded-xl transition-all no-underline" style={{boxShadow:"0 0 60px rgba(37,99,235,0.35)"}}>
            Get started free <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center"><Wrench size={12} color="white"/></div>
          <span className="font-bold text-base">FixFlow</span>
        </div>
        <p className="text-xs text-slate-600">© 2026 FixFlow. Built for repair shops worldwide.</p>
      </footer>
    </div>
  )
}
