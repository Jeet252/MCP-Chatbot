import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    // 1. Define the transport (connecting to a local MCP server running via stdio)
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "../server/server.ts"],
    });

    // 2. Initialize the client
    const client = new Client(
        {
            name: "my-mcp-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    // 3. Connect to the server
    await client.connect(transport);
    console.log("Connected to MCP Server successfully!");

    // 4. List available tools from the server
    const toolsList = await client.listTools();
    console.log("Available Tools:", toolsList.tools);

    // 5. Call a specific tool (example assuming a tool named 'calculate_sum')
    if (toolsList.tools.some((tool) => tool.name === "calculate_sum")) {
        const result = await client.callTool({
            name: "calculate_sum",
            arguments: { a: 10, b: 20 },
        });

        console.log("Tool Result:", result.content);
    }

    // 6. Graceful cleanup
    await client.close();
}

main().catch((err) => {
    console.error("MCP Client Error:", err);
    process.exit(1);
});