# Venue Operations

> A personal full-stack project built for fun and the challenge — a complete venue operations platform deployed on the edge.

## Live Demo

[View the interactive demo](https://venue-operations-api.dwirog.workers.dev/demo)

---

## What's Built

### Admin Panel

- **Auth** — sign in, invite users, forgot/reset password, role-based access. Signed-out users can reach the forgot and reset password pages.
- **Dashboard** — a bento layout: four stat cards (Revenue, Bookings, Upcoming, Clients) with real comparison lines, Revenue by Month (click a bar to see that month's bookings), Revenue by Event Type (month filter, booking counts, donut), Action Queue (balances still to collect), Upcoming (next events with paid progress), Events (Today, Tomorrow, This week), and a Recent Bookings table. Click a client name to open a detail panel that slides in from the right and can change the payment status. A **+ New booking** button opens the booking form as a popup on the same page. Every dashboard link opens its page with a "Back to dashboard" link.
- **Search** — the top-bar search box looks up bookings, clients, vendors, tenants, and staff.
- **Bookings** — search, filter, edit, bulk delete, and export. Can be filtered to one month. **New Booking** opens the booking form as a popup (the same one as the dashboard button) and saves through the admin create route, which uses the same validation as the public form.
- **Calendar** — monthly view. Past days are dimmed. Events show their type icon (party, lease, market) and are colored by payment status. Clicking an event shows contact details, balance due, and quick actions (email, call, balance reminder).
- **Bills & Payments** — balances, totals with thousands separators, and payment tracking.
- **Floor Plans** — spaces for party rooms, market booths, and lease units. Add and edit in a centered dialog.
- **Clients / Vendors / Tenants / Staff / Contacts** — full CRUD with CSV import/export. Clients are the source for booking and contract contact details.
- **Contracts** — contracts are linked to a client from the Clients list, so names and emails match.
- **QR Codes** — generate event QR codes, track RSVPs and check-ins.
- **Login Management (Team & Access)** — admins only. Add, edit name/email/role, reset password, block, and delete users.
- **Settings** — company name, tax ID, brand colors, logo, typography, fees and taxes, and contact details. Layout density (Comfortable or Compact) is saved per browser.
- **Data Management** — import/export Sanity-backed data types.

### Public-Facing

- **Booking form** — public inquiry at `/book`. Name, email, and phone are required. Errors show inline.
- **RSVP** — token-based RSVP flow via QR code.
- **Client portal** — client login and dashboard (in progress).
- **Error pages** — branded 404 and 500 pages, plus a 403 access-denied page.
- **Demo** — `/demo` shows a read-only sample dashboard and calendar with sample data, for showing the layout without touching live records.

### Data Model

Bookings, clients, vendors, tenants, staff, and contracts live in Sanity. Each booking links to its client by ID, and every screen reads the client's name, email, and phone from that record. Sample records are marked `isSample` so they can be removed in one batch.

---

## Tech Stack

| Layer     | Technology                 |
| :-------- | :------------------------- |
| Framework | Astro 4 + React 19         |
| Styling   | Tailwind CSS 4             |
| CMS       | Sanity v3                  |
| Database  | Cloudflare D1 (SQLite)     |
| Hosting   | Cloudflare Workers         |
| Email     | Resend                     |
| PDF       | @react-pdf/renderer        |
| Charts    | Chart.js + react-chartjs-2 |
| QR Codes  | qrcode                     |
| CSV       | PapaParse                  |
| Icons     | Lucide React               |

---

## Role Access

| Role      | View | Edit | Login Management |
| :-------- | :--: | :--: | :--------------: |
| Admin     |  ✅  |  ✅  |        ✅        |
| Manager   |  ✅  |  ✅  |        ❌        |
| Developer |  ✅  |  ❌  |        ❌        |
| Viewer    |  ✅  |  ❌  |        ❌        |

Viewer and Developer accounts are view-only in two places:
- **Server:** every admin write request is refused with 403 unless the role is Admin or Manager. The one exception is changing your own password.
- **Screen:** Add, Edit, Delete, and Save controls are disabled, and the sidebar hides Settings, Data Management, and the coming-soon pages.

---

## Branding

- The browser icon is the Factory logo, taken from the logo stored in Settings. It is saved as `public/favicon.png`, `public/favicon.ico`, and `public/apple-touch-icon.png`.

---

## Testing

```bash
npx vitest run            # unit tests: booking rules and validation
npx playwright test       # browser tests: booking flow, admin pages, dashboard, calendar, login
npx playwright test --grep-invert WCAG   # everything except the accessibility audit
```

- **Vitest** covers booking validation, the phone-number rule, and the rule that clients cannot set internal fields.
- **Playwright** covers the public booking flow, the admin pages, the dashboard links and dialogs, the calendar, the view-only sidebar, and the error pages. Some tests skip when the live data has no matching record.
- **Accessibility (axe):** the audit runs on every page in light and dark mode. It is not yet passing (see Known Gaps).

Tests that write data are avoided. Anything that changes live Sanity data is run by hand.

---

## Known Gaps

- **Accessibility:** about 32 of 40 pages still fail the WCAG color-contrast check, and some buttons and form fields need accessible names.
- **Account information** shows only the role, not the signed-in user's name or email.
- **Public `/demo` page** is still a sample dashboard with no login.
- **Booking admin edit form** does not yet require a phone number.
- **Sanity token:** the old hardcoded token appeared in git history. Rotate it in Sanity and keep the new one in `.env` only.

---

## Roadmap / Next Phase

- [ ] Client portal — full dashboard for clients to view their bookings and invoices
- [ ] Stripe integration — online payments for bookings and invoices
- [ ] Contracts — digital signing flow (contract records and client links exist)
- [ ] Reports — custom date-range reporting and PDF export
- [ ] Notifications — in-app and email notification system
- [ ] Floor plans — visual space layout builder (space list exists)
- [ ] Inventory & Equipment — asset tracking per event
- [ ] Tasks — internal task management for staff
- [ ] Maintenance — maintenance request tracking

---

## License

© 2026 Dwight Rogers / 09 Labs. All rights reserved.
This is proprietary software. Unauthorized copying, distribution, or use is prohibited.
