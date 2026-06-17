---
name: repo-audit
description: >
  Use to understand a repository before coding. Produces a short technical map
  of stack, scripts, folders, env needs, risks, and next steps.
---

# Repo Audit Skill

## Purpose

Before touching any code, build a clear picture of the project.
Prevents wrong assumptions, duplicate work, and broken changes.

---

## Steps

### 1. Detect the stack

Identify and note:
- **Language(s):** TypeScript, JavaScript, Python, Go, etc.
- **Package manager:** npm, pnpm, yarn, bun, pip, etc.
- **Frontend framework:** Next.js, React, Vue, Svelte, etc.
- **Backend framework:** Express, Hono, FastAPI, NestJS, etc.
- **Database:** PostgreSQL, MySQL, SQLite, MongoDB, Supabase, etc.
- **ORM / Query layer:** Prisma, Drizzle, TypeORM, SQLAlchemy, etc.
- **Auth system:** NextAuth, Lucia, Clerk, custom JWT, etc.
- **Deployment target:** Vercel, Fly.io, Railway, Docker, etc.

### 2. Read package scripts

Open `package.json` (or equivalent) and list all scripts:
- Which script runs the dev server?
- Which runs type-check?
- Which runs lint?
- Which runs tests?
- Which builds for production?

### 3. Identify main folders and entry points

List the main directories:
- Where does the app start? (entry points)
- Where are the API routes / controllers?
- Where are the UI pages / components?
- Where are shared utilities, hooks, lib files?
- Where is the database schema or migration folder?
- Where are tests?

### 4. Identify missing env keys

- Scan `.env.example`, `.env.template`, or config files for required keys.
- List key **names only** — never values, never contents of actual `.env` files.
- Note which keys are required for core functionality vs. optional integrations.

### 5. Find obvious risks

Look for:
- Broken imports (files that are referenced but do not exist)
- Duplicate files or conflicting implementations
- Hardcoded secrets or tokens in source files
- Missing auth guards on sensitive routes
- Unhandled async paths or missing error boundaries
- Outdated dependencies flagged as vulnerable

### 6. Output the audit report

```
## Repo Audit

**Stack**
- Language:     ...
- Package mgr:  ...
- Frontend:     ...
- Backend:      ...
- Database:     ...
- Auth:         ...
- Deploy:       ...

**Important Scripts**
- dev:          ...
- type-check:   ...
- lint:         ...
- test:         ...
- build:        ...

**Main Folders**
- Entry point:  ...
- API routes:   ...
- UI pages:     ...
- Shared lib:   ...
- DB schema:    ...
- Tests:        ...

**Current Status**
- [ ] ...
- [ ] ...

**Risks**
- (HIGH)   ...
- (MEDIUM) ...
- (LOW)    ...

**Missing ENV Keys (names only)**
- ...

**Next Exact Task**
- ...
```

---

## Rules

- Never print or log `.env` values.
- Never assume a file exists — verify it.
- Do not make any code changes during an audit.
- Do not run heavy commands (build, install) during an audit unless requested.
- If something is unclear, mark it as `UNKNOWN` and flag for investigation.
