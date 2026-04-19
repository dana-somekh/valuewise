# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Specifically:
- Auth gating is in `src/proxy.ts` (NOT `src/middleware.ts`) and the exported function is `proxy()` not `middleware()`.
- In Server Components and Route Handlers, `cookies()` is async — always `await cookies()`.
