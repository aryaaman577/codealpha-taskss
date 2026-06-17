---
name: debug-fix
description: >
  Use for bugs, build errors, login/register failures, API errors, socket
  errors, UI crashes, and broken flows. Traces root cause before fixing anything.
---

# Debug Fix Skill

## Purpose

Fix the exact problem. Do not guess. Do not change unrelated code.
Do not claim fixed until the broken path is verified working.

---

## Steps

### 1. Reproduce or locate the issue

- Get the exact error message, stack trace, or failure behavior.
- If a user reported it, ask for the exact error text or screenshot.
- If it is a build error, read the terminal output exactly.
- If it is a runtime error, find the error in logs or console.

### 2. Read the exact error message

- Do not summarize or paraphrase the error.
- Note the error **type**, **message**, **file**, and **line number**.
- Note which environment it occurs in: dev / staging / production.

### 3. Trace the relevant path

Depending on the error type, trace:

| Error type             | Trace targets                                              |
|------------------------|------------------------------------------------------------|
| Build / type error     | File, import chain, types, tsconfig                        |
| API / fetch error      | Route handler, request shape, response shape, status code  |
| Auth failure           | Token flow, session, cookie, middleware, guard             |
| DB / ORM error         | Schema, query, migration state, connection env             |
| UI crash / render bug  | Component tree, props, state, missing null checks          |
| Socket / realtime bug  | Connection lifecycle, event names, payload shape           |
| Env / config error     | `.env` key names (not values), config loading order        |

Trace only the relevant path — do not read the entire codebase.

### 4. Identify the exact root cause

Write it out clearly before making any change:

```
Root cause: [exact description of what is wrong and why]
Affected file(s): [list]
Fix plan: [one or two sentences]
```

### 5. Fix the smallest safe part first

- Change only the minimum code required to fix the root cause.
- Do not refactor or clean surrounding code unless it is directly causing the bug.
- Do not change unrelated files.

### 6. Do not guess

- If the cause is unclear, add a targeted log or trace to gather more information.
- Do not apply a fix based on assumptions — verify the cause first.

### 7. Add logs only when needed

- Add a temporary log only if you need to confirm runtime behavior.
- Use a clear prefix so logs are easy to find: e.g. `[debug-fix]`
- Remove all debug logs before marking the fix as complete.

### 8. Remove noisy logs before final

- Search for `console.log`, `console.debug`, `console.warn` added during debugging.
- Remove them or replace with proper structured logging if the project uses it.

### 9. Verify the broken path again

After the fix:
- Re-run the failing check (type-check / lint / test / build) as appropriate.
- Confirm the original error no longer appears.
- Check that related flows are not broken by the change.

---

## Rules

- Do not claim FIXED until the verification step passes.
- Do not change working code to fix broken code.
- Do not expand scope — one bug, one fix.
- Never expose env values in logs.
- If a fix introduces a new error, treat it as a new debug cycle.
