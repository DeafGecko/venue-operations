# Venue Operations

[![Astro](https://img.shields.io/badge/Astro-4-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Sanity](https://img.shields.io/badge/Sanity-v3-F03E2F?logo=sanity&logoColor=white)](https://sanity.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-FF6F00?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> A personal full-stack project built for fun and the challenge — a complete venue operations platform deployed on the edge.

**Live:** [venue-operations-api.dwirog.workers.dev](https://venue-operations-api.dwirog.workers.dev)

## Demo Access

For portfolio and review purposes:

- **URL:** [Admin login](https://venue-operations-api.dwirog.workers.dev/admin/login)
- **Email:** `demo@09labs.dev`
- **Password:** `[demo password]`
- **Role:** Viewer

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

## Getting Started

Follow these steps to run the project on your computer.

### 1. What You Need

Install or create these first:

- Node.js 22+
- Sanity account (free tier works)
- Cloudflare account (free tier works)
- Resend account (free tier works)

### 2. Download the Project

Open a terminal and run:

```bash
git clone https://github.com/DeafGecko/venue-operations.git
cd venue-operations
npm install
```

### 3. Set Up Wrangler

The real `wrangler.toml` file is not saved in Git because it holds settings for your machine. Copy the example file to make your own:

```bash
cp wrangler.toml.example wrangler.toml
```

Open `wrangler.toml` and replace the example values with your own Cloudflare and Sanity settings.

### 4. Add Environment Variables

Create a file named `.env` in the main project folder. Add your own values:

```env
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_token
SUPER_ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=your_secure_password
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=noreply@yourdomain.com
PUBLIC_BASE_URL=http://localhost:4321
```

Do not share this file or commit it to Git. It contains private keys and passwords.

### 5. Run the Project

Start the website:

```bash
npm run dev
```

To use Sanity Studio, open a second terminal and run:

```bash
npm run studio
```

Then open [http://localhost:4321/admin/login](http://localhost:4321/admin/login) in your browser.

### 6. Deploy to Cloudflare

Upload your private values one time:

```bash
npx wrangler secret put SANITY_API_TOKEN
npx wrangler secret put SUPER_ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put RESEND_API_KEY
```

Build and deploy the project:

```bash
npm run build && npx wrangler deploy
```

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
