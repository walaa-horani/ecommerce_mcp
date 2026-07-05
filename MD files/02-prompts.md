# Step-by-Step Prompts — Multi-Vendor Inventory & Storefront SaaS (Claude Code)

---

## Prompt 1 — Project Setup
```
Set up a new Next.js project (App Router, TypeScript strict, Tailwind, shadcn/ui basics:
button, card, table, input, dialog). Scaffolding only, no pages yet.
```

## Prompt 2 — Design System with Google Stitch
```
Here's my Google Stitch export and DESIGN.md (it covers a public storefront, customer auth,
a protected cart/checkout, and a vendor/admin dashboard — one shared token set). Turn the
tokens into a Tailwind theme extension and a basic layout shell. Confirm palette/fonts first.
```

## Prompt 3 — Connect to Supabase
```
Add Supabase via @supabase/ssr (browser client + server client). No tables yet.
```

## Prompt 4 — Database Schema (SQL only)
```
Write one SQL migration for the following tables. Every table except organizations,
platform_admins, and customers has an org_id FK. Add proper constraints (foreign keys,
not null on essential fields). No RLS yet — that's the next prompt.

- organizations: id, name, slug, plan (free|pro), is_active, created_at
- memberships: id, org_id, user_id, role (owner|admin|staff)
- platform_admins: id, user_id, created_at
- customers: id (references auth.users), name, email, created_at
- warehouses: id, org_id, name, location, created_at
- products: id, org_id, sku, name, description, price, image_url, category, unit,
  reorder_threshold, is_published, created_at
- product_stock: id, org_id, product_id, warehouse_id, quantity
- stock_movements: id, org_id, product_id, warehouse_id, type (in|out|transfer|adjustment),
  quantity, reference_note, created_by, created_at
- carts: id, customer_id (references customers), created_at
- cart_items: id, cart_id, product_id, org_id, quantity
- orders: id, org_id, customer_id (references customers), shipping_address,
  status (pending|paid|fulfilled|cancelled), total_amount, created_at
- order_items: id, order_id, product_id, quantity, unit_price
- suppliers: id, org_id, name, contact_info, created_at
- purchase_orders: id, org_id, supplier_id, status (draft|sent|received), created_at
- purchase_order_items: id, purchase_order_id, product_id, quantity, unit_price
- payments: id, org_id, amount, currency, paytabs_transaction_ref, status, created_at
- audit_log: id, org_id, actor, action, target_table, target_ids, details (jsonb), created_at

Explain each table in one sentence after writing the SQL.
```

## Prompt 5 — Enable RLS
```
Enable RLS on every table. Vendor-scoped tables: policy via org_id + memberships +
auth.uid() (SKILL.md rule 2). Customer-scoped tables (customers, carts, cart_items,
orders-as-buyer): policy via customer_id = auth.uid() (rule 4). The one deliberate public
exception: SELECT on products where is_published = true (rule 3). No anonymous INSERT
anywhere. Give me a manual test for each access pattern (vendor, customer, public read).
```

## Prompt 6 — Sign Up and Login (default: customer account)
```
Build a single, unified sign-up and login flow with Supabase Auth (email + password).
This is the only sign-up flow on the site — there is no separate "vendor sign-up." On
successful sign-up, immediately create a customers row (id = auth.uid(), name, email).
```

## Prompt 7 — "Become a Vendor" Onboarding (upgrade path, not a new account)
```
Add a "Become a Vendor" link in the footer (per DESIGN.md), visible to any logged-in
customer — if logged out, it redirects to sign-in first, then continues. Clicking it opens
an onboarding screen that shows the account's existing info (especially their email,
already captured at Prompt 6) read-only, then asks for store details (name, slug). On
submit, in one transaction: create an organizations row and a memberships row
(role: owner, user_id = auth.uid()) — reuse the SAME account, never create a second one.
```

## Prompt 8 — Platform Admin Setup
```
Add a way to insert the first platform_admins row (a one-time seed script or protected
setup route, not open UI). Add a server-side helper isPlatformAdmin(userId) for admin-only
routes going forward.
```

## Prompt 9 — Service Layer for Products
```
Create lib/services/products.ts: createProduct, getProducts(orgId), getLowStockProducts,
getPublishedProducts (public catalog). Zod-validated, pure functions, no UI yet.
```

## Prompt 10 — Vendor Dashboard: Products Page
```
Build /dashboard/products: a table using getProducts, plus an "Add Product" dialog
(sku, name, description, price, image_url, unit, reorder_threshold, is_published toggle).
No edit/delete yet.
```

## Prompt 11 — Stock Movement Logic (the core of the project)
```
Create recordStockMovement(input) in lib/services/stock.ts. Inside one DB transaction:
insert into stock_movements, then update product_stock (in/out/transfer). If an out/transfer
would exceed available quantity, reject with no changes made. Reject zero/negative quantities.
```

## Prompt 12 — Low Stock Alerts Dashboard
```
Add a low-stock section to /dashboard using getLowStockProducts. No new logic.
```

## Prompt 13 — Public Storefront: Product Catalog
```
Build the public homepage (/) showing a grid of all published products across all vendors,
using getPublishedProducts — no login required to browse. Each card: image, name,
"Sold by [vendor]", price, a stock badge only when low/out, "Add to Cart" button.
Add a small "Become a Vendor" link in the footer only (per Prompt 7) — the top bar stays
customer-only (Amazon pattern).
```

## Prompt 14 — Public Storefront: Product Detail Page
```
Build /products/[id]: image, name, description, price, vendor name, quantity selector,
Add to Cart. Public, no login required to view.
```

## Prompt 15 — Protected Cart (server-side, per SKILL.md rule 4)
```
Create lib/services/cart.ts: addToCart, getCart(customerId), updateCartItem,
removeCartItem. Every function resolves the customer from the authenticated session inside
its Server Action — never accept customer_id as a parameter from the client. If "Add to
Cart" is clicked while logged out, redirect to customer sign-in (Prompt 7) first.
```

## Prompt 16 — Cart Page
```
Build /cart (requires login) showing the current customer's cart items grouped by vendor,
quantity steppers wired to updateCartItem/removeCartItem, subtotal per vendor and overall,
"Checkout" button.
```

## Prompt 17 — Checkout (authenticated, server-resolved — per SKILL.md rule 5)
```
Create createOrder(input) in lib/services/orders.ts and a checkout Server Action that:
resolves customer_id from the session (never from client input), resolves each cart item's
org_id from the product row itself, groups items by vendor and creates one order +
order_items per vendor, calls recordStockMovement (type: out) per item, then clears the
cart. Build a checkout form (shipping address) and an order confirmation page.
```

## Prompt 18 — My Orders (customer-facing order history)
```
Build /account/orders: the logged-in customer's own past orders (via customer_id =
auth.uid()), with status badges.
```

## Prompt 19 — Vendor Dashboard: Orders Page
```
Build /dashboard/orders: a table of the vendor's own orders (getOrders(orgId)), with a
status dropdown (pending/paid/fulfilled/cancelled) wired to updateOrderStatus.
```

## Prompt 20 — Suppliers and Purchase Orders
```
Add lib/services/purchaseOrders.ts (createSupplier, createPurchaseOrder) and a
/dashboard/purchase-orders page (list + create form). This is vendor restocking from
suppliers — separate from customer orders. No plan restrictions yet.
```

## Prompt 21 — Subscription Plans and Feature Gating
```
Create checkPlanLimit(orgId, feature) in lib/services/plans.ts:
free = 1 warehouse, 50 products, no suppliers/PO/MCP. pro = unlimited, all features.
Wire it into createProduct and createSupplier/createPurchaseOrder.
```

## Prompt 22 — PayTabs Payment Integration (vendor plan upgrade)
```
Add PayTabs hosted checkout for a vendor upgrading to 'pro': a Server Action to start
payment, and /api/webhooks/paytabs to receive the callback. Verify the signature before
trusting anything; only a verified "success" callback may set plan='pro' and insert into
payments. Ask me for the PayTabs profile ID and server key names first.
```

## Prompt 23 — Platform Admin Dashboard
```
Build /admin (protected by isPlatformAdmin from Prompt 8): a table of all vendors (name,
plan badge, is_active toggle, product count, order count). Toggling plan/is_active updates
organizations directly — the one place allowed to write across vendors (SKILL.md rule 6).
```

## Prompt 24 — Deployment
```
Prepare for Vercel: list required env vars, confirm .env.example is current, give me a
pre-deploy checklist. No logic changes.
```

## Prompt 25 — Seed Data Script
```
Write a seed script (scripts/seed.ts, run via tsx) that creates: 3-4 fake vendors
(organizations + owner memberships) with a warehouse each and 8-10 published products
(realistic names/prices/placeholder images); 2-3 fake customer accounts; and a handful of
past orders + order_items so the dashboard, storefront, and admin panel look populated on
first run. Safe to re-run without duplicating data.
```

---

# القسم الثاني — مرحلة MCP (Prompts 26-35)

## دليل سريع: امتى بدنا MCP فعلاً؟
عملية بكليكة وحدة **ما بتستاهل MCP** — الداشبورد أسرع وأرخص. منستخدمو بس لأربع حالات:

| الحالة | الأداة |
|---|---|
| فلترة مركّبة | `search_products` |
| تحليل واستنتاج | `get_inventory_insights` |
| سيناريو افتراضي | `simulate_fulfillment` |
| عملية جماعية | `bulk_update_products` |
| صياغة + إرسال | `draft/send_purchase_order` |
| تنسيق بين أدوات | Gmail + الأدوات الموجودة |

## Prompt 26 — Audit Log Table
```
Add audit_log (org_id, actor, action, target_table, target_ids, details jsonb, created_at)
with RLS, plus a logAction() function in lib/services/audit.ts.
```

## Prompt 27 — Remote MCP Server: First Tool
```
Set up the Remote MCP server (app/api/mcp/route.ts, TypeScript MCP SDK). Add one tool:
list_low_stock_products, scoped to the caller's own vendor org_id. Tell me how to test it
locally before deploying.
```

## Prompt 28 — Compound Filtering (search_products)
```
Add search_products: optional filters (category, warehouse_id, status,
no_movement_since_days, min/max quantity). Implement in a new getProductsFiltered()
service function — keep the tool a thin wrapper.
```

## Prompt 29 — Analysis Tool (get_inventory_insights)
```
Add get_inventory_insights. In lib/services/insights.ts, calculate sales velocity per
product from the last 30 days of stock_movements (driven by real customer orders from
Prompt 17), estimate days-until-stockout, and suggest a reorder quantity.
```

## Prompt 30 — What-If Simulation (simulate_fulfillment)
```
Add simulate_fulfillment: given a list of {product_id, warehouse_id, quantity}, compute
resulting stock without writing anything, flagging anything below threshold or negative.
Must stay read-only.
```

## Prompt 31 — Bulk Operations (bulk_update_products)
```
Add bulk_update_products (reuse getProductsFiltered for criteria). Follow the
confirm-before-execute pattern from SKILL.md.
```

## Prompt 32 — Resend Setup
```
Add Resend as the email provider via a Supabase Edge Function send-email
(to/subject/html), with RESEND_API_KEY as a function secret.
```

## Prompt 33 — Draft & Send Purchase Order Emails
```
Add two MCP tools: draft_purchase_order (creates a draft order to a supplier, returns an
email preview, doesn't send) and send_purchase_order_email (sends via Prompt 32,
confirm-gated per SKILL.md).
```

## Prompt 34 — Cross-Tool Orchestration with Gmail (no code — a lesson step)
```
1. In Claude Desktop → Connectors, enable Gmail (official OAuth connector).
2. With the project's MCP server still connected, ask: "Check the latest supplier email
   about pricing and compare it to our current product costs via search_products."
3. Point out: any resulting write still needs a confirm-gated tool — Claude summarizing an
   email is not authorization to write to the database.
```

## Prompt 35 — Final MCP Testing and Deployment
```
Verify the deployed MCP server end to end: confirm /api/mcp is reachable, walk me through
connecting via Claude Desktop + mcp-remote on Windows, and give me 5 example requests
covering Prompts 28-33. No code changes — verification only.
```

---

### General note
Prompts 26-35 are the "advanced MCP" arc — fine as bonus/season-2 episodes if the core
1-25 already feels like a complete series. Run Prompt 25 (seed data) right after Prompt 24
so every later screen recording already looks populated instead of empty.
