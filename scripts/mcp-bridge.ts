import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'

/**
 * A bridge script to connect Claude Code / Claude Desktop to our remote Next.js MCP server.
 * 
 * Claude Desktop expects an MCP server to communicate over standard input/output (stdio).
 * This script acts as a proxy: it runs locally via stdio, connects to our Next.js SSE endpoint,
 * and passes the API Key in the headers.
 *
 * Usage:
 * npx tsx scripts/mcp-bridge.ts
 */
async function main() {
  const apiKey = process.env.MCP_API_KEY
  if (!apiKey) {
    console.error('Error: MCP_API_KEY environment variable is required.')
    process.exit(1)
  }

  // 1. Connect to our Next.js MCP Server via HTTP
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/api/mcp'), {
    requestInit: {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  })

  const client = new Client({ name: 'mcp-bridge', version: '1.0.0' })
  await client.connect(transport)

  // 2. Set up a local Stdio server for Claude to connect to
  const stdioTransport = new StdioServerTransport()
  
  // Forward messages from Claude (stdio) to Next.js (HTTP)
  stdioTransport.onmessage = async (message: any) => {
    // Send request to our remote server
    if ('method' in message && message.method === 'tools/call') {
       const result = await client.callTool(message.params as any)
       await stdioTransport.send({
         jsonrpc: '2.0',
         id: message.id as any,
         result
       })
    } else if ('method' in message && message.method === 'tools/list') {
       const result = await client.listTools()
       await stdioTransport.send({
         jsonrpc: '2.0',
         id: message.id as any,
         result
       })
    }
    // Note: A full proxy would forward all JSON-RPC messages generically, 
    // but the SDK handles tool calls directly.
  }

  await stdioTransport.start()
  console.error('MCP Bridge running on stdio, connected to http://localhost:3000/api/mcp')
}

main().catch(console.error)
