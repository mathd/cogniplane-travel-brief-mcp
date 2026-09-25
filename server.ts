import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { toolSummary } from "./src/brief.ts";

export const TOOL_NAME = "show_travel_brief";
export const RESOURCE_URI = "ui://travel-brief/app.html";
export function createServer(loadHtml: () => Promise<string>): McpServer {
  const server = new McpServer({ name: "Travel Brief", version: "1.0.0" });

  registerAppTool(
    server,
    TOOL_NAME,
    {
      title: "Show travel brief builder",
      description:
        "Opens a travel brief builder for a travel advisor. The advisor sets the travel party, destination and budget, follows a word cloud to precise preferences, and sends the brief to the chat.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => ({ content: [{ type: "text", text: toolSummary() }] }),
  );

  registerAppResource(
    server,
    "Travel brief builder",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        { uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: await loadHtml() },
      ],
    }),
  );

  return server;
}
