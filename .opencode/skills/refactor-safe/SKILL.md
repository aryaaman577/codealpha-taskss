---
name: refactor-safe
description: >
  Use when refactoring is needed. Keeps behavior unchanged and verifies after
  small isolated changes. Does not refactor for style alone.
---

# Refactor Safe Skill

## Purpose

Improve code structure without changing behavior.
Small steps. Verify each step. Never break what works.

---

## Steps

### 1. Confirm refactor is necessary

Before touching anything, confirm the refactor is justified by one of:
- A build or type error that cannot be fixed without restructuring
- A real bug caused by the current structure
- A security issue requiring architectural correction
- Significant duplication causing maintenance risk
- A clear performance problem in a hot path

**Do not refactor for:**
- Personal style preference
- Naming taste
- "Cleaner" structure that does not fix a real problem
- Making code look like a different project or framework

If the justification is not clear, stop and ask the user.

### 2. Identify exact files affected

List every file that will be touched:

```
## Refactor Scope

Reason: [why this refactor is necessary]
Files affected:
- [file path] — [what changes]
Files NOT touched:
- [confirm adjacent working files stay unchanged]
```

Do not expand scope after starting. If a new issue is found in an unrelated file, note it for later and continue with the defined scope.

### 3. Preserve behavior

The external behavior of the code must remain identical:
- Same inputs produce the same outputs.
- Same API contracts (routes, function signatures, component props).
- Same side effects (database writes, events, cookies, etc.).
- Same error behavior.

If a behavior change is required, it must be flagged to the user before proceeding — it is no longer a refactor, it is a feature change.

### 4. Make small changes

Refactor in the smallest possible steps:
- Extract one function or component at a time.
- Rename one thing at a time.
- Move one file at a time.
- Update imports for one moved file before moving the next.

Do not batch multiple structural changes into one large edit.

### 5. Avoid broad rewrites

**Allowed:**
- Extracting a function from a long function
- Moving a utility to a shared file
- Renaming a variable for clarity
- Splitting a large component into smaller ones
- Removing dead code (code with no callers)
- Simplifying a complex conditional

**Not allowed without explicit instruction:**
- Rewriting a working module in a different style or pattern
- Replacing one library/pattern with another (e.g. fetch → axios, class → hooks)
- Changing folder structure broadly
- Changing public API shapes

### 6. Keep public APIs stable unless required

Public APIs include:
- Exported function names and signatures
- React component prop interfaces
- REST / RPC route shapes
- Event names and payload shapes
- Database schema columns used by the rest of the app

If a public API must change, update every call site in the same refactor. Do not leave broken callers.

### 7. Run verification after each significant step

After each extracted function / moved file / renamed item:
- `type-check` — catch broken imports and type mismatches immediately
- `lint` — catch unused variables and import issues
- `test` — run relevant tests if they exist for this area

Do not accumulate 10 changes and then run verification — verify incrementally.

### 8. Explain what changed and why

At the end:

```
## Refactor Summary

Reason: [why this was done]
Changed files:
- [file] — [what changed]

Behavior preserved: ✅ Yes  /  ❌ No — [explain any intentional behavior change]

Verification:
- type-check: ✅ / ❌
- lint:        ✅ / ❌
- test:        ✅ / ❌ / ⏭

Notes: [anything the user should be aware of]
```

---

## Rules

- Never refactor working code for style alone.
- Never change public API shapes without updating all callers.
- Never skip verification after structural changes.
- If a refactor reveals a bug, fix the bug separately — do not mix the fixes.
- A refactor that breaks tests is not a refactor — it is a regression.
- Keep the scope minimal. When in doubt, do less.
