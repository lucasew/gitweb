# ghweb

Alternative GitHub UI — faster triage tool. **AGPL-3.0-or-later** (commercial
licensing available; see `COMMERCIAL.md`).

Product contract: [`SPEC.md`](./SPEC.md).

## Dev

Requires [mise](https://mise.jdx.dev/) and network for GitHub.

```bash
mise run install
mise run codegen:schema   # needs GITHUB_TOKEN or gh auth
mise run codegen:relay
mise run dev
```

Paste a PAT at the login screen (`sessionStorage`, per tab).

```bash
mise run format        # workspaced codebase format
mise run lint          # workspaced codebase lint
mise run typecheck
mise run test
mise run build
mise run ci            # full offline CI (what GitHub Actions runs)
mise run schema-refresh  # schema + relay (scheduled job)
```

GitHub Actions must only invoke **`mise run …`** tasks (never `mise exec`).

## Stack

Vite, React, Relay, Tailwind, daisyUI, TanStack Router. Browser → GitHub GraphQL
directly.
