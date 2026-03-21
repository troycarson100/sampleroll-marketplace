# Supabase MCP (Cursor + Claude Code)

[Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) lets AI tools query your project, run SQL (with care), and use docs search.

## Cursor (this repo)

1. **Config** — `.cursor/mcp.json` is gitignored. Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` and adjust:
   - Replace `YOUR_SUPABASE_PROJECT_REF` in the `supabase` URL (or keep your real ref).
   - Optional query params: `read_only=true`, `features=database,docs` — see [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp#configuration-options).

2. **URL shape** (hosted server):

   ```text
   https://mcp.supabase.com/mcp?project_ref=<your-project-ref>
   ```

3. **Authenticate** — Open **Cursor Settings → Tools & MCP**, select the Supabase server, and complete the browser OAuth flow when prompted (dynamic client registration).

4. **Reload** Cursor if tools don’t appear.

## Claude Code (CLI)

If you use [Claude Code](https://docs.claude.com) instead of/in addition to Cursor:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"
```

Then authenticate (regular terminal):

```bash
claude /mcp
```

Choose **supabase** → **Authenticate** and finish the flow.

## Optional: Supabase agent skills

Install Postgres best-practices skills for agents (Cursor, Claude Code, etc.):

```bash
npx skills add supabase/agent-skills -y
```

This repo installs skills under `.agents/skills/` (committed so the team can use them).

## Security

Use a **dev** Supabase project, not production. Prefer **`read_only=true`** and **`project_ref=...`** when you can. Review every tool call before approving.
