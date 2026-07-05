import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { verifyApiKey } from '@/lib/services/api-keys'
import { checkPlanLimit } from '@/lib/services/plans'
import { getLowStockProducts, getProductsFiltered, simulateFulfillment, bulkUpdateProducts } from '@/lib/services/inventory'
import { getInventoryInsights } from '@/lib/services/insights'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

/**
 * Handles incoming MCP API calls.
 * Implements a stateless Streamable HTTP server per the MCP SDK documentation.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized: Missing or invalid Authorization header', { status: 401 })
    }

    const rawKey = authHeader.substring(7)
    const supabase = createAdminClient()

    // Resolve caller's org_id from its API key first (SKILLS.md rule 10)
    const orgId = await verifyApiKey(supabase, rawKey)
    if (!orgId) {
      return new Response('Unauthorized: Invalid API key', { status: 401 })
    }

    // Call checkPlanLimit(orgId, 'mcp_access') and reject if not on pro (SKILLS.md rule 10)
    const planCheck = await checkPlanLimit(supabase, orgId, 'mcp_access')
    if (!planCheck.allowed) {
      return new Response('Forbidden: MCP access requires a Pro plan', { status: 403 })
    }

    const server = new McpServer({
      name: 'ecommerce-mcp',
      version: '1.0.0'
    })

    server.registerTool(
      'list_low_stock_products',
      {
        description: 'Lists products with stock levels at or below a given threshold.',
        inputSchema: z.object({
          threshold: z.number().optional().describe('Stock threshold to consider as low. Defaults to 10.')
        })
      },
      async ({ threshold }: { threshold?: number }) => {
        const products = await getLowStockProducts(supabase, orgId, threshold ?? 10)
        return {
          content: [
            { type: 'text', text: JSON.stringify(products, null, 2) }
          ]
        }
      }
    )

    server.registerTool(
      'search_products',
      {
        description: 'Powerful product search with complex inventory-aware filters.',
        inputSchema: z.object({
          category: z.string().optional().describe('Filter by category'),
          warehouse_id: z.string().optional().describe('Filter by warehouse ID'),
          status: z.boolean().optional().describe('Filter by published status (true = published)'),
          no_movement_since_days: z.number().optional().describe('Filter products with no movement since X days'),
          min_quantity: z.number().optional().describe('Minimum total quantity'),
          max_quantity: z.number().optional().describe('Maximum total quantity')
        })
      },
      async (filters) => {
        const products = await getProductsFiltered(supabase, orgId, filters)
        return { content: [{ type: 'text', text: JSON.stringify(products, null, 2) }] }
      }
    )

    server.registerTool(
      'get_inventory_insights',
      {
        description: 'Calculates sales velocity per product and recommends reorders based on past 30 days.',
        inputSchema: z.object({})
      },
      async () => {
        const insights = await getInventoryInsights(supabase, orgId)
        return { content: [{ type: 'text', text: JSON.stringify(insights, null, 2) }] }
      }
    )

    server.registerTool(
      'simulate_fulfillment',
      {
        description: 'Read-only test of an outgoing order\'s impact on stock.',
        inputSchema: z.object({
          items: z.array(z.object({
            product_id: z.string(),
            warehouse_id: z.string(),
            quantity: z.number()
          }))
        })
      },
      async ({ items }) => {
        const report = await simulateFulfillment(supabase, orgId, items)
        return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] }
      }
    )

    server.registerTool(
      'bulk_update_products',
      {
        description: 'Bulk update products. Returns preview on first call. Provide confirm: true to execute.',
        inputSchema: z.object({
          filters: z.object({
            category: z.string().optional(),
            warehouse_id: z.string().optional(),
            status: z.boolean().optional(),
            no_movement_since_days: z.number().optional(),
            min_quantity: z.number().optional(),
            max_quantity: z.number().optional()
          }),
          updates: z.record(z.string(), z.any()),
          confirm: z.boolean().optional().describe('Set to true to apply changes')
        })
      },
      async ({ filters, updates, confirm }) => {
        const result = await bulkUpdateProducts(supabase, orgId, filters, updates, confirm, null)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }
    )

    // Stateless transport
    const transport = new WebStandardStreamableHTTPServerTransport()
    await server.connect(transport)
    return await transport.handleRequest(req)
  } catch (error) {
    console.error('MCP Server Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
