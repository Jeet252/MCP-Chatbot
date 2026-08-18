import "dotenv/config";
import express from "express";
import cors from "cors";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let mcpClient: Client;

// 1. Connect backend to MCP server sub-process
async function initMCP() {
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "./mcp-tools.ts"], // your mcp tool file
    });

    mcpClient = new Client(
        { name: "express-mcp-bridge", version: "1.0.0" },
        { capabilities: {} }
    );

    await mcpClient.connect(transport);
    console.log("[Backend] Connected to MCP stdio process!");
}

// 2. Chat Endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { message, history } = req.body;

        // Fetch MCP tools & transform to Gemini specs
        const toolsResult = await mcpClient.listTools();
        const geminiTools = toolsResult.tools.map((tool) => ({
            functionDeclarations: [
                {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema as any,
                },
            ],
        }));

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: "You are a helpful assistant with access to connected MCP tools.",
                tools: geminiTools,
            },
            history: history || [],
        });

        let response = await chat.sendMessage({ message });
        const executedTools: { tool: string; args: any; result: any }[] = [];

        // Loop tool executions if Gemini calls MCP server tools
        while (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];

            // Skip if Gemini returned a function call without a name
            if (!call.name) break;

            const toolResult = await mcpClient.callTool({
                name: call.name,
                arguments: call.args as Record<string, any>,
            });

            executedTools.push({
                tool: call.name,
                args: call.args,
                result: toolResult.content,
            });

            response = await chat.sendMessage({
                message: [
                    {
                        functionResponse: {
                            name: call.name,
                            response: { result: toolResult.content },
                        },
                    },
                ],
            });
        }

        res.json({
            text: response.text,
            executedTools,
        });
    } catch (error: any) {
        console.error("Chat error:", error);
        res.status(500).json({ error: error.message });
    }
});

initMCP().then(() => {
    app.listen(5000, () => console.log("[Backend] API running on http://localhost:5000"));
});