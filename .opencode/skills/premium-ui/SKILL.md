---
name: premium-ui
description: >
  Use for frontend pages, landing pages, dashboards, auth pages, design polish,
  responsiveness, and UI/UX improvement. Produces clean, premium, accessible UI
  without touching logic.
---

# Premium UI Skill

## Purpose

Elevate the visual and interactive quality of the UI.
Look professional. Feel fast. Work on every screen.
Never break what is already working.

---

## Steps

### 1. Keep UI clean, premium, readable, and responsive

Design principles to follow:
- **Spacing:** Generous and consistent. Use the design system's spacing scale.
- **Typography:** Clear hierarchy — one dominant heading, supporting body, subtle labels.
- **Color:** High contrast for text, subtle for backgrounds, intentional accent use.
- **Layout:** Grid-aligned, not arbitrary. Breathe — do not crowd elements.
- **Responsive:** Mobile-first. Test at 375px, 768px, 1280px breakpoints mentally.

### 2. Use existing design system and components

- Check for existing component library (shadcn/ui, Radix, Chakra, MUI, Tailwind components, etc.).
- Use existing tokens — do not invent new color names or spacing values.
- Reuse existing components — do not recreate `Button`, `Input`, `Card` if they exist.
- Extend, do not replace.

### 3. Avoid cheap visual effects

**Do not use:**
- Excessive neon / RGB color schemes
- Gradient overload (more than 1–2 purposeful gradients)
- Drop shadows on everything
- Blinking or shaking animations
- Cluttered backgrounds (busy patterns, random blobs everywhere)
- Text on low-contrast backgrounds

**Do use:**
- Subtle depth (one level of shadow maximum per card layer)
- Clean white or neutral backgrounds with purposeful accent areas
- Readable font sizes (minimum 14px body, 16px+ preferred)
- Visual breathing room (padding and margin matter)

### 4. Use subtle motion and micro-interactions

Good motion:
- Hover states: 150–200ms ease transitions on color/opacity/scale
- Button press: slight scale down (`scale-95`) on active
- Page/section entry: fade-in or slide-up at 300–400ms, once only
- Loading skeletons instead of blank voids

Bad motion:
- Looping animations that run without user action
- Animations that delay content access
- Layout shifts that move content as the user reads

### 5. Keep accessibility and contrast strong

- Text contrast ratio: minimum 4.5:1 (WCAG AA)
- Interactive elements: must have visible focus states
- Images: must have meaningful `alt` text
- Buttons: must have clear labels (not just icons without aria-label)
- Forms: labels must be connected to inputs
- Color must not be the only way to convey information

### 6. Add loading, empty, error, and success states

Every dynamic section must handle:

| State    | UI treatment                                                    |
|----------|-----------------------------------------------------------------|
| Loading  | Skeleton or spinner — match the shape of the loaded content     |
| Empty    | Friendly message + call-to-action, not a blank void             |
| Error    | Helpful error message, retry option where possible              |
| Success  | Confirmation feedback (toast, inline message, updated content)  |

### 7. Do not break existing logic

- Do not rename props, events, or handlers while restyling.
- Do not move components to different files unless explicitly asked.
- Do not change data-fetching or state logic while updating styles.
- Run type-check after UI changes to catch broken prop types.

### 8. Verify responsive behavior where possible

After changes:
- Mentally walk through mobile (375px), tablet (768px), desktop (1280px+).
- Check that text does not overflow containers.
- Check that buttons and tap targets are at least 44×44px on mobile.
- Check that navigation is usable at small sizes.
- If Playwright MCP is enabled, run a visual spot-check.

---

## Rules

- Do not use inline styles for layout — use the design system's utilities.
- Do not add third-party animation libraries without user approval.
- Do not change component logic to achieve a visual effect.
- Always verify type-check after UI changes (prop changes break things).
- Premium means refined and purposeful — not flashy or over-engineered.
