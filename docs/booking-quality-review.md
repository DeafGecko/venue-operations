# Booking flow quality review

Scope: public booking form (/book), confirmation page (/client/dashboard), and the admin pages a booking touches (calendar, bills).

## The main problem: the public booking endpoint trusted the request body

**Problem.** `POST /api/create-booking` built the Sanity document with `_type: 'booking', ...formData`. Because the spread came last, a request could override `_type`, and any other field, so the public endpoint could write documents of any type into the dataset, including `adminUser` records. The Sanity token and project ID were also hardcoded in the file.

**Fix.** `src/lib/booking.ts` validates the input (`validateBookingInput`) and builds the stored document from a fixed set of fields (`buildBookingDocument`). Server-owned fields (`_type`, `paymentStatus`, `amountPaid`, `totalPrice`, `accountNumber`) are set by the server only. The endpoint uses the shared Sanity client, which reads credentials from the environment.

**Test.** `src/lib/booking.test.ts` ("ignores client-supplied Sanity and payment fields") sends `_type: 'adminUser'`, `role`, `passwordHash`, and `paymentStatus: 'paid'`, and asserts the built document has only booking fields.

## Other fixes, each with its test

| Problem | Fix | Test |
| --- | --- | --- |
| Step 1 "Next" skipped required name and email, so an empty booking could be submitted | `reportValidity()` before moving to step 2 | `booking-flow.spec.ts`: "step one cannot advance while name or email is empty" |
| `bg-primary` and `ring-primary` were undefined, so the main button had no background | `--color-primary` defined in `src/styles/global.css` | "page has a title, description, and visible primary action" |
| Public layout never loaded the stylesheet | `Layout.astro` imports `global.css` | Same spec (background check) |
| Errors shown with `alert()` and labels not linked to inputs | Inline `role="alert"` messages, `htmlFor`/`id` on every field, focus moved to each step heading | "server validation errors appear next to the field, not in an alert box"; "network failure shows an inline message" |
| Admin login subtitle and footer text failed WCAG AA contrast | Darker grays | `accessibility.spec.ts` (axe, wcag2aa) |
| Admin and client pages were indexable | `X-Robots-Tag` on admin responses, `noindex` on the confirmation page, `robots.txt` disallows `/admin` and `/api/admin` | `search-and-mobile.spec.ts` |
| Admin avatar menu missing Settings, account information, and a logout on Settings | Menu now has Settings, Account information, disabled Change password; Settings page has a Log out link; new `/admin/account` page | `admin-account-menu.spec.ts` |

## Open items (not changed)

- **Rotate the Sanity token.** The old hardcoded token is in git history. It must be revoked and replaced.
- **Confirm the Sanity project.** The public form and confirmation page used project `maowljqt`; `.env` uses `mzqx3hwz`. Bookings from the public form now go to `mzqx3hwz`. If `maowljqt` was intended, change the shared client.
- **Confirmation page shows personal details to anyone with the document ID.** Needs a lookup that also checks the account number and email.
- **Client login posts to `/api/client/auth`, which does not exist.**
- **Header account menu is hidden below the `lg` breakpoint.** Phone users reach Settings from the sidebar.
- **Booking endpoint has no rate limit or bot check.**
- **Calendar and bills tests read live Sanity.** The create step is stubbed. The payment-status test needs `E2E_BOOKING_ID`.

## Running the checks

- `npx vitest run`: 12 unit tests pass.
- `npx playwright test`: 33 pass, 3 skipped (phone account menu, and payment status without `E2E_BOOKING_ID`).
- Lighthouse on /book against the dev server: performance 100, accessibility 100, best practices 100, SEO 91. Dev-server numbers are rough; run it against a deployed build for real figures.
