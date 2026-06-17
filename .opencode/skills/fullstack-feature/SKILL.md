---
name: fullstack-feature
description: >
  Use for implementing a full-stack feature safely across frontend, backend,
  database, validation, API, and UI. Understands existing patterns before
  adding anything new.
---

# Fullstack Feature Skill

## Purpose

Build new features that fit naturally into the existing architecture.
Follow existing patterns. Handle all states. Verify before marking done.

---

## Steps

### 1. Understand existing architecture first

Before writing a single line:
- Read the relevant existing routes, controllers, services, or handlers.
- Read the relevant existing pages, components, or state management.
- Read the database schema or ORM models for related entities.
- Identify the naming conventions, folder structure, and import patterns used.

Do not introduce new patterns if the existing ones cover the need.

### 2. Find existing patterns

- How does this project do auth guards? Use the same pattern.
- How does it handle API errors? Use the same pattern.
- How does it structure server actions / route handlers / API clients?
- What component library or styling system is in use?

### 3. Plan the feature in small parts

Break the feature into independent pieces:

```
## Feature Plan

[ ] Database / schema change (if needed)
[ ] Backend: route / handler / service / validation
[ ] Frontend: API client / hook / state
[ ] UI: page / component / states
[ ] Auth guard (if this route is protected)
[ ] Tests (if applicable)
```

Work through parts in order. Do not start the UI before the API exists.

### 4. Update database / schema only if needed

- Add only the new fields or tables required.
- Do not change existing columns unless the feature explicitly requires it.
- Run migrations if the ORM supports it — do not skip migration steps.
- Verify schema changes do not break existing queries.

### 5. Add backend route / controller / service / validation

- Follow the existing route structure.
- Validate inputs on the server — never trust the client.
- Return consistent response shapes (match how other routes respond).
- Handle errors explicitly — return proper status codes.
- Protect routes with auth/authorization middleware if needed.

### 6. Add frontend API client / state / UI

- Use the existing data-fetching pattern (SWR, React Query, server actions, fetch, etc.)
- Keep API client code separated from UI components.
- Manage state consistently with existing patterns.
- Connect UI to real data — no hardcoded mock data in production paths.

### 7. Handle all states

Every interactive UI element must handle:

| State    | Example                                              |
|----------|------------------------------------------------------|
| Loading  | Skeleton, spinner, disabled button                   |
| Error    | Error message with retry or fallback                 |
| Empty    | Empty state with helpful copy or call to action      |
| Success  | Confirmation, updated content, toast if appropriate  |

Do not leave any state unhandled.

### 8. Keep security and validation in mind

- Auth guards on protected routes (frontend + backend).
- Input validation on the server.
- No secrets in client-side code.
- No sensitive data in URLs or query params.

### 9. Run verification

After the feature is complete:
- type-check
- lint
- test (if tests exist for this area)
- build (if near production-ready)

Fix any errors before reporting done.

### 10. Report changed files and next step

```
## Feature Complete

Changed files:
- [list of all modified or created files]

Verification:
- type-check: ✅ / ❌
- lint:        ✅ / ❌
- test:        ✅ / ❌ / ⏭
- build:       ✅ / ❌ / ⏭

Next step: [what comes next, if anything]
```

---

## Rules

- Never use fake/mock data in production paths.
- Never skip error handling.
- Never skip loading states.
- Never add a feature that duplicates existing functionality.
- Never change unrelated files to add a feature.
- Do not start the next feature until this one is verified.
