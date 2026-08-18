import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// 1. Initialize the MCP Server
const server = new Server(
    {
        name: "my-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {}, // Enable tools capability
        },
    }
);

// 2. Define available tools schema
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add_numbers",
                description: "Adds two numbers together",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number", description: "First number" },
                        b: { type: "number", description: "Second number" },
                    },
                    required: ["a", "b"],
                },
            },
            {
                name: "get_greeting",
                description: "Returns a personalized greeting",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Name of the person" },
                    },
                    required: ["name"],
                },
            },
        ],
    };
});

// 3. Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "add_numbers") {
        const { a, b } = args as { a: number; b: number };
        const result = a + b;

        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${result}`,
                },
            ],
        };
    }

    if (name === "get_greeting") {
        const { name: personName } = args as { name: string };

        return {
            content: [
                {
                    type: "text",
                    text: `Hello, ${personName}! Welcome to the MCP Server.`,
                },
            ],
        };
    }

    throw new Error(`Tool not found: ${name}`);
});

// 4. Start the server using Stdio transport
async function startServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Do NOT use console.log here as stdout is reserved for MCP JSON-RPC protocol messages.
    console.error("MCP Server is running on stdio...");
}

startServer().catch((error) => {
    console.error("Fatal error starting server:", error);
    process.exit(1);
});