# OpenCode Project Rules

## Main behavior

- Work in **LOW TOKEN MODE**.
- Always scan before editing.
- Never rewrite working files just for style.
- Never recreate existing working features.
- Never refactor large areas unless required for build, security, or real bugs.
- Prefer small safe changes.
- Finish one task fully before starting the next.
- Do not claim DONE until verification passes or failure is clearly explained.

---

## GSD workflow

Before starting any major task, create this checkpoint:

```
- Completed:
- Partially completed:
- Missing:
- Broken:
- Next exact task:
```

After checkpoint:

- Continue only from the first missing or broken task.
- Do not touch unrelated files.
- Do not repeat completed work.
- Do not install packages unless truly needed.
- Do not run heavy commands again and again.

---

## Permission rules

**Allowed without asking:**

- Normal file updates
- Small fixes
- Imports
- New helper files
- Safe config updates
- Running type-check / build / lint / test
- Installing normal open-source dev dependencies when needed

**Ask before:**

- Deleting a major folder
- Exposing secrets
- Force pushing Git
- Deploying publicly
- Using a paid API or service
- Changing database or provider credentials
- Changing project architecture heavily

---

## Security rules

- Never expose `.env` values.
- Never commit `.env`, `.env.local`, `.env.production`, API keys, tokens, database URLs, private keys, JWT secrets, OAuth secrets, or provider keys.
- Do not put tokens in `localStorage` or `sessionStorage`.
- Do not pass auth tokens in query params.
- Prefer HttpOnly cookies for auth.
- Validate backend inputs.
- Avoid unsafe eval or dynamic code execution.
- Keep error messages helpful but do not leak secrets.

---

## Verification rules

After meaningful changes, detect available scripts and run the lightest useful checks in order:

1. `type-check`
2. `lint`
3. `test`
4. `build`

If verification fails:

- Read the exact error.
- Identify the root cause.
- Fix only the blocking issue.
- Re-run only the failed check.
- Do not hide errors.

---

## Coding quality

- Keep code clean, typed, and readable.
- Use existing project patterns.
- Keep folder structure consistent.
- Remove unused imports.
- Avoid `TODO` / `FIXME` / dummy comments unless the user asks.
- Avoid fake or mock behavior in production paths.
- Handle loading, error, empty, and success states.

---

## UI quality

- UI should be clean, modern, responsive, accessible, and premium.
- Avoid messy effects, cheap neon, and clutter.
- Keep animations smooth and purposeful.
- Do not break logic while improving UI.

---

## MCP usage policy

Use MCP tools only when they help:

- Use **context7** for library or framework documentation lookups.
- Use **gh_grep** for searching code patterns and examples on GitHub.
- Use **playwright** only for UI testing or visual debugging — enable manually.
- Use **github** MCP only when GitHub repo management is needed — enable manually.
- Use **filesystem** MCP only if deep file traversal is needed — enable manually.
- Use **sequential_thinking** only for complex multi-step reasoning — enable manually.
- Use **memory** MCP only for long context persistence — enable manually.
- Use **fetch** MCP only for live URL fetching tasks — enable manually.
- Do not load every MCP for every task.
- Prefer focused tools to reduce context and token waste.

---

## Skills reference

| Skill                | When to use                                                           |
|----------------------|-----------------------------------------------------------------------|
| `gsd-checkpoint`     | Any large task — create checkpoint first, skip completed work         |
| `repo-audit`         | First time in a repo — map the stack, scripts, risks                  |
| `debug-fix`          | Bugs, build errors, API failures, broken flows                        |
| `production-verify`  | Before saying DONE — type-check, lint, test, build                    |
| `fullstack-feature`  | Implementing features across frontend, backend, database              |
| `premium-ui`         | Pages, dashboards, design polish, responsiveness                      |
| `security-review`    | Auth, secrets, validation, CORS, cookies, query safety                |
| `refactor-safe`      | When refactoring — preserve behavior, small changes, verify after     |
