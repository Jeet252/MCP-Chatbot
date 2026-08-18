import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
    { name: "mcp-tools-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// Define the tools this MCP server exposes
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
                description: "Returns a personalized greeting message",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Name of the person to greet" },
                    },
                    required: ["name"],
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "add_numbers") {
        const { a, b } = args as { a: number; b: number };
        return {
            content: [{ type: "text", text: `The sum of ${a} and ${b} is ${a + b}` }],
        };
    }

    if (name === "get_greeting") {
        const { name: personName } = args as { name: string };
        return {
            content: [{ type: "text", text: `Hello, ${personName}! Welcome to MCP.` }],
        };
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Start server on stdio (backend will spawn this as a subprocess)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MCP Tools] Server running on stdio");
}

main().catch(console.error);
