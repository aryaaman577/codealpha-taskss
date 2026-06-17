---
name: production-verify
description: >
  Use before saying work is done. Runs type-check, lint, test, and build where
  available, then fixes only real blocking errors. Never claims production-ready
  if verification is failing.
---

# Production Verify Skill

## Purpose

Confirm that code changes do not break the project before marking work complete.
Catch real errors — not noise. Fix only what blocks shipping.

---

## Steps

### 1. Detect package manager and available scripts

Check `package.json` (or equivalent) for available scripts:

```bash
# Examples — use whichever exist in the project
npm run type-check    # or: tsc --noEmit
npm run lint          # or: eslint, biome check
npm run test          # or: vitest, jest, pytest
npm run build         # or: next build, vite build, tsc
```

Do not assume scripts exist — verify them first.

### 2. Run checks in order (lightest first)

| Priority | Check       | Run when                                       |
|----------|-------------|------------------------------------------------|
| 1        | type-check  | Always, if the project uses TypeScript         |
| 2        | lint        | Always, if a linter is configured              |
| 3        | test        | When tests exist and are relevant to the change|
| 4        | build       | Before final sign-off or if a runtime error    |

- Start with type-check — it is fastest and catches most structural problems.
- Run lint after types are clean.
- Run tests only for the affected area unless a full test run is fast.
- Run build last — it is the heaviest and slowest.

### 3. Avoid heavy repeated commands

- Do not run `build` on every small change.
- Do not loop build + install + build without reason.
- If the project is large, run targeted checks (e.g. one test file) before full suite.

### 4. If a command fails — inspect the exact error

- Read the full error output.
- Identify: error type, file, line, message.
- Do not guess the fix.

### 5. Fix the smallest root cause

- Change only the code that directly causes the error.
- Do not refactor surrounding code unless it is the cause.
- Do not suppress TypeScript errors with `@ts-ignore` or `any` casts to pass checks.

### 6. Re-run only the failed check

- After a targeted fix, re-run only the check that failed.
- Do not re-run the full suite unless the fix could have cascading impact.

### 7. Do not claim production-ready if verification still fails

If any check is still failing after fixes:
- State exactly which check is failing.
- State the exact error.
- State what is blocking the fix (if known).
- Do not mark the task as DONE.

### 8. Summarize results clearly

```
## Verification Summary

- type-check:  ✅ PASS  /  ❌ FAIL — [error summary]
- lint:        ✅ PASS  /  ❌ FAIL — [error summary]
- test:        ✅ PASS  /  ❌ FAIL — [error summary]  /  ⏭ SKIPPED (no tests)
- build:       ✅ PASS  /  ❌ FAIL — [error summary]  /  ⏭ SKIPPED (not needed)

Status: ✅ READY  /  ❌ BLOCKED — [what needs fixing]
```

---

## Rules

- Never use `// @ts-ignore`, `any` casts, or lint disable comments to fake a pass.
- Never skip type-check if the project uses TypeScript.
- Never mark work complete with a known failing check.
- Run the minimum commands needed — do not waste tokens on repeated heavy builds.
- If a check does not exist in the project, mark it as SKIPPED (not a failure).
