import { McpServer, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { verifyApiKey } from '@/lib/services/api-keys'
import { checkPlanLimit } from '@/lib/services/plans'
import { getLowStockProducts } from '@/lib/services/inventory'
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
    const hasAccess = await checkPlanLimit(supabase, orgId, 'mcp_access')
    if (!hasAccess) {
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

    // Stateless transport
    const transport = new WebStandardStreamableHTTPServerTransport()
    await server.connect(transport)
    return await transport.handleRequest(req)
  } catch (error: any) {
    console.error('MCP Server Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
