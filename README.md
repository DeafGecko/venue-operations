# Venue Operations

> A personal full-stack project built for fun and the challenge — a complete venue operations platform deployed on the edge.

## Live Demo

[View the interactive demo](https://venue-operations-api.dwirog.workers.dev/demo)

---

## What's Built

### Admin Panel

- **Auth** — login, invite users, forgot/reset password, role-based access
- **Dashboard** — revenue, reservations, occupancy, and QR scan analytics
- **Bookings** — create, search, filter, edit, bulk delete, and export reservations
- **Calendar** — monthly view with reservation indicators
- **Bills & Payments** — invoices, balances, and payment tracking
- **Spaces** — configure venues, rooms, vendor spaces, and booths
- **Clients / Vendors / Tenants / Staff** — full CRUD with CSV import/export
- **QR Codes** — generate event QR codes, track RSVPs and check-ins
- **Login Management** — invite users, assign roles, reset passwords, block accounts
- **Settings** — brand colors, logo, and typography via Sanity CMS
- **Data Management** — import/export Sanity-backed data types

### Public-Facing

- **Booking form** — public event inquiry/booking page
- **RSVP** — token-based RSVP flow via QR code
- **Client portal** — client login and dashboard (in progress)

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

---

## Roadmap / Next Phase

- [ ] Client portal — full dashboard for clients to view their bookings and invoices
- [ ] Stripe integration — online payments for bookings and invoices
- [ ] Contracts — digital contract generation and signing flow
- [ ] Reports — custom date-range reporting and PDF export
- [ ] Notifications — in-app and email notification system
- [ ] Floor plans — visual space layout builder
- [ ] Inventory & Equipment — asset tracking per event
- [ ] Tasks — internal task management for staff
- [ ] Maintenance — maintenance request tracking

---

## License

© 2026 Dwight Rogers / 09 Labs. All rights reserved.
This is proprietary software. Unauthorized copying, distribution, or use is prohibited.
