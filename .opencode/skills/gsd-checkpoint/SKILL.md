---
name: gsd-checkpoint
description: >
  Use for any large coding task. Creates a GSD-style checkpoint, skips
  completed work, and continues only from the next exact missing or broken task.
---

# GSD Checkpoint Skill

## Purpose

Avoid re-doing completed work. Avoid touching unrelated files.
Always know exactly where to continue from.

---

## Steps

### 1. Scan the repo first

- Read the folder structure.
- Read `package.json` scripts (or equivalent for the stack).
- Read existing files relevant to the task.
- Do **not** assume state — verify it.

### 2. Create a short checkpoint

```
## GSD Checkpoint

- Completed:        [list what is fully done and verified]
- Partially done:   [list what exists but is incomplete or broken]
- Missing:          [list what has not been started]
- Broken:           [list confirmed errors, failing tests, broken imports]
- Next exact task:  [one specific action to take next]
```

### 3. Skip working files completely

- Do not open, edit, or refactor files that are already working.
- Do not restyle or rename things that function correctly.

### 4. Do not refactor for style only

- Refactoring is only valid if it fixes a build error, a bug, or a security issue.

### 5. Pick only one next task

- From the checkpoint, identify the **first missing or broken item**.
- Work on that single item only.

### 6. Make the smallest safe change

- Touch only the files needed for that one task.
- Do not expand scope mid-task.

### 7. Run focused verification

After the change, run the lightest available check:
- `type-check` if available
- `lint` if needed
- `test` for the affected module if tests exist
- `build` only if required to confirm the fix

### 8. Report concisely

Output only:
- Changed files (list)
- Verification result (pass / fail + exact error if fail)
- Next step (from the updated checkpoint)

---

## Rules

- Do not claim DONE unless verification passes.
- Do not start new tasks before the current one is confirmed working.
- Do not install packages unless the task explicitly requires it.
- Do not run build/test repeatedly for tasks that do not require it.
