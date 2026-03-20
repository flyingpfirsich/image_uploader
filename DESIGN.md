# Design System Strategy: Technical Noir

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Digital Ephemeral."**

Unlike traditional social platforms that aim for a "permanent" or "scroll-heavy" feel, this system is designed to capture a specific "moment-in-time." It rejects the bubbly, colorful consumerism of modern social media in favor of a high-end, technical aesthetic. We lean into a "Technical Noir" look—utilizing high-contrast monochrome values, monospace-influenced geometric type, and intentional negative space to make every user interaction feel like a curated piece of data.

The system moves away from generic templates by utilizing **asymmetrical visual weights** and **tonal depth**. Instead of relying on lines to separate content, we use the architecture of the screen itself, where depth is implied through the stacking of various shades of charcoal and obsidian.

## 2. Colors & Surface Philosophy

The palette is a sophisticated range of monochromatic tones. The goal is "High-Contrast Noir," where white (`#ffffff`) is used sparingly for maximum impact against a deep, layered background.

### Surface Hierarchy & Nesting

We define depth not through light and shadow, but through **Tonal Nesting**. The UI should be treated as physical layers of matte material.

- **Base Layer:** `surface` (`#131313`) — The absolute background.
- **Container Low:** `surface_container_low` (`#1b1b1b`) — Used for secondary grouping.
- **Container High:** `surface_container_high` (`#2a2a2a`) — Used for primary content cards (e.g., the main feed items).
- **Surface Bright:** `surface_bright` (`#393939`) — Reserved for interactive hover states or highlighted UI elements.

### The "No-Line" Rule

**Prohibit the use of 1px solid borders for sectioning.** To separate a profile header from a feed, do not draw a line. Instead, shift the background color from `surface` to `surface_container_low`. Boundaries must feel organic to the layout's architecture, not like a wireframe.

### The "Glass & Gradient" Rule

To elevate the "technical" feel, use **Glassmorphism** for floating elements (like the bottom navigation bar or pop-up modals).

- Use `surface_variant` at 60% opacity with a `20px` backdrop blur.
- **Signature Texture:** Apply a subtle linear gradient to primary CTAs, transitioning from `primary` (`#ffffff`) to `primary_container` (`#d4d4d4`) at a 45-degree angle. This provides a "metallic" sheen that feels premium.

## 3. Typography

We utilize **Space Grotesk** for its geometric precision and technical "data-entry" feel.

- **Display & Headlines:** Use `display-lg` and `headline-md` for high-impact moments. These should always be in `on_surface` (`#e2e2e2`). Use all-caps for labels and headers to lean into the "technical log" aesthetic.
- **The "Moment" Feel:** Monospace elements (used in Title and Label roles) should feel like timestamps.
- **Hierarchy:**
  - **Primary Info:** White (`#ffffff`)
  - **Secondary Info:** `on_surface_variant` (`#c6c6c6`)
  - **Tertiary Metadata:** `outline` (`#919191`)

## 4. Elevation & Depth

Traditional drop shadows are forbidden. We achieve "lift" through color and blur.

- **The Layering Principle:** Place a `surface_container_highest` (`#353535`) element on top of a `surface` background to create immediate visual priority.
- **Ambient Shadows:** For floating elements (like a "Post" button), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(0,0,0, 0.4)`. The shadow should feel like a soft glow of darkness rather than a hard edge.
- **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., input fields), use the **Ghost Border**: `outline_variant` (`#474747`) at 20% opacity. It should be felt, not seen.
- **Corner Radii:** Follow a strict scale for intentionality.
  - Cards: `xl` (`0.75rem`)
  - Buttons/Inputs: `md` (`0.375rem`)
  - Small Tags: `sm` (`0.125rem`)

## 5. Components

### Buttons

- **Primary:** Background `primary` (`#ffffff`), Text `on_primary` (`#1a1c1c`). Heavy, bold, and high-contrast.
- **Secondary:** Background `surface_container_highest`, Ghost Border, Text `primary`.
- **Tertiary:** No background. Text `primary` with a thin-stroke icon.

### Cards (Feed & Profiles)

**Forbid divider lines.** Separate the "Admin" header from the "Image" content using `spacing-4` (`1rem`) of vertical whitespace. The card itself should use `surface_container_high` to sit prominently against the `surface` background.

### Input Fields

Use `surface_container_lowest` for the field background. The label should use `label-sm` in all-caps, positioned strictly above the field to maintain a technical "form" look. Use the `Ghost Border` only on focus.

### Navigation (The Dock)

The bottom navigation should be a floating "Glass" element. Use `surface_container_high` with 70% opacity and a `12px` backdrop blur. Icons must be **thin-stroke (1px)** and minimalist.

### Additional Components: The "Moment" Grid

For photo capture or display, use a technical grid overlay using `outline_variant` at 10% opacity. This reinforces the "Technical Noir" North Star—making the user feel like they are operating a precision instrument.

## 6. Do's and Don'ts

### Do:

- **Use "Space" as a separator:** Lean on the Spacing Scale (specifically `8` and `12`) to let the high-contrast typography breathe.
- **Embrace pure black:** Use `surface_container_lowest` (`#0e0e0e`) for areas meant to "recede" into the phone's bezel.
- **Intentional Asymmetry:** If a profile has stats, align them to the right while the username stays left to create a dynamic, editorial feel.

### Don't:

- **Don't use 100% opaque borders:** They clutter the technical aesthetic and feel "cheap."
- **Don't use saturated colors:** Aside from the `error` state (`#ffb4ab`), keep the UI strictly monochromatic.
- **Don't use heavy icons:** Avoid filled icons. Every icon must be a thin, 1pt stroke to match the "Space Grotesk" weight.
- **Don't use standard system blurs:** Always tint your blurs with `surface_variant` to ensure the dark-mode depth is preserved.
