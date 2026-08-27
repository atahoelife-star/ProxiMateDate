# ProxiMateDate

Website-only long-distance date night at [proximatedate.com](https://www.proximatedate.com). Vite + React. There is no iOS/Android app.

## What ships in this preview

- **Date Room (free):** both restaurant menus in one session, waiter serving videos, chat, YouTube Watch Together, Netflix-class companion countdown.
- **Watch Together:** official YouTube IFrame Player (`youtube.com/iframe_api`). Paste a youtube.com / youtu.be link, then press Play. If the video cannot embed, Play becomes Watch on YouTube and opens that same video. No fake Netflix or other catalogs.
- **Companion mode:** countdown + chat while each person uses their own Netflix / Hulu / Disney+ / Prime app. No unofficial stream URLs.
- **Waitlist:** Sign In / Get Started / Contact post to FormSubmit (`atahoelife@gmail.com`, subject **ProxiMateDate waitlist**).
- **Pricing:** paid one-time amounts use Stripe Checkout when a secret key is configured. This site never collects raw card numbers.

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

`npm run build` type-checks and emits `dist/`. Local Vite has no `/api` routes, so paid Pricing buttons fall through to the email waitlist.

Cloudflare Workers Git builds (if connected) need this Wrangler file and a dashboard **Build command** of `npm run build`. They serve the SPA only; Stripe Checkout is the Vercel function.

## Stripe Checkout (website only)

Paid plans: Dinner **$9.99**, Movie Night **$14.99**, Premium Romance **$24.99**. Candlelight Chat stays free. The Date Room is not gated.

1. Create a Stripe account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. From Developers → API keys, copy the **Secret key** (`sk_test_…` for testing, `sk_live_…` for production). Never put this in the frontend repo.
3. In the [Vercel project](https://vercel.com) → Settings → Environment Variables, add:
   - `STRIPE_SECRET_KEY` = that secret
   - optional `PUBLIC_SITE_URL` = `https://www.proximatedate.com` (used for success/cancel URLs)

   A `.env.example` file in this repo lists the same names. Do not put the secret in a `VITE_` variable or it would ship to the browser.
4. Redeploy. Pricing CTAs `POST /api/create-checkout`, then redirect to Stripe-hosted Checkout.
5. If the key is missing, the API returns 503 and the site collects a waitlist email instead. No card fields are rendered on proximatedate.com.

Checkout success returns to `/date-room?paid=1`. Success does not unlock features — the date room was already free.
