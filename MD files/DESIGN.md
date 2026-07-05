# DESIGN.md — Multi-Vendor Inventory & Storefront SaaS

## Brand Mood
A SaaS platform where multiple vendors sell products through one shared marketplace
(Amazon-like storefront), while each vendor manages inventory through a calm, precise,
trustworthy operations dashboard. Two moods, one shared visual language:
- **Storefront (customer-facing)**: retail-friendly, product-forward, easy to scan and buy.
- **Dashboard (vendor + admin)**: calm, data-dense, professional — no decoration for its own sake.

## Color Palette (shared across both modes)

| Role | Color | Hex |
|---|---|---|
| Primary (brand, buttons, links) | Deep Indigo | `#3730A3` |
| Primary Hover | Indigo (darker) | `#312E81` |
| Accent (price, CTAs on storefront) | Amber | `#D97706` |
| Success (in stock, order placed) | Emerald | `#059669` |
| Danger (out of stock, errors) | Rose | `#DC2626` |
| Background | Off-white | `#F8FAFC` |
| Surface / Cards | White | `#FFFFFF` |
| Border | Light Gray | `#E2E8F0` |
| Text Primary | Slate | `#0F172A` |
| Text Secondary | Slate Gray | `#64748B` |

## Typography
- Font family: **Inter**
- Headings: semi-bold, tight letter spacing
- Body: regular weight, 14–16px base
- Prices: tabular figures, bold, larger than surrounding text
- Dashboard numeric data (quantities): tabular figures, medium weight

## Spacing & Shape
- 4px base spacing scale
- `rounded-lg` (8px) for cards/inputs, `rounded-full` for badges and the cart icon count
- Cards: `shadow-sm`, 1px Border, generous padding (16–24px)

---

## PART A — Storefront (customer-facing)

### Layout
- **Top bar**: logo left, search bar center, account icon + cart icon (item count badge)
  top-right. Account icon shows "Sign In" when logged out, avatar/initials when logged in.
  This top bar is customer-facing only — there is no vendor login link here.
- **Footer**: small, secondary link — "Sell on [Platform Name]" — this is the *only* entry
  point to vendor login (/login), consistent with the Amazon pattern (selling is a
  secondary, opt-in path, never presented as equal to shopping)
- **Product grid**: responsive card grid, 4 columns desktop / 2 tablet / 1 mobile — browsable
  with no login required
- **Product card**: image, name, "Sold by [Vendor]", price in Amber bold, "Add to Cart" button
- **Product detail page**: image left, name/price/description/vendor/quantity/Add to Cart right
- **Sign In / Create Account** (customer, separate from vendor login): centered card,
  email/password, tab or link to switch between the two modes
- **Cart page**: requires login — if a logged-out visitor clicks "Add to Cart" or the cart
  icon, redirect to Sign In first, then back to where they were. Line items grouped by
  vendor, qty steppers, subtotal per vendor and overall, "Checkout" button
- **Checkout page**: shipping address form (pre-fillable from profile), order summary
  sidebar, "Place Order" button
- **Order confirmation**: centered success card (Emerald checkmark), order number, summary
- **My Orders page**: authenticated customer's own order history, status badges

### Storefront Components
- **Stock badge**: small pill on product card — shown only when low/out, hidden otherwise
- **Auth-gate prompt**: lightweight inline card ("Sign in to add items to your cart") rather
  than a jarring full-page redirect where possible

---

## PART B — Dashboard (vendor + platform admin)

### Layout
- **Left sidebar** (~240px): logo, nav (Dashboard, Products, Orders, Warehouses,
  Purchase Orders, Settings), plan badge (Free=gray / Pro=indigo) at the bottom
- **Top bar**: page title left, primary action button right
- **Main content**: max-width container, cards/tables on a consistent grid

### Dashboard Components
- **Status badges**: stock (`In Stock` green / `Low Stock` amber / `Out of Stock` red),
  order status (`Pending` gray / `Paid` indigo / `Fulfilled` green / `Cancelled` rose)
- **Data tables**: clean row dividers, right-aligned numeric columns, light indigo hover
- **Alert cards** (low stock): amber left border accent, product name bold
- **Confirmation panel** (MCP bulk/send actions): amber-bordered card with preview text +
  explicit Confirm/Cancel buttons
- **Platform Admin table**: vendor list (name, plan badge, status toggle, product/order counts)

## What NOT to do
- No illustrations, no decorative icons beyond simple line icons
- No gradients or heavy shadows — flat, data-focused
- No playful/mascot visuals — professional operations + retail tool
- Don't let the storefront and dashboard look like two different products — same tokens
- Don't let "Sign In" feel like a wall — keep it fast, minimal fields, one clear CTA
