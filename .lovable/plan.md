# NoteVault — Handwritten MHT CET Std 12 Notes Store

A monochrome, editorial-styled storefront where students browse and buy handwritten notes for Maharashtra HSC Std 12 / MHT CET — Physics, Chemistry, Maths, Biology.

## Visual direction
- Pure black & white only — `#000` ink on `#FFF` paper, with subtle warm-gray (`#F4F4F2`) section bands.
- Typography: serif display (Fraunces) + clean sans (Inter) — feels like a handwritten notebook + modern bookstore.
- Notebook texture details: ruled-line dividers, hand-drawn underline accents, subtle paper grain on hero.
- Strict design tokens in `src/styles.css` (no ad-hoc colors in components).

## Pages
1. `/` — Hero ("Topper's handwritten notes. Now in your hands."), featured subjects, why-handwritten section, testimonials, CTA.
2. `/notes` — Catalog: grid of all note packs, filter by subject (Physics / Chemistry / Maths / Biology) and type (chapter-wise / full subject / PYQ).
3. `/notes/$slug` — Product detail: preview pages, what's inside, pages count, price, Buy button.
4. `/cart` — Cart with line items, totals, checkout button.
5. `/auth` — Sign in / sign up (email + Google).
6. `/account/orders` — User's past orders + download links (under `_authenticated`).
7. `/success` & `/cancel` — Post-checkout.

## Backend (Lovable Cloud)
- Tables: `products`, `product_files` (PDF storage path + previews), `orders`, `order_items`, `profiles`, `user_roles` (admin can later add notes).
- RLS: anyone reads `products`; users read their own `orders`/`order_items`; only buyers get signed-URL access to `product_files`.
- Storage bucket `notes-pdfs` (private) for full handwritten PDFs; `notes-previews` (public) for sample pages.
- Auth: email/password + Google.

## Payments
Run `recommend_payment_provider` → most likely **Paddle** (digital products, MoR handles Indian GST). Single-item & cart checkout via Paddle. Webhook fulfills order → grants download access.

## Build order
1. Design system + landing page + catalog UI with seed data (no backend).
2. Enable Lovable Cloud → schema, seed 8–12 sample note packs.
3. Auth (email + Google) + account/orders page.
4. Run payments eligibility check → enable provider → wire checkout + webhook + download links.

I'll start by generating the design directions in black & white so you can pick the exact look before I build.