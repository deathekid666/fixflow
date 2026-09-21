# Simplified launch workspace

Open **Settings → Workspace** to choose optional tools. **Show all optional tools** restores their entry points; **Use simple workspace** hides them again. Preferences are saved for each account and shop on the current browser/device. They are not shared shop-wide or synced to other devices.

The main navigation contains Repairs, Customers, Inventory, Calendar and (for admins) Reports, with Settings below. Settings → Workspace retains links to messages, suppliers, warranties, ratings, import, analytics, team management, templates, expenses and the repair-price catalogue. Existing role visibility is preserved.

Hidden by default: academy/course certificates, shop certification, industry benchmarks, additional AI panels, branches, service contracts, commissions, the separate POS screen and staff shifts. One contextual AI Assist remains on a work order. Hidden automatic AI panels do not initiate background AI requests. The TV dashboard remains in Settings → Integrations.

All page routes, API routes, records, billing plan definitions and feature implementations remain. There is no database migration or data deletion. Existing direct links continue to work under their existing authorization checks. Visibility is **not authorization** and does not grant or revoke permissions or subscription entitlements. Existing multi-branch shops retain their repair branch filter when they have more than one branch.

## Restore public promotion

`src/lib/workspace.ts` contains the central switches:

- `DEFAULT_WORKSPACE`: initial optional tool visibility for accounts without a saved preference.
- `LAUNCH_VISIBILITY.directoryPromotion`: links to the public directory from the landing page.
- `LAUNCH_VISIBILITY.publicCertification`: badges on directory listings, tracking and receipts.
- `LAUNCH_VISIBILITY.tvHeaderShortcut`: the old desktop TV shortcut.
- `LAUNCH_VISIBILITY.starterPlan` / `enterprisePlan`: public plan-card visibility. Existing account plans are unaffected.

Change a public switch and rebuild/deploy to restore that promotion. The workspace checkboxes intentionally do not control the public website. Public pricing emphasizes Pro and a contact link for larger requirements. Checkout-unavailable messaging remains explicit; no new billing system or plan changes were introduced.

## Verification

Run `npm run build`, then start the local production preview on port 3100 and run `node scripts/audit-workspace.cjs`. The browser check uses synthetic authentication and intercepts every API request with sample data; it creates no shop records or external provider calls.

Verified on 2026-09-21: production build passed with no errors (80 existing lint warnings). Browser checks passed at 320px, 390px and 1440px, including restoring/resetting tools, preference persistence and account isolation, preserved direct links, and suppression of hidden automatic AI requests. French and Arabic navigation and mobile landing/pricing checks also passed. No browser exceptions or horizontal overflow were found in these checks.

This change only simplifies presentation. Payment authorization findings and other launch blockers documented in the audit conversation still require separate work before launch.
