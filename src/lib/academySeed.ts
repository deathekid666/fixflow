import { prisma } from "@/lib/prisma";

const COURSES = [
  {
    title: "Getting Started with FixFlow",
    description: "Learn the essentials of the FixFlow platform in under an hour. From your first work order to customer management, this course gives you a solid foundation to run your shop efficiently.",
    level: "BEGINNER",
    category: "Fundamentals",
    duration: 55,
    order: 1,
    lessons: [
      {
        order: 1,
        title: "Introduction to the Dashboard",
        duration: 8,
        content: `# Welcome to FixFlow

The dashboard is your command center. Every time you log in, you get an instant overview of what matters most — open orders, today's revenue, parts running low, and upcoming SLA deadlines.

## Key Metrics Panel

At the top you'll see four KPI cards:
- **Active Orders** — work orders currently in progress
- **Today's Revenue** — payments collected today
- **Overdue SLAs** — orders past their promised completion time (aim for zero!)
- **Low Stock Alerts** — spare parts below minimum quantity

## Navigation Overview

The left sidebar gives you access to every section of the platform. On mobile, tap the hamburger menu (≡) to reveal it.

- **Work Orders** — the heart of FixFlow, where all repair jobs live
- **Customers** — profiles, history, and loyalty status
- **Spare Parts** — inventory management
- **Analytics** — revenue, performance, and industry benchmarks
- **Settings** — shop profile, team, notifications, and more

## Quick Actions

The **+ New Work Order** button in the top right is your fastest path to logging a new repair. Use it the moment a customer walks in.

## Key Takeaways

- The dashboard refreshes automatically every 30 seconds
- Red KPIs need immediate attention; green means you're on track
- Use the search bar (Ctrl+K) to jump to any order, customer, or part instantly`,
      },
      {
        order: 2,
        title: "Creating Your First Work Order",
        duration: 12,
        content: `# Creating a Work Order

A work order is the record of every repair job. Getting it right from the start saves you time, prevents disputes, and builds customer trust.

## Step-by-Step

1. Click **+ New Work Order** from the dashboard or the Work Orders list
2. Fill in the **customer information** — phone number first, FixFlow will auto-populate if the customer already exists
3. Enter **device details**: brand, model, and IMEI (optional but recommended for mobile devices)
4. Describe the **fault** in the customer's own words — keep it simple: "screen cracked", "won't charge"
5. Set the **service type** (screen repair, battery, software, etc.)
6. Choose an **assigned engineer** (defaults to you if you're the only technician)
7. Optionally set a **quoted price** and **SLA deadline**
8. Click **Create Work Order**

## The Status Workflow

Every order follows this path:
**PENDING → DIAGNOSING → REPAIRING → DONE → DELIVERED**

You can also mark an order as **CANCELLED** or **BOUNCED** (returned unrepaired).

## Intake Checklist & Photos

Before you close the intake form, use the **Checklist** to document the device's condition — scratches, cracks, missing buttons. Take **intake photos** to protect yourself from false damage claims.

## Key Takeaways

- Always capture intake photos, especially for cracked screens — it protects you legally
- The work order reference number (e.g., WO-0042) is what customers use on the tracking portal
- Setting a realistic SLA keeps customers happy and your score high`,
      },
      {
        order: 3,
        title: "Managing Customers",
        duration: 10,
        content: `# Customer Management

FixFlow automatically builds a customer database from your work orders. Every phone number you enter becomes a customer profile — you never have to create one manually.

## Customer Profiles

Each profile shows:
- **Full repair history** — every order, status, and amount
- **Lifetime value** — total revenue from this customer
- **Loyalty tier** — Bronze, Silver, Gold, or Platinum (auto-calculated)
- **Return rate** — what percentage of their devices came back for repeat issues

## Loyalty Tiers

| Tier | Threshold | Benefit |
|------|-----------|---------|
| Bronze | 1 order | Default tier |
| Silver | 3 orders | Priority notification |
| Gold | 7 orders | Special badge on order |
| Platinum | 15+ orders | VIP flag + custom notes |

Gold and Platinum customers are flagged automatically in the work order list so your team knows to give them extra care.

## Customer Notes

You can add private notes to any customer profile — allergies to certain cleaning chemicals, preferred contact method, regular device models. These notes are visible only to your team, never to the customer.

## Key Takeaways

- Never create duplicate customers — always search by phone first
- Platinum customers generate the most revenue; track them in the Customers list sorted by lifetime value
- The customer tracking portal lets customers check their repair status without calling you`,
      },
      {
        order: 4,
        title: "Setting Up Your Inventory",
        duration: 13,
        content: `# Spare Parts Inventory

FixFlow's inventory module tracks every spare part you stock — quantity, cost, selling price, and which orders they're used in.

## Adding a Spare Part

Go to **Spare Parts → Add Part** and fill in:
- **Name** — be descriptive: "Samsung S23 OLED Screen" not just "Screen"
- **SKU** — your internal code (optional but useful for large inventories)
- **Cost price** — what you paid the supplier
- **Selling price** — what you charge the customer (suggested markup: 30-50%)
- **Minimum quantity** — alert threshold before you run out
- **Supplier** — link to a supplier profile for quick reordering

## Using Parts in Work Orders

When a repair requires parts, open the work order, scroll to the **Parts** section, and click **Add Part**. FixFlow deducts the quantity automatically when the part is added, keeping stock levels accurate in real time.

## Stock Alerts

When a part drops below its minimum quantity, it appears on the dashboard as a **Low Stock Alert**. You can also go to **Spare Parts** and filter by "Low Stock" to see everything that needs reordering.

## Purchase Orders

Create a **Purchase Order** to formally request stock from a supplier. POs track expected deliveries and automatically update inventory when you mark them as received.

## Key Takeaways

- Set realistic minimum quantities — running out of common screens costs you jobs
- Always log part costs accurately; FixFlow uses them for profitability reports
- The parts cost on a work order directly affects your profit margin tracking`,
      },
      {
        order: 5,
        title: "Configuring Shop Settings",
        duration: 12,
        content: `# Shop Settings

Settings is where you make FixFlow yours. Take 15 minutes to configure it properly and you'll save hours of confusion later.

## Shop Profile

Under **Settings → Shop**, set your:
- **Shop name** — appears on invoices and the customer tracking portal
- **Logo** — uploaded once, shown everywhere (invoices, tracking page, social share)
- **Currency** — choose from MAD, EUR, USD, GBP, AED, SAR
- **Address & phone** — used on printed invoices

## Tax & TVA Settings

If your country requires tax on invoices, enable **TVA** in the Tax Settings section and enter your rate (e.g., 20% for Morocco). FixFlow will add it automatically to all invoices.

## SLA Defaults

Set a **default SLA** (e.g., 48 hours) and FixFlow will automatically assign a due date to every new order. You can always override per order.

## Customer Notifications

Under **Settings → Notifications**, configure:
- **SMS or WhatsApp** channel (requires Twilio credentials)
- Which status changes trigger a notification (e.g., DONE, DELIVERED)
- Language: English, French, or Arabic

## Team Management

Under **Settings → Team**, invite engineers by email. They log in with their own password and can only see orders assigned to their shop. ADMIN role has full access; ENGINEER role has limited access.

## Key Takeaways

- Logo and currency can only be changed by ADMIN users
- Test your notification setup with the "Send Test" button before going live
- Keep your SLA default realistic — better to under-promise and over-deliver`,
      },
    ],
  },
  {
    title: "Managing Your Repair Shop",
    description: "Go beyond the basics. Learn pricing strategy, team management, analytics interpretation, and customer retention tactics that separate thriving shops from struggling ones.",
    level: "INTERMEDIATE",
    category: "Operations",
    duration: 75,
    order: 2,
    lessons: [
      {
        order: 1,
        title: "Pricing Strategy for Repair Shops",
        duration: 12,
        content: `# Pricing Your Repairs Right

Pricing is the single most impactful business decision you make — too low and you work hard for nothing, too high and customers walk.

## Cost-Plus Pricing

The foundation of repair shop pricing:

**Price = (Parts cost × markup) + Labor**

A healthy markup on parts is **30–50%**. Labor is typically **150–300 MAD/hour** depending on your market and the complexity of the repair.

## Market Rate Research

Before setting your prices, research your local competition:
- Call 3 nearby shops and ask for screen replacement prices on common models
- Check Facebook Marketplace and local repair groups
- Use the **AI Price Suggestion** tool in FixFlow (click "💡 Price Suggestion" on any work order's quotation section)

## The AI Price Suggestion Tool

FixFlow includes an AI-powered pricing assistant. Open any work order, scroll to the Quotation section, and click **💡 Price Suggestion**. It analyzes:
- Your parts costs
- The device model and repair type
- Your location and currency
- Typical market rates in your region

It returns a **min/midpoint/max** range with reasoning. Click any of the three to apply it.

## Bundling Services

Offering bundles increases average order value:
- *Screen + battery replacement* — slight discount vs. separate
- *Full refurbishment package* — clean, new battery, screen protector
- *Diagnostic + fix* — one price for the whole job

## Key Takeaways

- Never price below your true cost — hidden costs (electricity, rent, consumables) add up
- Review prices every 6 months as parts costs fluctuate
- Use the AI Price Suggestion as a reality check, not a final answer`,
      },
      {
        order: 2,
        title: "Building and Managing Your Team",
        duration: 11,
        content: `# Building Your Repair Team

Growth requires delegation. FixFlow's team features help you manage engineers, track performance, and pay commissions fairly.

## Adding Team Members

Go to **Settings → Team → Invite Engineer**. Enter their email and role:
- **ADMIN** — full access: all orders, settings, reports, financial data
- **ENGINEER** — work orders and parts only; cannot see financials or change settings

Engineers receive an email invitation and set their own password. They see only your shop's data.

## Assigning Orders

When creating or editing a work order, use the **Assigned To** field to delegate to a specific engineer. The engineer sees all their assigned orders on their dashboard. Unassigned orders are visible to all ADMIN users.

## The Engineer Leaderboard

Go to **Engineers → Leaderboard** to see:
- Orders completed per engineer this month
- Revenue generated
- Average repair time
- Bounce rate (orders returned unrepaired)

This is your weekly team check-in data. Recognize top performers and identify who needs support.

## Commission Tracking

Set each engineer's **commission rate** (as a % of revenue) in their profile. FixFlow calculates commissions automatically at month-end based on orders they completed. Go to **Engineers → Commissions** to view and export.

## Key Takeaways

- Start engineers as ENGINEER role and promote to ADMIN only when truly needed
- Review the leaderboard weekly — visibility drives accountability
- A clear commission structure reduces disputes and motivates the team`,
      },
      {
        order: 3,
        title: "Using Analytics to Grow",
        duration: 14,
        content: `# Analytics: Turning Data Into Decisions

FixFlow's analytics dashboard shows you what's actually happening in your business — not what you think is happening.

## The Overview Tab

The overview shows weekly and monthly trends across:
- **Revenue** — money collected (not just invoiced)
- **Orders** — volume by status
- **Parts usage** — your most-used and most-costly parts
- **Profit margin** — revenue minus parts cost (labor not yet deducted)

Pay attention to the **week-over-week trend**. A consistent decline means something changed — a new competitor, a price increase, seasonal slowdown.

## The Benchmarks Tab

This is unique to FixFlow. Your metrics are compared anonymously against all active FixFlow shops in your region. You see:

- **Average TAT (Turnaround Time)** — how fast you complete orders vs. the industry
- **Average Order Value** — your ticket vs. the market
- **Bounce Rate** — yours vs. industry (lower is better)
- **Collection Rate** — % of invoiced amounts actually collected

If you're below average on any metric, that's an opportunity.

## Identifying Top Services

The **Top Services** chart shows which repair types generate the most revenue. Use this to:
- Stock more of those parts
- Train engineers on those repairs
- Promote those services on social media

## Key Takeaways

- Check analytics weekly, not daily — daily noise hides weekly signal
- The collection rate is often the hidden problem: you're doing the work but not collecting
- Benchmark data requires at least 2 active shops — it grows more meaningful as FixFlow adoption increases`,
      },
      {
        order: 4,
        title: "Customer Service Excellence",
        duration: 13,
        content: `# Delivering Outstanding Customer Service

Technical skill gets the repair done. Customer service gets them to come back — and to bring their friends.

## Response Time Matters

Studies show customers are **3× more likely to return** if they receive a status update within 2 hours of leaving their device. With FixFlow's SMS/WhatsApp notifications:
- Customers get notified automatically when you start diagnostics
- They get a "Ready for pickup" message when the repair is done
- No phone calls needed on your end

Set this up once in **Settings → Notifications** and it works automatically.

## The Customer Tracking Portal

Every work order has a unique tracking URL (e.g., fixflow.app/track/WO-0042). Share it with the customer at intake. They can check the status, see technician notes, and view photos — without calling you.

Include the tracking link in your intake receipt or WhatsApp message.

## Collecting Ratings

When a work order is marked DELIVERED, FixFlow can send an automatic rating request. Go to **Settings → Notifications** and enable the rating link. Customer ratings appear in:
- The work order detail
- The **Satisfaction** dashboard (aggregated)
- Your shop's public profile (if you've enabled directory listing)

## Handling Complaints

If a customer is unhappy:
1. Document the complaint in **Internal Notes** on the work order
2. Offer a re-check at no charge (costs you 10 minutes, saves the relationship)
3. If the repair failed, use the **Bounce** status and log the reason

## Key Takeaways

- Proactive communication beats reactive: notify before they ask
- The tracking portal reduces "when will my phone be ready?" calls by ~70%
- Never delete a negative rating — respond professionally instead`,
      },
      {
        order: 5,
        title: "Loyalty Programs & VIP Customers",
        duration: 13,
        content: `# Keeping Customers Coming Back

Acquiring a new customer costs 5× more than retaining an existing one. FixFlow's loyalty system helps you identify and reward your best customers automatically.

## How Loyalty Tiers Work

FixFlow assigns tiers based on **total number of completed orders**:

- 🥉 **Bronze** (1 order) — new customers
- 🥈 **Silver** (3 orders) — returning customers
- 🥇 **Gold** (7 orders) — loyal customers
- 💎 **Platinum** (15+ orders) — your VIPs

Tiers update automatically after every completed order.

## What to Do With VIP Customers

Gold and Platinum customers are flagged in the work order list with a badge. Train your team to:
- Greet them by name
- Offer same-day service when possible
- Apply a small loyalty discount (5-10%) as a gesture

Consider keeping a short note on each Platinum customer in their profile: their preferred devices, usual issues, best contact time.

## Retention Tactics

- **Follow up after 30 days** — message customers asking how their repair is holding up
- **Seasonal reminders** — "Summer heat is tough on batteries — want a free check?"
- **Referral incentives** — offer a discount on next repair if they send a friend

You can export customer lists from FixFlow to use in WhatsApp Business broadcasts.

## Key Takeaways

- Platinum customers typically represent 20% of your customer base but 50%+ of revenue
- A simple loyalty discount costs you little but feels huge to the customer
- Consistent follow-up is the #1 differentiator between shops that grow and those that plateau`,
      },
      {
        order: 6,
        title: "Marketing Your Repair Shop",
        duration: 12,
        content: `# Growing Your Shop With Marketing

The best repair shop in the neighborhood can still fail if nobody knows about it. FixFlow gives you tools to get discovered and build your reputation.

## The FixFlow Directory

If you're on the **SILVER** plan or above, your shop appears in the FixFlow public directory. Make sure your profile is complete:
- High-resolution logo
- Accurate address and phone number
- Google Maps URL
- List of services you offer

Customers searching for "iPhone repair near me" can find you through the FixFlow directory.

## Shop Certification

Go to **Certification** in the sidebar to earn a FixFlow certification badge:
- 🥉 **Bronze** — Complete your shop profile
- 🥈 **Silver** — 10+ completed orders with 4+ star rating
- 🥇 **Gold** — 50+ completed orders, 4.5+ stars, and SLA compliance > 80%

Certification badges appear on your directory profile and can be used in marketing materials.

## Social Media with FixFlow

When a work order is DELIVERED and has both before and after photos, a **📱 Share** button appears in the header. Click it to open the Social Share tool:
- Automatically generates a 1080×1080 before/after image
- Includes your shop logo and name
- Download as JPG, share directly to WhatsApp, or copy post text

Post consistently (3× per week minimum) on Facebook, Instagram, and TikTok for maximum reach.

## Key Takeaways

- Before/after photos are your most powerful marketing asset — take them on every repair
- Responding to Google reviews (positive and negative) improves your local SEO ranking
- The FixFlow directory is free visibility — keep your profile updated`,
      },
    ],
  },
  {
    title: "Mastering Diagnostics",
    description: "Elevate your technical process with professional documentation standards, AI-assisted diagnostics, photo evidence workflows, and strategies to eliminate bounce repairs.",
    level: "ADVANCED",
    category: "Technical",
    duration: 65,
    order: 3,
    lessons: [
      {
        order: 1,
        title: "Using the Repair Checklist",
        duration: 11,
        content: `# The Repair Checklist

A systematic checklist transforms your intake process from a conversation into a legal document. It protects you, sets customer expectations, and creates a quality baseline across your team.

## Why Checklists Matter

Without a checklist:
- Customer claims the screen was already cracked (and you can't prove it wasn't)
- Engineer forgets to test the earpiece after a screen replacement
- Two engineers follow different intake processes, creating inconsistency

With a checklist: every device goes through the same documented inspection.

## Setting Up Your Checklist

Go to **Settings → Checklists** to create checklist templates by device type:
- Mobile phones: screen condition, touch sensitivity, cameras, charging port, buttons, speakers, Face ID/fingerprint
- Laptops: keyboard, display, ports, battery health, trackpad, hinges
- Tablets: similar to phones plus stylus compatibility

## Running the Checklist at Intake

When creating a work order, open the **Checklist** tab. Work through each item with the customer present:
- ✅ **OK** — functioning normally
- ⚠️ **Pre-existing issue** — damaged before arrival (document this!)
- ❌ **Not tested** — feature not accessible without repair

Items marked "Pre-existing issue" appear prominently on the work order and printed receipt.

## After-Repair Quality Check

Run the same checklist after completing the repair to verify everything works. The completion checklist becomes your quality certificate.

## Key Takeaways

- Never skip the intake checklist, even for regular customers
- Have the customer sign or acknowledge the pre-existing issues in person
- The checklist data feeds into your bounce rate analysis — more pre-existing issues = lower real bounce rate`,
      },
      {
        order: 2,
        title: "Photo Documentation Best Practices",
        duration: 14,
        content: `# Photo Documentation

Photos are your strongest evidence and your most compelling marketing. FixFlow's photo timeline turns your repair process into a visual story.

## The Photo Timeline

Every work order has a **Photos** tab with four categories:
- **Intake** — device condition on arrival
- **Repair** — work in progress (component removal, fault visible)
- **Completion** — repaired device, all features working
- **Other** — anything that doesn't fit above

## What to Photograph at Intake

Capture these angles for every device:
1. Front face — screen condition, visible cracks or marks
2. Back — camera, cover condition
3. Ports — charging port, headphone jack
4. Corners — drop damage
5. Any pre-existing damage noted on the checklist (close-up)

Use good lighting — position the device near a window or under a bright light.

## Repair Progress Photos

For complex repairs, document the process:
- Component layout before disassembly
- Fault clearly visible (burned chip, broken connector, swollen battery)
- Replacement part next to old part
- Reassembly in progress

These photos are invaluable for training new engineers and for defending against complaints.

## Completion Photos

Always photograph:
- Screen powered on, showing full display
- All features demonstrated (camera, speakers, charging)
- Clean, reassembled device

The before/after comparison is what powers the **Social Share** feature.

## Key Takeaways

- 4-6 photos per order minimum; for complex repairs, 10-15 is not excessive
- Consistent photo angles make before/after comparisons more dramatic on social media
- Store photos in FixFlow — they're organized by order, searchable, and never lost`,
      },
      {
        order: 3,
        title: "Handling Bounce Repairs",
        duration: 12,
        content: `# Bounce Repairs: Understanding and Reducing Them

A "bounce" is a repair returned to the customer unrepaired — typically because the fault is beyond your capability or the repair cost exceeds the device value. Tracking bounces is critical to understanding your shop's real capability.

## What Is a Bounce?

Mark an order as **BOUNCED** when:
- Diagnosis reveals the device is beyond economical repair (BER)
- The customer declines the quoted price after diagnosis
- You lack the parts or skills for that specific repair
- A third-party component (screen, board) causes repeated failures

Always log a **bounce reason** — this data feeds your analytics.

## Common Bounce Reasons

- **BER (Beyond Economic Repair)** — cost of repair > device value
- **No fault found** — device works normally after testing
- **Customer declined quote** — price too high for customer's budget
- **Parts unavailable** — no stock and no supplier for this part
- **Skill gap** — repair requires equipment or expertise you don't have

## Analyzing Your Bounce Rate

In **Analytics → Overview**, the bounce rate shows what % of orders were returned unrepaired. Industry average is 8-15%. Above 20% signals a problem.

High bounce rates often mean:
- Your marketing attracts repairs outside your capability
- Your diagnostic process isn't filtering jobs early enough
- Parts sourcing is unreliable

## Reducing Bounces

- Pre-qualify over the phone: ask the customer to describe the fault before they come in
- Be upfront about complexity at intake: "This type of repair has a 1-in-3 risk of data loss — is that acceptable?"
- Build supplier relationships for hard-to-find parts before you need them

## Key Takeaways

- A bounce isn't a failure — it's an honest outcome that protects your reputation
- Track bounce reasons consistently; patterns reveal actionable improvements
- Charging a diagnostic fee for complex bounces is standard industry practice`,
      },
      {
        order: 4,
        title: "The Health Report Feature",
        duration: 14,
        content: `# The Repair Health Report

The Health Report is a professional summary you can share with customers at delivery. It turns your technical work into a document they can understand and trust.

## What's in the Health Report

The health report includes:
- **Device identification** — brand, model, IMEI
- **Reported fault** — in the customer's words
- **Diagnosed fault** — your technical finding
- **Work performed** — parts replaced, adjustments made
- **Post-repair test results** — checklist outcomes
- **Technician notes** — any additional observations
- **Before/after photos** — visual evidence of the repair

It's presented as a clean PDF with your shop logo and branding.

## Generating and Sharing the Report

Open a completed work order, click **Print/Export → Health Report**. FixFlow generates a PDF that you can:
- Share via WhatsApp directly to the customer
- Email as an attachment
- Print and include in the device bag

Many shops use the health report as a differentiator — very few repair shops provide this level of documentation.

## Building Trust Through Transparency

The health report tells the customer:
> "We know exactly what we did, we documented it, and we stand behind it."

This is especially powerful for:
- **Insurance claims** — customer needs proof of repair
- **Warranty repairs** — demonstrates the original fault was not caused by you
- **Repeat customers** — keeps a history of every repair on the device

## Adding Strong Technician Notes

The notes field on a work order becomes part of the health report. Write notes that would make sense to a non-technical customer:
- Not good: *"Replaced LCD assembly, cleaned FPC connector"*
- Good: *"Replaced the display module (screen + digitizer). Cleaned the connection point where screen meets motherboard. Verified touch sensitivity across full display surface."*

## Key Takeaways

- Health reports differentiate you from "just a phone repair shop"
- Write technician notes in plain language — customers read them
- Share the report proactively at delivery; don't wait to be asked`,
      },
      {
        order: 5,
        title: "AI Repair Assistant",
        duration: 14,
        content: `# The AI Repair Assistant

FixFlow includes an AI assistant powered by Claude Opus — one of the most capable AI models available. It's designed to help with complex diagnostics, second opinions, and repair guidance.

## When to Use the AI Assistant

The AI assistant is most valuable for:
- **Unusual fault descriptions** — "phone heats up but only when using GPS"
- **Board-level issues** — narrowing down potential failure components
- **Unknown devices** — identifying chipsets or repair procedures for uncommon models
- **Price check** — using the AI Price Suggestion tool (see the Pricing Strategy lesson)

## Accessing the AI Assistant

On any work order, scroll to the **AI Assistant** section. Enter:
- The fault description
- Any diagnostic steps you've already taken
- Your findings so far (e.g., "checked with multimeter, voltage at TP23 is 0V")

The AI returns a structured diagnostic recommendation with confidence level and next steps.

## Interpreting AI Suggestions

The AI assistant provides reasoning, not certainty. It may suggest:
- Component candidates to test (ordered by likelihood)
- Diagnostic tests to confirm the fault
- Common failure patterns for this device/symptom combination
- Related issues to rule out

Always verify AI suggestions with your own diagnostic equipment before replacing parts.

## Adding AI Notes to Work Orders

Any AI suggestion can be added to the work order's **Internal Notes** with one click. This creates a documented reasoning trail for the repair, useful if:
- Another engineer continues the job
- The customer asks why a particular part was replaced
- The repair needs to be revisited

## Pricing with AI

The **💡 Price Suggestion** button in the Quotation section uses the same AI to suggest a fair price range based on your parts cost, device type, and location. It gives you a minimum, midpoint, and maximum — each with a reasoning explanation.

## Key Takeaways

- AI suggestions are starting points, not final answers — your experience matters
- The AI works best with detailed fault descriptions; vague input gives vague output
- Document AI-assisted decisions in internal notes for team learning`,
      },
    ],
  },
];

let seeded = false;

export async function ensureAcademySeeded() {
  if (seeded) return;
  const count = await prisma.course.count();
  if (count > 0) { seeded = true; return; }

  for (const courseData of COURSES) {
    const { lessons, ...courseFields } = courseData;
    const course = await prisma.course.create({ data: courseFields });
    for (const lesson of lessons) {
      await prisma.lesson.create({ data: { ...lesson, courseId: course.id } });
    }
  }

  seeded = true;
}
