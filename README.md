# Travel brief MCP App

A demo MCP App based on the Atlas word cloud prototype. A travel advisor sets the travel party, the destination and the budget per person. Then the advisor follows a word cloud from broad themes (Culture, Coast, Food...) to precise preferences, and can add missing terms by hand. The cloud, the filter and the brief all run in the iframe. They do not call the model or the server. When the advisor clicks **Send brief to chat** in the review panel, the app sends a visible user message to the chat with `app.sendMessage`. The message holds the brief and asks for a short trip proposal.

The preference tree lives in `src/brief.ts`. The server, the UI and the tests all import that file. The app makes no bookings and connects to no travel service.

## Run

Needs Node 24. Node runs the `.ts` files directly (type stripping), so there is no server build step.

```sh
npm install
npm run build          # typecheck, then bundle the UI into dist/index.html
npm start              # HTTP on http://localhost:3109/mcp (set PORT to change it)
npm run start:stdio    # stdio transport
```

Run `npm run build` again after you change the UI. The server reads `dist/index.html` on each `resources/read`.

## Deploy to Cloudflare

The Worker serves the same MCP tool and UI resource at `https://travel-brief.demo.cogniplane.io/mcp`. Wrangler bundles `dist/index.html` with the Worker. Build before each deploy.

```sh
npm install
npm run cf:dry-run
npm run cf:deploy
```

The `wrangler.jsonc` Custom Domain creates the DNS record and TLS certificate in the Cloudflare zone when you deploy. Use a Cloudflare account with access to `cogniplane.io`. If that hostname already has a DNS record, remove the conflicting record before deployment.

In Cogniplane, set the Travel Brief gateway upstream URL to `https://travel-brief.demo.cogniplane.io/mcp`. The Worker has no authentication because this app contains only fictional data and its tool is read only. Do not use this setup for private MCP data.

The HTTP server listens on all IPv4 interfaces. It accepts requests addressed to a local interface IP or `localhost`. Set `MCP_ALLOWED_HOSTS` to a comma-separated list if a proxy sends another hostname in the `Host` header.

## MCP shape

- Tool `show_travel_brief`: no input, `annotations.readOnlyHint: true`, `_meta.ui.resourceUri: "ui://travel-brief/app.html"`. The result is a text summary for the model. The app needs no data from the result.
- Resource `ui://travel-brief/app.html`: MIME type `text/html;profile=mcp-app`. It is one HTML file with inline JS and CSS, with no remote fonts or assets.

## Changes from the prototype

- `wordcloud2.js` comes from npm and is bundled. The prototype loaded it from a CDN, which a strict CSP blocks.
- No Google Fonts. The cloud uses Georgia and the UI uses the system font, unless the viewer has Inter or Playfair Display installed.
- Fixed heights replace `100vh`/`100dvh`. The host sizes the iframe to the document, so viewport units would grow without end.
- **Send brief to chat** replaces **Copy trip brief**. Hosts usually block the clipboard in the sandbox iframe.
- Light theme only, as in the prototype. The app ignores the host theme.

## Test

```sh
npm run typecheck
npm test               # builds the UI, then runs node --test
```

`test/brief.test.ts` checks the tree shape, the brief text and the chat message. `test/server.test.ts` starts the HTTP app on a random port and sends `initialize`, `tools/list`, `tools/call` and `resources/read`.

## Files

- `main.ts`: HTTP and stdio entry point
- `worker.ts`: Cloudflare Worker entry point
- `server.ts`: `registerAppTool` and `registerAppResource`
- `src/brief.ts`: preference tree, brief text, chat message and tool summary
- `index.html`, `src/mcp-app.ts`, `src/mcp-app.css`: the UI (`App` from `@modelcontextprotocol/ext-apps`)
- `vite.config.ts`: single-file bundle with `vite-plugin-singlefile`
- `test/`: `node:test` tests
