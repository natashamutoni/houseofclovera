# House of Clovera

Deploy on Vercel: import this folder (or push it to GitHub and import). Vercel detects Vite automatically
(build: `npm run build`, output: `dist`). Local: `npm install && npm run dev`.

- Products, prices, delivery fees, free-delivery threshold and WhatsApp number: `src/clovera/data.ts` (sample data — replace before launch).
- Images: `src/assets/` — replace with real mannequin photos using the same filenames.
- Cart, wishlist and orders are stored in the visitor's browser. Checkout runs in TEST MODE.

Still needed before launch: a database + admin dashboard, live payments (MTN MoMo / Airtel Money / card via a
Ugandan provider such as Flutterwave or Pesapal) with server-side order validation, and the real WhatsApp number.
