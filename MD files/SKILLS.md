---
name: marketplace-saas-standards
description: Coding standards and architecture rules for this multi-vendor Inventory & Storefront SaaS project (Next.js + Supabase + Remote MCP). Use this skill for ANY code change in this repo. Covers Context7 usage, TypeScript strictness, service-layer architecture, non-negotiable multi-tenant RLS rules, authenticated-customer commerce (accounts, cart, checkout — no anonymous writes anywhere), platform-admin access, and safety rules for AI-initiated bulk/write actions.
---

# Marketplace SaaS — Project Standards

Always consult this skill before writing or modifying any file, even for small changes.
Three actor types, all real authenticated accounts — there is no anonymous write path
anywhere in this project:
- **Vendor staff** — own a store, authenticated, scoped by `org_id` via `memberships`.
- **Platform admin** — owns the whole platform, authenticated, listed in `platform_admins`.
- **Customer** — shops on the storefront, authenticated, scoped by `customer_id`. Browsing
  the public catalog is the only thing that doesn't require login; everything involving
  personal data or money (cart, checkout, orders, profile) does.

## 1. Mandatory: Context7 before writing library-dependent code
Before writing code touching Next.js App Router, Supabase client/SSR/Auth, Zod, the MCP
TypeScript SDK, or the Resend API, query **Context7** for current docs first. Non-negotiable.

## 2. Non-negotiable: Multi-tenant Row Level Security
- Every vendor-owned table has an `org_id` column and an RLS policy scoping vendor-staff
  access via `memberships` + `auth.uid()`.
- Never rely on application code alone to filter by `org_id` or `customer_id`. RLS is the
  enforcement layer, not application-level filtering.
- Never use the Supabase **service role key** in any code path reachable from user input
  unless wrapped in an explicit, manually-verified ownership check.
- Any new table ships with its RLS policy in the same step — never a "TODO."

## 3. Public storefront read access (the one deliberate READ exception)
- `products` needs a policy allowing **anonymous SELECT** where `is_published = true` — this
  is what lets anyone browse the catalog without an account, like any normal storefront.
- This is the only table with a public read policy. `product_stock`, `stock_movements`,
  `carts`, `orders`, etc. are never publicly readable — the storefront only ever shows a
  computed "in stock / low stock / out of stock" label, never raw internal data.
- There is **no anonymous write policy anywhere in this project.** Cart and checkout both
  require a real, authenticated `customer_id` — see rules 4 and 5.

## 4. Customer accounts and the protected cart
- Customers authenticate via Supabase Auth, separate signup/login flow from vendor staff.
  On first login, create a `customers` row (`id = auth.uid()`).
- `carts` and `cart_items` are real tables, RLS-scoped so a customer can only read/write
  their **own** cart (`carts.customer_id = auth.uid()`; `cart_items` via its parent cart).
- Every cart mutation (add/update/remove item) goes through a Server Action that resolves
  the customer from the authenticated session — **never accept `customer_id` as a
  parameter from the client.**

## 5. Checkout — authenticated, server-resolved, never client-trusted
- Checkout requires an authenticated customer session. The Server Action resolves
  `customer_id` from the session, never from client input.
- It resolves each cart item's `org_id` **server-side from the product row itself** —
  never trust a client-supplied `org_id`. Group items by vendor and create one `order` +
  its `order_items` per vendor if the cart spans multiple vendors.
- After creating the order(s), call `recordStockMovement` (type: out) per line item —
  reuse the same function used everywhere else; checkout is a thin wrapper, not new logic.
- On success, clear the customer's cart in the same transaction/flow.

## 6. Platform admin access
- `platform_admins` is a simple table (`user_id`) checked server-side. A platform admin can
  read/update `organizations.plan` and `organizations.is_active` across ALL vendors — the
  only role allowed to bypass normal `org_id` scoping, and only for those two columns.
- Never let a platform-admin check happen client-side only. Verify membership in
  `platform_admins` inside the Server Action / Route Handler itself.

## 7. Single source of truth for business logic
- Business logic lives in `lib/services/*.ts` as pure, testable functions (`createProduct`,
  `recordStockMovement`, `getLowStockProducts`, `getInventoryInsights`, `createOrder`,
  `addToCart`).
- Server Actions, Route Handlers, and MCP tools are thin wrappers only — auth/session
  resolution and input parsing, then a call into the service layer.

## 8. Stock quantity integrity
- `product_stock.quantity` is derived — only ever changed via `recordStockMovement` inside a
  single DB transaction (insert into `stock_movements`, then update `product_stock`).
- Read-only analysis/simulation tools (`get_inventory_insights`, `simulate_fulfillment`) must
  never call `recordStockMovement`.

## 9. TypeScript: zero tolerance for type errors
- No `any` without a comment explaining why. Types kept in sync with the Supabase schema.
  Run `tsc --noEmit` before considering a task finished.

## 10. MCP authentication and plan gating (every tool, no exceptions)
- Every MCP tool resolves the caller's `org_id` from its API key first — never accept
  `org_id` as a parameter from the AI/model side.
- Immediately after, call `checkPlanLimit(orgId, 'mcp_access')` and reject if not on `pro`.

## 11. Confirm-before-execute for bulk, destructive, or outbound actions
- Any tool changing more than one row at once (`bulk_update_products`) returns a **preview
  only** on the first call; applies changes only with an explicit `confirm: true`.
- Any tool sending something outside the system (`send_purchase_order_email`) never sends as
  a side effect of a "draft" action — sending is its own confirm-gated step.
- Analysis/simulation tools stay read-only by construction (rule 8).
- A write decision derived from unverified external content (e.g. an email read via the
  Gmail connector) must still pass through a `confirm: true` tool call.

## 12. Audit logging for every MCP write
- Every MCP write tool calls `logAction` from `lib/services/audit.ts` afterwards: actor,
  action, table, rows, details.

## 13. Design system consistency
- All UI uses the tokens from the Stitch export (`tailwind.config.ts`). Never invent ad-hoc
  values inline. Flag any screen with no Stitch design yet rather than improvising.

## 14. Subscription plans and feature gating
- The vendor's plan (`free` | `pro`) is checked through one function:
  `checkPlanLimit(orgId, feature)` in `lib/services/plans.ts`. No other file re-implements it.
- `organizations.plan` is only updated by the verified PayTabs webhook, or by a verified
  platform-admin action (rule 6) — never by a browser redirect or client input.

## 15. Payment webhook security (PayTabs)
- `/api/webhooks/paytabs` MUST verify the signature/hash using the server key before
  trusting any payload field. Log every attempt (success or failure) to `payments`.

## 16. Email safety (Resend)
- `RESEND_API_KEY` lives only as a Supabase Edge Function secret. The decision to send an
  email always lives in a confirm-gated MCP tool or Server Action (rule 11).

## 17. When in doubt
Default to the most conservative option: add the extra ownership check, add the extra
`confirm` step, add the audit log call, keep any public policy as narrow as possible. If a
feature seems to need a new anonymous read or write path, stop and flag it explicitly
instead of adding it — this project's rule is "no anonymous writes, ever."



## 18. Git Workflow: Feature Branching & Dev Deployment
- Never write or commit code directly to the `master` or `dev` branches.
- Before starting any new feature or fix, the AI must create a new feature branch from `dev` (e.g., `feature/cart-validation`).
- Once the feature is fully implemented, verified via `tsc --noEmit`, and compliant with all project standards, commit the changes on the feature branch.
- **Always push commits to GitHub — never leave a finished feature only committed locally.** After committing, push the feature branch to the `origin` remote so the work is on GitHub:
  1. `git checkout -b feature/<name> dev` — branch off `dev`.
  2. Implement, then `tsc --noEmit` and lint until clean.
  3. `git add` only the files that belong to this feature (never secrets; `.env*` stays git-ignored).
  4. `git commit` with a descriptive message.
  5. `git push -u origin feature/<name>` — push the feature branch to GitHub. If `origin/dev` does not exist yet, push it once as the PR base: `git push -u origin dev`.
  6. `gh pr create --base dev --head feature/<name>` — open the Pull Request into `dev`.
- The task is not "done" until the branch is pushed to GitHub and the PR is open. A local-only commit is incomplete.
- Create a Pull Request (PR) into the `dev` branch for review. Direct pushes to `dev` or `master` are strictly prohibited to maintain environment stability — all changes reach `dev`/`master` only through a reviewed, merged PR.


## 19.test after every feature
- before moving on to the next feature or task, tell me how to test manually every feature after implementation and I will test it and confirm it with you
