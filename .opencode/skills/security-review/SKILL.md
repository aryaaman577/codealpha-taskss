---
name: security-review
description: >
  Use to review auth, API routes, secrets, validation, uploads, database
  queries, CORS, cookies, and production safety. Reports findings by priority.
  Does not fix unless user explicitly asks.
---

# Security Review Skill

## Purpose

Find real security issues before they reach production.
Report clearly. Prioritize ruthlessly. Fix only when asked.

---

## Steps

### 1. Check secret exposure risk

Look for:
- Hardcoded API keys, tokens, passwords, or connection strings in source files
- Secrets committed in `.env` files tracked by Git
- Private keys, JWT secrets, OAuth client secrets in client-side code
- Environment variables passed to the frontend that should be server-only

Flag anything that could expose credentials to an attacker or the public.

### 2. Check auth token storage

Review where tokens or session data are stored:

| Storage method     | Risk level | Notes                                          |
|--------------------|------------|------------------------------------------------|
| HttpOnly cookie    | ✅ Safe     | Not accessible to JavaScript                   |
| Memory (React state)| ✅ Safe    | Lost on refresh — appropriate for short-lived  |
| localStorage       | ⚠️ Risk    | Accessible to JS — XSS can steal tokens        |
| sessionStorage     | ⚠️ Risk    | Same XSS risk as localStorage                  |
| URL / query param  | ❌ High    | Logged in server logs, browser history, referrers |

Flag any token stored in localStorage, sessionStorage, or URL params.

### 3. Check input validation

For every user-facing input (forms, API request bodies, query params, file uploads):
- Is validation happening on the **server** (not just the client)?
- Is the input type, length, format, and range validated?
- Are required fields enforced server-side?
- Is user-supplied content ever used unsanitized in HTML, SQL, file paths, or shell commands?

Flag missing or client-only validation as medium-to-high risk.

### 4. Check API authorization

For every API route or server action:
- Is authentication required? Is it actually checked?
- Is the authenticated user authorized to access this specific resource?
- Is there a risk of IDOR (Insecure Direct Object Reference) — can a user access another user's data by changing an ID?
- Are admin-only routes protected from regular users?

Flag any route missing auth checks, especially data-returning routes.

### 5. Check CORS and cookie settings

- Is CORS configured? Is `Access-Control-Allow-Origin` set to `*` in production? (High risk)
- Are cookies set with `HttpOnly`?
- Are cookies set with `Secure` (HTTPS-only)?
- Are cookies set with `SameSite=Strict` or `SameSite=Lax`?
- Is CSRF protection in place for mutation routes?

### 6. Check database query safety

- Are raw SQL queries using parameterized queries / prepared statements?
- Is user input ever interpolated directly into SQL strings? (SQL injection risk)
- Are ORM queries filtering by user ownership where appropriate?
- Are database error messages exposed directly to the client?

### 7. Check file upload restrictions (if present)

- Are uploaded file types validated server-side (not just by extension)?
- Is file size limited?
- Are uploaded files stored outside the web root (not directly accessible via URL)?
- Are uploaded filenames sanitized before use?

### 8. Check error leakage

- Do error responses include stack traces, file paths, or database details?
- Are internal server errors returning `500` with a generic message vs. detailed internal info?
- Are validation errors returning helpful messages without revealing system internals?

### 9. Report findings by priority

```
## Security Review

### 🔴 HIGH (fix before production)
- [Finding]: [file or area] — [why it is dangerous] — [suggested fix]

### 🟡 MEDIUM (fix soon)
- [Finding]: [file or area] — [why it matters] — [suggested fix]

### 🟢 LOW (good to address)
- [Finding]: [file or area] — [suggested improvement]

### ✅ LOOKS GOOD
- [Area]: [what was checked and found acceptable]
```

### 10. Fix only if user asked to fix

- The default output of this skill is a **report**, not code changes.
- If the user says "fix the issues", apply fixes starting from HIGH priority.
- Apply the minimum fix needed — do not refactor surrounding code.
- Run verification after fixes.

---

## Rules

- Never print `.env` values — check key names only.
- Never assume a route is protected — verify the code.
- Do not over-report low-risk cosmetic issues as security problems.
- Do not introduce new auth patterns — fix using the existing project's approach.
- If a finding requires architectural changes, flag it but do not implement without user instruction.
