# ProxiMateDate

Website-only long-distance date night at [proximatedate.com](https://www.proximatedate.com). Vite + React. There is no iOS/Android app.

## What ships in this preview

Three rooms:

- **Restaurant** (`/restaurant`): **$9.99** before the walk-in (host, tables, sit down), then dual menus and waiter serving videos. **90 minutes after you sit.** LIVE idle is a seated 1x dining room.
- **Movie Night** (`/movie-night`): **$14.99** before the walk-in (ticket booth, lobby, popcorn, seats), then Watch Together for **2.5 hours**. Official YouTube IFrame Player (`youtube.com/iframe_api`). Paste a youtube.com / youtu.be link, then press Play. Floating chat opens with Play. Netflix stays on your own accounts as companion mode.
- **Free Date Night** (`/date-night`): **free for 30 minutes**. Remaining time is on the clock. About three minutes before cutoff the **host** (not the guest) can pay **$2.99** on Stripe Checkout to extend. If they do not, the date ends at 30:00. No menus, no movie player.
- **Dates chooser** (`/date-room`): picks a room. Old Watch Together follower links (`?watch=` / `?follow=1`) redirect to movie night. Guest `?follow=1` links skip a second payment.

Other:

- **Companion mode:** countdown + chat while each person uses their own Netflix / Hulu / Disney+ / Prime app. No unofficial stream URLs. We do not bypass YouTube age-restriction.
- **Waitlist:** Sign In / Get Started / Contact post to FormSubmit (`atahoelife@gmail.com`, subject **ProxiMateDate waitlist**).
- **Pricing:** Dinner **$9.99** (90 minutes), Movie Night **$14.99** (2.5 hours), Premium Romance **$24.99** (both paid rooms, 3 hours). Candlelight Chat is free for 30 minutes, then **$2.99** to extend (host only). Paid rooms use Stripe Checkout when a secret key is configured. This site never collects raw card numbers and does not send people to PayPal, Venmo, or Cash App. If the key is missing, paid buttons collect a waitlist email.

### Watch Together sync (limitation)

There is no websocket server yet.

- In one browser there is a single movie player (the host). A follower tab stays in sync; there is no second partner video box on the same screen.
- Copy the room link (`?room=&watch=&follow=1`) to open a second tab on the **same computer**. That tab follows via `localStorage` + BroadcastChannel + a 400ms poll.
- Two phones can open the same video from the URL; lockstep across devices needs a realtime backend we have not added.

## Local development

```bash
npm install
npm run dev
```

`npm run build` type-checks and emits `dist/`. Local Vite serves `/api/live-room`, `/api/room-start`, `/api/feedback`, and `/api/stats`. Paid Pricing buttons still need `STRIPE_SECRET_KEY` on Vercel; without it they collect a waitlist email.

Cloudflare Workers Git builds (if connected) need this Wrangler file and a dashboard **Build command** of `npm run build`. They serve the SPA only; Stripe Checkout is the Vercel function.

## Stripe Checkout (website only)

Paid plans: Dinner **$9.99**, Movie Night **$14.99**, Premium Romance **$24.99** (unlocks both for 3 hours). Candlelight Chat is free for 30 minutes; extend is **$2.99**. Restaurant and movie night are gated until Checkout succeeds in this browser (`?paid=1`). Extend returns to `/date-night?paid=1&plan=extend`.

1. Create a Stripe account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. From Developers → API keys, copy the **Secret key** (`sk_test_…` for testing, `sk_live_…` for production). Never put this in the frontend repo.
3. In the [Vercel project](https://vercel.com) → Settings → Environment Variables, add:
   - `STRIPE_SECRET_KEY` = that secret
   - optional `PUBLIC_SITE_URL` = `https://www.proximatedate.com` (used for success/cancel URLs)
   - `STATS_KEY` = a long random password for the private counts page (never `VITE_`)
   - `VERCEL_PREVIEW_FEEDBACK_ENABLED` = `0` (documented toolbar disable for preview branches)
4. Same Vercel project → Settings → General → **Vercel Toolbar** → **Production: Off** (and Preview: Off). Customers must never see the comments / draft / feedback bubble on proximatedate.com. `vercel.json` also sends `x-vercel-skip-toolbar: 1`, and `index.html` removes the `vercel-live-feedback` widget if the platform still injects it.

   A `.env.example` file in this repo lists the same names. Do not put the secret in a `VITE_` variable or it would ship to the browser.
5. Redeploy. Pricing CTAs `POST /api/create-checkout`, then redirect to Stripe-hosted Checkout.
6. If the key is missing, the API returns 503 and the site collects a waitlist email instead. No card fields are rendered on proximatedate.com.

Checkout success returns to the matching room (`/restaurant`, `/movie-night`, `/date-night` for extend, or `/date-room`) with `?paid=1&plan=…`, which unlocks that room (or both, for Premium) in this browser. Extend adds 30 minutes to the free date night clock. If the key is missing, we never render a card form on this site — waitlist email only.

## Private evening counts (Gregory only)

This page is not linked from the public nav, footer, or homepage. Customers and ad landings never see it.

1. In Vercel → Settings → Environment Variables, set `STATS_KEY` to a long random password. Do not prefix it with `VITE_`.
2. Redeploy production.
3. Open `https://www.proximatedate.com/stats?key=` plus that same value. You can also type the password on `/stats`. HTTP Basic uses the same password.

The page shows unique room starts this website recorded (Free Date Night, Dinner, Movie Night) and, when `STRIPE_SECRET_KEY` is present, paid Checkout sessions (dinner $9.99, movie $14.99, premium $24.99, extend $2.99). It also lists recent private feedback from ended dates and the footer form. Feedback is never shown on the public site, homepage, or nav. There is no mailer: notes are stored with room starts on this server (they can reset if the host moves machines). Free dates never hit Stripe unless someone extends. Counts are never invented: if Stripe is missing, paid rows stay blank instead of showing zero.
