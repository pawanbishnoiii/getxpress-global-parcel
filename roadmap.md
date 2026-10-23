# GetXpress roadmap

## Current requested batch
- [ ] Supplied landing hero with admin replacement control and branded banners
- [ ] Faster indexed PIN search and booking contact/billing fields
- [ ] Staff role and territory management
- [ ] Company dashboard charts and wallet transaction sheet with search/help
- [ ] Isolated role-test environment and admin demo fixtures
- [ ] Shiprocket documented configuration; live calls require credentials
- [ ] Preview and regression verification

## Done
- New GetXpress logo everywhere (light version on dark sidebar)
- Onboarding: no placeholder email, verified phone chip, state + district only
- AI address check page for staff
- Orders: multi-sort, pincode/date filters, bulk status, CSV + Excel
- Audit log (orders, roles, providers, WhatsApp, parcel scans) with live view
- Fullscreen button, dashboard quick actions, database migrations started
- PIN lookup: 26,711 codes with town/post-office suggestions; imported into the database
- All-state district selectors, optional onboarding PIN and required WhatsApp
- Domestic booking tested through test-code confirmation, bill and tracking read-back
- International quote form tested with saved request and reference; no live international dispatch
- Landing photograph/footer refreshed, GSAP retained, reduced-motion Lottie added
- Tracking progress, parcel IDs, refresh, copy link and missing/error states
- Admin parcel/service/handling prices and policy consent; prohibited-item screening
- Reviewed migration conflict, applied additive shipping fields and quote request storage
- Available admin dashboard/pages visited; role navigation tests passed
- International quote read back on admin dashboard; onboarding Raisinghnagar search verified
- Public sitemap and unique page metadata checked; all 57 tests passed

## Open
- Live Maps rendering/reverse lookup — user must test on an authorized deployed origin
- Other-role live dashboard checks and account creation — need isolated test environment or approved real staff identities
- WhatsApp OTP + "WhatsApp off" banner + admin settings — waiting on TezSender API example
- Branded email notifications — needs an email domain set up
- Real support WhatsApp number (currently placeholder)
- Final legal policy approval, exact refund fees/timing and liability terms — business owner confirmation needed
- [ ] Real payment/SMS/courier API calls + partner webhooks (blocked: partner API keys/docs)
- [ ] Per-role test accounts check (blocked: needs isolated test environment)
- [ ] New landing photography + advanced GSAP motion pass

## Remix setup
- [x] Update SMTP_PASSWORD and SMTP_USERNAME through secure forms
- [x] Link managed Google Maps to this remix
- [x] Remove copied migrations and snapshots; initialize empty PostgreSQL journal without changing stored data
- [x] Repair malformed SMTP page header blocking preview

## Oct 23 batch
- [x] Warehouse hero photo with branding + female ops lead
- [x] GXQ international references trackable on /track
- [x] Removed /address-check; dashboard greeting removed
- [x] Users list includes every account
- [ ] Isolated test setup + per-role accounts (needs a separate test backend)
- [ ] International: auto dial code per country, 8–12 city suggestions
- [ ] Staff console rework (country → number → user → area/hub PIN; 28 states; UT list; area names)
- [x] Manual UPI/bank deposit with UTR + photo, admin approval credits wallet
- [x] Staff assignment (user → role → state → area → hub PIN) + territory map
- [ ] network/state manager/hub dashboards & CRM
- [ ] Admin on/off for roles and services; email logo + automation upgrade; GSAP scroll effect
- [x] Tracking question box with code entry on /track; international air-weight + customs checklist; hero regenerated; phone sign-in without photo
