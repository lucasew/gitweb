# ghweb — Product & Engineering Spec

Status: **accepted** (shared understanding, 2026-07-18)  
Visual design: deferred to a later **impeccable** pass (`PRODUCT.md` / `DESIGN.md`); this document is the contract for product, architecture, and behavior.

---

## 1. Vision

**ghweb** is a full-frontend alternative UI for GitHub: faster, less buggy, and more trustworthy than github.com for day-to-day work.

It is a **tool to get things done**, not a marketing clone of GitHub. North star is broad surface coverage (repos, search, Actions, PRs, issues, discussions, …). **v1 is intentionally narrower** and must feel obviously better on the paths it ships.

---

## 2. Goals

| Goal | Meaning |
|------|---------|
| Faster | Dense UI, command palette, optimistic updates, one GraphQL query per screen, no waterfalls |
| Less buggy | No fake controls; no silent failures; optimistics roll back; API limits surfaced |
| More trustworthy | Full transparency when things go wrong (what failed, why); hide or deep-link when the API cannot do the job |
| Open + commercial | AGPL for the community; dual-license commercial path for proprietary / “official” use |

## 3. Non-goals (v1)

- Pixel parity with every github.com screen
- Admin, billing, org policy, security-product chrome when the public API is weak or missing
- Write/edit/commit from the code browser
- Code search (REST), Actions, Discussions (later slices)
- Multi-account switcher UI
- GitHub Enterprise / custom host UI (client must still accept a future `baseUrl`)
- GraphQL subscriptions (GitHub does not offer them)
- Safer-than-GitHub credential storage (client-held PAT is accepted for dogfood)

---

## 4. Users

| User | Need |
|------|------|
| Primary | Developers who live in issues/PRs/review and want a faster, denser client |
| Secondary | Maintainers doing power triage (labels, assignees, merge strategies, reviews) |
| Non-target (v1) | Org admins configuring SSO/billing; CI engineers needing full Actions consoles |

Auth model assumes a user who can create a PAT (same mental model as `gh auth token`).

---

## 5. Product scope

### 5.1 v1 — Code + social core

| Area | Capability |
|------|------------|
| **Home `/`** | Hybrid **tool home**: triage strip (review requests, assigned issues, your open PRs/issues — exact widgets as API allows) + repo list (affiliations, starred/pins as data allows) |
| **Repo** | Repo home, navigation into code / issues / PRs |
| **Code** | **Read-only** tree + file view + README/markdown; honest handling of large/binary/LFS (message or open on GitHub) |
| **Issues** | **Power triage** — view + broad writes (see §5.3) |
| **Pull requests** | **Power triage** — conversation, files (read), reviews, merge when allowed |
| **Search** | **GraphQL `search` only** — repos, issues, PRs, users/orgs (types the schema supports well). No v1 code search |
| **Chrome** | Avatar (viewer), **breadcrumb** `ghweb > owner/repo` + code/issues/PRs icons (no sidebar), command palette (`/code` `/issues` `/prs`) |

### 5.2 Later (roadmap, not v1 gates)

- Actions (REST hybrid)
- Discussions
- Notifications inbox polish
- Code search (REST)
- Multi-account profiles
- Configurable GitHub host (GHE)
- Device-flow login (optional comfort upgrade over PAT paste)
- Light web edit/commit (only after read-only code + triage are solid)

### 5.3 Power triage (issues & PRs)

Ship high-leverage writes the API supports correctly, including as applicable:

- Edit title / body  
- Close / reopen (with reason where exposed)  
- Lock / unlock  
- Labels, assignees, milestone  
- Comments (create/edit/delete as API allows)  
- Reviews: approve / comment / request changes; request / re-request reviewers  
- Merge with strategy; update branch; auto-merge when exposed  
- Convert / transfer / pin / cross-refs where mutations exist and behave correctly  

**Honesty rule:** if the API cannot do it correctly → **omit the control** or **Open on GitHub**. Never show a working control that no-ops or lies.

### 5.4 Code browser (v1)

- Read-only browse only  
- No multi-file editor, no commit-from-UI  
- Prefer GraphQL git objects; use raw/REST only if required for content size/type  
- Explicit limits and empty states beat partial broken renderers  

---

## 6. Information architecture & routes

### 6.1 Path parity

Use **github.com-compatible path shapes** for core entities:

- `/{owner}/{repo}`
- `/{owner}/{repo}/issues`, `/{owner}/{repo}/issues/:number`
- `/{owner}/{repo}/pull/:number` (singular `pull`, GitHub-style) — conversation  
- `/{owner}/{repo}/pull/:number/files` — Files / diffs tab (deep-linked)
- `/{owner}/{repo}/tree/:ref/*`, `/{owner}/{repo}/blob/:ref/*`
- User/org routes where we mirror them

### 6.2 Intentional improvements

- **Do not** blindly copy opaque or ugly query-string-only navigation for search/filters  
- Prefer clear paths + **explicit, readable query params** we control (`q`, `type`, list filters, cursors as needed)  
- Accept paste of `https://github.com/...` URLs and map into in-app routes when supported; otherwise offer Open on GitHub  

### 6.3 Home

`/` is a **speed tool**: triage first, repos second. Not a second GitHub marketing homepage.

---

## 7. UX policies

### 7.1 Layout & responsive

- **Full responsive** — not desktop-only  
- Shell: **sidebar** + **avatar** menu; small screens use drawer/offcanvas patterns  
- Dense enough for triage; usable on phone without a separate “mobile product” rewrite  

### 7.2 Keyboard

- **Command palette** (`⌘K` / `Ctrl+K`): jump to repo, issue, PR, user, search  
- Small documented shortcut set on lists/details (e.g. j/k, focus composer)  
- Not vim-modal  

### 7.3 Freshness

GitHub has **no public GraphQL subscriptions**.

| Mechanism | When |
|-----------|------|
| Preload on navigation | Every route entry |
| Refetch on window focus | Detail screens (issue/PR/repo) |
| Slow poll | **Only** open issue/PR conversation (~30–60s, tunable) |
| Site-wide aggressive poll | **Forbidden** |

Local mutations update via Relay optimistics + payload. Other users’ changes appear on focus / poll / navigation.

### 7.4 Optimistic updates

**Policy: broad triage (finetune later).**

| Optimistic | Not optimistic |
|------------|----------------|
| Close/reopen, title/body | Fabricated timeline events |
| Comment insert/delete | `viewerCan*` permission bits |
| Labels, assignees, milestone | Merge commit SHA / final merged green before server |
| Review submit (verdict UI) | Anything that cannot roll back cleanly |
| Merge control → **merging / in progress** | |

**On failure:** hard rollback + **full transparency** (action attempted, server/HTTP/GraphQL error, rate limit). Use **standard controls**: daisyUI toast, alert/banner, modal confirm for destructive actions, loading/disabled on in-flight buttons.

### 7.5 Trust & errors

- Never silent-fail or leave optimistic lies on screen  
- Surface rate limit / secondary rate limit explicitly when hit  
- Include GraphQL `rateLimit` in queries where useful for diagnostics  
- Unsupported feature → clear copy + optional Open on GitHub  

### 7.6 External links

All **outside** links (github.com, docs, anything not an in-app route) **must open in a new browser tab**:

- `target="_blank"`
- `rel="noopener noreferrer"`

Use the shared `ExternalLink` component (or equivalent) so this is not forgotten. In-app navigation stays same-tab via the router.

### 7.7 Theme

- Default: **system** (`prefers-color-scheme`)  
- User toggle in avatar menu  
- Theme preference may use **`localStorage`**  
- PAT must **not** use `localStorage` (see auth)  

---

## 8. Stack

### 8.1 Runtime & app

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Framework | React |
| Bundler / app | Vite SPA |
| Router | TanStack Router (typed paths; amend to React Router if preferred) |
| Styling | Tailwind CSS + **daisyUI** |
| Data | **Relay** (`react-relay` / `relay-runtime` / `relay-compiler`) |
| API | GitHub GraphQL primary; REST only when a later feature forces it |
| Hosting | Vercel (static SPA + rewrites) |
| Network | **Browser → API directly** (Bearer PAT); `GitHubClient({ baseUrl, token })` |
| Package manager | pnpm |
| Task runner | **mise** (same pattern as margea / contapila) |
| Git hooks | **None — no husky** (format/codegen only via mise + CI) |

### 8.2 Libraries vs own code

**Use a library** when it is a hard, generic problem with a maintained answer:

| Concern | Library | Notes |
|---------|---------|--------|
| GraphQL client / store / optimistics | Relay | Non-negotiable for this app |
| Routing | TanStack Router | Or React Router 7 if we drop typed routes later |
| CSS / components | Tailwind + daisyUI | No second UI kit |
| Icons | lucide-react | |
| Command palette | cmdk | Style with daisyUI |
| Markdown bodies | **GraphQL `bodyHTML`** (GFM) + DOMPurify; REST `/markdown` for raw files | Full GitHub-rendered GFM |
| **PR / commit diffs** | **`@git-diff-view/react`** | Unified + split, virtualization-friendly, GitHub-like; feed GitHub `patch` / file contents — do not hand-roll diff UI |
| Dates | `Intl` first; date-fns only if needed | Prefer zero dep |
| className merge | clsx (+ tailwind-merge if needed) | |
| Long file lists / huge blobs | @tanstack/react-virtual | Code browser + large diffs if lib doesn’t virtualize enough |
| Syntax highlight (code browser) | Phase: plain first; **shiki** if we need real highlighting | Don’t block v1 |

**Write our own** (product glue, GitHub-specific, thin wrappers):

| Concern | Own code | Why |
|---------|----------|-----|
| PAT gate / sessionStorage auth | yes | Trivial; matches dogfood model |
| Relay environment + rate-limit headers | yes | Small; GitHub-specific |
| Optimistic updaters for GitHub mutations | yes | Schema-shaped; libraries won’t know connections |
| github.com URL → in-app route parser | yes | Spec parity paths |
| Home triage composition / query packing | yes | Product |
| Error / rate-limit banners (daisyUI) | yes | Standard controls, full transparency |
| Shell layout (top bar + contextual repo nav) | yes | Design direction C |
| Single-column issue/PR chrome | yes | |
| Search query-param scheme | yes | Cleaner than github.com |
| Client schema / REST bridge (later Actions) | yes | Thin adapter into Relay store |

**Explicitly do not add:** husky, Redux/Zustand for server data, Apollo, MUI/Chakra/shadcn stack, Monaco/CodeMirror (read-only v1), Storybook-as-gate, i18n framework (v1), moment, full “design system monorepo”.

### 8.3 Diff viewing (decision)

| Option | Verdict |
|--------|---------|
| Hand-rolled `<pre>` + green/red lines | Too weak for PR review |
| `react-diff-viewer` / continued | OK for small snippets; weaker on huge multi-file PRs |
| **`@git-diff-view/react` (chosen)** | Built for git/GitHub-style file diffs; split/unified; better scale |

Data path: GraphQL PR files (`patch`, additions/deletions, path) → parse/feed the viewer. Large binary / too-large patches → honest empty state + “Open on GitHub”, not a fake diff.

### 8.4 Codegen, schema refresh, format (mise + CI PR)

Patterned after **margea** (`mise` tasks: `codegen` → relay, `fmt` → prettier) and scheduled **codegen-on-main / open PR when dirty** workflows used elsewhere in the monorepo family.

Checked-in artifacts:

- `schema/github.graphql` — GitHub GraphQL schema (introspected)  
- `schema/client.graphql` — local client extensions (if any)  
- Relay `__generated__/` (or configured `artifactDirectory`) — compiler output  

**Local mise tasks** (names stable; exact scripts filled at scaffold):

| Task | Does |
|------|------|
| `mise run install` | pnpm install |
| `mise run codegen:schema` | Introspect `api.github.com/graphql` (token from env, e.g. `GITHUB_TOKEN` / `gh auth token`) → write `schema/github.graphql` |
| `mise run codegen:relay` | `relay-compiler` |
| `mise run codegen` | **depends on `codegen:*`** (runs all codegen subtasks, including schema + relay) |
| `mise run fmt` / `format` | **`workspaced codebase format`** (repo root; same as other LEWTEC/own projects) |
| `mise run lint` | **`workspaced codebase lint`** (path defaults per workspaced; configure via workspaced, not ad-hoc prettier/eslint scripts) |
| `mise run typecheck` | `tsc --noEmit` |
| `mise run test` | vitest |
| `mise run build` | depends `codegen:relay` + `typecheck`, then vite build |
| `mise run ci` | `codegen:relay` + `typecheck` + `test` + `build` (no network schema; **no `mise exec`**) |
| `mise run schema-refresh` | `codegen:schema` + `codegen:relay` (scheduled PR job) |
| `mise run dev` | vite dev |

Mise shape (illustrative):

```toml
[tasks."codegen:schema"]
# introspect → schema/github.graphql

[tasks."codegen:relay"]
# relay-compiler

[tasks.codegen]
depends = ["codegen:*"]
```

Day-to-day after editing queries only: prefer **`mise run codegen:relay`** (no network). Full refresh: **`mise run codegen`** (schema + relay) or `codegen:schema` then `codegen:relay`.

**Schema update PR workflow** (GitHub Actions — only `mise run …`, never `mise exec`):

1. Schedule (e.g. weekly) + `workflow_dispatch`  
2. Checkout; `mise run install`  
3. `mise run schema-refresh` (token from env)  
4. If git diff nonempty: open/update PR (“chore: refresh GitHub GraphQL schema”)  
5. CI on that PR: `mise run install` then **`mise run ci` only**

**CI note:** `mise run ci` is offline (no schema introspect). Schema refresh job alone hits the network.

**Format / lint** are not hand-rolled Prettier/ESLint mise one-liners — they go through **workspaced** so tool versions and rules stay consistent with the rest of the workspace. Project still has ESLint/Prettier (or whatever workspaced configures) as the engines; invocation is always:

```bash
workspaced codebase format
workspaced codebase lint
```

**No husky** — do not auto-format on commit; CI enforces; agents/humans run `mise run format` / `lint` / `codegen` deliberately (don’t format unrelated files).

### 8.5 Relay conventions

- One root query per screen; fragments co-located on components  
- `loadQuery` / `usePreloadedQuery` on route entry (not fetch-in-`useEffect`)  
- Pagination: `@connection` + `@refetchable` + `@argumentDefinitions`; GitHub page size 1–100  
- Mutations spread UI fragments in the response  
- **Never** copy Relay data into React state as a second source of truth  
- Header: `X-Github-Next-Global-ID: 1` on all GraphQL requests  
- Store: per-tab memory; `gcReleaseBufferSize` tuned for back-navigation  

### 8.6 REST escape hatch

v1 should not need REST for the core loop. When later features need it (Actions, packages, some raw blobs):

- Prefer a thin adapter that writes into the Relay store (client schema / `commitLocalUpdate`) so UI stays fragment-driven  
- Do not invent a second global state tree for server data  

### 8.7 Quality tooling

| Piece | Choice |
|-------|--------|
| Format entrypoint | **`workspaced codebase format`** (`mise run format`) |
| Lint entrypoint | **`workspaced codebase lint`** (`mise run lint`) |
| Engines (via workspaced) | ESLint (+ typescript-eslint, eslint-plugin-relay as needed), Prettier — pinned/configured the workspaced way, not duplicate one-off scripts |
| Unit | Vitest + Testing Library |
| E2E | Playwright **later** (not day 0) |
| CI | GitHub Actions: `mise run ci` on PR/push; separate schema-refresh workflow |

---


## 9. Auth & session

| Decision | Choice |
|----------|--------|
| Primary | **PAT paste** (classic or fine-grained; user-managed scopes) |
| Optional later | OAuth **device flow** if low-friction and scopes suffice |
| Accounts | Single account model (no switcher in v1) |
| Tab model | **Independent per browser tab** — no cross-tab Relay sync |
| Token storage | **`sessionStorage`** only (survives refresh in-tab; dies with tab) |
| Sign-out | Clear token + **wipe Relay store** |

Scopes: document recommended PAT scopes for v1 (repo, read:org, etc.) in app onboarding UI; fail with transparent errors if a mutation lacks scope.

Security note: XSS can steal a tab’s token. Accepted for v1 dogfood; not marketed as safer than GitHub’s own session.

---

## 10. Licensing & business

| Item | Choice |
|------|--------|
| Public license | **AGPL-3.0-or-later** |
| Model | **Dual license** — commercial license available for proprietary / official distribution |
| Trademark | Project name/logo; no “Official …” branding without a deal |
| Contributions | **CLA (or equivalent) with relicense grant** before accepting external PRs |
| Until CLA | Sole-author commits only (or no drive-by merges to main) |

Repo artifacts (when scaffolding license files):

- `LICENSE` — AGPL-3.0-or-later  
- `COMMERCIAL.md` — how to obtain a proprietary license  
- `CLA.md` (or CLA bot config)  
- Short trademark notice  

Not legal advice; commercial terms should get a human legal review before revenue.

Realistic expectation: compliant AGPL use does not force payment. Revenue path is **commercial exceptions + trademark / official branding**, not “sue any large company by default.”

---

## 11. Quality bar (definition of done)

A v1 cut is “done” when:

1. PAT paste → home triage + repos works in a single tab session  
2. Issue and PR power triage paths work with optimistics and correct rollback  
3. Read-only code browse works for normal text files with honest limits  
4. GraphQL search navigates to in-app entities  
5. Command palette reaches primary entities  
6. Responsive shell (sidebar/avatar) works from mobile to desktop  
7. Rate limit and mutation errors are always visible and accurate  
8. No control claims success the API did not confirm  
9. Deployable to Vercel as SPA with client routing  

---

## 12. Suggested implementation phases

| Phase | Deliverable |
|-------|-------------|
| **0** | Vite + React + Tailwind + daisyUI + Relay + mise (`codegen:schema` / `codegen:relay` / `codegen`→`codegen:*` / `fmt` / `ci`); checked-in schema; schema-refresh PR workflow; no husky; AGPL + COMMERCIAL + CLA stubs; PAT gate |
| **1** | Shell (sidebar, avatar, theme toggle, toasts); sessionStorage auth; home hybrid |
| **2** | Repo + issue list/detail + close/comment optimistics |
| **3** | PR conversation + review + merge (in-progress optimistic) + power triage fields |
| **4** | Read-only code browser |
| **5** | GraphQL search + command palette + github.com URL import |
| **6** | Focus refetch + conversation poll; rate-limit banners; polish |
| **∞** | impeccable visual pass; Actions; discussions; device flow; GHE |

---

## 13. Design (impeccable)

This SPEC intentionally does **not** freeze visual identity (palette, type, spacing rituals beyond daisyUI defaults), **except** the status-badge color legend in §13.1 (workflow semantics, not brand polish).

Planned follow-up:

- `$impeccable init` → `PRODUCT.md` / `DESIGN.md` aligned with this SPEC  
- Iterate shell, home, issue/PR surfaces for craft (density, hierarchy, a11y)  
- Keep behavior contracts here; keep visual system in DESIGN.md  

Register: **product / tool UI** (design serves the workflow), not marketing brand site.

### 13.1 Status badge color legend

Semantic tones (daisyUI badge classes). One legend app-wide for lifecycle and review chips. Metadata chips (label names, rate-limit counts, hunk numbers) are out of scope.

| Meaning | Tone | Classes | Used for |
|--------|------|---------|----------|
| Good path | **success** | `badge-success` | Open issue/PR; **Approved** review |
| Active friction | **warning** (solid) | `badge-warning` (+ `text-warning-content` when needed) | **Changes requested** |
| Incomplete review | **warning outline** | `badge-outline badge-warning` | **Pending** review / pending line comments |
| WIP / in progress | **info** | `badge-info` (+ `text-info-content` when needed) | **Merging…** |
| Terminal stop | **error** | `badge-error` | **Closed** issue; closed unmerged PR |
| Quiet / low urgency | **ghost** | `badge-ghost border border-base-300` | **Draft** PR; **Commented** review |
| Quiet + historical | **ghost muted** | ghost + `opacity-70` | **Dismissed** review |
| Merged (special) | **purple** | `bg-[#8250df] text-white` (hard-coded) | **Merged** PR only — sole non-daisy exception (GitHub muscle memory) |

**Encoding rules**

1. Prefer full **switch** on state in `ReviewStateBadge` / `PrStateBadge` / `IssueStateBadge` — no ad-hoc `badge-warning` for the same meaning elsewhere.  
2. Pending UI chrome (PR header “Pending review”, conversation “Pending”, files line-comment pending) must use **outline warning**, same as review state `PENDING`.  
3. Do **not** use solid warning for pending, or error for changes requested.  
4. One-line mnemonic: green = good path · yellow solid = review friction · yellow outline = unfinished review · blue = WIP · red = closed · ghost = quiet · purple = merged only.

---

## 14. Decision log (source)

Decisions locked in the 2026-07 grill session:

1. Full alternative north star; v1 = code + social core  
2. React + Vite + Tailwind + daisyUI; Vercel SPA  
3. GraphQL-first + Relay + broad optimistics  
4. PAT paste; sessionStorage; per-tab isolation; single account  
5. Direct browser → GitHub API  
6. Path parity + cleaner search/filter URLs  
7. Hybrid tool home  
8. Power triage writes; read-only code  
9. GraphQL search only  
10. Full responsive + palette/shortcuts  
11. Freshness: focus + slow PR/issue poll  
12. Full error transparency via standard controls  
13. System theme + toggle  
14. github.com now; baseUrl later  
15. Dual license AGPL + commercial; CLA with relicense grant  
16. mise: `codegen:schema`, `codegen:relay`, `codegen`→`codegen:*`; `format`/`lint` → **workspaced codebase format/lint**; `ci`; weekly schema PR; **no husky**  
17. Diff UI: `@git-diff-view/react` (confirmed); library vs own split per §8.2
18. External links open in a **new tab**
19. PR **Files** tab is full-width
20. Chrome: breadcrumb + section icons; no sidebar; ⌘K slash commands; line/hunk comments via DiffView widgets + review threads (`target=_blank` + `noopener noreferrer`)  
21. Status badge colors: SPEC §13.1 (changes requested = solid warning; pending = outline warning; merging = info; closed = error; approved/open = success; draft/commented = ghost; merged = purple only)  
22. Product name: **ghweb** (formerly gitweb); storage keys `ghweb.*` with one-shot migrate from `gitweb.*`  


---

## 15. Open questions (non-blocking)

Resolved enough to build; refine in implementation:

- Exact home triage widgets and GraphQL queries  
- Minimum PAT scope set for onboarding copy  
- Conversation poll interval default  
- Whether device flow lands before or after Actions  
- Commercial license terms text (lawyer)  

---

*End of SPEC. Implementation should not start from chat memory — start from this file.*
